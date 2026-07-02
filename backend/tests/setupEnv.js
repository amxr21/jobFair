/**
 * Test env — set BEFORE any app module is imported (jest setupFiles).
 * Runs in demo mode so no MongoDB is needed. sampleData.json is gitignored,
 * so demoStore.js falls back to a small built-in seed when it's absent —
 * that's what CI and a fresh clone actually run against.
 */
process.env.NODE_ENV = "test";
process.env.DEMO_MODE = "true";
process.env.TOKEN_SIGN = "test-secret-please-ignore-1234567890";
process.env.LOG_LEVEL = "error";
