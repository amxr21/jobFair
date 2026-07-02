const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

// sampleData.json is gitignored (holds realistic demo credentials for local
// dev) so it won't exist on a fresh clone or in CI. Fall back to a minimal
// built-in seed in that case, so demo mode always boots.
const sampleDataPath = path.join(__dirname, "../../sampleData.json");
const FALLBACK_SAMPLE_DATA = {
    applicants: [
        {
            applicantDetails: {
                uniId: "20000001", fullName: "Test Applicant", nationality: "United Arab Emirates",
                major: "Computer Science", cgpa: "3.5", gender: "Male",
            },
            cv: null, flags: [], shortlistedBy: [], rejectedBy: [], user_id: [], attended: false,
        },
    ],
    users: {
        mainManager: { email: "casto@sharjah.ac.ae", password: "ci-test-password", fields: "", representitives: "" },
        managers: [
            { companyName: "Test Company", email: "manager@test.local", password: "ci-test-password", fields: "Technology", representitives: "Test Rep", sector: "Private", city: "Sharjah", noOfPositions: "1", surveyResult: [] },
        ],
        viewers: [],
    },
};

// Tests force the fallback seed so they're deterministic regardless of
// whether a developer's local sampleData.json happens to exist
const sampleData = (process.env.NODE_ENV !== "test" && fs.existsSync(sampleDataPath))
    ? require(sampleDataPath)
    : FALLBACK_SAMPLE_DATA;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _oidCounter = 0;
function makeId() {
    // Produces a deterministic hex string that looks like a MongoDB ObjectId
    const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
    const rand = (++_oidCounter).toString(16).padStart(16, "0");
    return ts + rand;
}

function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ---------------------------------------------------------------------------
// Seed applicants — assign _id strings and timestamps
// ---------------------------------------------------------------------------

const APPLICANTS = sampleData.applicants.map((a, i) => {
    const now = new Date(Date.now() - (sampleData.applicants.length - i) * 60000);
    return {
        _id: makeId(),
        ...cloneDeep(a),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        __v: 0,
    };
});

// ---------------------------------------------------------------------------
// Seed users — hash passwords synchronously at startup (demo only)
// ---------------------------------------------------------------------------

const SALT = bcrypt.genSaltSync(10);

function seedUser(raw, role) {
    // The frontend gates admin features on companyName === "CASTO Office"
    const companyName = role === "main_manager" ? "CASTO Office" : raw.companyName;
    return {
        _id: makeId(),
        companyName,
        email: raw.email,
        password: bcrypt.hashSync(raw.password, SALT),
        fields: raw.fields,
        representitives: raw.representitives,
        sector: raw.sector,
        city: raw.city,
        noOfPositions: raw.noOfPositions || "0",
        preferredMajors: raw.preferredMajors || [],
        opportunityTypes: raw.opportunityTypes || [],
        preferredQualities: raw.preferredQualities || "",
        surveyResult: cloneDeep(raw.surveyResult || []),
        status: raw.status || "Confirmed",
        role: role || "manager",
        confirmationToken: null,
        confirmationTokenExpiry: null,
        reminderSentAt: null,
        __v: 0,
    };
}

const USERS = [
    seedUser(sampleData.users.mainManager, "main_manager"),
    ...sampleData.users.managers.map((m) => seedUser(m, "manager")),
    ...sampleData.users.viewers.map((v) => seedUser(v, "viewer")),
];

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const SETTINGS = { surveyPublic: false };

// ---------------------------------------------------------------------------
// Exported store (mutate these arrays directly for in-memory persistence)
// ---------------------------------------------------------------------------

module.exports = { APPLICANTS, USERS, SETTINGS, makeId };
