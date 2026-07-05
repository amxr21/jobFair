const request = require("supertest");
const { prisma, resetDb, testId } = require("./dbHelpers");
const app = require("../../app");

// Covers the highest-risk fix from the Mongo -> MySQL rewrite: the frontend
// sends the acting company's NAME (not id) to flag/shortlist/reject/apply,
// which must be resolved against the companies table before writing to
// applicant_company_relations. Confirmed against BriefInfo.jsx et al. — see
// controllers/applicantsControllers.js's addRelationByCompanyName.
describe("applicant <-> company relations (name-based writes)", () => {
    let companyId, applicantId;
    const COMPANY_NAME = "Acme Testing Corp";

    beforeEach(async () => {
        await resetDb();
        companyId = testId();
        applicantId = testId();
        await prisma.company.create({
            data: {
                id: companyId, companyName: COMPANY_NAME, email: "acme@test.local",
                password: "irrelevant-hash", status: "Confirmed",
            },
        });
        await prisma.applicant.create({
            data: { id: applicantId, uniId: "30000001", fullName: "Test Applicant", attended: false },
        });
    });

    afterAll(async () => {
        await resetDb();
        await prisma.$disconnect();
    });

    it("shortlistApplicant resolves the company name to a real relation row", async () => {
        const res = await request(app)
            .patch(`/applicants/shortlist/${applicantId}`)
            .send({ shortlistedBy: [COMPANY_NAME] });

        expect(res.status).toBe(200);
        expect(res.body.shortlistedBy).toContain(COMPANY_NAME);

        const row = await prisma.applicantCompanyRelation.findUnique({
            where: { applicantId_companyId_relationType: { applicantId, companyId, relationType: "shortlisted" } },
        });
        expect(row).not.toBeNull();
    });

    it("shortlisting twice does not create a duplicate relation row (matches old $addToSet dedup)", async () => {
        await request(app).patch(`/applicants/shortlist/${applicantId}`).send({ shortlistedBy: [COMPANY_NAME] });
        await request(app).patch(`/applicants/shortlist/${applicantId}`).send({ shortlistedBy: [COMPANY_NAME] });

        const count = await prisma.applicantCompanyRelation.count({
            where: { applicantId, companyId, relationType: "shortlisted" },
        });
        expect(count).toBe(1);
    });

    it("an applicant can be BOTH shortlisted and later rejected by the same company", async () => {
        await request(app).patch(`/applicants/shortlist/${applicantId}`).send({ shortlistedBy: [COMPANY_NAME] });
        await request(app).patch(`/applicants/reject/${applicantId}`).send({ rejectedBy: [COMPANY_NAME] });

        const res = await request(app).get(`/applicants/${applicantId}`);
        expect(res.body.shortlistedBy).toContain(COMPANY_NAME);
        expect(res.body.rejectedBy).toContain(COMPANY_NAME);
    });

    it("unshortlistApplicant removes exactly the shortlisted relation, leaving others intact", async () => {
        await request(app).patch(`/applicants/shortlist/${applicantId}`).send({ shortlistedBy: [COMPANY_NAME] });
        await request(app).patch(`/applicants/flag/${applicantId}`).send({ flags: [COMPANY_NAME] });

        const res = await request(app).patch(`/applicants/unshortlist/${applicantId}`).send({ company: COMPANY_NAME });

        expect(res.status).toBe(200);
        expect(res.body.shortlistedBy).not.toContain(COMPANY_NAME);
        expect(res.body.flags).toContain(COMPANY_NAME); // untouched
    });

    it("a name that doesn't match any company silently no-ops (matches old unvalidated Mongo array push)", async () => {
        const res = await request(app)
            .patch(`/applicants/shortlist/${applicantId}`)
            .send({ shortlistedBy: ["Some Company That Does Not Exist"] });

        expect(res.status).toBe(200);
        const count = await prisma.applicantCompanyRelation.count({ where: { applicantId } });
        expect(count).toBe(0);
    });
});
