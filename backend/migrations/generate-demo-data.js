/**
 * Generates demo-data.sql — a complete, synthetic dataset covering every table
 * in schema.sql and every feature surface in the dashboard.
 *
 * Unlike generate-seed.js (which converts the real MongoDB export, and whose
 * output is gitignored because it holds real applicant PII), everything here is
 * fabricated: no real person, email, phone, or password appears. The output is
 * therefore safe to commit and safe to load into shared/staging environments.
 *
 * Deterministic: a fixed PRNG seed means re-running produces byte-identical
 * SQL, so the committed file only changes when this generator changes.
 *
 * Read-only — does not connect to any database. Run with:
 *   node generate-demo-data.js
 */

const fs = require("fs");
const path = require("path");

const OUT_FILE = path.join(__dirname, "demo-data.sql");

// Every demo company account shares this bcrypt hash (cost 10) so the dataset
// is reproducible and the password is documented rather than secret.
const DEMO_PASSWORD = "Demo@1234";
const DEMO_HASH = "$2b$10$rCFqQI.Kh45UVYAE96i44uS5ugg00gDvfIUC.WoaE/lliLBUzBeSe";

// ─── Deterministic PRNG (mulberry32) ────────────────────────────────────────
let _seed = 0x6a09e667;
function rnd() {
    _seed |= 0;
    _seed = (_seed + 0x6d2b79f5) | 0;
    let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p) => rnd() < p;
function sample(arr, n) {
    const copy = [...arr];
    const out = [];
    for (let i = 0; i < n && copy.length; i++) {
        out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
    }
    return out;
}

// Mongo-style 24-char hex ids, generated deterministically so FKs line up.
let _oidCounter = 0;
function oid(prefix) {
    const ts = (0x67000000 + (_oidCounter += 7)).toString(16).padStart(8, "0");
    const mid = String(prefix).replace(/[^0-9a-f]/gi, "").padStart(8, "0").slice(0, 8);
    const tail = Array.from({ length: 8 }, () => "0123456789abcdef"[Math.floor(rnd() * 16)]).join("");
    return (ts + mid + tail).slice(0, 24);
}

// ─── SQL helpers ────────────────────────────────────────────────────────────
const S = (v) =>
    v === null || v === undefined
        ? "NULL"
        : "'" + String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
const J = (v) => (v === null || v === undefined ? "NULL" : S(JSON.stringify(v)));
const B = (v) => (v ? "1" : "0");
const N = (v) => (v === null || v === undefined ? "NULL" : String(v));
const pad2 = (n) => String(n).padStart(2, "0");
const dt = (d) => S(d.toISOString().slice(0, 19).replace("T", " "));
const dOnly = (d) => S(d.toISOString().slice(0, 10));

// Event day anchors the whole dataset so relative dates stay coherent.
const EVENT_DAY = new Date("2026-11-12T08:00:00Z");
const daysFrom = (base, n) => new Date(base.getTime() + n * 86400000);
const hhmm = (h, m) => `${pad2(h)}:${pad2(m)}`;

// ─── Reference vocabulary (all invented) ────────────────────────────────────
const SECTORS = ["Private", "Semi", "Local", "Federal"];
const CITIES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Al Ain", "Fujairah", "Ras Al Khaimah", "Umm Al Quwain"];
const INDUSTRIES = [
    "ENERGY", "BANKING AND FINANCE", "INFORMATION TECHNOLOGY", "REAL ESTATE ACTIVITIES",
    "HEALTHCARE", "LOGISTICS AND SUPPLY CHAIN", "AVIATION", "TELECOMMUNICATIONS",
    "CONSTRUCTION", "HOSPITALITY", "EDUCATION", "MANUFACTURING", "RETAIL", "CONSULTING",
];
const MAJORS = [
    "Computer Science", "Computer Engineering", "Information Systems", "Cybersecurity",
    "Mechanical Engineering", "Civil Engineering", "Electrical Engineering", "Chemical Engineering",
    "Business Administration", "Finance", "Accounting", "Marketing", "Economics",
    "Architecture", "Biomedical Engineering", "Environmental Science", "Data Science",
    "Human Resource Management", "Supply Chain Management", "Graphic Design",
];
const COLLEGES = [
    "College of Engineering", "College of Business", "College of Information Technology",
    "College of Science", "College of Humanities and Social Sciences",
    "College of Medicine and Health Sciences",
];
const OPPORTUNITY_TYPES = ["Full-time", "Part-time", "Internship", "Graduate Programme", "Co-op Training"];
const STUDY_LEVELS = ["Bachelor", "Master", "PhD", "Diploma"];
const NATIONALITIES = [
    "Emirati", "Egyptian", "Jordanian", "Indian", "Pakistani", "Syrian",
    "Lebanese", "Sudanese", "Filipino", "British", "Palestinian", "Yemeni",
];
const LANGUAGES = [
    "Arabic, English", "English", "Arabic, English, French",
    "Arabic, English, Hindi", "Arabic, English, Urdu",
];
const TECH_SKILLS = [
    "Python, SQL, Power BI", "Java, Spring Boot, MySQL", "React, TypeScript, Node.js",
    "AutoCAD, SolidWorks, MATLAB", "Excel, SAP, Tableau", "C++, Embedded Systems, IoT",
    "Figma, Adobe XD, HTML/CSS", "AWS, Docker, Kubernetes", "R, Statistics, Machine Learning",
    "Revit, Primavera P6, MS Project",
];
const SOFT_SKILLS = [
    "Teamwork, communication, time management",
    "Leadership, problem solving, adaptability",
    "Public speaking, negotiation, critical thinking",
    "Attention to detail, organisation, initiative",
    "Collaboration, presentation skills, resilience",
];
const AVAILABILITY = ["Immediately", "Within 1 month", "Within 3 months", "After graduation"];
const CAREER_GOALS = [
    "Build a career in software engineering within a large-scale technology organisation.",
    "Join a graduate programme that rotates across operations and strategy functions.",
    "Specialise in renewable energy projects and pursue a professional engineering licence.",
    "Grow into a financial analyst role and complete the CFA programme.",
    "Work in healthcare technology, combining clinical knowledge with data analysis.",
    "Develop expertise in cybersecurity operations and incident response.",
    "Move into product management after gaining hands-on engineering experience.",
];

