/**
 * Demo controllers — mirror every production controller function but read/write
 * the in-memory store instead of MongoDB.  No Cloudinary, no email, no DB.
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

const { APPLICANTS, USERS, SETTINGS, makeId } = require("./demoStore");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createToken = (_id) =>
    jwt.sign({ _id }, process.env.TOKEN_SIGN || "demo-secret", { expiresIn: "3d" });

function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Simulate Mongoose-style object (plain JS with an _id string)
function withId(doc) {
    return { ...cloneDeep(doc), id: doc._id };
}

// ---------------------------------------------------------------------------
// Auth middleware helper (used by requireAuth in demo mode)
// ---------------------------------------------------------------------------

const getDemoUser = (id) => USERS.find((u) => u._id === id) || null;
module.exports.getDemoUser = getDemoUser;

// ---------------------------------------------------------------------------
// ── APPLICANT controllers ──────────────────────────────────────────────────
// ---------------------------------------------------------------------------

const getAllApplicants = (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const search = (req.query.search || "").toLowerCase();
        const companyFilter = req.query.company || "";

        let list = APPLICANTS.filter((a) => a.applicantDetails != null);

        if (search) {
            list = list.filter((a) => {
                const d = a.applicantDetails;
                return (
                    (d.fullName || "").toLowerCase().includes(search) ||
                    (d.uniId || "").toLowerCase().includes(search) ||
                    (d.email || "").toLowerCase().includes(search)
                );
            });
        }

        if (companyFilter) {
            const cf = companyFilter.toLowerCase();
            list = list.filter((a) => {
                if (Array.isArray(a.user_id))
                    return a.user_id.some((id) => id.toLowerCase() === cf);
                return String(a.user_id).toLowerCase() === cf;
            });
        }

        const total = list.length;

        // Unique student count by uniId
        const uniqueIds = new Set(list.map((a) => a.applicantDetails?.uniId).filter(Boolean));
        const uniqueStudentCount = uniqueIds.size;

        const paginated = list
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(skip, skip + limit)
            .map(withId);

        res.status(200).json({
            applicants: paginated,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                uniqueStudentCount,
                itemsPerPage: limit,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getApplicant = (req, res) => {
    const applicant = APPLICANTS.find((a) => a._id === req.params.id);
    if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });
    res.status(200).json(withId(applicant));
};

const addApplicantPublic = (req, res) => {
    try {
        const now = new Date().toISOString();
        const newApplicant = {
            _id: makeId(),
            applicantDetails: { ...req.body },
            cv: req.file
                ? { originalname: req.file.originalname, mimetype: req.file.mimetype }
                : null,
            user_id: [],
            attended: false,
            flags: [],
            shortlistedBy: [],
            rejectedBy: [],
            createdAt: now,
            updatedAt: now,
            __v: 0,
        };
        APPLICANTS.push(newApplicant);
        // Return a fake QR url (data URI of applicant id string as text)
        const fakeQr = `data:image/svg+xml;base64,${Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#fff"/><text x="10" y="50" font-size="10">${newApplicant._id}</text></svg>`
        ).toString("base64")}`;
        res.status(200).json({ url: fakeQr, applicantProfile: withId(newApplicant) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// addApplicant (protected) — same as public in demo
const addApplicant = addApplicantPublic;

const updateApplicant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });

        if (req.body.hasOwnProperty("user_id")) {
            const val = req.body.user_id[0];
            if (!applicant.user_id.includes(val)) applicant.user_id.push(val);
        }
        applicant.updatedAt = new Date().toISOString();
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const flagApplicant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });

        if (req.body.flags && Array.isArray(req.body.flags)) {
            const val = req.body.flags[0];
            if (!applicant.flags.includes(val)) applicant.flags.push(val);
        }
        applicant.updatedAt = new Date().toISOString();
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getApplicantFlag = (req, res) => {
    const applicant = APPLICANTS.find((a) => a._id === req.params.id);
    if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });
    res.status(200).json(withId(applicant));
};

const shortlistApplicant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });

        if (req.body.shortlistedBy) {
            const val = req.body.shortlistedBy[0];
            if (!applicant.shortlistedBy.includes(val)) applicant.shortlistedBy.push(val);
        }
        applicant.updatedAt = new Date().toISOString();
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const rejectApplicant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });

        if (req.body.rejectedBy) {
            const val = req.body.rejectedBy[0];
            if (!applicant.rejectedBy.includes(val)) applicant.rejectedBy.push(val);
        }
        applicant.updatedAt = new Date().toISOString();
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unshortlistApplicant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });
        const company = req.body.company;
        applicant.shortlistedBy = (applicant.shortlistedBy || []).filter(c => c !== company);
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unrejectApplicant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });
        const company = req.body.company;
        applicant.rejectedBy = (applicant.rejectedBy || []).filter(c => c !== company);
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unflagApplicant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });
        const company = req.body.company;
        applicant.flags = (applicant.flags || []).filter(c => c !== company);
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const confirmAttendant = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such id for an applicant" });

        if (req.body.hasOwnProperty("attended")) {
            applicant.attended = true;
        }
        applicant.updatedAt = new Date().toISOString();
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteApplicant = (req, res) => {
    try {
        const idx = APPLICANTS.findIndex((a) => a._id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: "Applicant not found" });
        const [removed] = APPLICANTS.splice(idx, 1);
        res.status(200).json({ message: "Applicant deleted successfully", applicant: withId(removed) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const apply = (req, res) => {
    try {
        const applicant = APPLICANTS.find((a) => a._id === req.params.id);
        if (!applicant) return res.status(404).json({ error: "No such a company with this id" });

        if (req.body.hasOwnProperty("user_id")) {
            const val = req.body.user_id[0];
            if (!applicant.user_id.includes(val)) applicant.user_id.push(val);
        }
        applicant.updatedAt = new Date().toISOString();
        res.status(200).json(withId(applicant));
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const emailRequest = (req, res) => {
    // In demo mode we just acknowledge — no real email sent
    console.log("[DEMO] emailRequest suppressed for:", req.body.email, "type:", req.body.type);
    res.status(200).json({ message: "email sent! (demo mode — no real email)" });
};

// ---------------------------------------------------------------------------
// ── COMPANY controllers ────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

const getCompanies = (req, res) => {
    res.json(USERS.map(withId));
};

const getCompany = (req, res) => {
    const company = USERS.find((u) => u._id === req.params.id);
    if (!company) return res.status(400).json({ message: "Not a valid id " + req.params.id });
    res.json(withId(company));
};

const submitSurvey = (req, res) => {
    try {
        const company = USERS.find((u) => u._id === req.params.id);
        if (!company) return res.status(404).json({ error: "No such id for a company" });

        if (req.body.hasOwnProperty("surveyResult")) {
            company.surveyResult.push(req.body.surveyResult);
        }
        res.status(200).json(withId(company));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendCompanyReminders = (req, res) => {
    console.log("[DEMO] sendCompanyReminders suppressed — no real emails");
    const { companyIds = [] } = req.body;
    const results = companyIds.map((id) => {
        const c = USERS.find((u) => u._id === id);
        return c ? { companyId: id, companyName: c.companyName, status: "sent (demo)" } : { companyId: id, error: "not found" };
    });
    res.status(200).json({ message: `Demo: acknowledged ${results.length} reminder(s)`, results, errors: [] });
};

const confirmCompanyAttendance = (req, res) => {
    const { token } = req.params;
    const company = USERS.find((u) => u.confirmationToken === token);
    if (!company) return res.status(400).json({ error: "Invalid or expired confirmation link" });
    company.status = "Confirmed";
    company.confirmationToken = null;
    res.status(200).json({ message: "Attendance confirmed successfully!", companyName: company.companyName });
};

const updateCompanyStatus = (req, res) => {
    try {
        const company = USERS.find((u) => u._id === req.params.id);
        if (!company) return res.status(404).json({ error: "Company not found" });
        if (!["Pending", "Confirmed", "Canceled"].includes(req.body.status))
            return res.status(400).json({ error: "Invalid status value" });
        company.status = req.body.status;
        res.status(200).json({ message: "Status updated", company: withId(company) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteCompany = (req, res) => {
    try {
        const idx = USERS.findIndex((u) => u._id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: "Company not found" });
        const [removed] = USERS.splice(idx, 1);
        res.status(200).json({ message: "Company deleted successfully", company: withId(removed) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSettings = (req, res) => {
    res.status(200).json({ surveyPublic: SETTINGS.surveyPublic });
};

const updateSettings = (req, res) => {
    const { key, value } = req.body;
    if (!["surveyPublic"].includes(key))
        return res.status(400).json({ error: "Invalid setting key" });
    SETTINGS[key] = value;
    res.status(200).json({ message: "Setting updated successfully", setting: { key, value } });
};

// Event operations state — in-memory in demo mode
let EVENT_OPS = null;
const getEventOps = (req, res) => {
    res.status(200).json(EVENT_OPS);
};
const updateEventOps = (req, res) => {
    EVENT_OPS = req.body;
    res.status(200).json(EVENT_OPS);
};

// Attendance staff check-in — mirrors the real-mode controllers, reading/
// writing the same in-memory EVENT_OPS document
const findStaffer = (code) =>
    (EVENT_OPS?.attendanceStaff || []).find((s) => s.code === String(code || '').trim().toUpperCase());

const verifyAttendanceStaff = (req, res) => {
    const staffer = findStaffer(req.body.code);
    if (!staffer) return res.status(401).json({ error: "Invalid access code" });
    res.status(200).json({ id: staffer.id, name: staffer.name, email: staffer.email, phone: staffer.phone, status: staffer.status });
};

const updateAttendanceStaffProfile = (req, res) => {
    const { code, phone } = req.body;
    const staffer = findStaffer(code);
    if (!staffer) return res.status(401).json({ error: "Invalid access code" });

    EVENT_OPS = {
        ...EVENT_OPS,
        attendanceStaff: (EVENT_OPS.attendanceStaff || []).map((s) =>
            s.id === staffer.id ? { ...s, phone: phone ?? s.phone, status: "active" } : s),
    };
    const updated = EVENT_OPS.attendanceStaff.find((s) => s.id === staffer.id);
    res.status(200).json({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, status: updated.status });
};

const checkinByStaff = (req, res) => {
    const { code, uniId } = req.body;
    const staffer = findStaffer(code);
    if (!staffer) return res.status(401).json({ error: "Invalid access code" });
    if (!uniId?.trim()) return res.status(400).json({ error: "University ID is required" });

    const applicant = APPLICANTS.find((a) => a.applicantDetails?.uniId === uniId.trim());
    if (!applicant) return res.status(404).json({ error: "No applicant found with that University ID" });
    if (applicant.attended) return res.status(409).json({ error: "Already checked in", applicant });

    applicant.attended = true;

    const log = EVENT_OPS.checkinLog || [];
    log.unshift({
        id: Date.now(),
        uniId: applicant.applicantDetails?.uniId,
        name: applicant.applicantDetails?.fullName,
        by: staffer.name,
        byId: staffer.id,
        at: new Date().toISOString(),
    });
    EVENT_OPS = { ...EVENT_OPS, checkinLog: log.slice(0, 500) };

    res.status(200).json({ applicant, checkedInBy: staffer.name });
};

// CV download — no real files in demo
const downloadCV = (req, res) => {
    res.status(200).json({ message: "CV download not available in demo mode." });
};

const testFunc = (req, res) => res.json("Demo mode active — make it work");

// ---------------------------------------------------------------------------
// ── USER / AUTH controllers ────────────────────────────────────────────────
// ---------------------------------------------------------------------------

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = USERS.find((u) => u.email === email);
        if (!user) return res.status(400).json({ error: "Incorrect email" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Incorrect password" });

        const token = createToken(user._id);
        res.status(200).json({
            user_id: user._id,
            email: user.email,
            token,
            fields: user.fields,
            representitives: user.representitives,
            companyName: user.companyName,
            sector: user.sector,
            city: user.city,
            noOfPositions: user.noOfPositions,
            preferredMajors: user.preferredMajors,
            opportunityTypes: user.opportunityTypes,
            preferredQualities: user.preferredQualities,
            role: user.role,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const signupUser = async (req, res) => {
    const { email, password, fields, representitives, companyName, sector, city, noOfPositions,
        preferredMajors, opportunityTypes, preferredQualities } = req.body;
    try {
        if (!email || !password || !representitives || !fields || !companyName)
            throw Error("All fields must be filled");
        if (USERS.find((u) => u.email === email))
            throw Error("Email already in use");

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const now = new Date().toISOString();
        const newUser = {
            _id: makeId(),
            companyName, email, password: hash, fields,
            representitives, sector, city,
            noOfPositions: noOfPositions || "0",
            preferredMajors: preferredMajors || [],
            opportunityTypes: opportunityTypes || [],
            preferredQualities: preferredQualities || "",
            surveyResult: [],
            status: "Pending",
            role: "manager",
            confirmationToken: null,
            confirmationTokenExpiry: null,
            reminderSentAt: null,
            __v: 0,
        };
        USERS.push(newUser);
        const token = createToken(newUser._id);
        res.status(200).json({
            user_id: newUser._id, email, token, fields, representitives, companyName,
            sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const checkSimilarCompanyName = (req, res) => {
    const { companyName } = req.query;
    if (!companyName || companyName.trim().length < 2)
        return res.status(200).json({ similarCompanies: [] });

    const input = companyName.toLowerCase().trim();
    const similar = USERS.filter((u) => {
        if (!u.companyName) return false;
        const name = u.companyName.toLowerCase().trim();
        return name === input || name.includes(input) || input.includes(name);
    }).map((u) => ({ id: u._id, companyName: u.companyName, email: u.email }));

    res.status(200).json({ similarCompanies: similar });
};

const reinitializeCompany = async (req, res) => {
    const { existingCompanyId, email, password, fields, representitives, companyName,
        sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities } = req.body;
    try {
        const user = USERS.find((u) => u._id === existingCompanyId);
        if (!user) throw Error("Company not found");
        if (USERS.find((u) => u.email === email && u._id !== existingCompanyId))
            throw Error("Email already in use by another company");

        const salt = await bcrypt.genSalt(10);
        user.email = email;
        user.password = await bcrypt.hash(password, salt);
        user.fields = fields;
        user.representitives = representitives;
        user.companyName = companyName;
        user.sector = sector;
        user.city = city;
        user.noOfPositions = noOfPositions;
        user.preferredMajors = preferredMajors || [];
        user.opportunityTypes = opportunityTypes || [];
        user.preferredQualities = preferredQualities || "";
        user.status = "Pending";
        user.surveyResult = [];

        const token = createToken(user._id);
        res.status(200).json({
            user_id: user._id, email: user.email, token,
            fields: user.fields, representitives: user.representitives, companyName: user.companyName,
            sector: user.sector, city: user.city, noOfPositions: user.noOfPositions,
            preferredMajors: user.preferredMajors, opportunityTypes: user.opportunityTypes,
            preferredQualities: user.preferredQualities,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// ---------------------------------------------------------------------------
// requireAuth middleware for demo mode
// ---------------------------------------------------------------------------

const requireAuthDemo = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        req.user = null;
        return next();
    }
    const token = authorization.split(" ")[1];
    try {
        const { _id } = jwt.verify(token, process.env.TOKEN_SIGN || "demo-secret");
        req.user = USERS.find((u) => u._id === _id) || null;
        next();
    } catch {
        res.status(401).json({ error: "Request is not authorized" });
    }
};

// ---------------------------------------------------------------------------

module.exports = {
    // applicant
    getAllApplicants, getApplicant, addApplicant, addApplicantPublic,
    updateApplicant, flagApplicant, getApplicantFlag, shortlistApplicant,
    rejectApplicant, unshortlistApplicant, unrejectApplicant, unflagApplicant,
    confirmAttendant, deleteApplicant, apply, emailRequest,
    downloadCV, testFunc,
    // company
    getCompanies, getCompany, submitSurvey, sendCompanyReminders,
    confirmCompanyAttendance, updateCompanyStatus, deleteCompany,
    // settings
    getSettings, updateSettings, getEventOps, updateEventOps,
    verifyAttendanceStaff, checkinByStaff, updateAttendanceStaffProfile,
    // user auth
    loginUser, signupUser, checkSimilarCompanyName, reinitializeCompany,
    // middleware
    requireAuthDemo,
};
