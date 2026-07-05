const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const dotenv = require("dotenv");
dotenv.config();

const prisma = require("../config/prisma");

const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.TOKEN_SIGN, { expiresIn: "3d" });
};

// sector is now a MySQL ENUM (see schema.prisma). The signup form's
// dropdown is already constrained to these 4 values, but the API
// shouldn't trust that alone — an invalid/blank value would otherwise
// throw a raw Prisma error and 500 the whole signup instead of a clean
// validation message.
const VALID_SECTORS = ["Private", "Semi", "Local", "Federal"];
function toSectorOrNull(value) {
    return VALID_SECTORS.includes(value) ? value : null;
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            throw Error("All fields must be filled");
        }

        // Primary email first; if not found, check whether this email was
        // approved as an additional login for some company (shared
        // password, mirrors how the CASTO office runs one login across
        // several staff members — see CompanyLoginEmail).
        let user = await prisma.company.findUnique({ where: { email } });
        if (!user) {
            const altEmail = await prisma.companyLoginEmail.findUnique({ where: { email }, include: { company: true } });
            user = altEmail?.company ?? null;
        }
        if (!user) {
            throw Error("Incorrect email");
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw Error("Incorrect password");
        }

        const user_id = user.id;
        const token = createToken(user.id);

        // Echo the authoritative DB row's own values, not whatever the
        // client happened to send in the request body.
        res.status(200).json({
            user_id, email, token,
            fields: user.fields, representitives: user.representatives, companyName: user.companyName,
            sector: user.sector, city: user.city, noOfPositions: user.noOfPositions,
            preferredMajors: user.preferredMajors, opportunityTypes: user.opportunityTypes,
            preferredQualities: user.preferredQualities,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const signupUser = async (req, res) => {
    const { email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities } = req.body;
    try {
        if (!email || !password || !representitives || !fields || !companyName) {
            throw Error("All fields must be filled");
        }
        if (!validator.isEmail(email)) {
            throw Error("Email is not valid");
        }
        if (!validator.isStrongPassword(password)) {
            throw Error("Password is not strong enough");
        }

        const exists = await prisma.company.findUnique({ where: { email } });
        if (exists) {
            throw Error("Email already in use");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Mongo ObjectIds were used as this table's primary key throughout
        // the migration; new rows created via the app need an equivalent
        // 24-char hex id since no AUTO_INCREMENT exists on this column.
        const { ObjectId } = require("bson");
        const id = new ObjectId().toHexString();

        const user = await prisma.company.create({
            data: {
                id,
                email,
                password: hash,
                fields,
                representatives: representitives,
                companyName,
                sector: toSectorOrNull(sector),
                city,
                noOfPositions,
                preferredMajors: preferredMajors ?? [],
                opportunityTypes: opportunityTypes ?? [],
                preferredQualities: preferredQualities ?? "",
            },
        });

        const user_id = user.id;
        const token = createToken(user.id);

        res.status(200).json({ user_id, email, token, fields, representitives, companyName, sector: user.sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities });
    } catch (error) {
        console.log("ERROR....");
        res.status(400).json({ error: error.message });
    }
};

// Check for similar company names
const checkSimilarCompanyName = async (req, res) => {
    const { companyName } = req.query;

    if (!companyName || companyName.trim().length < 2) {
        return res.status(200).json({ similarCompanies: [] });
    }

    try {
        const normalizedInput = companyName.toLowerCase().trim();

        const allCompanies = await prisma.company.findMany({
            select: { id: true, companyName: true, email: true },
        });

        const similarCompanies = allCompanies.filter(company => {
            if (!company.companyName) return false;

            const normalizedCompany = company.companyName.toLowerCase().trim();

            if (normalizedCompany === normalizedInput) {
                return true;
            }

            if (normalizedCompany.includes(normalizedInput) || normalizedInput.includes(normalizedCompany)) {
                return true;
            }

            const inputWords = normalizedInput.split(/\s+/).filter(w => w.length > 2);
            const companyWords = normalizedCompany.split(/\s+/).filter(w => w.length > 2);

            if (inputWords.length > 0 && companyWords.length > 0) {
                const matchingWords = inputWords.filter(iw =>
                    companyWords.some(cw =>
                        cw.includes(iw) || iw.includes(cw) ||
                        (iw.length > 3 && cw.length > 3 && levenshteinDistance(iw, cw) <= 2)
                    )
                );

                const matchRatio = matchingWords.length / Math.max(inputWords.length, companyWords.length);
                if (matchRatio >= 0.5) {
                    return true;
                }
            }

            if (normalizedInput.length > 5 && normalizedCompany.length > 5) {
                const distance = levenshteinDistance(normalizedInput, normalizedCompany);
                const maxLen = Math.max(normalizedInput.length, normalizedCompany.length);
                const similarity = 1 - (distance / maxLen);

                if (similarity >= 0.7) {
                    return true;
                }
            }

            return false;
        }).map(company => ({
            id: company.id,
            companyName: company.companyName,
            email: company.email
        }));

        res.status(200).json({ similarCompanies });
    } catch (error) {
        console.error("Error checking similar company names:", error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function: Calculate Levenshtein distance
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }

    return dp[m][n];
}

// Update existing company data (for reinitialization)
const reinitializeCompany = async (req, res) => {
    const { existingCompanyId, email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities } = req.body;

    try {
        if (!email || !password || !representitives || !fields || !companyName) {
            throw Error("All fields must be filled");
        }
        if (!validator.isEmail(email)) {
            throw Error("Email is not valid");
        }
        if (!validator.isStrongPassword(password)) {
            throw Error("Password is not strong enough");
        }

        const emailExists = await prisma.company.findFirst({
            where: { email, id: { not: existingCompanyId } },
        });
        if (emailExists) {
            throw Error("Email already in use by another company");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        let updatedUser;
        try {
            updatedUser = await prisma.company.update({
                where: { id: existingCompanyId },
                data: {
                    email,
                    password: hash,
                    fields,
                    representatives: representitives,
                    companyName,
                    sector: toSectorOrNull(sector),
                    city,
                    noOfPositions,
                    preferredMajors: preferredMajors ?? [],
                    opportunityTypes: opportunityTypes ?? [],
                    preferredQualities: preferredQualities ?? "",
                    status: "Pending",
                },
            });
        } catch (updateError) {
            throw Error("Company not found");
        }

        // Clear previous survey results for this company (was surveyResult: []
        // on the Mongo document; now a set of rows in a separate table).
        await prisma.companySurveyResponse.deleteMany({ where: { companyId: existingCompanyId } });

        const user_id = updatedUser.id;
        const token = createToken(user_id);

        res.status(200).json({
            user_id,
            email: updatedUser.email,
            token,
            fields: updatedUser.fields,
            representitives: updatedUser.representatives,
            companyName: updatedUser.companyName,
            sector: updatedUser.sector,
            city: updatedUser.city,
            noOfPositions: updatedUser.noOfPositions,
            preferredMajors: updatedUser.preferredMajors,
            opportunityTypes: updatedUser.opportunityTypes,
            preferredQualities: updatedUser.preferredQualities
        });
    } catch (error) {
        console.error("Error reinitializing company:", error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = { loginUser, signupUser, checkSimilarCompanyName, reinitializeCompany, toSectorOrNull, levenshteinDistance };
