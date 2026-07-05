// Separate Jest config for MySQL integration tests — deliberately does NOT
// extend the root package.json jest config, which sets DEMO_MODE=true via
// tests/setupEnv.js. These tests need DEMO_MODE=false and a real
// DATABASE_URL (guarded to jobfair_test only — see setupEnv.js here).
module.exports = {
    rootDir: "../../",
    testEnvironment: "node",
    setupFiles: ["<rootDir>/tests/mysql/setupEnv.js"],
    testMatch: ["<rootDir>/tests/mysql/**/*.test.js"],
};
