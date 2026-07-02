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

describe("protected routes reject a malformed token", () => {
    // NOTE: in demo mode, requireAuthDemo only rejects a *present but invalid*
    // token — a request with no Authorization header at all currently passes
    // through with req.user = null (see demo/demoControllers.js). That's an
    // existing gap, not something these tests changed; asserting the
    // malformed-token case here so a real regression (e.g. breaking JWT
    // verification) still fails CI.
    it("GET /applicants with a garbage token returns 401", async () => {
        const res = await request(app).get("/applicants").set("Authorization", "Bearer not-a-real-token");
        expect(res.status).toBe(401);
    });

    it("GET /event-ops with a garbage token returns 401", async () => {
        const res = await request(app).get("/event-ops").set("Authorization", "Bearer not-a-real-token");
        expect(res.status).toBe(401);
    });
});
