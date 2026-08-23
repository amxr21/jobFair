/**
 * Runs a .sql file against the database in DATABASE_URL, from inside the app
 * container.
 *
 * Exists because the deployed backend image is a plain Node build (Nixpacks,
 * no Dockerfile) and therefore has no `mysql` CLI — so the usual
 * `mysql -u root -p db < file.sql` is not available on the server. The
 * mariadb driver that Prisma's adapter already depends on speaks the same
 * protocol, so the SQL can be executed directly from Node instead.
 *
 * Usage (from backend/):
 *   node migrations/run-sql.js migrations/schema.sql
 *   node migrations/run-sql.js migrations/demo-data.sql
 *
 * Writes to whatever DATABASE_URL points at, so it refuses to run unless
 * --yes is passed or SEED_CONFIRM=yes is set, to make an accidental
 * production wipe hard rather than one keystroke away.
 */

const fs = require("fs");
const path = require("path");
const mariadb = require("mariadb");

const file = process.argv[2];
const confirmed = process.argv.includes("--yes") || process.env.SEED_CONFIRM === "yes";

if (!file) {
    console.error("Usage: node migrations/run-sql.js <file.sql> [--yes]");
    process.exit(1);
}

const abs = path.resolve(file);
if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
}

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
}

// Same parsing approach as config/prisma.js: the pool takes discrete fields,
// not a URL, and credentials may be percent-encoded.
const parsed = new URL(rawUrl);
const database = parsed.pathname.slice(1);
const wantsSsl = /ssl-mode=REQUIRED/i.test(rawUrl) || Boolean(process.env.DB_CA_CERT_PATH);

const config = {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    connectTimeout: 15000,
    // The .sql files are one script of many statements, not a single query.
    multipleStatements: true,
};

if (wantsSsl) {
    const caPath = process.env.DB_CA_CERT_PATH;
    const caExists = caPath && fs.existsSync(caPath);
    config.ssl = caExists
        ? { ca: fs.readFileSync(caPath), rejectUnauthorized: true }
        : { rejectUnauthorized: process.env.DB_SSL_INSECURE !== "true" };
}

async function main() {
    let sql = fs.readFileSync(abs, "utf-8");

    // schema.sql opens with `CREATE DATABASE IF NOT EXISTS jobfair` + `USE
    // jobfair`, from when the database was always called "jobfair". A hosted
    // database rarely is (Coolify generates its own name), and leaving those
    // lines in silently creates a second database and applies everything
    // there instead of the one DATABASE_URL points at. Strip them so the
    // connection's own database is always the target.
    const stripped = sql.replace(/^\s*(CREATE\s+DATABASE|USE)\s+[^;]+;\s*$/gim, "");
    if (stripped !== sql) {
        console.log(`Note     : stripped CREATE DATABASE/USE — targeting "${database}" from DATABASE_URL`);
        sql = stripped;
    }

    console.log(`File     : ${abs}`);
    console.log(`Target   : ${config.user}@${config.host}:${config.port}/${database}`);
    console.log(`Size     : ${sql.length.toLocaleString()} bytes`);

    if (!confirmed) {
        console.error(
            "\nRefusing to run without confirmation — this writes to the database above" +
            "\nand a seed file may DELETE existing rows first." +
            "\n\nRe-run with --yes (or SEED_CONFIRM=yes) if that is what you want."
        );
        process.exit(1);
    }

    const conn = await mariadb.createConnection(config);
    try {
        console.log("\nExecuting...");
        await conn.query(sql);
        console.log("OK — script applied.");

        // Report what landed, so a silent no-op is visible rather than assumed.
        const tables = await conn.query(
            "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",
            [database]
        );
        if (tables.length) {
            console.log(`\n${tables.length} tables in ${database}:`);
            for (const { t } of tables) {
                const [{ n }] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``);
                console.log(`  ${String(t).padEnd(30)} ${String(n).padStart(6)}`);
            }
        }
    } finally {
        await conn.end();
    }
}

main().catch((err) => {
    console.error("\nFailed:", err.message);
    process.exit(1);
});
