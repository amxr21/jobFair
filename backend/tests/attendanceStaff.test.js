const request = require("supertest");
const app = require("../app");

// Attendance-staff check-in is deliberately public (no CASTO/company account
// needed) but gated by a short code stored in the eventOps Settings document.
// These tests seed that document directly via the (auth-optional, per the
// existing demo-mode gap) event-ops endpoint, then drive the same flow a
// real staffer would.
describe("attendance staff check-in", () => {
    const CODE = "TESTCODE";
    const UNI_ID = "20000001"; // matches the fallback seed's single applicant

    beforeAll(async () => {
        await request(app)
            .put("/event-ops")
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

    it("checks a real applicant in by university ID", async () => {
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
});
