const prisma = require("../config/prisma");
const { ObjectId } = require("bson");
const QRCode = require("qrcode");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { toSectorOrNull, levenshteinDistance } = require("./userController");

const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");

// ─── Outbound email kill-switch ─────────────────────────────────────────────
// Email is OFF by default. Nothing is ever sent unless EMAIL_ENABLED=true is
// set explicitly in the environment (which only the maintainer controls). When
// off, every send is logged (subject / to / from) instead of dispatched, so a
// student registering or a reminder being triggered can never fire a real
// email during testing. The most recent attempts are kept in memory for the
// developer-only email view to display (see getEmailActivity).
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

const emailActivity = []; // most-recent-first, capped
const recordEmailAttempt = (entry) => {
    emailActivity.unshift(entry);
    if (emailActivity.length > 100) emailActivity.length = 100;
};
const getEmailActivityLog = () => emailActivity;
const isEmailEnabled = () => EMAIL_ENABLED;

const sendEmail = async (subject, message, send_to, sent_from) => {
    const attempt = {
        at: new Date().toISOString(),
        subject,
        to: send_to,
        from: sent_from,
        sent: false,
        skippedReason: null,
    };

    if (!EMAIL_ENABLED) {
        attempt.skippedReason = "EMAIL_ENABLED is not true — outbound email is off";
        recordEmailAttempt(attempt);
        console.log(`[email OFF] would send "${subject}" to ${send_to} (from ${sent_from})`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: "Gmail",
        port: "465",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const options = {
        from: sent_from,
        to: send_to,
        subject: subject,
        html: message
    };

    transporter.sendMail(options, function (err, info) {
        if (err) { attempt.error = err.message; console.log(err); }
        else { attempt.sent = true; console.log("Email sent"); }
        recordEmailAttempt(attempt);
    });
};

// 24-char hex ids to match the migrated companies/applicants primary keys
// (VARCHAR(24), no AUTO_INCREMENT — see migrations/schema.sql).
const newId = () => new ObjectId().toHexString();

const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id || "");

// YYYY-MM-DD, matching the plain string shape Mongo always returned for
// these fields (frontend code does .split("-")[0] on birthdate directly —
// see MainBanner.jsx — so a raw Date's full ISO datetime string must not
// leak through).
function dateOnlyString(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
}

// Maps a Prisma `applicants` row back into the applicantDetails-nested shape
// the frontend already expects (unchanged API contract from the Mongo days).
// cgpa/birthdate/ExpectedToGraduate/gender/studyLevel are now real
// Decimal/Date/Enum types in Prisma (see schema.prisma) — converted back to
// the plain strings the frontend has always received.
function toApplicantJson(row) {
    if (!row) return row;
    return {
        _id: row.id,
        applicantDetails: {
            uniId: row.uniId,
            fullName: row.fullName,
            birthdate: dateOnlyString(row.birthdate),
            gender: row.gender,
            nationality: row.nationality,
            studyLevel: row.studyLevel,
            college: row.college,
            major: row.major,
            email: row.email,
            phoneNumber: row.phoneNumber,
            cgpa: row.cgpa === null || row.cgpa === undefined ? null : row.cgpa.toString(),
            city: row.city,
            linkedIn: row.linkedIn,
            technicalSkills: row.technicalSkills,
            nonTechnicalSkills: row.nonTechnicalSkills,
            experience: row.experience,
            languages: row.languages,
            ExpectedToGraduate: dateOnlyString(row.expectedToGraduate),
            fieldInterest: row.fieldInterest,
            opportunityType: row.opportunityType,
            preferredWorkCity: row.preferredWorkCity,
            careerGoals: row.careerGoals,
            availability: row.availability,
        },
        cv: row.cvMetadata,
        attended: row.attended,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user_id: (row.relations || []).filter(r => r.relationType === "applied").map(r => r.company?.companyName ?? r.companyId),
        flags: (row.relations || []).filter(r => r.relationType === "flagged").map(r => r.company?.companyName ?? r.companyId),
        rejectedBy: (row.relations || []).filter(r => r.relationType === "rejected").map(r => r.company?.companyName ?? r.companyId),
        shortlistedBy: (row.relations || []).filter(r => r.relationType === "shortlisted").map(r => r.company?.companyName ?? r.companyId),
    };
}

const applicantWithRelationsInclude = {
    relations: { include: { company: { select: { companyName: true } } } },
};

const testFunc = async (req, res) => {
    res.json("Make it work");
};

const getAllApplicants = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const search = req.query.search || "";
        const companyFilter = req.query.company || "";

        const where = { fullName: { not: null } };

        if (search) {
            where.OR = [
                { fullName: { contains: search } },
                { uniId: { contains: search } },
                { email: { contains: search } },
            ];
        }

        if (companyFilter) {
            where.relations = {
                some: { relationType: "applied", company: { companyName: companyFilter } },
            };
        }

        const total = await prisma.applicant.count({ where });

        const uniqueCountResult = await prisma.applicant.groupBy({
            by: ["uniId"],
            where,
        });
        const uniqueStudentCount = uniqueCountResult.length;

        const applicants = await prisma.applicant.findMany({
            where,
            include: applicantWithRelationsInclude,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });

        res.status(200).json({
            applicants: applicants.map(toApplicantJson),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                uniqueStudentCount,
                itemsPerPage: limit,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const VALID_GENDERS = ["Male", "Female"];
const VALID_STUDY_LEVELS = ["Bachelor", "Master", "PhD", "Diploma"];

// gender/studyLevel are now real MySQL ENUMs (see schema.prisma) — Prisma
// throws if handed a value outside the set, unlike Mongo's old untyped
// Object field. Anything unrecognized (blank, typo, future new option the
// enum hasn't caught up with) is dropped to null rather than 500ing the
// whole submission.
function toEnumOrNull(value, allowed) {
    return allowed.includes(value) ? value : null;
}

// cgpa is now DECIMAL(3,2) — same conversion rules as the migration
// (see migrations/generate-seed.js's sqlCgpa): blank/non-numeric/out-of-range
// -> null rather than rejecting the submission.
function toCgpaOrNull(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    if (isNaN(n) || n < 0 || n > 9.99) return null;
    return n;
}

function toDateOrNull(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

async function createApplicant(req, res, { userIdField }) {
    const d = req.body;
    const cvData = req.file ? {
        url: req.file.path,
        public_id: req.file.filename,
        originalname: req.file.originalname
    } : null;

    const id = newId();

    const created = await prisma.applicant.create({
        data: {
            id,
            uniId: d.uniId?.trim() || null,
            fullName: d.fullName ?? null,
            birthdate: toDateOrNull(d.birthdate),
            gender: toEnumOrNull(d.gender, VALID_GENDERS),
            nationality: d.nationality ?? null,
            studyLevel: toEnumOrNull(d.studyLevel, VALID_STUDY_LEVELS),
            college: d.college ?? null,
            major: d.major ?? null,
            email: d.email ?? null,
            phoneNumber: d.phoneNumber ?? null,
            cgpa: toCgpaOrNull(d.cgpa),
            city: d.city ?? null,
            linkedIn: d.linkedIn ?? null,
            technicalSkills: d.technicalSkills ?? null,
            nonTechnicalSkills: d.nonTechnicalSkills ?? null,
            experience: d.experience ?? null,
            languages: d.languages ?? null,
            expectedToGraduate: toDateOrNull(d.ExpectedToGraduate),
            fieldInterest: d.fieldInterest ?? undefined,
            opportunityType: d.opportunityType ?? undefined,
            preferredWorkCity: d.preferredWorkCity ?? null,
            careerGoals: d.careerGoals ?? null,
            availability: d.availability ?? null,
            cvMetadata: cvData ?? undefined,
            attended: false,
        },
    });

    // userIdField mirrors the old Mongo `user_id` write on creation: a
    // single company relation of type "applied", when a real company id is
    // supplied (authenticated dashboard submission). Public submissions
    // start with no relations at all, same as before.
    if (userIdField && isValidId(userIdField)) {
        const companyExists = await prisma.company.findUnique({ where: { id: userIdField }, select: { id: true } });
        if (companyExists) {
            await prisma.applicantCompanyRelation.create({
                data: { applicantId: id, companyId: userIdField, relationType: "applied" },
            }).catch(() => {}); // best-effort, matches prior silent-fail-safe behavior
        }
    }

    return prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
}

const addApplicant = async (req, res) => {
    const userId = !req.user ? null : req.user._id;
    try {
        console.log("Recieved POST request to /applicants");
        console.log("Request body: ", req.body);
        console.log("Uploaded applicant CV: ", req.file);

        const applicantProfile = await createApplicant(req, res, { userIdField: userId });
        console.log(applicantProfile);

        QRCode.toDataURL(JSON.stringify(applicantProfile.id), (err, url) => {
            res.status(200).json({ url: url, applicantProfile: toApplicantJson(applicantProfile) });
            const ticketUrl = `${req.body.frontendUrl || 'https://job-fair-control.vercel.app'}/my-qr-code`;
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,
                `<div style=\"max-width:600px;padding:20px;background-color:#fff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1);\"><h1 style=\"color:#333;text-align:center;\">Your Ticket Confirmation</h1><p style=\"color:#555;line-height:1.6;\">Dear ${req.body.fullName},We are pleased to inform you that your ticket has been confirmed for the upcoming academic conference.Ticket Details:<ul><li><strong>ID Number:</strong>${req.body.uniId}</li><li><strong>Name:</strong>${req.body.fullName}</li><li><strong>Email:</strong>${req.body.email}</li><li><strong>Conference Date:</strong>[Conference Date]</li><li><strong>File Name:</strong>${req.file?.originalname}</li></ul></p><img src=${url} alt=\"QR Code\" style=\"display:block;margin:20px auto;max-width:100%;height:auto;border-radius:5px;\"><p style=\"color:#555;line-height:1.6;text-align:center;\">Lost this email or need your QR code again? <a href=\"${ticketUrl}\" style=\"color:#0E7F41;font-weight:bold;\">View your ticket anytime here</a> using your University ID (${req.body.uniId}).</p><p style=\"color:#555;line-height:1.6;\">Please ensure that you have your ticket ready for verification upon arrival at the conference venue.</p><footer style=\"text-align:center;margin-top:20px;\"><p style=\"color:#999;font-size:14px;\">Best Regards,</p><p style=\"color:#999;font-size:14px;\">CASTO Office</p></footer></div>`,
                `${req.body.email}`,
                `CASTO Office 🏢🚨 <${process.env.USER_EMAIL}>`,
            );
        });

    } catch (error) {
        console.log("----this is the error---\n\n\n\n\n\n\n\n\n\n\n\n-", error, "---------\n\n\n\n\n\n\n\n");
        res.status(500).json({ error: "Request is never sent...T-T" });
    }
};

const getApplicant = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(404).json({ error: "No such id for an applicant" });
    }

    try {
        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        if (!applicant) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }
        res.status(200).json(toApplicantJson(applicant));
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "did not find the applicant" });
    }
};

