/**
 * Reads the MongoDB JSON exports in data/ and generates a MySQL seed file
 * (seed.sql) with INSERT statements for companies, applicants, their
 * relations, survey responses, and settings.
 *
 * Read-only against the source JSON files — does not modify them, does not
 * connect to any database. Run with: node generate-seed.js
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "..", "..", "..", "data");
const OUT_FILE = path.join(__dirname, "seed.sql");

const applicants = require(path.join(DATA_DIR, "Applicants.json"));
const companies = require(path.join(DATA_DIR, "Companies.json"));
// companies-data.json is intentionally NOT used: it shares every _id/email
// with Companies.json but holds older field values (see migration notes).

const REPORT = { warnings: [] };

function warn(msg) {
    REPORT.warnings.push(msg);
}

// ─── SQL value helpers ──────────────────────────────────────────────────────

function sqlString(val) {
    if (val === null || val === undefined) return "NULL";
    return "'" + String(val).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
}

function sqlJson(val) {
    if (val === null || val === undefined) return "NULL";
    return sqlString(JSON.stringify(val));
}

function sqlBool(val) {
    return val ? "1" : "0";
}

function sqlDate(mongoDate) {
    if (!mongoDate) return "NULL";
    const iso = mongoDate.$date || mongoDate;
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
        warn(`Unparseable date "${iso}" -> stored as NULL`);
        return "NULL";
    }
    return sqlString(d.toISOString().slice(0, 19).replace("T", " "));
}

function sqlDateOnly(dateStr, fieldLabel = "date") {
    if (!dateStr) return "NULL";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        warn(`Unparseable ${fieldLabel} "${dateStr}" -> stored as NULL`);
        return "NULL";
    }
    return sqlString(d.toISOString().slice(0, 10));
}

// cgpa column is DECIMAL(3,2) — see schema.sql for the source-data audit.
// "" -> NULL. One real outlier ("40") is a near-certain dropped decimal
// point for a 4.0-scale GPA; corrected per data owner sign-off. Anything
// else non-numeric or out of DECIMAL(3,2)'s 0.00-9.99 range is NULLed and
// logged rather than guessed at.
function sqlCgpa(raw, contextId) {
    if (raw === null || raw === undefined || raw === "") return "NULL";
    let n = Number(raw);
    if (isNaN(n)) {
        warn(`Applicant ${contextId}: non-numeric cgpa "${raw}" -> stored as NULL`);
        return "NULL";
    }
    if (String(raw) === "40") {
        warn(`Applicant ${contextId}: cgpa "40" corrected to 4.00 (dropped decimal point, per data owner sign-off)`);
        n = 4.0;
    }
    if (n < 0 || n > 9.99) {
        warn(`Applicant ${contextId}: out-of-range cgpa "${raw}" -> stored as NULL`);
        return "NULL";
    }
    return n.toFixed(2);
}

// gender/studyLevel/sector columns are now ENUMs with a fixed, source-data-
// verified value set (see schema.sql). Anything outside that set is NULLed
// and logged rather than silently coerced or rejecting the whole row.
function sqlEnum(raw, allowedValues, fieldLabel, contextId) {
    if (raw === null || raw === undefined || raw === "") return "NULL";
    if (!allowedValues.includes(raw)) {
        warn(`${contextId}: unexpected ${fieldLabel} "${raw}" -> stored as NULL`);
        return "NULL";
    }
    return sqlString(raw);
}

function oid(idField) {
    if (!idField) return null;
    return typeof idField === "string" ? idField : idField.$oid;
}

// ObjectId's first 4 bytes are a big-endian unix timestamp (seconds) —
// used to decide "newer wins" when the source data has real duplicates.
function oidTimestamp(idStr) {
    return parseInt(idStr.substring(0, 8), 16);
}

// ─── Companies ──────────────────────────────────────────────────────────────

// The companies table enforces UNIQUE(email), but MySQL's default collation
// is case-insensitive while the source data has one pair of records that
// differ only by email case (two distinct real signups, confirmed by
// differing _id/companyName/password). Mongo had no such constraint at the
// DB level, so this only surfaces here. Resolution (per data owner): keep
// the newer record (later ObjectId timestamp) as the surviving company row,
// drop the older duplicate — EXCEPT if the older record has survey answers
// and the newer one doesn't, in which case the older record's surveyResult
// is carried over onto the surviving row so that real data isn't lost.
function hasSurveyData(c) {
    let sr = c.surveyResult;
    if (Array.isArray(sr) && sr.length > 0 && Array.isArray(sr[0])) sr = sr[sr.length - 1];
    return Array.isArray(sr) && sr.length > 0;
}

const byEmailLower = new Map();
for (const c of companies) {
    const id = oid(c._id);
    if (!id) continue;
    const key = (c.email || "").toLowerCase();
    const existing = byEmailLower.get(key);
    if (!existing) {
        byEmailLower.set(key, c);
        continue;
    }

    const [older, newer] = oidTimestamp(id) > oidTimestamp(oid(existing._id))
        ? [existing, c]
        : [c, existing];

    let survivor = newer;
    if (!hasSurveyData(newer) && hasSurveyData(older)) {
        survivor = { ...newer, surveyResult: older.surveyResult };
        warn(`Company email collision (case-insensitive) "${key}": kept newer record ${oid(newer._id)} ("${newer.companyName}"), dropped older ${oid(older._id)} ("${older.companyName}") but carried over its survey answers (newer record had none)`);
    } else {
        warn(`Company email collision (case-insensitive) "${key}": kept newer record ${oid(newer._id)} ("${newer.companyName}"), dropped older ${oid(older._id)} ("${older.companyName}")`);
    }
    byEmailLower.set(key, survivor);
}
const dedupedCompanies = [...byEmailLower.values()];

// Lookup table for resolving applicant relation arrays (company NAME
// strings) to real company IDs. Keyed by trimmed exact name — verified
// against the full dataset: 27 of 29 distinct referenced names match a real
// company by exact trimmed name; the other 2 are junk (see relations section).
const companyIdByExactName = new Map();
for (const c of dedupedCompanies) {
    companyIdByExactName.set(c.companyName.trim(), oid(c._id));
}

const companyRows = [];
const surveyRows = [];

for (const c of dedupedCompanies) {
    const id = oid(c._id);
    if (!id) {
        warn(`Company skipped: missing _id (email=${c.email})`);
        continue;
    }

    const status = ["Pending", "Confirmed", "Canceled"].includes(c.status)
        ? c.status
        : "Pending";
    if (c.status && status !== c.status) {
        warn(`Company ${id}: unexpected status "${c.status}" -> defaulted to Pending`);
    }

    companyRows.push(`(
        ${sqlString(id)},
        ${sqlString(c.companyName?.trim())},
        ${sqlString(c.email)},
        ${sqlString(c.password)},
        ${sqlString(c.representitives)},
        ${sqlJson(c.fields ?? null)},
        ${sqlEnum(c.sector, ["Private", "Semi", "Local", "Federal"], "sector", `Company ${id}`)},
        ${sqlString(c.city)},
        ${sqlString(c.noOfPositions)},
        ${sqlJson(c.preferredMajors ?? null)},
        ${sqlJson(c.opportunityTypes ?? null)},
        ${sqlString(c.preferredQualities ?? null)},
        ${sqlString(status)},
        ${sqlString(c.confirmationToken ?? null)},
        ${sqlDate(c.confirmationTokenExpiry)},
        ${sqlDate(c.reminderSentAt)}
    )`);

    // ── Survey responses: normalize surveyResult into one row per question.
    // Some records are double-nested ([[{...}]]) representing more than one
    // full submission (a real duplicate-submission bug in the source app,
    // not an export artifact — confirmed one company has 2 full 22-question
    // submissions). Per data owner: keep the later submission.
    let sr = c.surveyResult;
    if (Array.isArray(sr) && sr.length > 0 && Array.isArray(sr[0])) {
        if (sr.length > 1) {
            warn(`Company ${id} ("${c.companyName}"): ${sr.length} full survey submissions found -> kept only the last one`);
        }
        sr = sr[sr.length - 1];
    }
    if (Array.isArray(sr)) {
        for (const q of sr) {
            if (!q || !q.id) continue;
            surveyRows.push(`(
                ${sqlString(id)},
                ${sqlString(q.id)},
                ${sqlString(q.text ?? "")},
                ${sqlString(q.responses ?? null)}
            )`);
        }
    }
}

// ─── Applicants + applicant_company_relations ──────────────────────────────

const applicantRows = [];
const relationRows = [];
// dedupe (applicant_id, company_id, relation_type) triples: the join table's
// primary key requires uniqueness, and a name could in principle appear
// twice in the same source array.
const seenRelations = new Set();

const RELATION_FIELD_MAP = {
    user_id: "applied",
    flags: "flagged",
    rejectedBy: "rejected",
    shortlistedBy: "shortlisted",
};

for (const a of applicants) {
    const id = oid(a._id);
    if (!id) {
        warn(`Applicant skipped: missing _id`);
        continue;
    }

    const d = a.applicantDetails || {};
    if (!a.applicantDetails) {
        warn(`Applicant ${id}: no applicantDetails (incomplete submission) -> all detail columns NULL`);
    }

    applicantRows.push(`(
        ${sqlString(id)},
        ${sqlString(d.uniId ?? null)},
        ${sqlString(d.fullName ?? null)},
        ${sqlDateOnly(d.birthdate, "birthdate")},
        ${sqlEnum(d.gender, ["Male", "Female"], "gender", `Applicant ${id}`)},
        ${sqlString(d.nationality ?? null)},
        ${sqlEnum(d.studyLevel, ["Bachelor", "Master", "PhD", "Diploma"], "studyLevel", `Applicant ${id}`)},
        ${sqlString(d.college ?? null)},
        ${sqlString(d.major ?? null)},
        ${sqlString(d.email ?? null)},
        ${sqlString(d.phoneNumber ?? null)},
        ${sqlCgpa(d.cgpa, id)},
        ${sqlString(d.city ?? null)},
        ${sqlString(d.linkedIn ?? null)},
        ${sqlString(d.technicalSkills ?? null)},
        ${sqlString(d.nonTechnicalSkills ?? null)},
        ${sqlString(d.experience ?? null)},
        ${sqlString(d.languages ?? null)},
        ${sqlDateOnly(d.ExpectedToGraduate, "ExpectedToGraduate")},
        ${sqlJson(d.fieldInterest ?? null)},
        ${sqlJson(d.opportunityType ?? null)},
        ${sqlString(d.preferredWorkCity ?? null)},
        ${sqlString(d.careerGoals ?? null)},
        ${sqlString(d.availability ?? null)},
        NULL, -- cv_metadata intentionally left empty; see MIGRATION_NOTES.md
        ${sqlBool(a.attended)},
        ${sqlDate(a.createdAt)},
        ${sqlDate(a.updatedAt)}
    )`);

    for (const [field, relationType] of Object.entries(RELATION_FIELD_MAP)) {
        for (const rawName of a[field] || []) {
            const name = (rawName || "").trim();
            if (!name) {
                warn(`Applicant ${id}: empty company-name string in ${field} -> skipped`);
                continue;
            }
            const companyId = companyIdByExactName.get(name);
            if (!companyId) {
                warn(`Applicant ${id}: unresolvable company name "${name}" in ${field} -> skipped (no matching company)`);
                continue;
            }
            const key = `${id}|${companyId}|${relationType}`;
            if (seenRelations.has(key)) continue;
            seenRelations.add(key);
            relationRows.push(`(${sqlString(id)}, ${sqlString(companyId)}, ${sqlString(relationType)})`);
        }
    }
}

// ─── Write seed.sql ─────────────────────────────────────────────────────────

const chunks = [];

chunks.push("-- Auto-generated by generate-seed.js. Do not edit by hand.");
chunks.push("USE jobfair;\n");

chunks.push(`INSERT INTO companies (
    id, company_name, email, password, representatives, fields, sector, city,
    no_of_positions, preferred_majors, opportunity_types, preferred_qualities,
    status, confirmation_token, confirmation_token_expiry, reminder_sent_at
) VALUES\n${companyRows.join(",\n")};\n`);

chunks.push(`INSERT INTO applicants (
    id, uni_id, full_name, birthdate, gender, nationality, study_level, college,
    major, email, phone_number, cgpa, city, linked_in, technical_skills,
    non_technical_skills, experience, languages, expected_to_graduate,
    field_interest, opportunity_type, preferred_work_city, career_goals, availability,
    cv_metadata, attended, created_at, updated_at
) VALUES\n${applicantRows.join(",\n")};\n`);

if (relationRows.length > 0) {
    chunks.push(`INSERT INTO applicant_company_relations (
    applicant_id, company_id, relation_type
) VALUES\n${relationRows.join(",\n")};\n`);
}

if (surveyRows.length > 0) {
    chunks.push(`INSERT INTO company_survey_responses (
    company_id, question_id, question_text, response
) VALUES\n${surveyRows.join(",\n")};\n`);
}

fs.writeFileSync(OUT_FILE, chunks.join("\n"), "utf-8");

console.log(`Wrote ${companyRows.length} companies, ${applicantRows.length} applicants, ${relationRows.length} applicant-company relations, ${surveyRows.length} survey responses to ${OUT_FILE}`);
console.log(`\n${REPORT.warnings.length} warning(s):`);
for (const w of REPORT.warnings.slice(0, 50)) console.log("  - " + w);
if (REPORT.warnings.length > 50) {
    console.log(`  ...and ${REPORT.warnings.length - 50} more`);
}
