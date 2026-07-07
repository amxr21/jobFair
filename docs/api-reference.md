# JobFair Dashboard — API Reference

Base URL (backend): `http://localhost:2000` in local dev (see
`frontend/src/config/api.js` for the environment-specific values).

Authentication: `Authorization: Bearer <token>` header, where `<token>` is
the JWT returned by `/user/login` or `/user/signup`. Routes marked
**Protected** require this header. `requireAuth` (see
`backend/middlewares/requireAuth.js`) does not reject requests with no
header at all — it just leaves the request unauthenticated — so protected
handlers each check `req.user` themselves.

All routes below live in `backend/routers/userRoutes.js` (prefixed `/user`)
and `backend/routers/applicantRouter.js` (no prefix), backed by
`backend/controllers/userController.js` and
`backend/controllers/applicantsControllers.js` respectively.

---

## Auth (`/user`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/user/login` | Public | `{ email, password }`. Resolves either a company's primary email or an approved secondary login email (`CompanyLoginEmail`) to the same account, sharing one password. Returns `{ user_id, email, token, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities }`. |
| POST | `/user/signup` | Public | `{ email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities }`. Creates a new company. Validates email format and password strength; rejects duplicate emails. |
| GET | `/user/check-company-name` | Public | `?companyName=`. Fuzzy-matches against existing company names (exact, substring, word-overlap, and Levenshtein-similarity heuristics) to catch likely duplicates before signup. |
| PUT | `/user/reinitialize` | Public | `{ existingCompanyId, email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities }`. Full re-signup of an existing company: resets status to Pending and clears prior survey responses. |

---

## Companies

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/companies` | Public | List every company, each including `surveyResult` (real submitted survey answers, reshaped from `CompanySurveyResponse`). |
| GET | `/companies/:id` | Public | Single company by id. |
| PATCH | `/companies/:id/status` | Protected | `{ status }` — one of `Pending` / `Confirmed` / `Canceled`. |
| DELETE | `/companies/:id` | Protected | Deletes a company (cascades to its applicant relations and survey responses). |
| POST | `/companies/send-reminders` | Protected | `{ companyIds: [...], frontendUrl }`. Emails a confirmation link to each selected company, tracks `reminderSentAt`. |
| POST | `/companies/bulk-import` | Protected | `{ rows: [{ rowIndex, action: "create"\|"update"\|"skip", data, existingCompanyId }] }`. Per-row create/update/skip with independent success/failure reporting (never fails the whole batch for one bad row); new companies get an auto-generated temporary password. |
| GET | `/companies/:id/login-emails` | Protected (owner only) | Lists additional emails approved to log into this company. |
| POST | `/companies/:id/login-emails` | Protected (owner only) | `{ email }`. Approves a new email to log in with the company's existing password. |
| DELETE | `/companies/:id/login-emails/:emailId` | Protected (owner only) | Revokes a previously-approved login email. |
| PATCH | `/companies/:id/profile` | Protected (owner only) | `{ email?, phone?, fields?, sector?, city?, noOfPositions?, preferredMajors?, opportunityTypes?, preferredQualities? }`. Lightweight self-service edit — only updates the fields provided, does not reset status or touch survey data (unlike `/user/reinitialize`). Changing `email` makes it the new login email. |

"Owner only" = the JWT's company id must match the `:id` in the URL.

---

## Applicants

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/applicants` | Public\* | `?page=&limit=&search=&company=`. Paginated list; \*`requireAuth` runs but doesn't require a token — behavior differs by whether `req.user` is set inside the handler. |
| GET | `/applicants/:id` | Protected | Single applicant, 404 if not found. |
| PATCH | `/applicants/:id` | Protected | Adds an "applied" relation to a company (`{ user_id: [companyName] }`). |
| POST | `/applicants` | Protected | Multipart, `cvfile` upload. Creates an applicant (CASTO-side add). |
| DELETE | `/applicants/:id` | Protected | Deletes an applicant. |
| PATCH | `/applicants/flag/:id` | Protected | `{ flags: [companyName] }`. Private per-company flag. |
| PATCH | `/applicants/unflag/:id` | Protected | `{ company }`. Removes a flag. |
| GET | `/applicants/flag/:id` | Protected | Fetch an applicant with flag state. |
| PATCH | `/applicants/shortlist/:id` | Protected | `{ shortlistedBy: [companyName] }`. Visible to all companies. |
| PATCH | `/applicants/unshortlist/:id` | Protected | `{ company }`. |
| PATCH | `/applicants/reject/:id` | Protected | `{ rejectedBy: [companyName] }`. |
| PATCH | `/applicants/unreject/:id` | Protected | `{ company }`. |
| PATCH | `/applicants/confirm/:id` | Protected | Marks an applicant as attended/confirmed. |
| PATCH | `/applicants/survey/:id` | Protected | `{ surveyResult: [{ id, text, responses }] }`. `:id` here is actually a **company** id (see `SubmitSurveyButton.jsx`) — upserts one row per question into `CompanySurveyResponse`. |
| PATCH | `/applicant/apply/:id` | Public | `{ user_id: [companyName] }`. Public "apply to a company" action from the applicant's own flow. |
| POST | `/applicants` | Public | Multipart, `cvfile` upload. Public application submission (registration). |
| GET | `/cv/:id` | Public | Redirects to the applicant's CV URL if it's a full URL, else 404. |

---

## Settings

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/settings` | Public | `{ surveyPublic }` — whether the survey results page is publicly viewable. |
| PATCH | `/settings` | Protected | `{ key: "surveyPublic", value }`. |

---

## Event Ops (CASTO Event Settings — one JSON-shaped document backed by real tables)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/event-ops` | Protected | Returns `{ booths, banners, requirements, equipment, delegates, attendanceCompanies, attendanceStudents, schedule, passes, attendanceStaff, checkinLog, audit }`, assembled live from their respective tables. |
| PUT | `/event-ops` | Protected | Body may contain any subset of the same top-level keys; each section present is fully replaced (delete-and-reinsert in a transaction) with the caller's array. Sections not included are left untouched. |

---

## Attendance staff (volunteer/staff check-in terminal)

Deliberately **not** behind `requireAuth` — a staffer works with just a
short access code, no CASTO/company login.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/attendance-staff/verify` | Public (code-gated) | `{ code }`. "Logs in" a staffer by their access code. |
| PATCH | `/attendance-staff/checkin` | Public (code-gated) | `{ code, applicantId? , uniId? }`. Checks a student in by QR scan (applicantId) or manual uni ID lookup. |
| PATCH | `/attendance-staff/profile` | Public (code-gated) | `{ code, phone }`. A staffer completes their own profile after first login. |

---

## Attendance confirmation (public link from reminder emails)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/confirm-attendance/:token` | Public | Confirms a company's attendance via the emailed token, flips status to Confirmed. |

---

## Misc

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Protected | Health-check style endpoint (`testFunc`). |

---

## Demo mode

When `DEMO_MODE=true`, `applicantRouter.js` and `userRoutes.js` swap in
`backend/demo/demoControllers.js` (in-memory store, `backend/demo/demoStore.js`)
instead of the real Prisma-backed controllers — same route paths, no MySQL
required. `bulkImportCompanies`, `getCompanyLoginEmails` /
`addCompanyLoginEmail` / `removeCompanyLoginEmail` / `updateCompanyProfile`
have no demo-mode equivalent yet (those routes are only registered when the
real controllers provide them).