// Adds one "applied" relation for the given company (was $addToSet on
// user_id). No-ops (matching prior $addToSet semantics) if the relation
// already exists, thanks to the join table's composite primary key.
// Frontend sends the company NAME here (see BarButtons.jsx/MobileRegisterFAB.jsx
// QR check-in flow: `user_id: [user?.companyName]`), same as flag/shortlist/reject.
const updateApplicant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        if (req.body.hasOwnProperty("user_id") && Array.isArray(req.body.user_id) && req.body.user_id[0]) {
            await addRelationByCompanyName(id, req.body.user_id[0], "applied")
                .catch((err) => console.log({ error: err.message }));
        }

        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        console.log(id);
        console.log(applicant);

        res.status(200).json(toApplicantJson(applicant));

    } catch (error) {
        console.log({ error: error.message });
        res.status(404).json({ error: "No such id for an applicant" });
    }
};

// The frontend sends the acting company's NAME (user?.companyName), not its
// id, on every flag/shortlist/reject/unflag/unshortlist/unreject call — this
// was confirmed against BriefInfo.jsx, matching how the Mongo-era data
// stored these arrays as company-name strings, not ObjectId references. So
// every relation write here needs a name -> id lookup first.
async function findCompanyIdByName(companyName) {
    if (!companyName) return null;
    const company = await prisma.company.findFirst({
        where: { companyName },
        select: { id: true },
    });
    return company?.id ?? null;
}

// Generic "add a relation of type X for this applicant/company pair"
// helper — replaces the repeated $addToSet pattern across flag/shortlist/
// reject/apply. Upsert is a no-op if the relation already exists, matching
// $addToSet's dedup behavior. Silently no-ops if the company name doesn't
// resolve (matches the old behavior: Mongo never validated that these
// strings referred to a real company either).
async function addRelationByCompanyName(applicantId, companyName, relationType) {
    const companyId = await findCompanyIdByName(companyName);
    if (!companyId) return null;
    return prisma.applicantCompanyRelation.upsert({
        where: { applicantId_companyId_relationType: { applicantId, companyId, relationType } },
        create: { applicantId, companyId, relationType },
        update: {},
    });
}

// Generic "remove a relation of type X" helper — replaces $pull. deleteMany
// (not delete) because the composite key lookup would throw if the row
// doesn't exist, and $pull was always a silent no-op in that case too.
async function removeRelationByCompanyName(applicantId, companyName, relationType) {
    const companyId = await findCompanyIdByName(companyName);
    if (!companyId) return { count: 0 };
    return prisma.applicantCompanyRelation.deleteMany({
        where: { applicantId, companyId, relationType },
    });
}

const flagApplicant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        if (req.body.flags && Array.isArray(req.body.flags) && req.body.flags[0]) {
            await addRelationByCompanyName(id, req.body.flags[0], "flagged");
        }

        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        console.log(id);
        console.log(applicant);

        res.status(200).json(toApplicantJson(applicant));

    } catch (error) {
        console.log({ error: error.message });
        res.status(404).json({ error: "No such id for an applicant" });
    }
};

const shortlistApplicant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        if (req.body.shortlistedBy && req.body.shortlistedBy[0]) {
            await addRelationByCompanyName(id, req.body.shortlistedBy[0], "shortlisted");
        }

        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        console.log(id);
        console.log(applicant);

        res.status(200).json(toApplicantJson(applicant));

    } catch (error) {
        console.log({ error: error.message });
        res.status(404).json({ error: "No such id for an applicant" });
    }
};

const rejectApplicant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        if (req.body.rejectedBy && req.body.rejectedBy[0]) {
            await addRelationByCompanyName(id, req.body.rejectedBy[0], "rejected");
        }

        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        console.log(id);
        console.log(applicant);

        res.status(200).json(toApplicantJson(applicant));

    } catch (error) {
        console.log({ error: error.message });
        res.status(404).json({ error: "No such id for an applicant" });
    }
};

// The company survey (submitted once per company from the company-status
// page) used to be written with $addToSet onto UserModel.surveyResult — a
// bug, since $addToSet on an array of objects appends a whole new array
// entry every time rather than updating existing answers, which is exactly
// how the real "Green Crystal" company ended up with 2 duplicate full
// submissions in the migrated data (see migrations/generate-seed.js).
// Rewritten here as an upsert per question: submitting the survey again
// replaces each question's prior answer instead of duplicating it.
const submitSurvey = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        if (req.body.hasOwnProperty("surveyResult") && Array.isArray(req.body.surveyResult)) {
            for (const q of req.body.surveyResult) {
                if (!q || !q.id) continue;
                await prisma.companySurveyResponse.upsert({
                    where: { companyId_questionId: { companyId: id, questionId: String(q.id) } },
                    create: { companyId: id, questionId: String(q.id), questionText: q.text ?? "", response: q.responses ?? null },
                    update: { questionText: q.text ?? "", response: q.responses ?? null },
                });
            }
        }

        const company = await prisma.company.findUnique({ where: { id } });
        res.status(200).json(company);

    } catch (error) {
        console.log({ error: error.message });
        res.status(404).json({ error: "No such id for a company" });
    }
};

const getApplicantFlag = async (req, res) => {
    const { id } = req.params;

    if (!isValidId(id)) {
        return res.status(404).json({ error: "No such id for an applicant" });
    }

    try {
        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        res.status(200).json(toApplicantJson(applicant));
    } catch (error) {
        console.log({ error: error.message });
        res.status(404).json({ error: "No such id for an applicant" });
    }
};

