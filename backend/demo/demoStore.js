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

// surveyPublic drives the Survey nav link and the company-facing survey form.
// Left off, demo mode hides the survey entirely and it can't be demonstrated.
const SETTINGS = { surveyPublic: true };

// ---------------------------------------------------------------------------
// Event operations
// ---------------------------------------------------------------------------
// getEventOps reads this in demo mode. Without it the endpoint returned null,
// which left every Event Settings tab (venue, banners, equipment, passes,
// delegates, attendance, schedule) blank with nothing to interact with.
//
// Shaped to match loadEventOps() in controllers/applicantsControllers.js, and
// deliberately spread across states — Assigned/Reserved/Available booths, every
// banner step, open and resolved requirements — so each tab renders populated
// rows, empty rows, and every status badge the UI can draw.

const demoCompanyNames = USERS
    .filter((u) => u.role !== "main_manager" && u.companyName)
    .map((u) => u.companyName);

const pickCompany = (i) => demoCompanyNames[i % demoCompanyNames.length] || "Test Company";

// 24 booths: 18 outer ring + 6 centre island, across zones A/B/C.
const demoBooths = Array.from({ length: 24 }, (_, i) => {
    const zone = ["A", "B", "C"][Math.floor(i / 8)];
    const assigned = i < 14;
    const reserved = i >= 14 && i < 18;
    return {
        id: `booth-demo-${i + 1}`,
        number: `${zone}${String((i % 8) + 1).padStart(2, "0")}`,
        zone,
        ring: i % 4 === 3 ? "center" : "outer",
        company: assigned ? pickCompany(i) : null,
        type: ["Standard", "Premium", "Corner"][i % 3],
        status: assigned ? "Assigned" : reserved ? "Reserved" : "Available",
        updatedBy: assigned ? "Rana" : null,
        updatedAt: assigned ? new Date(Date.now() - i * 36e5).toISOString() : null,
    };
});

const BANNER_STATES = ["Not Submitted", "Submitted", "Approved", "Printed", "Placed"];
const demoBanners = demoCompanyNames.slice(0, 8).map((company, i) => ({
    id: `banner-demo-${i + 1}`,
    company,
    material: ["Roll-up Banner", "Backdrop", "Table Skirt", "Digital Screen Graphic"][i % 4],
    size: "85 × 200 cm",
    quantity: (i % 3) + 1,
    artwork: i % 2 === 0 ? "https://example.com/artwork.pdf" : null,
    contact: `media${i + 1}@example.com`,
    deadline: new Date(Date.now() + (i + 2) * 864e5).toISOString(),
    status: BANNER_STATES[i % BANNER_STATES.length],
    notes: i % 3 === 0 ? "Awaiting high-res file from the company." : null,
    updatedBy: "Aseel",
    updatedAt: new Date(Date.now() - i * 72e5).toISOString(),
}));

const demoRequirements = demoCompanyNames.slice(0, 6).map((company, i) => ({
    id: `req-demo-${i + 1}`,
    company,
    description: [
        "Wheelchair-accessible booth approach",
        "Extra 16A power line for demo hardware",
        "Ceiling rig for hanging banner",
        "Quiet area for candidate interviews",
        "Live video feed to the main screen",
        "Additional lockable storage overnight",
    ][i],
    category: ["Accessibility", "Power", "Rigging", "Space", "AV", "Storage"][i],
    priority: ["High", "Medium", "Low"][i % 3],
    status: ["Open", "In Progress", "Resolved"][i % 3],
    notes: null,
    updatedBy: "Prithba",
    updatedAt: new Date(Date.now() - i * 108e5).toISOString(),
}));

const demoEquipment = demoCompanyNames.slice(0, 7).map((company, i) => ({
    id: `equip-demo-${i + 1}`,
    company,
    item: ["Table", "Chairs", "Power Strip", "Monitor", "Extension Cable", "Whiteboard", "Podium"][i],
    quantity: (i % 4) + 1,
    status: ["Requested", "Approved", "Delivered"][i % 3],
    notes: null,
    requestedBy: company,
    updatedBy: "Prithba",
    updatedAt: new Date(Date.now() - i * 54e5).toISOString(),
}));

const demoDelegates = demoCompanyNames.slice(0, 6).map((company, i) => ({
    id: `deleg-demo-${i + 1}`,
    company,
    delegates: Array.from({ length: (i % 3) + 1 }, (_, j) => ({
        name: `Delegate ${i + 1}-${j + 1}`,
        role: ["Recruiter", "Engineer", "HR Lead"][j % 3],
        email: `delegate${i}${j}@example.com`,
        badgePrinted: j === 0,
    })),
    updatedBy: "Maha",
    updatedAt: new Date(Date.now() - i * 90e5).toISOString(),
}));

const demoPasses = demoCompanyNames.slice(0, 5).map((company, i) => ({
    id: `pass-demo-${i + 1}`,
    company,
    type: ["Entry", "Parking"][i % 2],
    code: `PASS-${1000 + i}`,
    slot: i % 2 === 1 ? `P-${10 + i}` : null,
    status: ["Issued", "Collected", "Pending"][i % 3],
    updatedBy: "Yousef",
    updatedAt: new Date(Date.now() - i * 126e5).toISOString(),
}));

const demoAttendanceCompanies = demoCompanyNames.slice(0, 6).map((company, i) => ({
    booth: demoBooths[i]?.number || "—",
    company,
    selfCheckedIn: i % 2 === 0,
    checkedInAt: i % 2 === 0 ? new Date(Date.now() - i * 36e5).toISOString() : null,
    delegateCount: (i % 3) + 1,
}));

const demoSchedule = [
    { id: "sch-1", time: "08:30", title: "Doors open · exhibitor setup", owner: "Rana", status: "Done" },
    { id: "sch-2", time: "09:30", title: "Opening remarks", owner: "Rana", status: "Done" },
    { id: "sch-3", time: "10:00", title: "Student sessions begin", owner: "Maha", status: "In Progress" },
    { id: "sch-4", time: "12:30", title: "Lunch break", owner: "Prithba", status: "Upcoming" },
    { id: "sch-5", time: "15:30", title: "Employer panel", owner: "Aseel", status: "Upcoming" },
    { id: "sch-6", time: "17:00", title: "Close · teardown", owner: "Yousef", status: "Upcoming" },
];

const EVENT_OPS = {
    booths: demoBooths,
    banners: demoBanners,
    requirements: demoRequirements,
    equipment: demoEquipment,
    delegates: demoDelegates,
    passes: demoPasses,
    attendanceCompanies: demoAttendanceCompanies,
    studentAttendance: [],
    schedule: demoSchedule,
    supportStaff: [],
    audit: [],
};

// ---------------------------------------------------------------------------
// Exported store (mutate these arrays directly for in-memory persistence)
// ---------------------------------------------------------------------------

module.exports = { APPLICANTS, USERS, SETTINGS, EVENT_OPS, makeId };
