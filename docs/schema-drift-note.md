# Schema drift: live DB vs schema.sql / schema.prisma

## What was found

While adding the `company_login_emails` table and `companies.phone` column, running
`prisma db push` surfaced warnings that it wanted to alter five *unrelated* columns:

| Table | Column | schema.sql / schema.prisma declares | Live database actually has |
|---|---|---|---|
| `applicants` | `gender` | `ENUM('Male','Female')` | `VARCHAR(20)` |
| `applicants` | `study_level` | `ENUM('Bachelor','Master','PhD','Diploma')` | `VARCHAR(50)` |
| `applicants` | `cgpa` | `DECIMAL(3,2)` | `VARCHAR(10)` |
| `applicants` | `expected_to_graduate` | `DATE` | `VARCHAR(50)` |
| `companies` | `sector` | `ENUM('Private','Semi','Local','Federal')` | `VARCHAR(100)` |

`prisma db push` diffs the *declared* schema against the *live* database and
generates whatever `ALTER TABLE` statements are needed to make them match. It
found these five columns out of sync and wanted to run `MODIFY COLUMN`
statements converting each from loose text to the strict type — silently, as
a side effect of pushing the actually-wanted change (adding `phone` and the
new table).

## Why this is dangerous to run blindly

`ALTER TABLE ... MODIFY COLUMN cgpa DECIMAL(3,2)` on a column that is
currently free-text `VARCHAR(10)` will try to cast every existing value.
Anything that doesn't parse cleanly as that stricter type can:
- get silently truncated or rounded (e.g. a stray `"3.65 "` with trailing
  whitespace, or a value like `"N/A"`),
- get set to `NULL` if the cast fails outright, or
- abort the whole migration partway through, depending on MySQL's strict-mode
  settings — leaving the table in a partially-converted state.

This is not hypothetical for this project specifically: earlier in this same
session, real rows in exactly these columns (`gender`, `cgpa`,
`expected_to_graduate`) were found to contain empty strings (`''`) instead of
`NULL`, which crashed the API (`Value '' not found in enum 'ApplicantGender'`,
`[DecimalError] Invalid argument`) until they were manually cleaned up. That
was found and fixed by inspecting the data first — running an automatic
`MODIFY COLUMN` over the *whole* column without that same inspection could
reintroduce the same class of bug at a larger scale, invisibly, since
`db push` does not show you which rows would be affected before running.

## Why this drift exists at all

It's not a missing seed or setup step. Seed files (`seed.sql`,
`generate-seed.js`) only `INSERT` rows — they do not define column types, so
re-running them would not change `VARCHAR` into `ENUM`/`DECIMAL`. The type
declarations live entirely in `schema.sql`'s `CREATE TABLE` statements (and
the generated `schema.prisma`), and there is no `ALTER TABLE` anywhere in the
`migrations/` folder that would have tightened these columns after the fact.

The most likely explanation: the live database was created from an earlier,
looser version of the schema (or a raw import that used `VARCHAR` for
everything as a safe default), and `schema.sql`/`schema.prisma` were written
or later edited to declare the *intended* stricter types — but that intent
was never actually applied to the live database with a real migration.
`schema.sql` and the live schema have been out of sync since then, and
nothing surfaced this until Prisma's own diffing tool was run against it just
now.

## What was done about it (this session)

Per your decision, the drift was **left alone**. Only the two actually-wanted
changes were applied, by hand, with plain `ALTER TABLE` / `CREATE TABLE`
statements that don't touch any existing column:

```sql
ALTER TABLE companies ADD COLUMN phone VARCHAR(50) NULL AFTER password;

CREATE TABLE company_login_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(24) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    added_by VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Both were verified live afterward (queried via Prisma, backend restarted and
confirmed it still boots and serves `/companies` correctly).

## If you want to fix the drift later

Recommended approach, following the same pattern used earlier this session
for the applicant data cleanup:

1. For each of the 5 columns, query the live data first and list every
   distinct value that would **not** cleanly cast to the stricter type
   (e.g. `SELECT DISTINCT gender FROM applicants WHERE gender NOT IN
   ('Male','Female')`).
2. Decide row-by-row (or value-by-value) how each bad value should map —
   usually to `NULL`, occasionally to a corrected value if it's an obvious
   typo (the `cgpa` column already had one such correction made earlier this
   session, `"40"` → `4.00`).
3. Only after every value is confirmed clean, run the real `ALTER TABLE ...
   MODIFY COLUMN` for that one column, then verify again.
4. Do this as its own isolated piece of work, not bundled into an unrelated
   feature's schema push — so a `db push` for some future, different feature
   doesn't surface this same warning again by surprise.
