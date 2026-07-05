/**
 * Env for MySQL integration tests — set BEFORE any app module is imported
 * (jest setupFiles). These tests are opt-in (npm run test:mysql), never run
 * by the default `npm test`, and target a SEPARATE database
 * (jobfair_test) from the real jobfair database — never run these against
 * a DATABASE_URL pointing at real data.
 */
process.env.NODE_ENV = "test";
process.env.DEMO_MODE = "false";
process.env.TOKEN_SIGN = "test-secret-please-ignore-1234567890";
process.env.LOG_LEVEL = "error";

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes("jobfair_test")) {
    throw new Error(
        "MySQL integration tests require DATABASE_URL to point at a database " +
        "named jobfair_test (a name containing 'jobfair_test'), as a guard " +
        "against accidentally running destructive tests against real data. " +
        "Set it in your shell before running: npm run test:mysql"
    );
}