// Invented company names — deliberately generic so none maps to a real firm.
const COMPANY_NAMES = [
    "Falcon Ridge Energy", "Zenith Gulf Bank", "Nova Systems FZ-LLC", "Harbourline Logistics",
    "Cedar Point Consulting", "Bluewave Telecom", "Meridian Health Group", "Sandstone Construction",
    "Lumen Digital Studios", "Oryx Manufacturing", "Palm Grove Hospitality", "Vertex Analytics",
    "Silver Dune Retail", "Aurora Aviation Services", "Coral Bay Properties", "Ironwood Engineering",
    "Skyline Data Centres", "Emerald Field Agritech", "Quantum Shore Robotics", "Beacon Trust Insurance",
    "Northgate Pharmaceuticals", "Crescent Media House", "Tidewater Marine", "Summit Education Group",
    "Granite Peak Mining", "Azure Cloud Partners", "Willow Creek Foods", "Redstone Security",
    "Lighthouse Legal Advisors", "Pioneer Water Solutions", "Cobalt Motors", "Starlight Entertainment",
    "Highbridge Capital", "Verdant Landscaping", "Kestrel Defence Systems", "Opal Interiors",
    "Trailblazer Sports", "Monarch Facilities Management", "Driftwood Travel", "Ember Petrochemicals",
];

const FIRST_M = [
    "Omar", "Yousef", "Khalid", "Hassan", "Ali", "Ahmed", "Saeed", "Rashid",
    "Tariq", "Bilal", "Faisal", "Ibrahim", "Zayed", "Marwan", "Nabil", "Adnan",
];
const FIRST_F = [
    "Layla", "Maryam", "Fatima", "Noura", "Aisha", "Salma", "Hind", "Reem",
    "Dana", "Amal", "Huda", "Sara", "Mona", "Rana", "Lina", "Shaikha",
];
const LAST = [
    "Al Mansouri", "Al Zaabi", "Haddad", "Nasser", "Al Farsi", "Khoury", "Saleh",
    "Al Balushi", "Rahman", "Siddiqui", "Al Hashimi", "Darwish", "Younis",
    "Al Suwaidi", "Kamal", "Abdullah",
];

// ─── Companies ──────────────────────────────────────────────────────────────
// Status spread is deliberate: mostly Confirmed (the state most screens care
// about), a band of Pending (drives confirmation-token UI), a few Canceled.
// The CASTO admin account. Not a real exhibitor — it is the organiser login the
// dashboard treats as admin, gated throughout the app on this exact email and
// on company_name === "CASTO Office" (see App.jsx / NavBar.jsx). Without it the
// demo database has 40 exhibitors and no way to reach any admin screen.
//
// Kept out of COMPANY_NAMES so it never appears in exhibitor lists, booth
// assignments, survey responses, or statistics — it is appended to the INSERT
// only, exactly as seed.sql does it.
const CASTO_ADMIN = {
    id: "67f998024358c6515d4d859c",
    name: "CASTO Office",
    email: "casto@sharjah.ac.ae",
    rep: "CASTO Office",
    sector: "Federal",
    city: "Sharjah",
    industry: "University Careers Office",
    positions: "0",
    majors: [],
    oppTypes: [],
    status: "Confirmed",
};

const companies = COMPANY_NAMES.map((name, i) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const status = i < 26 ? "Confirmed" : i < 35 ? "Pending" : "Canceled";
    const female = chance(0.5);
    return {
        id: oid(String(i)),
        name,
        email: `careers@${slug}.example.com`,
        rep: `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`,
        sector: pick(SECTORS),
        city: pick(CITIES),
        industry: pick(INDUSTRIES),
        positions: String(int(1, 25)),
        majors: sample(MAJORS, int(2, 5)),
        oppTypes: sample(OPPORTUNITY_TYPES, int(1, 3)),
        status,
        confirmed: status === "Confirmed",
    };
});
const confirmed = companies.filter((c) => c.confirmed);