const addApplicantPublic = async (req, res) => {
    try {
        const applicantProfile = await createApplicant(req, res, { userIdField: null });

        console.log(applicantProfile, "------this is the added applicant publically-----");

        QRCode.toDataURL((JSON.stringify(applicantProfile.id)), (err, url) => {
            res.status(200).json({ url: url, applicantProfile: toApplicantJson(applicantProfile) });
            const ticketUrl = `${req.body.frontendUrl || 'https://job-fair-control.vercel.app'}/my-qr-code`;
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,
                `<div style=\"max-width:600px;padding:20px;background-color:#fff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1);\"><h1 style=\"color:#333;text-align:center;\">Your Ticket Confirmation</h1><p style=\"color:#555;line-height:1.6;\">Dear ${req.body.fullName},We are pleased to inform you that your ticket has been confirmed for the upcoming academic conference.Ticket Details:<ul><li><strong>ID Number:</strong>${req.body.uniId}</li><li><strong>Name:</strong>${req.body.fullName}</li><li><strong>Email:</strong>${req.body.email}</li><li><strong>Conference Date:</strong>[Conference Date]</li><li><strong>File Name:</strong>${req.file?.originalname}</li></ul></p><img src=${url} alt=\"QR Code\" style=\"display:block;margin:20px auto;max-width:100%;height:auto;border-radius:5px;\"><p style=\"color:#555;line-height:1.6;text-align:center;\">Lost this email or need your QR code again? <a href=\"${ticketUrl}\" style=\"color:#0E7F41;font-weight:bold;\">View your ticket anytime here</a> using your University ID (${req.body.uniId}).</p><p style=\"color:#555;line-height:1.6;\">Please ensure that you have your ticket ready for verification upon arrival at the conference venue.</p><footer style=\"text-align:center;margin-top:20px;\"><p style=\"color:#999;font-size:14px;\">Best Regards,</p><p style=\"color:#999;font-size:14px;\">CASTO Office</p></footer></div>`,
                `${req.body.email}`,
                "🥲 <ammar211080@gmail.com>",
            );
        });

    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const emailRequest = async (req, res) => {
    console.log(req.body, "This is the request\n\n\n\n\n");

    const emailTemplate = {
        i: `<div style="max-width:600px; padding:20px; background-color:#f9f9f9; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); text-align:center; font-family:Arial, sans-serif; color:#333; line-height:1.6;">
            <h1 style="margin-bottom:20px; font-size:24px;">Interview Invitation</h1>
            <p>Dear ${req.body.fullName},</p>
            <p>Congratulations! We are pleased to inform you that you have been selected for an interview.</p>
            <p><strong>Interview Details:</strong></p>
            <ul style="list-style-type:none; padding:0;">
                <li><strong>Name:</strong> ${req.body.fullName}</li>
                <li><strong>Email:</strong> ${req.body.email}</li>
                <li><strong>Interview Date:</strong> [Interview Date]</li>
                <li><strong>Interview Time:</strong> [Interview Time]</li>
                <li><strong>Interview Location:</strong> [Interview Location]</li>
            </ul>
            <p>Please confirm your availability for the interview by replying to this email at your earliest convenience.</p>
            <p>We look forward to meeting you.</p>
            <p>Best Regards,<br>Interview Team</p>
        </div>
        `,
        r: `<div style="max-width:600px; padding:20px; background-color:#f9f9f9; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); text-align:center; font-family:Arial, sans-serif; color:#333; line-height:1.6;">
        <h1 style="margin-bottom:20px; font-size:24px;">Application Update</h1>
        <p>Dear ${req.body.fullName},</p>
        <p>We regret to inform you that your application for the position has not been successful. We sincerely appreciate the time and effort you put into your application.</p>
        <p>We received a high number of qualified applicants, and after careful consideration, we have selected candidates whose qualifications more closely match our needs at this time.</p>
        <p>Thank you for your interest in joining our team. We wish you all the best in your future endeavors.</p>
        <p>Best Regards,<br>The Hiring Team</p>
    </div>
    `,
        o: `Hala`

    };

    switch (req.body.type) {
        case "interview":
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,
                emailTemplate["i"],
                `${req.body.email}`,
                "🥲 <ammar211080@gmail.com>",
            );
            break;
        case "rejection":
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,
                emailTemplate["r"],
                `${req.body.email}`,
                "🥲 <ammar211080@gmail.com>",
            );
            break;
        case "other":
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,
                emailTemplate["o"],
                `${req.body.email}`,
                "🥲 <ammar211080@gmail.com>",
            );
    }

    res.status(200).json({ message: "email sent!" });
};

// Frontend sends the company NAME here too (BarButtons.jsx/MobileRegisterFAB.jsx
// QR check-in flow: `user_id: [user?.companyName]`).
const apply = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such a comapny with this id" });
        }

        if (req.body.hasOwnProperty("user_id") && Array.isArray(req.body.user_id) && req.body.user_id[0]) {
            await addRelationByCompanyName(id, req.body.user_id[0], "applied");
        }

        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        console.log(id);
        console.log(applicant);

        res.status(200).json(toApplicantJson(applicant));

    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const getCompanies = async (req, res) => {
    try {
        const companies = await prisma.company.findMany({
            include: { surveyResponses: true },
        });
        // Reshape each company's normalized (companyId, questionId) survey rows
        // into the single-answer-set array shape the frontend has always
        // consumed (see QuestionsContainer.jsx's nested-forEach aggregation) —
        // wrapping in one outer array satisfies its Array.isArray(answerSet)
        // guard and makes `surveyResult.length > 0` true exactly when the
        // company has submitted at least one answer.
        const shaped = companies.map(({ surveyResponses, ...rest }) => ({
            ...rest,
            surveyResult: surveyResponses.length
                ? [surveyResponses.map((r) => ({ text: r.questionText, responses: r.response }))]
                : [],
        }));
        res.json(shaped);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCompany = async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) {
        return res.status(400).json({ message: "Not a valid id" + id });
    }

    try {
        const company = await prisma.company.findUnique({ where: { id } });
        res.json(company);
    } catch (error) {
        return res.json({ error: error });
    }
};

const confirmAttendant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        let applicant = null;
        if (req.body.hasOwnProperty("attended")) {
            applicant = await prisma.applicant.update({
                where: { id },
                data: { attended: true },
                include: applicantWithRelationsInclude,
            });
        } else {
            applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        }
        console.log(id);
        console.log(applicant);

        res.status(200).json(toApplicantJson(applicant));

    } catch (error) {
        console.log({ error: error.message });
        res.status(404).json({ error: "No such id for an applicant" });
    }
};

