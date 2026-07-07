const request = require("supertest");
const jwt = require("jsonwebtoken");
const { prisma, resetDb, testId } = require("./dbHelpers");
const app = require("../../app");

// Covers the survey-duplication bug found in real migrated data (a company
// called "Green Crystal" had 2 full duplicate submissions because the old
// Mongo code used $addToSet on the whole surveyResult array). The rewritten
// submitSurvey does a per-question upsert instead — resubmitting must
// REPLACE each question's answer, not add a second row.
describe("company survey submission (duplication-bug regression)", () => {
    let companyId;
    let authHeader;

    beforeEach(async () => {
        await resetDb();
        companyId = testId();
        await prisma.company.create({
            data: {
                id: companyId, companyName: "Survey Test Co", email: "survey@test.local",
                password: "irrelevant-hash", status: "Confirmed",
            },
        });
        authHeader = ["Authorization", `Bearer ${jwt.sign({ _id: companyId }, process.env.TOKEN_SIGN, { expiresIn: "1h" })}`];
    });

    afterAll(async () => {
        await resetDb();
        await prisma.$disconnect();
    });

    it("first submission creates one row per question", async () => {
        const res = await request(app).patch(`/applicants/survey/${companyId}`).set(...authHeader).send({
            surveyResult: [
                { id: "q1", text: "How was it?", responses: "Good" },
                { id: "q2", text: "Would you return?", responses: "Yes" },
            ],
        });
        expect(res.status).toBe(200);

        const rows = await prisma.companySurveyResponse.findMany({ where: { companyId } });
        expect(rows.length).toBe(2);
    });

    it("resubmitting REPLACES answers instead of duplicating rows (the actual bug fix)", async () => {
        await request(app).patch(`/applicants/survey/${companyId}`).set(...authHeader).send({
            surveyResult: [{ id: "q1", text: "How was it?", responses: "Good" }],
        });
        await request(app).patch(`/applicants/survey/${companyId}`).set(...authHeader).send({
            surveyResult: [{ id: "q1", text: "How was it?", responses: "Excellent" }],
        });

        const rows = await prisma.companySurveyResponse.findMany({ where: { companyId, questionId: "q1" } });
        expect(rows.length).toBe(1); // NOT 2 — this is what the old Mongo code got wrong
        expect(rows[0].response).toBe("Excellent");
    });

    it("resubmitting with a subset of questions only updates those, leaves others alone", async () => {
        await request(app).patch(`/applicants/survey/${companyId}`).set(...authHeader).send({
            surveyResult: [
                { id: "q1", text: "Q1", responses: "A" },
                { id: "q2", text: "Q2", responses: "B" },
            ],
        });
        await request(app).patch(`/applicants/survey/${companyId}`).set(...authHeader).send({
            surveyResult: [{ id: "q1", text: "Q1", responses: "Updated A" }],
        });

        const rows = await prisma.companySurveyResponse.findMany({ where: { companyId }, orderBy: { questionId: "asc" } });
        expect(rows.length).toBe(2);
        expect(rows.find(r => r.questionId === "q1").response).toBe("Updated A");
        expect(rows.find(r => r.questionId === "q2").response).toBe("B");
    });
});
