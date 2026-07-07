const jwt = require("jsonwebtoken");
const prisma = require("../../config/prisma");

// Deletes all rows from every table this test suite might have written to,
// in child-before-parent order (matches migrations/schema.sql's FK
// dependencies). Companies/applicants themselves are also cleared — this
// file only ever runs against jobfair_test (enforced by setupEnv.js), never
// against real migrated data.
async function resetDb() {
    await prisma.checkinLog.deleteMany({});
    await prisma.equipmentRequest.deleteMany({});
    await prisma.applicantCompanyRelation.deleteMany({});
    await prisma.companySurveyResponse.deleteMany({});
    await prisma.attendanceStaff.deleteMany({});
    await prisma.booth.deleteMany({});
    await prisma.banner.deleteMany({});
    await prisma.specialRequirement.deleteMany({});
    await prisma.companyDelegate.deleteMany({});
    await prisma.companyAttendance.deleteMany({});
    await prisma.studentAttendanceView.deleteMany({});
    await prisma.eventSchedule.deleteMany({});
    await prisma.accessPass.deleteMany({});
    await prisma.castoTeamMember.deleteMany({});
    await prisma.eventOpsAuditLog.deleteMany({});
    await prisma.setting.deleteMany({});
    await prisma.applicant.deleteMany({});
    await prisma.company.deleteMany({});
}

let idCounter = 0;
// Deterministic-enough 24-char hex ids for test fixtures — doesn't need to
// be a real ObjectId, just needs to satisfy VARCHAR(24) + the app's
// /^[0-9a-fA-F]{24}$/ id-shape validation.
function testId() {
    idCounter += 1;
    return idCounter.toString(16).padStart(24, "0");
}

// Creates a real CASTO company row and returns a signed token for it, so
// tests can call auth-protected routes (requireAuth looks the company up by
// the JWT's _id). Returns { token, authHeader } where authHeader is ready to
// spread into a supertest `.set(...)` call.
async function seedAuth(email = "casto@sharjah.ac.ae") {
    const id = testId();
    await prisma.company.create({
        data: { id, companyName: "CASTO Office", email, password: "x" },
    });
    const token = jwt.sign({ _id: id }, process.env.TOKEN_SIGN, { expiresIn: "1h" });
    return { id, token, authHeader: ["Authorization", `Bearer ${token}`] };
}

module.exports = { prisma, resetDb, testId, seedAuth };