const companyRows = companies.map((c, i) => {
    // Only Pending companies carry a live confirmation token; Confirmed ones
    // have already consumed theirs, Canceled ones never completed the flow.
    const pending = c.status === "Pending";
    return `(
    ${S(c.id)}, ${S(c.name)}, ${S(c.email)}, ${S(DEMO_HASH)},
    ${S("+9715" + int(10000000, 59999999))}, ${S(c.rep)},
    ${J(c.industry)}, ${S(c.sector)}, ${S(c.city)}, ${S(c.positions)},
    ${J(c.majors)}, ${J(c.oppTypes)},
    ${S("Strong communication skills, willingness to learn, and a collaborative mindset.")},
    ${S(c.status)},
    ${pending ? S("demo-token-" + i.toString(36).padStart(4, "0")) : "NULL"},
    ${pending ? dt(daysFrom(EVENT_DAY, -20)) : "NULL"},
    ${chance(0.4) ? dt(daysFrom(EVENT_DAY, -30)) : "NULL"}
)`;
});

// Appended after the exhibitors so the admin row exists in `companies` (login
// reads from there) without being part of `companies`/`confirmed`, which drive
// booths, surveys, attendance and statistics.
companyRows.push(`(
    ${S(CASTO_ADMIN.id)}, ${S(CASTO_ADMIN.name)}, ${S(CASTO_ADMIN.email)}, ${S(DEMO_HASH)},
    ${S("+97165050000")}, ${S(CASTO_ADMIN.rep)},
    ${J(CASTO_ADMIN.industry)}, ${S(CASTO_ADMIN.sector)}, ${S(CASTO_ADMIN.city)}, ${S(CASTO_ADMIN.positions)},
    ${J(CASTO_ADMIN.majors)}, ${J(CASTO_ADMIN.oppTypes)},
    ${S("Organiser account — not an exhibitor.")},
    ${S(CASTO_ADMIN.status)},
    NULL,
    NULL,
    NULL
)`);

// ─── Company login emails (shared-login feature) ─────────────────────────────
const loginEmailRows = [];
for (const c of sample(confirmed, 10)) {
    const domain = c.email.split("@")[1];
    loginEmailRows.push(
        `(${S(c.id)}, ${S("recruitment@" + domain)}, ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -25))})`
    );
    if (chance(0.4)) {
        loginEmailRows.push(
            `(${S(c.id)}, ${S("hr.team@" + domain)}, ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -24))})`
        );
    }
}

// ─── Applicants ─────────────────────────────────────────────────────────────
const APPLICANT_COUNT = 260;
const applicants = [];
for (let i = 0; i < APPLICANT_COUNT; i++) {
    const female = chance(0.52);
    // ~12% are deliberately incomplete submissions, mirroring the real data's
    // shape so null-handling and empty states get exercised.
    const incomplete = chance(0.12);
    applicants.push({
        id: oid("a" + i.toString(16)),
        uniId: String(202100000 + i * 7),
        name: `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`,
        female,
        level: chance(0.72) ? "Bachelor" : pick(STUDY_LEVELS),
        major: pick(MAJORS),
        college: pick(COLLEGES),
        incomplete,
        attended: !incomplete && chance(0.42),
    });
}

const applicantRows = applicants.map((a, i) => {
    if (a.incomplete) {
        // No applicantDetails at all: every detail column NULL.
        return `(
    ${S(a.id)}, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    ${B(false)}, ${dt(daysFrom(EVENT_DAY, -60 + (i % 40)))}, ${dt(daysFrom(EVENT_DAY, -55 + (i % 40)))}
)`;
    }
    const slug = a.name.toLowerCase().replace(/[^a-z]+/g, ".");
    const gradYear = 2026 + int(0, 2);
    return `(
    ${S(a.id)}, ${S(a.uniId)}, ${S(a.name)},
    ${dOnly(new Date(Date.UTC(int(1998, 2006), int(0, 11), int(1, 28))))},
    ${S(a.female ? "Female" : "Male")}, ${S(pick(NATIONALITIES))}, ${S(a.level)},
    ${S(a.college)}, ${S(a.major)},
    ${S(slug + "@students.example.ac.ae")}, ${S("+9715" + int(10000000, 59999999))},
    ${(2 + rnd() * 2).toFixed(2)}, ${S(pick(CITIES))},
    ${S("https://www.linkedin.com/in/" + slug.replace(/\./g, "-") + "-demo")},
    ${S(pick(TECH_SKILLS))}, ${S(pick(SOFT_SKILLS))},
    ${S(chance(0.55) ? "Internship at a local firm (" + int(2, 6) + " months)." : "No prior formal experience.")},
    ${S(pick(LANGUAGES))},
    ${dOnly(new Date(Date.UTC(gradYear, pick([4, 5, 11]), int(1, 28))))},
    ${J(sample(INDUSTRIES, int(1, 3)))}, ${J(sample(OPPORTUNITY_TYPES, int(1, 2)))},
    ${S(pick(CITIES))}, ${S(pick(CAREER_GOALS))}, ${S(pick(AVAILABILITY))},
    ${chance(0.7)
            ? J({
                url: "https://res.cloudinary.com/demo/raw/upload/cv_" + a.uniId + ".pdf",
                public_id: "demo/cv_" + a.uniId,
                originalname: a.name.replace(/ /g, "_") + "_CV.pdf",
            })
            : "NULL"},
    ${B(a.attended)},
    ${dt(daysFrom(EVENT_DAY, -60 + (i % 40)))}, ${dt(daysFrom(EVENT_DAY, -55 + (i % 40)))}
)`;
});