// Delete applicant
const deleteApplicant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        let applicant;
        try {
            applicant = await prisma.applicant.delete({ where: { id } });
        } catch (e) {
            applicant = null;
        }

        if (!applicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }

        res.status(200).json({ message: "Applicant deleted successfully", applicant: toApplicantJson(applicant) });

    } catch (error) {
        console.log({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// Generate random token for confirmation
const crypto = require('crypto');

const generateConfirmationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send confirmation reminder email to companies
const sendCompanyReminders = async (req, res) => {
    try {
        if (!isCastoAccount(req)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const { companyIds, frontendUrl } = req.body;

        if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
            return res.status(400).json({ error: "No companies selected" });
        }

        const results = [];
        const errors = [];

        for (const companyId of companyIds) {
            try {
                if (!isValidId(companyId)) {
                    errors.push({ companyId, error: "Invalid company ID" });
                    continue;
                }

                const company = await prisma.company.findUnique({ where: { id: companyId } });
                if (!company) {
                    errors.push({ companyId, error: "Company not found" });
                    continue;
                }

                const token = generateConfirmationToken();
                const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

                await prisma.company.update({
                    where: { id: companyId },
                    data: {
                        confirmationToken: token,
                        confirmationTokenExpiry: tokenExpiry,
                        reminderSentAt: new Date(),
                    },
                });

                const confirmUrl = `${frontendUrl || 'https://job-fair-control.vercel.app'}/confirm-attendance/${token}`;

                const emailHtml = `
                    <div style="max-width:600px; margin:0 auto; padding:30px; background-color:#ffffff; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.1); font-family:Arial, sans-serif;">
                        <div style="text-align:center; margin-bottom:30px;">
                            <h1 style="color:#0E7F41; margin-bottom:10px;">Job Fair Attendance Confirmation</h1>
                            <p style="color:#666; font-size:14px;">University of Sharjah Career Services</p>
                        </div>

                        <p style="color:#333; font-size:16px; line-height:1.6;">Dear <strong>${company.companyName}</strong>,</p>

                        <p style="color:#555; line-height:1.8;">
                            We are excited to have you participate in our upcoming Job Fair! To finalize your attendance, please confirm your participation by clicking the button below.
                        </p>

                        <div style="background-color:#f5f5f5; padding:20px; border-radius:8px; margin:20px 0;">
                            <h3 style="color:#333; margin-bottom:15px;">Your Account Details:</h3>
                            <p style="margin:5px 0;"><strong>Company:</strong> ${company.companyName}</p>
                            <p style="margin:5px 0;"><strong>Email:</strong> ${company.email}</p>
                            <p style="margin:5px 0;"><strong>Representatives:</strong> ${company.representatives}</p>
                            <p style="margin:5px 0;"><strong>City:</strong> ${company.city}</p>
                        </div>

                        <div style="text-align:center; margin:30px 0;">
                            <a href="${confirmUrl}" style="display:inline-block; padding:15px 40px; background-color:#0E7F41; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px;">
                                Confirm Attendance
                            </a>
                        </div>

                        <p style="color:#888; font-size:12px; text-align:center;">
                            This confirmation link will expire in 7 days.<br>
                            If you did not register for this event, please ignore this email.
                        </p>

                        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">

                        <footer style="text-align:center;">
                            <p style="color:#999; font-size:12px;">Best Regards,</p>
                            <p style="color:#0E7F41; font-weight:bold;">CASTO Office</p>
                            <p style="color:#999; font-size:11px;">University of Sharjah</p>
                        </footer>
                    </div>
                `;

                await sendEmail(
                    `Job Fair Attendance Confirmation - ${company.companyName}`,
                    emailHtml,
                    company.email,
                    `CASTO Office <${process.env.EMAIL_USER}>`
                );

                results.push({ companyId, companyName: company.companyName, status: "sent" });

            } catch (err) {
                errors.push({ companyId, error: err.message });
            }
        }

        res.status(200).json({
            message: `Sent ${results.length} reminder(s)`,
            results,
            errors
        });

    } catch (error) {
        console.error("Error sending reminders:", error);
        res.status(500).json({ error: error.message });
    }
};

// Builds a password guaranteed to satisfy validator.isStrongPassword's default
// rules (min length 8, at least one lowercase/uppercase/number/symbol) — used
// for companies bulk-created via Excel import, which can't reasonably supply
// their own password in a spreadsheet.
function generateStrongTempPassword() {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const symbols = "!@#$%^&*";
    const all = lower + upper + digits + symbols;

    const required = [
        lower[Math.floor(Math.random() * lower.length)],
        upper[Math.floor(Math.random() * upper.length)],
        digits[Math.floor(Math.random() * digits.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
    ];
    const fillLength = 8;
    const rest = Array.from({ length: fillLength }, () => all[Math.floor(Math.random() * all.length)]);

    const chars = [...required, ...rest];
    for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join("");
}

// Bulk-imports companies from a client-parsed spreadsheet. Each row carries
// its own action (create/update/skip) decided by the admin during the
// import wizard's conflict-resolution step — this endpoint re-validates every
// row with the same rules as signupUser/reinitializeCompany (never trust
// client-parsed data for a mutating endpoint) and isolates failures per row
// so one bad row never fails the whole batch. Prisma's createMany can't
// return per-row created data or isolate per-row failures, and can't mix
// creates with updates in one call — a sequential loop with individual
// try/catch is the correct trade-off here for typical (dozens of rows) import
// sizes, matching the per-row success/failure UX the UI needs.
const bulkImportCompanies = async (req, res) => {
    try {
        if (!isCastoAccount(req)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const { rows } = req.body;
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: "No rows to import" });
        }

        const results = [];

        for (const row of rows) {
            const { rowIndex, action, data = {}, existingCompanyId } = row || {};
            const companyName = data.companyName || "(unnamed)";

            if (action === "skip") {
                results.push({ rowIndex, companyName, status: "skipped" });
                continue;
            }

            const { email, representitives, fields, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities } = data;

            if (!email || !representitives || !fields || !data.companyName) {
                results.push({ rowIndex, companyName, status: "error", error: "Missing required field (company name, email, representatives, or fields)" });
                continue;
            }
            if (!validator.isEmail(email)) {
                results.push({ rowIndex, companyName, status: "error", error: "Invalid email format" });
                continue;
            }

            try {
                if (action === "update") {
                    if (!existingCompanyId) {
                        results.push({ rowIndex, companyName, status: "error", error: "Missing existing company id for update" });
                        continue;
                    }
                    const emailExists = await prisma.company.findFirst({
                        where: { email, id: { not: existingCompanyId } },
                    });
                    if (emailExists) {
                        results.push({ rowIndex, companyName, status: "error", error: "Email already in use by another company" });
                        continue;
                    }
                    await prisma.company.update({
                        where: { id: existingCompanyId },
                        data: {
                            email,
                            fields,
                            representatives: representitives,
                            companyName: data.companyName,
                            sector: toSectorOrNull(sector),
                            city,
                            noOfPositions,
                            preferredMajors: preferredMajors ?? [],
                            opportunityTypes: opportunityTypes ?? [],
                            preferredQualities: preferredQualities ?? "",
                        },
                    });
                    results.push({ rowIndex, companyName, status: "updated" });
                } else {
                    const exists = await prisma.company.findUnique({ where: { email } });
                    if (exists) {
                        results.push({ rowIndex, companyName, status: "error", error: "Email already in use" });
                        continue;
                    }
                    const tempPassword = generateStrongTempPassword();
                    const hash = await bcrypt.hash(tempPassword, await bcrypt.genSalt(10));
                    const id = new ObjectId().toHexString();

                    await prisma.company.create({
                        data: {
                            id,
                            email,
                            password: hash,
                            fields,
                            representatives: representitives,
                            companyName: data.companyName,
                            sector: toSectorOrNull(sector),
                            city,
                            noOfPositions,
                            preferredMajors: preferredMajors ?? [],
                            opportunityTypes: opportunityTypes ?? [],
                            preferredQualities: preferredQualities ?? "",
                        },
                    });
                    results.push({ rowIndex, companyName, status: "created", tempPassword });
                }
            } catch (rowError) {
                results.push({ rowIndex, companyName, status: "error", error: rowError.message });
            }
        }

        res.status(200).json({ results });
    } catch (error) {
        console.error("Error bulk-importing companies:", error);
        res.status(500).json({ error: error.message });
    }
};

// Confirm company attendance via token
const confirmCompanyAttendance = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        const company = await prisma.company.findFirst({
            where: {
                confirmationToken: token,
                confirmationTokenExpiry: { gt: new Date() },
            },
        });

        if (!company) {
            return res.status(400).json({ error: "Invalid or expired confirmation link" });
        }

        await prisma.company.update({
            where: { id: company.id },
            data: {
                status: 'Confirmed',
                confirmationToken: null,
                confirmationTokenExpiry: null,
            },
        });

        res.status(200).json({
            message: "Attendance confirmed successfully!",
            companyName: company.companyName
        });

    } catch (error) {
        console.error("Error confirming attendance:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update company status manually (for admin)
const updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidId(id)) {
            return res.status(400).json({ error: "Invalid company ID" });
        }

        if (!['Pending', 'Confirmed', 'Canceled'].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        // A company may only change its own status; CASTO can change any
        if (!isCastoAccount(req) && !ownsCompany(req, id)) {
            return res.status(403).json({ error: "Not authorized for this company" });
        }

        let company;
        try {
            company = await prisma.company.update({ where: { id }, data: { status } });
        } catch (e) {
            company = null;
        }

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.status(200).json({ message: "Status updated", company });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── Company self-service: additional login emails + profile ───────────────
// A company's login stays one shared password across every approved email —
// mirrors how the CASTO office runs one login across several staff members
// (see CompanyLoginEmail in schema.prisma / EventOpsContext.jsx's team
// concept on the CASTO side). Any email already logged into a company can
// add/remove another; there's no separate "owner" tier, matching how CASTO's
// own team access works today.

const ownsCompany = (req, id) => req.user && req.user._id === id;

const getCompanyLoginEmails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!ownsCompany(req, id)) return res.status(403).json({ error: "Not authorized for this company" });
        const emails = await prisma.companyLoginEmail.findMany({ where: { companyId: id }, orderBy: { createdAt: "asc" } });
        res.status(200).json(emails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addCompanyLoginEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;
        if (!ownsCompany(req, id)) return res.status(403).json({ error: "Not authorized for this company" });
        if (!email || !validator.isEmail(email)) return res.status(400).json({ error: "A valid email is required" });

        const existingPrimary = await prisma.company.findUnique({ where: { email } });
        if (existingPrimary) return res.status(400).json({ error: "Email already in use" });
        const existingAlt = await prisma.companyLoginEmail.findUnique({ where: { email } });
        if (existingAlt) return res.status(400).json({ error: "Email already in use" });

        const created = await prisma.companyLoginEmail.create({
            data: { companyId: id, email, addedBy: req.user.email },
        });
        res.status(200).json(created);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const removeCompanyLoginEmail = async (req, res) => {
    try {
        const { id, emailId } = req.params;
        if (!ownsCompany(req, id)) return res.status(403).json({ error: "Not authorized for this company" });

        const row = await prisma.companyLoginEmail.findUnique({ where: { id: Number(emailId) } });
        if (!row || row.companyId !== id) return res.status(404).json({ error: "Login email not found" });

        await prisma.companyLoginEmail.delete({ where: { id: Number(emailId) } });
        res.status(200).json({ message: "Login email removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Lightweight self-service profile edit — unlike reinitializeCompany (which
// is a full re-signup that wipes survey data and resets status to Pending),
// this only updates the fields it's given and leaves everything else alone.
const updateCompanyProfile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!ownsCompany(req, id)) return res.status(403).json({ error: "Not authorized for this company" });

        const { email, phone, fields, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities } = req.body;
        const data = {};

        if (email !== undefined) {
            if (!validator.isEmail(email)) return res.status(400).json({ error: "Email is not valid" });
            const collision = await prisma.company.findFirst({ where: { email, id: { not: id } } });
            if (collision) return res.status(400).json({ error: "Email already in use by another company" });
            const altCollision = await prisma.companyLoginEmail.findUnique({ where: { email } });
            if (altCollision) return res.status(400).json({ error: "Email already in use as a login for this or another company" });
            data.email = email;
        }
        if (phone !== undefined) data.phone = phone || null;
        if (fields !== undefined) data.fields = fields;
        if (sector !== undefined) data.sector = toSectorOrNull(sector);
        if (city !== undefined) data.city = city;
        if (noOfPositions !== undefined) data.noOfPositions = noOfPositions;
        if (preferredMajors !== undefined) data.preferredMajors = preferredMajors;
        if (opportunityTypes !== undefined) data.opportunityTypes = opportunityTypes;
        if (preferredQualities !== undefined) data.preferredQualities = preferredQualities;

        const updated = await prisma.company.update({ where: { id }, data });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── CASTO team members (real DB persistence for the office's shared login) ──
// The whole CASTO office shares one login; the server can only verify "is
// this the CASTO account", not "is this specifically Rana" — the same trust
// level the existing password+code reassignment flow already relies on
// client-side. isCastoAccount mirrors that: any request authenticated as the
// CASTO company can manage the team roster.
const isCastoAccount = (req) => req.user?.email === "casto@sharjah.ac.ae";

// Mirrors MODULE_LABELS in frontend/src/context/EventOpsContext.jsx — kept
// in sync by hand since this is only used to render the invite email.
const MODULE_LABEL_NAMES = {
    venue: "Venue & Booths", banners: "Banners & Branding", requirements: "Special Requirements",
    equipment: "Equipment & Logistics", delegates: "Delegate List", attendance: "Attendance",
    manageStaff: "Manage Staff", schedule: "Schedule", passes: "Access Passes", report: "Post-Event Report",
};

const getCastoTeam = async (req, res) => {
    try {
        if (!isCastoAccount(req)) return res.status(403).json({ error: "Not authorized" });
        const team = await prisma.castoTeamMember.findMany({ orderBy: { createdAt: "asc" } });
        res.status(200).json(team.map((m) => ({
            id: m.id, name: m.name, email: m.email, role: m.role,
            focus: m.focusModules || [], responsibilities: m.responsibilities,
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const inviteCastoTeamMember = async (req, res) => {
    try {
        if (!isCastoAccount(req)) return res.status(403).json({ error: "Not authorized" });
        const { name, email, role, focus, responsibilities } = req.body;
        if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: "Name and email are required" });
        if (!validator.isEmail(email)) return res.status(400).json({ error: "Email is not valid" });

        const existing = await prisma.castoTeamMember.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "That email is already on the team" });

        const id = new ObjectId().toHexString();
        const created = await prisma.castoTeamMember.create({
            data: {
                id, name: name.trim(), email: email.trim(), role: role || null,
                focusModules: Array.isArray(focus) ? focus : [],
                responsibilities: responsibilities || null,
                invitedBy: req.user.email,
            },
        });

        const focusLabels = (Array.isArray(focus) ? focus : []).map((f) => MODULE_LABEL_NAMES[f] || f).join(", ") || "no specific modules yet";
        const portalUrl = req.body.frontendUrl || "https://job-fair-control.vercel.app";
        sendEmail(
            "You've been added to the CASTO Event Ops team",
            `<p>Hi ${created.name},</p>
             <p>You've been added as <strong>${role || "a team member"}</strong> on the CASTO office's Event Settings team, covering: <strong>${focusLabels}</strong>.</p>
             <p>Log in at <a href="${portalUrl}">${portalUrl}</a> using the CASTO office account, then switch to your name under "Viewing as" in Event Settings.</p>
             <p>— CASTO Office</p>`,
            created.email,
            process.env.EMAIL_USER
        );

        res.status(200).json({ id: created.id, name: created.name, email: created.email, role: created.role, focus: created.focusModules, responsibilities: created.responsibilities });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateCastoTeamMember = async (req, res) => {
    try {
        if (!isCastoAccount(req)) return res.status(403).json({ error: "Not authorized" });
        const { id } = req.params;
        const { focus, responsibilities, role } = req.body;
        const data = {};
        if (focus !== undefined) data.focusModules = Array.isArray(focus) ? focus : [];
        if (responsibilities !== undefined) data.responsibilities = responsibilities;
        if (role !== undefined) data.role = role;

        const updated = await prisma.castoTeamMember.update({ where: { id }, data });
        res.status(200).json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, focus: updated.focusModules, responsibilities: updated.responsibilities });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const removeCastoTeamMember = async (req, res) => {
    try {
        if (!isCastoAccount(req)) return res.status(403).json({ error: "Not authorized" });
        const { id } = req.params;
        await prisma.castoTeamMember.delete({ where: { id } });
        res.status(200).json({ message: "Team member removed" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Uploads a real artwork file (image/PDF) for one banner row to Cloudinary
// and stores the resulting URL in that row's `artwork` column. Banners are
// keyed in the frontend by `legacyId` (see bannerRowToJson: id = legacyId ??
// real db id) since the whole section is otherwise treated as a
// delete-and-reinsert array — this endpoint updates just the one row
// in-place instead of going through that whole-array replace.
const uploadBannerArtwork = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const numericId = Number(id);
        const banner = await prisma.banner.findFirst({
            where: isNaN(numericId) ? { id: -1 } : { OR: [{ legacyId: BigInt(numericId) }, { id: numericId }] },
        });
        if (!banner) return res.status(404).json({ error: "Banner not found" });

        const updated = await prisma.banner.update({
            where: { id: banner.id },
            data: { artwork: req.file.path || req.file.secure_url, updatedBy: req.user?.email ?? null, updatedAt: new Date() },
        });
        res.status(200).json({ artwork: updated.artwork });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete company (admin only)
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isCastoAccount(req)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        if (!isValidId(id)) {
            return res.status(400).json({ error: "Invalid company ID" });
        }

        let company;
        try {
            // applicant_company_relations and company_survey_responses both
            // have ON DELETE CASCADE to companies — matches the old code's
            // commented-out intent to also detach applicants on company delete.
            company = await prisma.company.delete({ where: { id } });
        } catch (e) {
            company = null;
        }

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.status(200).json({ message: "Company deleted successfully", company });

    } catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get app settings (public endpoint for certain settings)
const getSettings = async (req, res) => {
    try {
        const row = await prisma.setting.findUnique({ where: { key: "surveyPublic" } });
        const surveyPublic = row ? row.value : false;

        res.status(200).json({
            surveyPublic
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update app settings (admin only)
const updateSettings = async (req, res) => {
    try {
        if (!isCastoAccount(req)) {
            return res.status(403).json({ error: "Not authorized" });
        }

        const { key, value } = req.body;
        const userEmail = req.user?.email;

        const allowedKeys = ['surveyPublic'];
        if (!allowedKeys.includes(key)) {
            return res.status(400).json({ error: 'Invalid setting key' });
        }

        const setting = await prisma.setting.upsert({
            where: { key },
            create: { key, value, updatedBy: userEmail ?? null },
            update: { value, updatedBy: userEmail ?? null, updatedAt: new Date() },
        });

        res.status(200).json({
            message: 'Setting updated successfully',
            setting: { key: setting.key, value: setting.value }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── Event operations (booths, banners, logistics, passes, staff, ...) ──────
// Formerly one Mixed Settings document. Now 12 real tables (see
// migrations/schema.sql) — this section maps each one back to the exact
// section-keyed JSON shape the frontend (EventOpsContext.jsx) already
// expects, so the API contract is unchanged even though the storage isn't
// a single blob anymore. Sections not tied to a dedicated table (currently
// just "audit") still round-trip through the settings table as JSON.

const boothRowToJson = (b) => ({
    id: b.legacyId !== null ? Number(b.legacyId) : b.id,
    number: b.number, zone: b.zone, ring: b.ring,
    company: b.companyName, type: b.boothType, status: b.status,
    updatedBy: b.updatedBy, updatedAt: b.updatedAt,
});

const bannerRowToJson = (b) => ({
    id: b.legacyId !== null ? Number(b.legacyId) : b.id,
    company: b.companyName, material: b.material, size: b.size, quantity: b.quantity,
    artwork: b.artwork, contact: b.contact,
    deadline: dateOnlyString(b.deadline),
    status: toEnumDisplay(b.status), notes: b.notes, updatedBy: b.updatedBy, updatedAt: b.updatedAt,
});

const requirementRowToJson = (r) => ({
    id: r.legacyId !== null ? Number(r.legacyId) : r.id,
    company: r.companyName, description: r.description, category: r.category,
    priority: r.priority, status: toEnumDisplay(r.status), notes: r.notes,
    updatedBy: r.updatedBy, updatedAt: r.updatedAt,
});

const equipmentRowToJson = (e) => ({
    id: e.legacyId !== null ? Number(e.legacyId) : e.id,
    entity: e.entityLabel, item: e.item, qtyReq: e.qtyRequested, qtyFul: e.qtyFulfilled,
    status: e.status, requestedBy: e.requestedBy ?? null,
    updatedBy: e.updatedBy, updatedAt: e.updatedAt,
});

const delegateRowToJson = (d) => ({
    name: d.name, role: d.role, email: d.email, phone: d.phone, badge: d.badgeStatus,
});

const companyAttendanceRowToJson = (a) => ({
    booth: a.boothNumber, company: a.companyName, delegateCount: a.delegateCount,
    checkedIn: a.checkedInCount, time: a.checkInTime, method: a.method, status: a.status,
    updatedBy: a.updatedBy, updatedAt: a.updatedAt,
});

const studentAttendanceRowToJson = (s) => ({
    id: s.uniId, name: s.studentName, time: s.checkInTime, method: s.method, status: toEnumDisplay(s.status),
});

const scheduleRowToJson = (s) => ({
    id: s.legacyId !== null ? Number(s.legacyId) : s.id,
    start: s.startTime, end: s.endTime, title: s.title, host: s.host, location: s.location,
    capacity: s.capacity, registered: s.registered, status: s.status,
    updatedBy: s.updatedBy, updatedAt: s.updatedAt,
});

const passRowToJson = (p) => ({
    id: p.legacyId !== null ? Number(p.legacyId) : p.id,
    company: p.companyName, delegate: p.delegate, type: p.passType, code: p.code,
    issued: dateOnlyString(p.issuedDate),
    status: p.status, slot: p.slot, location: p.location, mapUrl: p.mapUrl,
    updatedBy: p.updatedBy, updatedAt: p.updatedAt,
});

const staffRowToJson = (s) => ({
    id: s.legacyId !== null ? Number(s.legacyId) : s.id,
    name: s.name, email: s.email, phone: s.phone, code: s.code, status: s.status,
    updatedBy: s.updatedBy, updatedAt: s.updatedAt,
});

const checkinRowToJson = (c) => ({
    id: Number(c.id), uniId: c.uniIdSnapshot, name: c.fullNameSnapshot,
    by: c.checkedInByName, byId: c.checkedInByStaffId, at: c.checkedInAt instanceof Date && !isNaN(c.checkedInAt.getTime()) ? c.checkedInAt.toISOString() : null,
});

async function loadEventOps() {
    const [booths, banners, requirements, equipment, delegateRows, attendanceCompanies,
        attendanceStudents, schedule, passes, staff, checkins, auditSetting] = await Promise.all([
        prisma.booth.findMany({ orderBy: { id: "asc" } }),
        prisma.banner.findMany({ orderBy: { id: "asc" } }),
        prisma.specialRequirement.findMany({ orderBy: { id: "asc" } }),
        prisma.equipmentRequest.findMany({ orderBy: { id: "asc" } }),
        prisma.companyDelegate.findMany({ orderBy: { id: "asc" } }),
        prisma.companyAttendance.findMany({ orderBy: { id: "asc" } }),
        prisma.studentAttendanceView.findMany({ orderBy: { id: "asc" } }),
        prisma.eventSchedule.findMany({ orderBy: { id: "asc" } }),
        prisma.accessPass.findMany({ orderBy: { id: "asc" } }),
        prisma.attendanceStaff.findMany({ orderBy: { id: "asc" } }),
        prisma.checkinLog.findMany({ orderBy: { checkedInAt: "desc" }, take: 500 }),
        prisma.setting.findUnique({ where: { key: "eventOpsAudit" } }),
    ]);

    // supportStaff (services/logistics helpers + their task lists) is nested
    // JSON, so — like `audit` — it round-trips through the settings table
    // rather than its own relational tables. Loaded separately to keep the
    // Promise.all destructuring above stable.
    const supportStaffSetting = await prisma.setting.findUnique({ where: { key: "eventOpsSupportStaff" } });

    // delegates[] groups flat rows back into {company, delegates: [...]}
    const delegatesByCompany = new Map();
    for (const d of delegateRows) {
        if (!delegatesByCompany.has(d.companyName)) delegatesByCompany.set(d.companyName, []);
        delegatesByCompany.get(d.companyName).push(delegateRowToJson(d));
    }
    const delegates = [...delegatesByCompany.entries()].map(([company, delegates]) => ({ company, delegates }));

    return {
        booths: booths.map(boothRowToJson),
        banners: banners.map(bannerRowToJson),
        requirements: requirements.map(requirementRowToJson),
        equipment: equipment.map(equipmentRowToJson),
        delegates,
        attendanceCompanies: attendanceCompanies.map(companyAttendanceRowToJson),
        attendanceStudents: attendanceStudents.map(studentAttendanceRowToJson),
        schedule: schedule.map(scheduleRowToJson),
        passes: passes.map(passRowToJson),
        attendanceStaff: staff.map(staffRowToJson),
        checkinLog: checkins.map(checkinRowToJson),
        supportStaff: supportStaffSetting ? supportStaffSetting.value : [],
        audit: auditSetting ? auditSetting.value : [],
    };
}

const getEventOps = async (req, res) => {
    try {
        const value = await loadEventOps();
        res.status(200).json(value);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// A few Prisma enums map a spaced display string onto a non-spaced member
// name (e.g. RequirementStatus.InProgress @map("In Progress")) — the @map
// only controls the stored DB value, but the Prisma client itself only
// accepts the literal member name (InProgress), not the mapped string. The
// frontend has always used the human-readable spaced string (matching what
// used to be a free-form Mongo field), so every write of one of these enums
// needs translating first or Prisma throws "Invalid value for argument
// status. Expected RequirementStatus" and the whole transaction rolls back —
// this was silently breaking every requirement/banner "in progress" or
// "not submitted" transition, and marking students "Checked In" manually.
const ENUM_DISPLAY_TO_MEMBER = {
    "In Progress": "InProgress",
    "Not Submitted": "NotSubmitted",
    "Checked In": "CheckedIn",
};
const toEnumMember = (value) => ENUM_DISPLAY_TO_MEMBER[value] ?? value;
const ENUM_MEMBER_TO_DISPLAY = Object.fromEntries(Object.entries(ENUM_DISPLAY_TO_MEMBER).map(([display, member]) => [member, display]));
const toEnumDisplay = (value) => ENUM_MEMBER_TO_DISPLAY[value] ?? value;

// updateEventOps used to shallow-merge { ...current, ...req.body } into one
// Mongo document — the caller only ever sends the section(s) it actually
// changed. Same contract here: for each top-level key present in req.body,
// replace that section's rows entirely (delete + re-insert, inside a
// transaction) with whatever array the caller sent. Sections the caller
// didn't touch are left alone, same as the old shallow merge.
const SECTION_WRITERS = {
    booths: async (tx, rows) => {
        await tx.booth.deleteMany({});
        for (const b of rows) {
            await tx.booth.create({ data: {
                legacyId: b.id ?? null, number: b.number, zone: b.zone ?? null, ring: b.ring ?? null,
                companyName: b.company ?? null, boothType: b.type ?? null, status: b.status ?? "Available",
                updatedBy: b.updatedBy ?? null, updatedAt: b.updatedAt ? new Date(b.updatedAt) : null,
            }});
        }
    },
    banners: async (tx, rows) => {
        await tx.banner.deleteMany({});
        for (const b of rows) {
            await tx.banner.create({ data: {
                legacyId: b.id ?? null, companyName: b.company ?? null, material: b.material ?? null,
                size: b.size ?? null, quantity: b.quantity ?? null, artwork: b.artwork ?? null,
                contact: b.contact ?? null, deadline: b.deadline ? new Date(b.deadline) : null,
                status: toEnumMember(b.status ?? "Not Submitted"), notes: b.notes ?? null,
                updatedBy: b.updatedBy ?? null, updatedAt: b.updatedAt ? new Date(b.updatedAt) : null,
            }});
        }
    },
    requirements: async (tx, rows) => {
        await tx.specialRequirement.deleteMany({});
        for (const r of rows) {
            await tx.specialRequirement.create({ data: {
                legacyId: r.id ?? null, companyName: r.company ?? null, description: r.description ?? null,
                category: r.category ?? null, priority: r.priority ?? "Low", status: toEnumMember(r.status ?? "Open"),
                notes: r.notes ?? null, updatedBy: r.updatedBy ?? null,
                updatedAt: r.updatedAt ? new Date(r.updatedAt) : null,
            }});
        }
    },
    equipment: async (tx, rows) => {
        await tx.equipmentRequest.deleteMany({});
        for (const e of rows) {
            await tx.equipmentRequest.create({ data: {
                legacyId: e.id ?? null, entityLabel: e.entity ?? null, item: e.item ?? null,
                qtyRequested: e.qtyReq ?? null, qtyFulfilled: e.qtyFul ?? null, status: e.status ?? "Pending",
                requestedBy: e.requestedBy ?? null,
                updatedBy: e.updatedBy ?? null, updatedAt: e.updatedAt ? new Date(e.updatedAt) : null,
            }});
        }
    },
    delegates: async (tx, groups) => {
        await tx.companyDelegate.deleteMany({});
        for (const group of groups) {
            for (const d of (group.delegates || [])) {
                await tx.companyDelegate.create({ data: {
                    companyName: group.company, name: d.name, role: d.role ?? null,
                    email: d.email ?? null, phone: d.phone ?? null, badgeStatus: d.badge ?? "Pending",
                }});
            }
        }
    },
    attendanceCompanies: async (tx, rows) => {
        await tx.companyAttendance.deleteMany({});
        for (const a of rows) {
            await tx.companyAttendance.create({ data: {
                boothNumber: a.booth ?? null, companyName: a.company ?? null,
                delegateCount: a.delegateCount ?? null, checkedInCount: a.checkedIn ?? null,
                checkInTime: a.time ?? null, method: a.method ?? null, status: a.status ?? "Absent",
                updatedBy: a.updatedBy ?? null, updatedAt: a.updatedAt ? new Date(a.updatedAt) : null,
            }});
        }
    },
    attendanceStudents: async (tx, rows) => {
        await tx.studentAttendanceView.deleteMany({});
        for (const s of rows) {
            await tx.studentAttendanceView.create({ data: {
                uniId: s.id ?? null, studentName: s.name ?? null, checkInTime: s.time ?? null,
                method: s.method ?? null, status: toEnumMember(s.status ?? "Pending"),
            }});
        }
    },
    schedule: async (tx, rows) => {
        await tx.eventSchedule.deleteMany({});
        for (const s of rows) {
            await tx.eventSchedule.create({ data: {
                legacyId: s.id ?? null, startTime: s.start ?? null, endTime: s.end ?? null,
                title: s.title, host: s.host ?? null, location: s.location ?? null,
                capacity: s.capacity ?? null, registered: s.registered ?? null, status: s.status ?? "Upcoming",
                updatedBy: s.updatedBy ?? null, updatedAt: s.updatedAt ? new Date(s.updatedAt) : null,
            }});
        }
    },
    passes: async (tx, rows) => {
        await tx.accessPass.deleteMany({});
        for (const p of rows) {
            await tx.accessPass.create({ data: {
                legacyId: p.id ?? null, companyName: p.company ?? null, delegate: p.delegate ?? null,
                passType: p.type, code: p.code, issuedDate: p.issued ? new Date(p.issued) : null,
                status: p.status ?? "Active", slot: p.slot ?? null, location: p.location ?? null,
                mapUrl: p.mapUrl ?? null,
                updatedBy: p.updatedBy ?? null, updatedAt: p.updatedAt ? new Date(p.updatedAt) : null,
            }});
        }
    },
    // NOT delete-and-reinsert like the other sections: checkin_log has an
    // ON DELETE SET NULL foreign key into attendance_staff, so wiping and
    // recreating every staffer row here would silently orphan (unlink) every
    // check-in a still-present staffer had already logged, just because the
    // roster was edited (e.g. one staffer added). Upsert by `code` (the
    // real unique identity — see schema.sql) instead, and only delete rows
    // genuinely absent from the new list.
    attendanceStaff: async (tx, rows) => {
        const incomingCodes = rows.map((s) => s.code);
        await tx.attendanceStaff.deleteMany({ where: { code: { notIn: incomingCodes.length ? incomingCodes : [""] } } });
        for (const s of rows) {
            await tx.attendanceStaff.upsert({
                where: { code: s.code },
                create: {
                    legacyId: s.id ?? null, name: s.name, email: s.email, phone: s.phone ?? "",
                    code: s.code, status: s.status ?? "invited",
                    updatedBy: s.updatedBy ?? null, updatedAt: s.updatedAt ? new Date(s.updatedAt) : null,
                },
                update: {
                    name: s.name, email: s.email, phone: s.phone ?? "", status: s.status ?? "invited",
                    updatedBy: s.updatedBy ?? null, updatedAt: s.updatedAt ? new Date(s.updatedAt) : null,
                },
            });
        }
    },
    checkinLog: async (tx, rows) => {
        // checkinLog is otherwise only appended to server-side by
        // checkinByStaff; a caller sending this key wholesale (e.g.
        // clearing it) replaces it the same way as every other section.
        await tx.checkinLog.deleteMany({});
        for (const c of rows) {
            const staffRow = c.byId ? await tx.attendanceStaff.findFirst({ where: { legacyId: BigInt(c.byId) } }) : null;
            await tx.checkinLog.create({ data: {
                id: BigInt(c.id ?? Date.now()), applicantId: c.applicantId, uniIdSnapshot: c.uniId ?? null,
                fullNameSnapshot: c.name ?? null, checkedInByStaffId: staffRow?.id ?? null,
                checkedInByName: c.by ?? null, checkedInAt: c.at ? new Date(c.at) : new Date(),
            }});
        }
    },
    audit: async (tx, rows) => {
        await tx.setting.upsert({
            where: { key: "eventOpsAudit" },
            create: { key: "eventOpsAudit", value: rows },
            update: { value: rows, updatedAt: new Date() },
        });
    },
    // Support staff + their nested task lists — settings-backed JSON, same as
    // audit. Whole section replaced on each write (matching every other
    // section's contract).
    supportStaff: async (tx, rows) => {
        await tx.setting.upsert({
            where: { key: "eventOpsSupportStaff" },
            create: { key: "eventOpsSupportStaff", value: rows },
            update: { value: rows, updatedAt: new Date() },
        });
    },
};

// Companies self-serve exactly two sections: submitting a special
// requirement, and self-check-in via their own booth QR (both send back the
// FULL section array with only their own row changed, per EventOpsContext's
// update()) — "audit" always rides along since every update() call appends
// to it. Every other section (booths, banners, equipment, delegates, passes,
// schedule, staff rosters) is CASTO-only: there is no legitimate company
// write path for them, and each writer deletes-and-recreates the whole
// table, so a non-CASTO caller could otherwise wipe every other company's
// rows in that section.
const COMPANY_WRITABLE_SECTIONS = new Set(["requirements", "attendanceCompanies", "audit"]);

const updateEventOps = async (req, res) => {
    try {
        const sections = Object.keys(req.body).filter((k) => SECTION_WRITERS[k]);

        if (!isCastoAccount(req)) {
            const forbidden = sections.filter((s) => !COMPANY_WRITABLE_SECTIONS.has(s));
            if (forbidden.length > 0) {
                return res.status(403).json({ error: "Not authorized to update: " + forbidden.join(", ") });
            }
        }

        await prisma.$transaction(async (tx) => {
            for (const section of sections) {
                await SECTION_WRITERS[section](tx, req.body[section]);
            }
        });

        const value = await loadEventOps();
        res.status(200).json(value);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Company self-service requests (equipment/logistics, special requirement, or a
// parking note). Deliberately a SEPARATE, INSERT-ONLY endpoint rather than
// widening the bulk event-ops writer to companies: those writers delete-and-
// recreate the whole section, so letting a company PUT the equipment array
// could wipe every other company's rows. Here we only ever append rows tied to
// the authenticated caller's own company, so there is no way to touch anyone
// else's data. CASTO then approves/fulfils via the normal event-ops path.
//
// Notifies the owning CASTO officer by email (sendEmail is a graceful no-op
// while outbound email is disabled — it just logs — so this is safe to call
// now and starts working the moment the mailer is turned on). The cross-account
// in-app bell is driven client-side off CASTO's existing /event-ops poll
// detecting the new requestedBy rows, since notifications are per-account.
const MODULE_OWNER_EMAIL = async (moduleId) => {
    try {
        // focusModules is a JSON column; JSON filtering across the MariaDB
        // adapter is finicky, so fetch the small team and match in JS.
        const team = await prisma.castoTeamMember.findMany({ select: { email: true, focusModules: true } });
        const owner = team.find((m) => Array.isArray(m.focusModules) && m.focusModules.includes(moduleId));
        return owner?.email || null;
    } catch { return null; }
};

const submitCompanyRequest = async (req, res) => {
    try {
        // Resolve the caller's own company — never trust a company name from the body
        const company = await prisma.company.findUnique({
            where: { id: req.user?._id || "" },
            select: { companyName: true },
        });
        if (!company?.companyName) return res.status(403).json({ error: "Only a company account can submit requests" });
        const companyName = company.companyName;

        const { kind } = req.body;
        const now = new Date();

        if (kind === "equipment") {
            const items = Array.isArray(req.body.items) ? req.body.items : [];
            const clean = items
                .map((i) => ({ item: String(i.item || "").trim(), qty: Math.max(1, Number(i.qty) || 1) }))
                .filter((i) => i.item);
            if (clean.length === 0) return res.status(400).json({ error: "Add at least one item" });

            await prisma.$transaction(
                clean.map((i) => prisma.equipmentRequest.create({ data: {
                    entityLabel: companyName, item: i.item, qtyRequested: i.qty, qtyFulfilled: 0,
                    status: "Pending", requestedBy: companyName, updatedBy: companyName, updatedAt: now,
                }}))
            );
            const to = await MODULE_OWNER_EMAIL("equipment");
            if (to) sendEmail(
                `New equipment request from ${companyName}`,
                `<p>${companyName} requested equipment for the Job Fair:</p><ul>${clean.map((i) => `<li>${i.qty} × ${i.item}</li>`).join("")}</ul><p>Review and approve it in Event Operations → Equipment & Logistics.</p>`,
                to, process.env.EMAIL_USER,
            );
            return res.status(200).json({ ok: true, created: clean.length });
        }

        if (kind === "requirement" || kind === "parking") {
            const description = String(req.body.description || "").trim();
            if (!description) return res.status(400).json({ error: "Describe your request" });
            const category = kind === "parking" ? "Parking" : (String(req.body.category || "").trim() || "General");

            await prisma.specialRequirement.create({ data: {
                companyName, description, category, priority: "Medium",
                status: "Open", notes: "Submitted by company", updatedBy: companyName, updatedAt: now,
            }});
            const to = await MODULE_OWNER_EMAIL(kind === "parking" ? "passes" : "requirements");
            if (to) sendEmail(
                `New ${kind === "parking" ? "parking" : "special"} request from ${companyName}`,
                `<p>${companyName} submitted a ${kind === "parking" ? "parking" : "special"} request:</p><p><strong>${category}:</strong> ${description}</p><p>Review it in Event Operations.</p>`,
                to, process.env.EMAIL_USER,
            );
            return res.status(200).json({ ok: true, created: 1 });
        }

        return res.status(400).json({ error: "Unknown request type" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ── Attendance staff check-in ───────────────────────────────────────────────
// Lets CASTO hand out a short access code to a staffer so they can check
// students in at the door without a full CASTO/company login. Now backed by
// real attendance_staff / checkin_log tables instead of the eventOps JSON
// blob's attendanceStaff/checkinLog arrays.

const findStafferByCode = (code) =>
    prisma.attendanceStaff.findUnique({ where: { code: String(code || "").trim().toUpperCase() } });

// Public: a staffer enters their code to "log in" to the check-in view
const verifyAttendanceStaff = async (req, res) => {
    try {
        const staffer = await findStafferByCode(req.body.code);
        if (!staffer) return res.status(401).json({ error: "Invalid access code" });
        res.status(200).json({ id: staffer.legacyId !== null ? Number(staffer.legacyId) : staffer.id, name: staffer.name, email: staffer.email, phone: staffer.phone, status: staffer.status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Public, code-gated: a staffer completes their own profile after first login
const updateAttendanceStaffProfile = async (req, res) => {
    try {
        const { code, phone } = req.body;
        const staffer = await findStafferByCode(code);
        if (!staffer) return res.status(401).json({ error: "Invalid access code" });

        const updated = await prisma.attendanceStaff.update({
            where: { id: staffer.id },
            data: { phone: phone ?? staffer.phone, status: "active" },
        });
        res.status(200).json({ id: updated.legacyId !== null ? Number(updated.legacyId) : updated.id, name: updated.name, email: updated.email, phone: updated.phone, status: updated.status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Public: checks a student in, gated by the staffer's code. Primary path is
// scanning the applicant's printed QR code (which encodes their id — same
// value the CASTO-side scanners already use); manual University ID entry is
// the fallback when the camera isn't usable. Logs the check-in under that
// staffer's name so they can see their own list.
const checkinByStaff = async (req, res) => {
    try {
        const { code, applicantId, uniId } = req.body;
        const staffer = await findStafferByCode(code);
        if (!staffer) return res.status(401).json({ error: "Invalid access code" });
        if (!applicantId?.trim() && !uniId?.trim()) return res.status(400).json({ error: "Scan a QR code or enter a University ID" });

        const applicant = applicantId?.trim() && isValidId(applicantId.trim())
            ? await prisma.applicant.findUnique({ where: { id: applicantId.trim() } })
            : await prisma.applicant.findFirst({ where: { uniId: uniId?.trim() } });
        if (!applicant) return res.status(404).json({ error: "No matching applicant found" });
        if (applicant.attended) return res.status(409).json({ error: "Already checked in", applicant: toApplicantJson(applicant) });

        const updatedApplicant = await prisma.applicant.update({ where: { id: applicant.id }, data: { attended: true } });

        await prisma.checkinLog.create({
            data: {
                id: BigInt(Date.now()),
                applicantId: applicant.id,
                uniIdSnapshot: applicant.uniId,
                fullNameSnapshot: applicant.fullName,
                checkedInByStaffId: staffer.id,
                checkedInByName: staffer.name,
                checkedInAt: new Date(),
            },
        });

        res.status(200).json({ applicant: toApplicantJson(updatedApplicant), checkedInBy: staffer.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Public, code-gated: a staffer's own check-in history, so their "Checked in
// by you today" list survives a page refresh instead of resetting to empty
// (it used to live only in React state). Scoped to just this staffer's own
// check-ins, not the full event log.
const getMyCheckins = async (req, res) => {
    try {
        const staffer = await findStafferByCode(req.query.code);
        if (!staffer) return res.status(401).json({ error: "Invalid access code" });

        const rows = await prisma.checkinLog.findMany({
            where: { checkedInByStaffId: staffer.id },
            orderBy: { checkedInAt: "desc" },
            take: 200,
        });
        res.status(200).json(rows.map(checkinRowToJson));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Public: lets a student retrieve their own QR code after the fact using
// only their University ID — the application journey no longer has to end
// at the submission screen. Returns just enough to render the QR and a
// status line, not the full applicant record (no CV, no company relations).
const lookupApplicantByUniId = async (req, res) => {
    try {
        const uniId = req.params.uniId?.trim();
        if (!uniId) return res.status(400).json({ error: "University ID is required" });

        const applicant = await prisma.applicant.findFirst({
            where: { uniId },
            orderBy: { createdAt: "desc" },
        });
        if (!applicant) return res.status(404).json({ error: "No application found for that University ID" });

        res.status(200).json({
            id: applicant.id,
            fullName: applicant.fullName,
            uniId: applicant.uniId,
            attended: applicant.attended,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unshortlistApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(404).json({ error: "No such id" });
        await removeRelationByCompanyName(id, req.body.company, "shortlisted");
        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        res.status(200).json(toApplicantJson(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unrejectApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(404).json({ error: "No such id" });
        await removeRelationByCompanyName(id, req.body.company, "rejected");
        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        res.status(200).json(toApplicantJson(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unflagApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(404).json({ error: "No such id" });
        await removeRelationByCompanyName(id, req.body.company, "flagged");
        const applicant = await prisma.applicant.findUnique({ where: { id }, include: applicantWithRelationsInclude });
        res.status(200).json(toApplicantJson(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Developer-only: exposes whether outbound email is enabled and the log of
// recent send attempts (what would have gone out while email is off). Gated to
// the CASTO account — mirrors how the rest of the admin surface is trusted.
const getEmailActivity = async (req, res) => {
    try {
        if (!isCastoAccount(req)) return res.status(403).json({ error: "Not authorized" });
        res.status(200).json({
            enabled: isEmailEnabled(),
            fromAddress: process.env.EMAIL_USER || null,
            attempts: getEmailActivityLog(),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getEmailActivity,
    getAllApplicants, addApplicant, getApplicant, updateApplicant, testFunc, addApplicantPublic,
    emailRequest, apply, getCompanies, getCompany, confirmAttendant, flagApplicant, getApplicantFlag,
    shortlistApplicant, rejectApplicant, unshortlistApplicant, unrejectApplicant, unflagApplicant,
    submitSurvey, deleteApplicant, sendCompanyReminders, confirmCompanyAttendance, updateCompanyStatus,
    deleteCompany, getSettings, updateSettings, getEventOps, updateEventOps, verifyAttendanceStaff,
    checkinByStaff, updateAttendanceStaffProfile, bulkImportCompanies, lookupApplicantByUniId, getMyCheckins,
    getCompanyLoginEmails, addCompanyLoginEmail, removeCompanyLoginEmail, updateCompanyProfile,
    getCastoTeam, inviteCastoTeamMember, updateCastoTeamMember, removeCastoTeamMember,
    uploadBannerArtwork, submitCompanyRequest,
};
