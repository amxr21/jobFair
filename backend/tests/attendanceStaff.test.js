const request = require("supertest");
const app = require("../app");

// Attendance-staff check-in is deliberately public (no CASTO/company account
// needed) but gated by a short code stored in the eventOps Settings document.
// These tests seed that document via the event-ops endpoint (which is now
// auth-protected), then drive the same flow a real staffer would — the
// check-in endpoints themselves stay public.
describe("attendance staff check-in", () => {
    const CODE = "TESTCODE";
    const UNI_ID = "20000001"; // matches the fallback seed's single applicant

    beforeAll(async () => {
        const login = await request(app)
            .post("/user/login")
            .send({ email: "casto@sharjah.ac.ae", password: "ci-test-password" });
        const token = login.body.token;
        await request(app)
            .put("/event-ops")
            .set("Authorization", `Bearer ${token}`)
            .send({
                booths: [], banners: [], requirements: [], equipment: [], delegates: [],
                attendanceCompanies: [], attendanceStudents: [], schedule: [], passes: [],
                attendanceStaff: [{ id: 1, name: "Test Staffer", email: "staffer@test.local", code: CODE, status: "invited" }],
                checkinLog: [], audit: [],
            });
    });

    it("rejects an invalid code", async () => {
        const res = await request(app).post("/attendance-staff/verify").send({ code: "NOPE" });
        expect(res.status).toBe(401);
    });

    it("accepts the seeded code and returns the staffer's identity", async () => {
        const res = await request(app).post("/attendance-staff/verify").send({ code: CODE });
        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Test Staffer");
    });

    it("checks a real applicant in via manual University ID entry (fallback path)", async () => {
        const res = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: CODE, uniId: UNI_ID });
        expect(res.status).toBe(200);
        expect(res.body.applicant.attended).toBe(true);
        expect(res.body.checkedInBy).toBe("Test Staffer");
    });

    it("rejects checking the same applicant in twice", async () => {
        const res = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: CODE, uniId: UNI_ID });
        expect(res.status).toBe(409);
    });

    it("rejects a check-in with an invalid code", async () => {
        const res = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: "NOPE", uniId: UNI_ID });
        expect(res.status).toBe(401);
    });

    it("404s for a university ID that doesn't exist", async () => {
        const res = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: CODE, uniId: "99999999" });
        expect(res.status).toBe(404);
    });

    it("400s when neither applicantId nor uniId is provided", async () => {
        const res = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: CODE });
        expect(res.status).toBe(400);
    });

    it("checks a student in via QR scan (applicantId), the primary path", async () => {
        // The already-checked-in applicant from the manual-entry test above
        // still has a resolvable _id — reuse it to prove the QR-scan lookup
        // path resolves the same record, independent of the earlier 409.
        const lookup = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: CODE, uniId: UNI_ID }); // 409 again, but body still carries the applicant
        const applicantId = lookup.body.applicant._id;
        expect(applicantId).toBeTruthy();

        const res = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: CODE, applicantId });
        // Already attended from the earlier test, so this also 409s — but a
        // 404 here would mean the QR-scan lookup path itself is broken
        expect(res.status).toBe(409);
    });
});