// ─── Applicant <-> company relations ────────────────────────────────────────
// Covers all four relation types, including pairs holding more than one type
// at once (shortlisted then rejected) since the PK explicitly allows that.
const relationRows = [];
const seenRel = new Set();
function addRel(applicantId, companyId, type) {
    const key = `${applicantId}|${companyId}|${type}`;
    if (seenRel.has(key)) return;
    seenRel.add(key);
    relationRows.push(`(${S(applicantId)}, ${S(companyId)}, ${S(type)})`);
}
for (const a of applicants) {
    if (a.incomplete) continue;
    for (const c of sample(confirmed, int(1, 5))) {
        addRel(a.id, c.id, "applied");
        if (chance(0.3)) addRel(a.id, c.id, "shortlisted");
        if (chance(0.15)) addRel(a.id, c.id, "rejected");
        if (chance(0.12)) addRel(a.id, c.id, "flagged");
    }
}

// ─── Company survey responses (q1..q22) ─────────────────────────────────────
const SURVEY_QUESTIONS = [
    "How would you rate the overall organisation of the job fair?",
    "How satisfied were you with the booth allocation process?",
    "Was the registration process clear and straightforward?",
    "How would you rate the quality of student candidates?",
    "Did the event meet your recruitment objectives?",
    "How satisfied were you with the venue facilities?",
    "Was the event schedule communicated clearly in advance?",
    "How would you rate the support from the CASTO team?",
    "Were the parking and access arrangements adequate?",
    "How would you rate the catering and refreshments?",
    "Was the booth setup time sufficient?",
    "How likely are you to participate again next year?",
    "Would you recommend this event to other employers?",
    "How would you rate the signage and wayfinding?",
    "Was the student traffic to your booth as expected?",
    "How would you rate the audio-visual support provided?",
    "Were your special requirements handled satisfactorily?",
    "How would you rate the pre-event communication?",
    "Was the delegate badge process efficient?",
    "How would you rate the event's digital platform?",
    "Did you make any hires or shortlist candidates?",
    "Any other feedback or suggestions for improvement?",
];
const RATINGS = ["Excellent", "Very Good", "Good", "Average", "Needs Improvement"];
const FREE_TEXT = [
    "Very well organised overall; the team was responsive throughout.",
    "More time for booth setup would help next year.",
    "Student turnout exceeded our expectations in the morning session.",
    "Clearer signage near the parking entrance would be appreciated.",
    "We shortlisted several strong candidates and will follow up.",
    "",
];
// Only a subset of confirmed companies submitted, so the "not yet submitted"
// state stays reachable in the UI.
const surveyRows = [];
for (const c of sample(confirmed, 18)) {
    SURVEY_QUESTIONS.forEach((text, qi) => {
        const freeForm = qi >= 20;
        surveyRows.push(
            `(${S(c.id)}, ${S("q" + (qi + 1))}, ${S(text)}, ${S(freeForm ? pick(FREE_TEXT) : pick(RATINGS))})`
        );
    });
}

// ─── Attendance staff ───────────────────────────────────────────────────────
const STAFF = [
    ["Rana Al Hashimi", "rana.h", "active"],
    ["Omar Nasser", "omar.n", "active"],
    ["Salma Khoury", "salma.k", "active"],
    ["Bilal Rahman", "bilal.r", "active"],
    ["Hind Al Zaabi", "hind.z", "active"],
    ["Yousef Darwish", "yousef.d", "invited"],
    ["Dana Saleh", "dana.s", "invited"],
    ["Marwan Kamal", "marwan.k", "active"],
];
const staffRows = STAFF.map(([name, slug, status], i) => `(
    ${N(1700000000000 + i * 1000)}, ${S(name)}, ${S(slug + "@casto.example.ac.ae")},
    ${S("+9715" + int(10000000, 59999999))}, ${S("STAFF" + String(101 + i))},
    ${S(status)}, ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -7))}
)`);
// attendance_staff.id is AUTO_INCREMENT starting at 1, so row order gives the
// id that checkin_log's FK must point at.
const ACTIVE_STAFF_IDS = STAFF.map((s, i) => (s[2] === "active" ? i + 1 : null)).filter(Boolean);

// ─── Check-in log ───────────────────────────────────────────────────────────
const attendees = applicants.filter((a) => a.attended);
const checkinRows = attendees.map((a, i) => {
    const staffId = pick(ACTIVE_STAFF_IDS);
    const staffName = STAFF[staffId - 1][0];
    const at = new Date(EVENT_DAY.getTime() + (60 + i * 3) * 60000);
    return `(${N(1700100000000 + i * 977)}, ${S(a.id)}, ${S(a.uniId)}, ${S(a.name)}, ${N(staffId)}, ${S(staffName)}, ${dt(at)})`;
});

