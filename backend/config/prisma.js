const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// Aiven (and most managed MySQL) require TLS. Enable SSL when the connection
// string asks for it, or when a CA cert path is provided.
const rawUrl = process.env.DATABASE_URL || "";
const wantsSsl =
  /ssl-mode=REQUIRED/i.test(rawUrl) || Boolean(process.env.DB_CA_CERT_PATH);

let poolConfig = rawUrl;

if (wantsSsl) {
  const caPath = process.env.DB_CA_CERT_PATH;
  const caExists = caPath && fs.existsSync(caPath);
  if (caPath && !caExists) {
    console.warn(
      `DB_CA_CERT_PATH is set to "${caPath}" but that file was not found. ` +
        `Falling back to unverified TLS — download ca.pem from the Aiven console and save it there.`
    );
  }
  const ssl = caExists
    ? { ca: fs.readFileSync(caPath), rejectUnauthorized: true }
    : { rejectUnauthorized: process.env.DB_SSL_INSECURE !== "true" };

  // The mariadb PoolConfig has no `url` field, so the connection string must
  // be broken into discrete fields to attach `ssl` alongside them.
  const parsed = new URL(rawUrl);
  poolConfig = {
    host: parsed.hostname,
    port: Number(parsed.port),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    ssl,
    // Cross-region latency (e.g. Render US/EU ↔ Aiven Bangalore) pushes the
    // TLS + auth handshake past the driver's 1s default connectTimeout, so
    // the pool never gets a single connection and times out generically.
    connectTimeout: 15000,
    // acquireTimeout is the pool's own deadline for handing a connection to a
    // query (default 10s). It must exceed connectTimeout, otherwise the pool
    // reports "failed to retrieve a connection from pool after 10000ms" while
    // the first connection attempt is still mid-handshake.
    acquireTimeout: 30000,
  };
}

const adapter = new PrismaMariaDb(poolConfig);

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
module.exports.poolConfig = poolConfig;
