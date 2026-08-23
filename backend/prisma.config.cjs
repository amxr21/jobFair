require("dotenv").config();
const { defineConfig } = require("prisma/config");

// `prisma generate` loads this config but never opens a connection — it only
// needs the schema to emit the client. Using prisma/config's `env()` here made
// generation *require* DATABASE_URL, which build steps don't get: with no .env
// in the build container, `postinstall` failed with "PrismaConfigEnvError:
// Cannot resolve environment variable: DATABASE_URL" and the deploy aborted.
// (apps/form/backend hit this exact failure on Render first.)
//
// Fall back to a placeholder so config loading (and therefore `generate`)
// works without a database. Commands that genuinely connect — `migrate`,
// `db push`, `studio` — still need the real value, and the runtime client is
// built from it in config/prisma.js, which throws a named error when unset.
const url = process.env.DATABASE_URL || "mysql://placeholder:placeholder@127.0.0.1:3306/placeholder";

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