// ─── Booths ─────────────────────────────────────────────────────────────────
// 48 booths across 4 zones. Confirmed companies fill the first 26, leaving
// Reserved and Available booths so every status renders.
const ZONES = ["A", "B", "C", "D"];
const BOOTH_TYPES = ["Standard", "Premium", "Corner", "Island"];
const booths = [];
let boothSeq = 0;
for (const zone of ZONES) {
    for (let n = 1; n <= 12; n++) {
        const idx = boothSeq++;
        const company = idx < confirmed.length ? confirmed[idx] : null;
        booths.push({
            id: idx + 1, // matches AUTO_INCREMENT order, used by equipment_requests
            number: `${zone}${pad2(n)}`,
            zone,
            ring: n <= 4 ? "Inner" : n <= 8 ? "Middle" : "Outer",
            company,
            type: pick(BOOTH_TYPES),
            status: company ? "Assigned" : idx < confirmed.length + 6 ? "Reserved" : "Available",
        });
    }
}
const boothRows = booths.map((b, i) => `(
    ${N(1700200000000 + i * 811)}, ${S(b.number)}, ${S(b.zone)}, ${S(b.ring)},
    ${b.company ? S(b.company.name) : "NULL"}, ${b.company ? S(b.company.id) : "NULL"},
    ${S(b.type)}, ${S(b.status)}, ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -10))}
)`);
const assignedBooths = booths.filter((b) => b.company);

// ─── Banners ────────────────────────────────────────────────────────────────
const BANNER_STATUS = ["Not Submitted", "Submitted", "Approved", "Printed", "Placed"];
const MATERIALS = ["Vinyl", "Fabric", "Mesh", "Foam Board", "Acrylic"];
const SIZES = ["2x1 m", "3x2 m", "4x2 m", "1.5x1 m", "6x3 m"];
const bannerRows = sample(confirmed, 22).map((c, i) => {
    const status = BANNER_STATUS[i % BANNER_STATUS.length];
    return `(
    ${N(1700300000000 + i * 733)}, ${S(c.name)}, ${S(c.id)}, ${S(pick(MATERIALS))}, ${S(pick(SIZES))},
    ${N(int(1, 4))}, ${status === "Not Submitted" ? "NULL" : S("artwork_" + i + ".pdf")},
    ${S(c.rep)}, ${dOnly(daysFrom(EVENT_DAY, -14))}, ${S(status)},
    ${S(status === "Not Submitted"
            ? "Awaiting artwork from the company."
            : "Artwork received and checked against the print spec.")},
    ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -12))}
)`;
});

// ─── Special requirements ───────────────────────────────────────────────────
const REQ_CATEGORIES = ["Accessibility", "Power", "Networking", "Catering", "Furniture", "Security", "Storage"];
const REQ_PRIORITY = ["Low", "Medium", "High", "Critical"];
const REQ_STATUS = ["Open", "In Progress", "Fulfilled"];
const REQ_TEXT = [
    "Requires wheelchair-accessible booth access and a lowered counter.",
    "Needs a dedicated 16A power line for demonstration equipment.",
    "Requests a wired network connection for a live product demo.",
    "Halal catering required for a delegation of eight.",
    "Additional two high stools and one lockable cabinet.",
    "Overnight storage for promotional materials.",
    "Private interview space adjacent to the booth for two hours.",
];
const reqRows = sample(confirmed, 20).map((c, i) => `(
    ${N(1700400000000 + i * 659)}, ${S(c.name)}, ${S(c.id)}, ${S(REQ_TEXT[i % REQ_TEXT.length])},
    ${S(REQ_CATEGORIES[i % REQ_CATEGORIES.length])}, ${S(REQ_PRIORITY[i % REQ_PRIORITY.length])},
    ${S(REQ_STATUS[i % REQ_STATUS.length])},
    ${S("Logged during pre-event coordination call.")}, ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -9))}
)`);

// ─── Equipment requests ─────────────────────────────────────────────────────
const ITEMS = [
    "Extra chairs", '55" display screen', "Extension cord", "Whiteboard",
    "Standing banner rail", "Coffee machine", "Laptop stand", "Wireless microphone",
];
const equipRows = assignedBooths.slice(0, 24).map((b, i) => {
    const requested = int(1, 6);
    // Cycles through fulfilled / partial / pending so each status is present.
    const mode = i % 3;
    const fulfilled = mode === 0 ? requested : mode === 1 ? int(1, Math.max(1, requested - 1)) : 0;
    const status = mode === 0 ? "Fulfilled" : mode === 1 ? "Partial" : "Pending";
    // Every 4th row is company-raised and awaiting CASTO approval:
    // requested_by != NULL, status Pending, qty_fulfilled 0.
    const companyRaised = i % 4 === 3;
    return `(
    ${N(1700500000000 + i * 577)}, ${S(b.company.name + " / " + b.number)}, ${N(b.id)},
    ${S(ITEMS[i % ITEMS.length])}, ${N(requested)}, ${N(companyRaised ? 0 : fulfilled)},
    ${S(companyRaised ? "Pending" : status)},
    ${companyRaised ? S(b.company.name) : "NULL"},
    ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -6))}
)`;
});

// ─── Company delegates ──────────────────────────────────────────────────────
const ROLES = [
    "Talent Acquisition Lead", "HR Manager", "Recruitment Officer",
    "Engineering Manager", "Graduate Programme Lead", "Marketing Executive",
];
const delegateRows = [];
for (const b of assignedBooths) {
    const domain = b.company.email.split("@")[1];
    for (let d = 0; d < int(1, 3); d++) {
        const female = chance(0.5);
        const name = `${pick(female ? FIRST_F : FIRST_M)} ${pick(LAST)}`;
        delegateRows.push(`(
    ${S(b.company.name)}, ${S(b.company.id)}, ${S(name)}, ${S(pick(ROLES))},
    ${S(name.toLowerCase().replace(/[^a-z]+/g, ".") + "@" + domain)},
    ${S("+9715" + int(10000000, 59999999))}, ${S(chance(0.6) ? "Printed" : "Pending")}
)`);
    }
}

