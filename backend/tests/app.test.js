const request = require("supertest");
const app = require("../app");

describe("public routes are reachable", () => {
    it("GET /companies returns the seeded manager list", async () => {
        const res = await request(app).get("/companies");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it("GET /settings returns the survey visibility flag", async () => {
        const res = await request(app).get("/settings");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("surveyPublic");
    });
});

describe("auth", () => {
    it("logs in with the seeded CASTO account and returns a token", async () => {
        const res = await request(app)
            .post("/user/login")
            .send({ email: "casto@sharjah.ac.ae", password: "ci-test-password" });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();
        expect(res.body.email).toBe("casto@sharjah.ac.ae");
    });

    it("rejects a bad password with 400", async () => {
        const res = await request(app)
            .post("/user/login")
            .send({ email: "casto@sharjah.ac.ae", password: "wrong-password" });
        expect(res.status).toBe(400);
    });

    it("rejects an unknown email with 400", async () => {
        const res = await request(app)
            .post("/user/login")
            .send({ email: "nobody@nowhere.test", password: "whatever" });
        expect(res.status).toBe(400);
    });
});

describe("protected routes reject unauthenticated requests", () => {
    it("GET /applicants with a garbage token returns 401", async () => {
        const res = await request(app).get("/applicants").set("Authorization", "Bearer not-a-real-token");
        expect(res.status).toBe(401);
    });

    it("GET /event-ops with a garbage token returns 401", async () => {
        const res = await request(app).get("/event-ops").set("Authorization", "Bearer not-a-real-token");
        expect(res.status).toBe(401);
    });

    // Regression for the auth gap: a request with NO Authorization header used
    // to pass through requireAuthDemo (req.user = null) and reach the handler,
    // exposing applicant PII to unauthenticated callers. It must now 401.
    it("GET /applicants with no Authorization header returns 401", async () => {
        const res = await request(app).get("/applicants");
        expect(res.status).toBe(401);
    });

    it("GET /event-ops with no Authorization header returns 401", async () => {
        const res = await request(app).get("/event-ops");
        expect(res.status).toBe(401);
    });

    it("PATCH /applicants/flag/:id with no Authorization header returns 401", async () => {
        const res = await request(app).patch("/applicants/flag/anyid").send({ flags: ["X"] });
        expect(res.status).toBe(401);
    });

    // Public routes are registered before requireAuth, so they stay open.
    it("public GET /companies still works with no token", async () => {
        const res = await request(app).get("/companies");
        expect(res.status).toBe(200);
    });
});
