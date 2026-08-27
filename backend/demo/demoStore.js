const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// ---------------------------------------------------------------------------
// Demo account credentials
// ---------------------------------------------------------------------------
// No password is ever committed to this repo. Each demo login reads its
// password from an environment variable; when one isn't set we generate a
// random password for this boot and print it to the server console, so a
// fresh clone still has working demo logins without shipping a secret.
//
// Pin them in backend/.env (see .env.example) when you need stable
// credentials to hand to someone for a walkthrough.
const generatedCredentials = [];

// Memoized per env var: two accounts can share one variable (both CASTO
// logins do), and without this each call would mint a different password and
// print two conflicting lines for the same credential.
const generatedByVar = new Map();

function demoPassword(envVar, label) {
    const fromEnv = process.env[envVar];
    if (fromEnv) return fromEnv;
    // Tests need determinism; a random password per boot would make the
    // seeded logins unusable from the test suites.
    if (process.env.NODE_ENV === "test") return "ci-test-password";
    if (generatedByVar.has(envVar)) return generatedByVar.get(envVar);
    const generated = crypto.randomBytes(9).toString("base64url");
    generatedByVar.set(envVar, generated);
    generatedCredentials.push({ label, envVar, password: generated });
    return generated;
}

// Access codes are short and uppercase (the check-in terminal upper-cases
// whatever is typed before matching), so they can't reuse demoPassword().
function demoAccessCode(envVar, label) {
    const fromEnv = process.env[envVar];
    if (fromEnv) return String(fromEnv).trim().toUpperCase();
    if (process.env.NODE_ENV === "test") return "DEMO1";
    const generated = crypto.randomBytes(4).toString("hex").slice(0, 5).toUpperCase();
    generatedCredentials.push({ label, envVar, password: generated });
    return generated;
}

// Called by server.js after boot so the console shows usable demo logins.
function printDemoCredentials(log = console.log) {
    if (!generatedCredentials.length) return;
    log("\n  Demo accounts (generated for this run - set the env vars to pin them):");
    for (const c of generatedCredentials) {
        log(`    ${c.label.padEnd(26)} ${c.password}   [${c.envVar}]`);
    }
    log("");
}

// sampleData.json is gitignored (holds realistic demo credentials for local
// dev) so it won't exist on a fresh clone or in CI. Fall back to a built-in
// seed in that case, so demo mode always boots with the three demo roles.
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
        // The original office address. The test suites log in as this user to
        // seed fixtures, so the email must not change. On a fresh clone this is
        // also the CASTO login; where a local sampleData.json defines its own
        // account at this address, that one wins and this is unused.
        mainManager: {
            email: "casto@sharjah.ac.ae",
            password: demoPassword("DEMO_CASTO_PASSWORD", "CASTO office"),
            fields: "", representitives: "Demo Coordinator",
        },
        // The documented CASTO demo login, on its own address so it survives a
        // sampleData.json that already claims casto@sharjah.ac.ae. Seeded as a
        // second main_manager, so it carries the same full permissions.
        demoCasto: {
            email: "casto.demo@jobfair.demo",
            password: demoPassword("DEMO_CASTO_PASSWORD", "CASTO office"),
            fields: "", representitives: "Demo Coordinator",
        },
        managers: [
            // Employer / company representative - scoped to its own company.
            {
                companyName: "Northwind Technologies",
                email: "employer.demo@jobfair.demo",
                password: demoPassword("DEMO_EMPLOYER_PASSWORD", "Employer / manager"),
                fields: "Technology", representitives: "Demo Recruiter",
                sector: "Private", city: "Sharjah", noOfPositions: "6",
                preferredMajors: ["Computer Science", "Computer Engineering"],
                opportunityTypes: ["Full-time", "Internship"],
                preferredQualities: "Problem solving, teamwork, initiative",
                surveyResult: [],
            },
            { companyName: "Test Company", email: "manager@test.local", password: demoPassword("DEMO_TEST_COMPANY_PASSWORD", "Test Company"), fields: "Technology", representitives: "Test Rep", sector: "Private", city: "Sharjah", noOfPositions: "1", surveyResult: [] },
        ],
        viewers: [],
    },
};

// Tests force the fallback seed so they're deterministic regardless of
// whether a developer's local sampleData.json happens to exist
const baseData = (process.env.NODE_ENV !== "test" && fs.existsSync(sampleDataPath))
    ? require(sampleDataPath)
    : FALLBACK_SAMPLE_DATA;

// A local sampleData.json supplies a richer applicant/company set, so it stays
// the primary source - but the three documented demo logins must exist either
// way, or they'd silently disappear on any machine that happens to have that
// file. Merge them in on top instead of choosing one source or the other.
//
// sampleData.json wins on collision: if it already defines an account at the
// same email, that one is kept rather than being overwritten by the demo seed.
const demoUsers = FALLBACK_SAMPLE_DATA.users;
const baseManagers = baseData.users.managers || [];
const baseEmails = new Set(baseManagers.map((m) => m.email));

const sampleData = {
    ...baseData,
    users: {
        ...baseData.users,
        // The main manager slot is single - keep whichever source defined it,
        // preferring sampleData.json, and fall back to the demo CASTO account.
        mainManager: baseData.users.mainManager || demoUsers.mainManager,
        managers: [
            ...baseManagers,
            ...demoUsers.managers.filter((m) => !baseEmails.has(m.email)),
        ],
        viewers: baseData.users.viewers || [],
    },
};