// ─── Access passes ──────────────────────────────────────────────────────────
// Entry passes leave slot/location/map_url NULL; Parking passes populate them,
// matching the rule the app enforces in application code.
const PASS_STATUS = ["Active", "Used", "Revoked"];
const passRows = [];
assignedBooths.forEach((b, i) => {
    passRows.push(`(
    ${N(1700600000000 + i * 499)}, ${S(b.company.name)}, ${S(b.company.rep)}, ${S("Entry")},
    ${S("ENT-" + String(1000 + i))}, ${dOnly(daysFrom(EVENT_DAY, -5))},
    ${S(PASS_STATUS[i % PASS_STATUS.length])}, NULL, NULL, NULL,
    ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -5))}
)`);
    if (i % 2 === 0) {
        const slot = "P" + pad2(int(1, 40));
        passRows.push(`(
    ${N(1700650000000 + i * 499)}, ${S(b.company.name)}, ${S(b.company.rep)}, ${S("Parking")},
    ${S("PRK-" + String(2000 + i))}, ${dOnly(daysFrom(EVENT_DAY, -5))},
    ${S(i % 4 === 0 ? "Active" : "Used")}, ${S(slot)},
    ${S("Visitor Car Park " + pick(["North", "South", "East", "West"]))},
    ${S("https://maps.example.com/?q=25.2%2C55.3&z=17&pin=" + slot)},
    ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -5))}
)`);
    }
});

// ─── Company attendance (event-day) ─────────────────────────────────────────
const companyAttRows = assignedBooths.map((b, i) => {
    const delegates = int(1, 4);
    const mode = i % 4;
    const checked = mode === 3 ? 0 : mode === 2 ? Math.max(1, delegates - 1) : delegates;
    const status = checked === 0 ? "Absent" : checked < delegates ? "Partial" : "Present";
    return `(
    ${S(b.number)}, ${S(b.company.name)}, ${S(b.company.id)}, ${N(delegates)}, ${N(checked)},
    ${checked ? S(hhmm(8, (i * 7) % 60)) : "NULL"}, ${S(checked ? pick(["QR", "Manual"]) : "—")},
    ${S(status)}, ${S("CASTO Admin")}, ${dt(new Date(EVENT_DAY.getTime() + 3600000))}
)`;
});

// ─── Student attendance view ────────────────────────────────────────────────
const studentViewRows = sample(applicants.filter((a) => !a.incomplete), 80).map((a, i) => `(
    ${S(a.uniId)}, ${S(a.id)}, ${S(a.name)},
    ${a.attended ? S(hhmm(9, (i * 5) % 60)) : "NULL"}, ${S(a.attended ? pick(["QR", "Manual"]) : "—")},
    ${S(a.attended ? "Checked In" : "Pending")}
)`);

// ─── Event schedule ─────────────────────────────────────────────────────────
const SCHEDULE = [
    ["08:00", "09:00", "Exhibitor Setup & Booth Check", "Operations Team", "Main Hall", 60, 48, "Ended"],
    ["09:00", "09:30", "Opening Ceremony", "University Leadership", "Main Stage", 400, 372, "Ended"],
    ["09:30", "10:15", "Keynote: Careers in the Energy Transition", "Falcon Ridge Energy", "Auditorium A", 250, 233, "Ended"],
    ["10:15", "11:00", "Panel: Breaking into Technology", "Nova Systems FZ-LLC", "Auditorium B", 200, 188, "Live"],
    ["11:00", "12:00", "CV Clinic & Portfolio Review", "CASTO Careers Team", "Workshop Room 1", 80, 80, "Live"],
    ["12:00", "13:00", "Networking Lunch", "CASTO", "Atrium", 500, 410, "Upcoming"],
    ["13:00", "13:45", "Workshop: Interview Skills", "Cedar Point Consulting", "Workshop Room 2", 60, 47, "Upcoming"],
    ["13:45", "14:30", "Graduate Programmes Showcase", "Zenith Gulf Bank", "Auditorium A", 180, 121, "Upcoming"],
    ["14:30", "15:15", "Startup & Entrepreneurship Corner", "Quantum Shore Robotics", "Innovation Lab", 70, 39, "Upcoming"],
    ["15:15", "16:00", "Closing Remarks & Prize Draw", "University Leadership", "Main Stage", 400, 268, "Upcoming"],
];
const scheduleRows = SCHEDULE.map(([start, end, title, host, loc, cap, reg, status], i) => `(
    ${N(1700700000000 + i * 431)}, ${S(start)}, ${S(end)}, ${S(title)}, ${S(host)}, ${S(loc)},
    ${N(cap)}, ${N(reg)}, ${S(status)}, ${S("CASTO Admin")}, ${dt(daysFrom(EVENT_DAY, -3))}
)`);

