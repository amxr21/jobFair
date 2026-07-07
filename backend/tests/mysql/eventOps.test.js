const request = require("supertest");
const { prisma, resetDb, testId } = require("./dbHelpers");
const app = require("../../app");

// Covers two things found while rewriting getEventOps/updateEventOps:
// 1. updateEventOps must shallow-merge by SECTION (only touch keys present
//    in the request body), matching the old Mongo behavior exactly, since
//    two independent CASTO sessions/tabs each hold a stale partial copy.
// 2. attendanceStaff writes must NOT delete-and-reinsert the whole roster,
//    because checkin_log has an ON DELETE SET NULL FK into attendance_staff
//    — a naive rewrite would silently orphan check-in history any time the
//    staff roster was edited. Verified here with a real checked-in student.
describe("eventOps (12-table split, section-scoped writes)", () => {
    beforeEach(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await resetDb();
        await prisma.$disconnect();
    });

    it("updateEventOps only touches the section(s) present in the request body", async () => {
        await request(app).put("/event-ops").send({
            schedule: [{ id: 1, start: "09:00", end: "10:00", title: "Opening", status: "Upcoming" }],
        });
        await request(app).put("/event-ops").send({
            booths: [{ id: 1, number: "B01", status: "Available" }],
        });

        const res = await request(app).get("/event-ops");
        expect(res.body.schedule.length).toBe(1); // untouched by the booths-only update
        expect(res.body.booths.length).toBe(1);
    });

    it("editing the attendance staff roster does not orphan existing check-in log entries", async () => {
        // Seed one staffer + one applicant, check the applicant in (creates a
        // checkin_log row with a real FK to the staffer).
        await request(app).put("/event-ops").send({
            attendanceStaff: [{ id: 1, name: "Staffer One", email: "one@test.local", code: "CODE1", status: "active" }],
        });

        const applicantId = testId();
        await prisma.applicant.create({ data: { id: applicantId, uniId: "40000001", fullName: "Checked In Student", attended: false } });

        const checkinRes = await request(app)
            .patch("/attendance-staff/checkin")
            .send({ code: "CODE1", applicantId });
        expect(checkinRes.status).toBe(200);

        const beforeCount = await prisma.checkinLog.count();
        expect(beforeCount).toBe(1);

        // Now edit the roster: keep Staffer One, add Staffer Two.
        await request(app).put("/event-ops").send({
            attendanceStaff: [
                { id: 1, name: "Staffer One", email: "one@test.local", code: "CODE1", status: "active" },
                { id: 2, name: "Staffer Two", email: "two@test.local", code: "CODE2", status: "invited" },
            ],
        });

        // The check-in log entry must survive, still linked to Staffer One.
        const afterCount = await prisma.checkinLog.count();
        expect(afterCount).toBe(1);

        const log = await prisma.checkinLog.findFirst();
        const staffer = await prisma.attendanceStaff.findUnique({ where: { code: "CODE1" } });
        expect(log.checkedInByStaffId).toBe(staffer.id);
    });

    it("removing a staffer from the roster deletes only that staffer, not others", async () => {
        await request(app).put("/event-ops").send({
            attendanceStaff: [
                { id: 1, name: "Staffer One", email: "one@test.local", code: "CODE1", status: "active" },
                { id: 2, name: "Staffer Two", email: "two@test.local", code: "CODE2", status: "invited" },
            ],
        });
        await request(app).put("/event-ops").send({
            attendanceStaff: [{ id: 1, name: "Staffer One", email: "one@test.local", code: "CODE1", status: "active" }],
        });

        const remaining = await prisma.attendanceStaff.findMany();
        expect(remaining.length).toBe(1);
        expect(remaining[0].code).toBe("CODE1");
    });

    it("supportStaff (services helpers + nested task lists) round-trips through settings", async () => {
        await request(app).put("/event-ops").send({
            supportStaff: [
                { id: 1, name: "Print Guy", role: "Printing & Supplies", phone: "+971 50 1", tasks: [
                    { id: 11, title: "Print 200 badges", status: "In Progress", linkedTo: null },
                    { id: 12, title: "Bring 10 chairs to B07", status: "Pending", linkedTo: null },
                ]},
            ],
        });

        const res = await request(app).get("/event-ops");
        expect(res.body.supportStaff).toHaveLength(1);
        expect(res.body.supportStaff[0].name).toBe("Print Guy");
        expect(res.body.supportStaff[0].tasks).toHaveLength(2);
        expect(res.body.supportStaff[0].tasks[0].status).toBe("In Progress");

        // A section-scoped update to a different section must leave it intact.
        await request(app).put("/event-ops").send({ booths: [{ id: 1, number: "B01", status: "Available" }] });
        const after = await request(app).get("/event-ops");
        expect(after.body.supportStaff).toHaveLength(1);
        expect(after.body.supportStaff[0].tasks).toHaveLength(2);
    });
});