// The documented CASTO demo login is always seeded as a second
// full-permission office account, unless the active data source already
// defines an account at that address.
const seededEmails = new Set([
    sampleData.users.mainManager?.email,
    ...sampleData.users.managers.map((m) => m.email),
]);
const demoCastoIsSeparate = !seededEmails.has(demoUsers.demoCasto.email);

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
    // Second full-permission office account, only when sampleData.json claimed
    // the main-manager slot with a different email (see demoCastoIsSeparate).
    ...(demoCastoIsSeparate ? [seedUser(demoUsers.demoCasto, "main_manager")] : []),
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

// Code-gated door staff for /student-checkin. Demo mode previously seeded
// none, so verifyAttendanceStaff() had nothing to match and the check-in
// terminal was unreachable without first creating a staffer in Event
// Settings. The access code is a credential, so it follows the same
// env-var-or-generated rule as the demo passwords.
//
// status "active" (not "invited") so the code logs straight into the scanner
// instead of stopping at the fill-in-your-details step.
const demoAttendanceStaff = [
    {
        id: 7001,
        name: "Demo Check-in Staff",
        email: "checkin.demo@jobfair.demo",
        phone: "+971 50 000 0000",
        code: demoAccessCode("DEMO_CHECKIN_CODE", "Check-in staff (code)"),
        status: "active",
        updatedBy: "Maha",
        updatedAt: new Date(Date.now() - 2 * 36e5).toISOString(),
    },
];

const EVENT_OPS = {
    booths: demoBooths,
    banners: demoBanners,
    requirements: demoRequirements,
    equipment: demoEquipment,
    delegates: demoDelegates,
    passes: demoPasses,
    attendanceCompanies: demoAttendanceCompanies,
    attendanceStaff: demoAttendanceStaff,
    checkinLog: [],
    studentAttendance: [],
    schedule: demoSchedule,
    supportStaff: [],
    // Seeded so the Activity panel and the notification watcher have real
    // history to render instead of "No activity yet". Attributed across the
    // team so each member's name appears somewhere in the trail.
    audit: [
        { id: 9001, at: new Date(Date.now() - 1 * 36e5).toISOString(), by: "Rana", section: "booths", messageKey: "booths.assigned", messageParams: { number: "A01", label: pickCompany(0) } },
        { id: 9002, at: new Date(Date.now() - 3 * 36e5).toISOString(), by: "Aseel", section: "banners", messageKey: "banners.status", messageParams: { company: pickCompany(1), status: "Approved" } },
        { id: 9003, at: new Date(Date.now() - 6 * 36e5).toISOString(), by: "Prithba", section: "equipment", messageKey: "equipment.status", messageParams: { company: pickCompany(2), status: "Delivered" } },
        { id: 9004, at: new Date(Date.now() - 9 * 36e5).toISOString(), by: "Maha", section: "delegates", messageKey: "delegates.added", messageParams: { company: pickCompany(3) } },
        { id: 9005, at: new Date(Date.now() - 12 * 36e5).toISOString(), by: "Yousef", section: "passes", messageKey: "passes.issued", messageParams: { company: pickCompany(4) } },
        { id: 9006, at: new Date(Date.now() - 24 * 36e5).toISOString(), by: "Rana", section: "schedule", messageKey: "schedule.updated", messageParams: { title: "Opening remarks" } },
    ],
};

// The CASTO office team. Mirrors DEFAULT_TEAM in the frontend's
// EventOpsContext so demo mode serves the same five members the real backend
// would, rather than 404ing and leaving the frontend on its local fallback.
//
// Rana is the Event Lead: isEventLead() gives that role every operations
// module and the right to reassign other members' focus, while everyone else
// is scoped to their own focus list.
const CASTO_TEAM = [
    { id: "rana", name: "Rana", email: "rana@sharjah.ac.ae", role: "Event Lead", focus: ["venue", "schedule", "report"], responsibilities: "Owns the venue floor plan and booth assignments, builds the event-day schedule, and compiles the post-event report. Final point of contact for anything not covered by another module." },
    { id: "prithba", name: "Prithba", email: "prithba@sharjah.ac.ae", role: "Logistics & Equipment", focus: ["equipment", "requirements"], responsibilities: "Handles all equipment requests (tables, chairs, power, screens) and special requirements raised by companies (accessibility, AV, custom setups)." },
    { id: "aseel", name: "Aseel", email: "aseel@sharjah.ac.ae", role: "Branding & Media", focus: ["banners"], responsibilities: "Tracks every company's banner and branding assets from submission through printing to placement on-site." },
    { id: "maha", name: "Maha", email: "maha@sharjah.ac.ae", role: "Attendance & Check-in", focus: ["attendance", "delegates"], responsibilities: "Runs check-in on event day (booth QR scans and student check-in) and manages the company delegate list and badge printing." },
    { id: "yousef", name: "Yousef", email: "yousef@sharjah.ac.ae", role: "Access & Passes", focus: ["passes"], responsibilities: "Issues and manages entry and parking access passes for every company delegate, including parking slot assignments." },
];

// ---------------------------------------------------------------------------
// Exported store (mutate these arrays directly for in-memory persistence)
// ---------------------------------------------------------------------------

module.exports = { APPLICANTS, USERS, SETTINGS, EVENT_OPS, CASTO_TEAM, makeId, printDemoCredentials };
