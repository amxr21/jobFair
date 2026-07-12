const request = require("supertest");
const { prisma, resetDb, testId, seedAuth } = require("./dbHelpers");
const app = require("../../app");

// Exercises every documented company <-> CASTO interaction point:
// attendance status changes, profile self-service, login-email management,
// event-ops sections CASTO uses to act on a company (booths/banners/
// requirements/equipment/passes), and the admin-only company management
// endpoints (delete/bulk-import/reminders). Each "admin only" comment in
// applicantsControllers.js is treated as a claim to verify, not just read —
// several turned out to have no enforcement at all.
describe("company <-> CASTO interaction surface", () => {
    let castoAuth, companyId, companyAuth, otherCompanyId, otherCompanyAuth;

    beforeEach(async () => {
        await resetDb();
        castoAuth = await seedAuth(); // casto@sharjah.ac.ae

        companyId = testId();
        await prisma.company.create({
            data: { id: companyId, companyName: "Acme Corp", email: "acme@test.local", password: "x", status: "Pending" },
        });
        const companyToken = require("jsonwebtoken").sign({ _id: companyId }, process.env.TOKEN_SIGN, { expiresIn: "1h" });
        companyAuth = { token: companyToken, authHeader: ["Authorization", `Bearer ${companyToken}`] };

        otherCompanyId = testId();
        await prisma.company.create({
            data: { id: otherCompanyId, companyName: "Beta Inc", email: "beta@test.local", password: "x", status: "Pending" },
        });
        const otherToken = require("jsonwebtoken").sign({ _id: otherCompanyId }, process.env.TOKEN_SIGN, { expiresIn: "1h" });
        otherCompanyAuth = { token: otherToken, authHeader: ["Authorization", `Bearer ${otherToken}`] };
    });

    afterAll(async () => {
        await resetDb();
        await prisma.$disconnect();
    });

    describe("attendance status: company can only touch its own, CASTO can touch any", () => {
        it("company confirms its own attendance", async () => {
            const res = await request(app)
                .patch(`/companies/${companyId}/status`)
                .set(...companyAuth.authHeader)
                .send({ status: "Confirmed" });
            expect(res.status).toBe(200);
            expect(res.body.company.status).toBe("Confirmed");
        });

        it("company CANNOT change another company's status", async () => {
            const res = await request(app)
                .patch(`/companies/${companyId}/status`)
                .set(...otherCompanyAuth.authHeader)
                .send({ status: "Canceled" });
            expect(res.status).toBe(403);
        });

        it("CASTO can change any company's status", async () => {
            const res = await request(app)
                .patch(`/companies/${companyId}/status`)
                .set(...castoAuth.authHeader)
                .send({ status: "Canceled" });
            expect(res.status).toBe(200);
            expect(res.body.company.status).toBe("Canceled");
        });

        it("rejects an invalid status value", async () => {
            const res = await request(app)
                .patch(`/companies/${companyId}/status`)
                .set(...companyAuth.authHeader)
                .send({ status: "Definitely Not A Status" });
            expect(res.status).toBe(400);
        });
    });

    describe("company profile self-service: owner-only", () => {
        it("company edits its own profile", async () => {
            const res = await request(app)
                .patch(`/companies/${companyId}/profile`)
                .set(...companyAuth.authHeader)
                .send({ city: "Sharjah", sector: "Tech" });
            expect(res.status).toBe(200);
        });

        it("company CANNOT edit another company's profile", async () => {
            const res = await request(app)
                .patch(`/companies/${companyId}/profile`)
                .set(...otherCompanyAuth.authHeader)
                .send({ city: "Hijacked" });
            expect(res.status).toBe(403);
        });
    });

    describe("company login-email management: owner-only", () => {
        it("company adds a secondary login email to itself", async () => {
            const res = await request(app)
                .post(`/companies/${companyId}/login-emails`)
                .set(...companyAuth.authHeader)
                .send({ email: "colleague@acme.test" });
            expect(res.status).toBe(200);
        });

        it("company CANNOT add a login email to another company", async () => {
            const res = await request(app)
                .post(`/companies/${companyId}/login-emails`)
                .set(...otherCompanyAuth.authHeader)
                .send({ email: "intruder@evil.test" });
            expect(res.status).toBe(403);
        });

        it("company CANNOT list another company's login emails", async () => {
            const res = await request(app)
                .get(`/companies/${companyId}/login-emails`)
                .set(...otherCompanyAuth.authHeader);
            expect(res.status).toBe(403);
        });
    });

    describe("CASTO team management: CASTO-only", () => {
        it("a regular company CANNOT invite a CASTO team member", async () => {
            const res = await request(app)
                .post("/casto-team")
                .set(...companyAuth.authHeader)
                .send({ email: "newteam@sharjah.ac.ae", name: "New Teammate" });
            expect(res.status).toBe(403);
        });

        it("CASTO can invite a team member", async () => {
            const res = await request(app)
                .post("/casto-team")
                .set(...castoAuth.authHeader)
                .send({ email: "newteam@sharjah.ac.ae", name: "New Teammate" });
            expect(res.status).toBe(200);
        });
    });

    describe("event-ops as the CASTO->company action surface (booths/banners/requirements/passes)", () => {
        it("CASTO assigns a booth to a company via event-ops booths section", async () => {
            const res = await request(app)
                .put("/event-ops")
                .set(...castoAuth.authHeader)
                .send({ booths: [{ id: 1, number: "B01", status: "Assigned", company: "Acme Corp" }] });
            expect(res.status).toBe(200);

            const read = await request(app).get("/event-ops").set(...companyAuth.authHeader);
            expect(read.status).toBe(200);
            const booth = read.body.booths.find((b) => b.company === "Acme Corp");
            expect(booth).toBeTruthy();
            expect(booth.number).toBe("B01");
        });

        it("company can read its own requirement/equipment/pass state after CASTO updates it", async () => {
            await request(app).put("/event-ops").set(...castoAuth.authHeader).send({
                requirements: [{ id: 1, company: "Acme Corp", description: "Extra power outlet", category: "Electrical", priority: "Medium", status: "Fulfilled", notes: "Done by facilities" }],
            });

            const res = await request(app).get("/event-ops").set(...companyAuth.authHeader);
            const req_ = res.body.requirements.find((r) => r.company === "Acme Corp");
            expect(req_.status).toBe("Fulfilled");
        });

        it("a company can PUT arbitrary event-ops sections it has no business touching (no role gate)", async () => {
            // This is a gap, not a desired behavior: updateEventOps has no
            // isCastoAccount check, so a non-CASTO company can rewrite booths,
            // banners, requirements, equipment, passes, schedule for ANY company.
            const res = await request(app)
                .put("/event-ops")
                .set(...companyAuth.authHeader)
                .send({ booths: [{ id: 1, number: "HIJACKED", status: "Assigned", company: "Beta Inc" }] });
            expect(res.status).toBe(403);
        });

        it("a company CAN self-submit into the requirements section (legitimate self-service)", async () => {
            const res = await request(app)
                .put("/event-ops")
                .set(...companyAuth.authHeader)
                .send({ requirements: [{ id: 1, company: "Acme Corp", description: "Need a chair", category: "Furniture", priority: "Low", status: "Open", notes: "" }] });
            expect(res.status).toBe(200);
        });

        it("a company CAN self-check-in via the attendanceCompanies section (legitimate self-service)", async () => {
            const res = await request(app)
                .put("/event-ops")
                .set(...companyAuth.authHeader)
                .send({ attendanceCompanies: [{ company: "Acme Corp", status: "Present", method: "QR" }] });
            expect(res.status).toBe(200);
        });

        it("a company mixing a self-service section with a CASTO-only section is rejected entirely", async () => {
            const res = await request(app)
                .put("/event-ops")
                .set(...companyAuth.authHeader)
                .send({
                    requirements: [{ id: 1, company: "Acme Corp", description: "Need a chair", category: "Furniture", priority: "Low", status: "Open", notes: "" }],
                    banners: [{ id: 1, company: "Acme Corp", status: "Approved" }],
                });
            expect(res.status).toBe(403);
        });
    });

    describe("admin-only company management endpoints — now enforced to match the comments", () => {
        it("a regular (non-CASTO) company CANNOT delete another company", async () => {
            const res = await request(app)
                .delete(`/companies/${otherCompanyId}`)
                .set(...companyAuth.authHeader);
            expect(res.status).toBe(403);
            const stillThere = await prisma.company.findUnique({ where: { id: otherCompanyId } });
            expect(stillThere).not.toBeNull();
        });

        it("CASTO can delete a company (intended path)", async () => {
            const res = await request(app)
                .delete(`/companies/${otherCompanyId}`)
                .set(...castoAuth.authHeader);
            expect(res.status).toBe(200);
        });

        it("a regular company CANNOT trigger bulk company import", async () => {
            const res = await request(app)
                .post("/companies/bulk-import")
                .set(...companyAuth.authHeader)
                .send({ rows: [{ rowIndex: 0, action: "create", data: { companyName: "Injected Co", email: "injected@test.local" } }] });
            expect(res.status).toBe(403);
        });

        it("CASTO can trigger bulk company import", async () => {
            const res = await request(app)
                .post("/companies/bulk-import")
                .set(...castoAuth.authHeader)
                .send({ rows: [{ rowIndex: 0, action: "create", data: { companyName: "Imported Co", email: "imported@test.local" } }] });
            expect(res.status).toBe(200);
        });

        it("a regular company CANNOT trigger send-reminders", async () => {
            const res = await request(app)
                .post("/companies/send-reminders")
                .set(...companyAuth.authHeader)
                .send({ companyIds: [otherCompanyId] });
            expect(res.status).toBe(403);
        });

        it("CASTO can trigger send-reminders", async () => {
            const res = await request(app)
                .post("/companies/send-reminders")
                .set(...castoAuth.authHeader)
                .send({ companyIds: [otherCompanyId] });
            expect(res.status).toBe(200);
        });

        it("a regular company CANNOT change the global surveyPublic setting", async () => {
            const res = await request(app)
                .patch("/settings")
                .set(...companyAuth.authHeader)
                .send({ key: "surveyPublic", value: true });
            expect(res.status).toBe(403);
        });

        it("CASTO can change the global surveyPublic setting", async () => {
            const res = await request(app)
                .patch("/settings")
                .set(...castoAuth.authHeader)
                .send({ key: "surveyPublic", value: true });
            expect(res.status).toBe(200);
        });
    });

    describe("notification gap: CASTO-side company actions produce no persisted/queryable notification for the company", () => {
        it("no notification/message table or endpoint exists for a targeted company alert", async () => {
            // There is no /notifications route at all in the router; confirms
            // the frontend NotificationsContext is purely localStorage-scoped
            // and CASTO actions never reach the affected company's account.
            const res = await request(app).get("/notifications").set(...companyAuth.authHeader);
            expect(res.status).toBe(404);
        });
    });
});