// ─── CASTO team members ─────────────────────────────────────────────────────
// focus_modules values come from MODULE_LABELS in the frontend.
const TEAM = [
    ["tm-001", "Rana Al Hashimi", "rana.h", "Event Operations Lead", ["venue", "attendance", "report"]],
    ["tm-002", "Omar Nasser", "omar.n", "Logistics Coordinator", ["equipment", "requirements", "passes"]],
    ["tm-003", "Salma Khoury", "salma.k", "Employer Relations Manager", ["delegates", "banners", "schedule"]],
    ["tm-004", "Bilal Rahman", "bilal.r", "Student Engagement Officer", ["attendance", "manageStaff"]],
    ["tm-005", "Hind Al Zaabi", "hind.z", "Marketing & Branding", ["banners", "report"]],
    ["tm-006", "Marwan Kamal", "marwan.k", "Facilities Supervisor", ["venue", "equipment"]],
];
const teamRows = TEAM.map(([id, name, slug, role, mods]) => `(
    ${S(id)}, ${S(name)}, ${S(slug + "@casto.example.ac.ae")}, ${S(role)}, ${J(mods)},
    ${S("Owns " + mods.join(", ") + " for the November 2026 fair.")}, ${S("CASTO Admin")},
    ${dt(daysFrom(EVENT_DAY, -45))}
)`);

// ─── Event-ops audit log ────────────────────────────────────────────────────
const auditRows = [];
let auditSeq = 0;
function audit(daysBefore, actor, section, message) {
    auditRows.push(
        `(${N(1700800000000 + auditSeq * 397)}, ${dt(daysFrom(EVENT_DAY, -daysBefore))}, ${S(actor)}, ${S(section)}, ${S(message)})`
    );
    auditSeq++;
}
assignedBooths.slice(0, 14).forEach((b, i) =>
    audit(10 - (i % 8), TEAM[i % TEAM.length][1], "venue", `Assigned booth ${b.number} to ${b.company.name}`)
);
audit(9, "Salma Khoury", "banners", "Approved artwork for Bluewave Telecom");
audit(9, "Omar Nasser", "equipment", "Marked 2 extra chairs as fulfilled for Harbourline Logistics / B03");
audit(8, "Rana Al Hashimi", "schedule", "Added Workshop: Interview Skills at 13:00");
audit(8, "Marwan Kamal", "requirements", "Escalated power requirement for Oryx Manufacturing to Critical");
audit(7, "Bilal Rahman", "manageStaff", "Invited Dana Saleh as attendance staff");
audit(6, "Omar Nasser", "passes", "Issued 12 parking passes for Zone A exhibitors");
audit(5, "Salma Khoury", "delegates", "Printed badges for Cedar Point Consulting (3 delegates)");
audit(3, "Rana Al Hashimi", "report", "Generated pre-event readiness report");
audit(1, "Marwan Kamal", "venue", "Reverted booth D11 to Available after a cancellation");
audit(0, "Bilal Rahman", "attendance", "Opened student check-in at the main entrance");

// ─── Settings ───────────────────────────────────────────────────────────────
const settingsRows = [
    `(${S("surveyPublic")}, ${J(true)}, ${dt(daysFrom(EVENT_DAY, -2))}, ${S("CASTO Admin")})`,
    `(${S("eventOpsSupportStaff")}, ${J(
        TEAM.slice(0, 4).map(([id, name, slug, role]) => ({
            id, name, email: slug + "@casto.example.ac.ae", role,
        }))
    )}, ${dt(daysFrom(EVENT_DAY, -20))}, ${S("CASTO Admin")})`,
    `(${S("eventOpsAudit")}, ${J({
        retentionDays: 180,
        lastPrunedAt: daysFrom(EVENT_DAY, -30).toISOString(),
    })}, ${dt(daysFrom(EVENT_DAY, -30))}, ${S("CASTO Admin")})`,
];

// ─── Emit ───────────────────────────────────────────────────────────────────
function block(table, cols, rows) {
    if (!rows.length) return "";
    return `INSERT INTO ${table} (\n    ${cols}\n) VALUES\n${rows.join(",\n")};\n`;
}

const out = [];
out.push(`-- ============================================================================
-- JobFair demo dataset — AUTO-GENERATED by generate-demo-data.js. Do not edit.
--
-- 100% synthetic. No real applicant, company, email, phone number, or password
-- appears in this file, so unlike migrations/seed.sql it is safe to commit and
-- safe to load into shared or staging environments.
--
-- Covers every table in schema.sql and exercises every status/enum value the
-- dashboard renders, including empty and partial states.
--
-- All ${companies.length} company accounts share the password: ${DEMO_PASSWORD}
--   e.g. ${companies[0].email}
--
-- The CASTO admin account uses the same password:
--   ${CASTO_ADMIN.email}
-- It is the organiser login (admin screens, event settings) and is deliberately
-- excluded from booths, surveys, attendance and statistics.
--
-- Load AFTER schema.sql, into a database that already has the tables:
--   mysql -u <user> -p <dbname> < demo-data.sql
--
-- Re-runnable: clears every table first (children before parents), so loading
-- it twice is safe.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM event_ops_audit_log;
DELETE FROM casto_team_members;
DELETE FROM event_schedule;
DELETE FROM student_attendance_view;
DELETE FROM company_attendance;
DELETE FROM company_delegates;
DELETE FROM equipment_requests;
DELETE FROM special_requirements;
DELETE FROM banners;
DELETE FROM booths;
DELETE FROM access_passes;
DELETE FROM checkin_log;
DELETE FROM attendance_staff;
DELETE FROM company_survey_responses;
DELETE FROM applicant_company_relations;
DELETE FROM applicants;
DELETE FROM company_login_emails;
DELETE FROM companies;
DELETE FROM settings;
ALTER TABLE access_passes AUTO_INCREMENT = 1;
ALTER TABLE attendance_staff AUTO_INCREMENT = 1;
ALTER TABLE banners AUTO_INCREMENT = 1;
ALTER TABLE booths AUTO_INCREMENT = 1;
ALTER TABLE company_attendance AUTO_INCREMENT = 1;
ALTER TABLE company_delegates AUTO_INCREMENT = 1;
ALTER TABLE company_login_emails AUTO_INCREMENT = 1;
ALTER TABLE company_survey_responses AUTO_INCREMENT = 1;
ALTER TABLE equipment_requests AUTO_INCREMENT = 1;
ALTER TABLE event_ops_audit_log AUTO_INCREMENT = 1;
ALTER TABLE event_schedule AUTO_INCREMENT = 1;
ALTER TABLE special_requirements AUTO_INCREMENT = 1;
ALTER TABLE student_attendance_view AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;
`);

