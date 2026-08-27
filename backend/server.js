require("dotenv").config();

const app = require("./app");

const isDemo = process.env.DEMO_MODE === "true";

if (isDemo) {
    // Demo mode: no MongoDB needed — routes work immediately
    app.listen(process.env.PORT || 2000, () => {
        console.log(`[DEMO MODE] Server running on PORT ${process.env.PORT || 2000}`);
        console.log("[DEMO MODE] Using in-memory data — no MongoDB required");
        console.log("[DEMO MODE] Demo accounts: CASTO office, employer, and check-in staff");
        // Prints only the credentials that were generated for this boot (i.e.
        // the ones with no env var set) - nothing is printed for pinned ones.
        require("./demo/demoStore").printDemoCredentials();
    });
} else {
    const prisma = require("./config/prisma");

    prisma.$queryRaw`SELECT 1`
        .then(() => {
            console.log("DB Connected successfully");
        })
        .catch(async (err) => {
            console.error("DB connection error:", err.message);
            // Prisma's pool wrapper swallows the real driver/TLS error behind a
            // generic pool-timeout message. Retry with the raw mariadb driver
            // (no pool) to surface what's actually failing underneath.
            try {
                const mariadb = require("mariadb");
                const conn = await mariadb.createConnection({ ...prisma.poolConfig, connectTimeout: 10000 });
                await conn.end();
                console.error("Diagnostic: raw mariadb connection succeeded (Prisma pool config may differ).");
            } catch (rawErr) {
                console.error("Diagnostic: raw mariadb connection failed:", rawErr.code, "-", rawErr.message);
            }
        });

    app.listen(process.env.PORT || 2000, () => {
        console.log("Server running on PORT:", process.env.PORT || 2000);
    });
}
