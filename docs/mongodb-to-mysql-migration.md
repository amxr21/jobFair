# MongoDB → MySQL Migration

Status: schema, data migration, and backend API rewrite are complete for both
`apps/dashboard/backend` and `apps/form/backend`. Not yet done: frontend
testing against the new backend, production cutover, and CV file migration
(see [Known gaps](#known-gaps)).

## Why

The original stack (MongoDB Atlas + Mongoose) was the source of a string of
production incidents: unguarded `mongoose.connect()` calls that crashed the
whole process on a transient network blip, an Atlas IP-allowlist gap that
caused hours of downtime, and application code with `$addToSet` bugs that
silently corrupted data (see [Data anomalies found](#data-anomalies-found-and-resolved)).
Debugging these was made harder by Mongoose's loose schemas (`type: Object`
on `applicantDetails` meant nothing was validated) and by inconsistent error
handling across ~50 route handlers. MySQL + Prisma was chosen to get real
schema validation, typed queries, and structured errors.

## What changed, by layer

### 1. Schema (`apps/dashboard/backend/migrations/schema.sql`)

18 tables, replacing 3 loose Mongoose models:

| Table | Replaces |
|---|---|
| `companies` | `User` model |
| `applicants` | `applicants_details.file` model's scalar fields |
| `applicant_company_relations` | `user_id`, `flags`, `rejectedBy`, `shortlistedBy` arrays on the applicant doc |
| `company_survey_responses` | `surveyResult` array on the company doc |
| `attendance_staff`, `checkin_log` | `eventOps.attendanceStaff[]`, `eventOps.checkinLog[]` |
| `access_passes`, `booths`, `banners`, `special_requirements`, `equipment_requests`, `company_delegates`, `company_attendance`, `student_attendance_view`, `event_schedule`, `casto_team_members`, `event_ops_audit_log` | the rest of the `eventOps` Settings document |
| `settings` | remaining ad-hoc keys (e.g. `surveyPublic`) |

Key design decisions:
- Mongo ObjectIds are preserved as-is (`VARCHAR(24)`) as primary keys on
  `companies`/`applicants`, rather than switching to auto-increment ints —
  keeps existing IDs meaningful across the migration.
- `applicant_company_relations` has a composite primary key
  `(applicant_id, company_id, relation_type)`, not just `(applicant_id,
  company_id)` — confirmed against real data that a single applicant/company
  pair can hold more than one relation at once (e.g. shortlisted, then later
  rejected, by the same company; 19 such pairs exist in the migrated data).
- Fields with messy real-world data were deliberately **not** type-coerced:
  `cgpa` stays `VARCHAR`, not `DECIMAL` (source values include `""` and
  `"0"` mixed with real numbers); `fields`/`preferredMajors`/etc. stay `JSON`
  since the source data is inconsistently shaped (sometimes a string,
  sometimes an array).
- Every table referencing "a company" by free-text name (booths, banners,
  passes, etc.) keeps that name column **and** adds a nullable `company_id`
  foreign key — populated only when the name matches a real company. This
  reflects that the eventOps feature currently runs on hardcoded demo
  company names (`"Emirates NBD"`, `"Etisalat"`, ...) that don't correspond
  to real registrants yet, but the schema is ready to link once they do.
- `cv_metadata` on `applicants` is `JSON` and documents two incompatible
  historical shapes: legacy records have MongoDB GridFS metadata; current
  code (`config/cloudinary.js`) writes Cloudinary references
  (`{url, public_id, originalname}`). See [Known gaps](#known-gaps) — the
  actual PDF files were never migrated, only whichever metadata shape each
  record already had.

### 2. Data migration (`apps/dashboard/backend/migrations/`)

- `generate-seed.js` reads the real MongoDB exports (`data/Applicants.json`,
  `data/Companies.json`) and produces `seed.sql` (gitignored — contains real
  PII). Re-run with `node generate-seed.js`.
- `generate-eventops-sample-data.js` produces `seed-eventops-sample.sql` —
  sample data for the 14 tables that have no real production data yet
  (transcribed from the frontend's existing demo `SEED` object in
  `EventOpsContext.jsx`, so the UI and the database show consistent content).
  Idempotent — safe to re-run, clears its own tables first.
- Migrated: 75 companies, 1445 applicants, 462 applicant-company relations,
  924 survey responses.

#### Data anomalies found and resolved

All resolved with explicit user sign-off — nothing altered silently:

1. **Duplicate company by email, different case** (`Ismail.Afify@wsp.com` vs
   `ismail.afify@wsp.com`) — two genuinely different company records (WSP
   Middle East vs. wsp.com) that collide under MySQL's case-insensitive
   collation. Resolved: kept the newer record (by ObjectId timestamp), but
   merged in the older record's completed survey responses so no real
   answers were lost.
2. **Duplicate survey submission** — one company (Green Crystal Consulting
   Group) had 2 full 22-question submissions nested in `surveyResult`,
   caused by a live application bug (see below). Resolved: kept the later
   submission.
3. **3 unresolvable relation references** — an empty string and
   `"Test#1 Company"` appearing in relation arrays didn't match any real
   company. Excluded from the join table, logged with the specific
   applicant IDs.

### 3. Backend API rewrite (Mongoose → Prisma)

Both `apps/dashboard/backend` and `apps/form/backend` fully rewritten. ORM:
Prisma 7, using `@prisma/adapter-mariadb` (Prisma 7 requires a driver
adapter; `mariadb`'s wire protocol is MySQL-compatible). Both apps stayed on
CommonJS (`require`/`module.exports`) — `moduleFormat = "cjs"` is set in each
`schema.prisma`'s generator block, and `prisma.config.cjs` replaces the
old `datasource { url }` pattern Prisma 7 removed.

`apps/form/backend`'s Prisma schema only declares the two tables it actually
touches (`companies`, `applicants`, their relation table) — it never reads
or writes eventOps data, so the other 15 tables aren't in its schema. Keep
the shared model fields in sync with `apps/dashboard/backend/prisma/schema.prisma`
if either changes.

#### Bugs found and fixed during the rewrite

1. **Survey submission was append-only, not idempotent.** The original
   `submitSurvey` used `$addToSet` on the whole `surveyResult` array — every
   submission added a new array entry instead of updating existing answers.
   This is the actual cause of the Green Crystal duplicate found in
   [Data anomalies](#data-anomalies-found-and-resolved). Fixed: the
   rewritten `submitSurvey` does a per-question upsert against
   `company_survey_responses` (`UNIQUE(company_id, question_id)`), so
   resubmitting replaces answers.
2. **Relation writes assumed the wrong identifier type.** Initial draft of
   `flagApplicant`/`shortlistApplicant`/`rejectApplicant`/`apply`/
   `updateApplicant` assumed the frontend sends a company ID. Checked the
   actual frontend code (`BriefInfo.jsx`, `BarButtons.jsx`) and found it
   sends the company **name** (`user?.companyName`), matching how the
   original Mongo arrays stored names, not ObjectId references. Fixed by
   adding a name → ID resolution step before every relation write
   (`addRelationByCompanyName` / `removeRelationByCompanyName`). Silently
   no-ops on an unresolvable name, matching the old (unvalidated) Mongo
   behavior.
3. **`updateEventOps`'s attendance-staff writer would have orphaned check-in
   history.** First draft deleted and recreated the entire `attendance_staff`
   table on every roster edit. `checkin_log` has an `ON DELETE SET NULL`
   foreign key into it — a naive rewrite would silently unlink every
   check-in record from its staffer just because someone added a new
   staffer to the roster. Fixed: upsert by `code` (the real unique identity
   — it's the staffer's login credential) and only delete rows genuinely
   absent from the new list.
4. **Two `requireAuth.js` middlewares (one per app) were still importing the
   deleted Mongoose `userModel`.** Found after the controller rewrite was
   otherwise complete — every authenticated request in both apps was still
   hitting Mongoose. Rewritten against Prisma; the dead Mongoose model files
   were then deleted from both apps.
5. **A live, separate bug**: the public application form's "Preferences"
   step (Field Interest, Opportunity Type, Preferred Work City, Career
   Goals, Availability) was collected in the UI but never sent to the
   backend — the fields aren't in `Form.jsx`'s `keyMap`, which drives what
   actually gets submitted. Added 2026-01-04, unrelated to the DB migration
   but found during the schema audit. Fixed by adding the 5 fields to
   `keyMap`; matching nullable columns added to `applicants`.

#### API contract preserved

`getEventOps`/`updateEventOps` split one JSON Settings document into 12
tables, but the HTTP response shape is unchanged — `loadEventOps()` reads
all 12 tables and reassembles the same section-keyed JSON object
(`{booths: [...], banners: [...], ...}`) the frontend already expects.
`updateEventOps` still does a section-scoped merge (only the top-level keys
present in the request body are touched), matching the old shallow-merge
semantics that existed specifically because multiple CASTO sessions each
hold a stale partial copy. No frontend changes were needed for this part.

### 4. Tests

- `npm test` (both apps): existing demo-mode suite, runs against in-memory
  data, unaffected by this migration — still 15/15 passing in the dashboard
  app.
- `npm run test:mysql` (dashboard app only): new, **opt-in**, real MySQL
  integration tests covering the three bugs above (relation name-resolution,
  survey duplication fix, attendance-staff cascading-delete fix). Guarded to
  refuse running unless `DATABASE_URL` points at a database named
  `jobfair_test` — will not run against real data. See
  `apps/dashboard/backend/tests/mysql/`.

## Known gaps

- **CV files were not migrated.** `cv_metadata` carries whatever pointer
  each record already had (GridFS metadata for old records, Cloudinary
  references for new ones) — the actual PDF bytes for the ~534 legacy GridFS
  records were never pulled out of MongoDB. Follow-up task, not part of this
  migration.
- **Frontend has not been tested against the rewritten backend end-to-end.**
  Controllers are syntax-checked and export-verified against the routers,
  and the riskiest logic has integration test coverage, but no one has
  clicked through the actual dashboard UI against real MySQL yet.
- **Production is still running on MongoDB.** `DEMO_MODE`/`URI` env vars and
  the ability to run against Mongo were left in place; cutover (updating
  Render env vars to point at MySQL, decommissioning the Mongo connection
  code) hasn't happened.
- Mongo-era dependencies (`mongoose`, `mongodb`) are still listed in both
  apps' `package.json` — not removed yet since a full cutover hasn't
  happened.

## Where things live

- Schema: `apps/dashboard/backend/migrations/schema.sql`
- Migration scripts: `apps/dashboard/backend/migrations/generate-seed.js`,
  `generate-eventops-sample-data.js`
- Prisma schema (dashboard): `apps/dashboard/backend/prisma/schema.prisma`
- Prisma schema (form): `apps/form/backend/prisma/schema.prisma`
- Prisma client: `apps/dashboard/backend/config/prisma.js`,
  `apps/form/backend/config/prisma.js`
- MySQL integration tests: `apps/dashboard/backend/tests/mysql/`