out.push(block(
    "companies",
    "id, company_name, email, password, phone, representatives, fields, sector, city,\n    no_of_positions, preferred_majors, opportunity_types, preferred_qualities,\n    status, confirmation_token, confirmation_token_expiry, reminder_sent_at",
    companyRows
));
out.push(block("company_login_emails", "company_id, email, added_by, created_at", loginEmailRows));
out.push(block(
    "applicants",
    "id, uni_id, full_name, birthdate, gender, nationality, study_level, college,\n    major, email, phone_number, cgpa, city, linked_in, technical_skills,\n    non_technical_skills, experience, languages, expected_to_graduate,\n    field_interest, opportunity_type, preferred_work_city, career_goals, availability,\n    cv_metadata, attended, created_at, updated_at",
    applicantRows
));
out.push(block("applicant_company_relations", "applicant_id, company_id, relation_type", relationRows));
out.push(block("company_survey_responses", "company_id, question_id, question_text, response", surveyRows));
out.push(block("attendance_staff", "legacy_id, name, email, phone, code, status, updated_by, updated_at", staffRows));
out.push(block("checkin_log", "id, applicant_id, uni_id_snapshot, full_name_snapshot, checked_in_by_staff_id, checked_in_by_name, checked_in_at", checkinRows));
out.push(block("booths", "legacy_id, number, zone, ring, company_name, company_id, booth_type, status, updated_by, updated_at", boothRows));
out.push(block("access_passes", "legacy_id, company_name, delegate, pass_type, code, issued_date, status, slot, location, map_url, updated_by, updated_at", passRows));
out.push(block("banners", "legacy_id, company_name, company_id, material, size, quantity, artwork, contact, deadline, status, notes, updated_by, updated_at", bannerRows));
out.push(block("special_requirements", "legacy_id, company_name, company_id, description, category, priority, status, notes, updated_by, updated_at", reqRows));
out.push(block("equipment_requests", "legacy_id, entity_label, booth_id, item, qty_requested, qty_fulfilled, status, requested_by, updated_by, updated_at", equipRows));
out.push(block("company_delegates", "company_name, company_id, name, role, email, phone, badge_status", delegateRows));
out.push(block("company_attendance", "booth_number, company_name, company_id, delegate_count, checked_in_count, check_in_time, method, status, updated_by, updated_at", companyAttRows));
out.push(block("student_attendance_view", "uni_id, applicant_id, student_name, check_in_time, method, status", studentViewRows));
out.push(block("event_schedule", "legacy_id, start_time, end_time, title, host, location, capacity, registered, status, updated_by, updated_at", scheduleRows));
out.push(block("casto_team_members", "id, name, email, role, focus_modules, responsibilities, invited_by, created_at", teamRows));
out.push(block("event_ops_audit_log", "legacy_id, occurred_at, actor_name, section, message", auditRows));
out.push(block("settings", "`key`, value, updated_at, updated_by", settingsRows));

fs.writeFileSync(OUT_FILE, out.join("\n"), "utf-8");

const counts = [
    ["companies", companyRows.length],
    ["company_login_emails", loginEmailRows.length],
    ["applicants", applicantRows.length],
    ["applicant_company_relations", relationRows.length],
    ["company_survey_responses", surveyRows.length],
    ["attendance_staff", staffRows.length],
    ["checkin_log", checkinRows.length],
    ["booths", boothRows.length],
    ["access_passes", passRows.length],
    ["banners", bannerRows.length],
    ["special_requirements", reqRows.length],
    ["equipment_requests", equipRows.length],
    ["company_delegates", delegateRows.length],
    ["company_attendance", companyAttRows.length],
    ["student_attendance_view", studentViewRows.length],
    ["event_schedule", scheduleRows.length],
    ["casto_team_members", teamRows.length],
    ["event_ops_audit_log", auditRows.length],
    ["settings", settingsRows.length],
];
console.log(`Wrote ${OUT_FILE}`);
for (const [t, n] of counts) console.log(`  ${t.padEnd(30)} ${String(n).padStart(5)}`);
console.log(`  ${"TOTAL".padEnd(30)} ${String(counts.reduce((s, [, n]) => s + n, 0)).padStart(5)} rows`);
