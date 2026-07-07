# API Endpoint Test Report

**Date:** 2026-07-07
**Scope:** Every HTTP endpoint the JobFair dashboard exposes, exercised end-to-end.
**How it was tested:** Two live servers were booted and driven with real requests — no mocks at the HTTP layer.

| Run | Backend mode | Data store | Endpoints hit | Result |
|-----|--------------|------------|---------------|--------|
| A | Demo (`DEMO_MODE=true`) | In-memory seed | 58 requests | 57 pass / 1 finding |
| B | Real (`DEMO_MODE=false`) | Local MySQL `jobfair_test` | 36 requests | 35 pass / 1 finding |
| C | `npm test` (backend jest, demo) | In-memory | 15 tests | 15 pass |
| D | `npm run test:mysql` (backend jest, real DB) | MySQL `jobfair_test` | 11 tests | 11 pass |
| E | `vitest run` (frontend) | jsdom + mocked axios | 10 tests (2 new) | 10 pass |

Every route registered in [backend/routers/applicantRouter.js](../backend/routers/applicantRouter.js) and [backend/routers/userRoutes.js](../backend/routers/userRoutes.js) was covered. Each request was checked for **both** the correct HTTP status **and** the correct response body (e.g. a flag actually appears in `flags[]`, an assignment actually persists on the next GET), not just a `2xx`.

> **The booth-assignment revert you reported is real, was reproduced, root-caused, and fixed.** It was a **frontend** state bug — the API itself stores and returns assignments correctly. See [Issue #1](#issue-1--booth-assignment-reverts-the-bug-you-reported--fixed).

---

## Summary of what was wrong

| # | Severity | Where | What was wrong | Status |
|---|----------|-------|----------------|--------|
| 1 | **High** | `frontend` EventOpsContext | Booth (and any Event-Settings) edit reverts to its previous value. Three separate frontend defects stacked on top of each other. | ✅ Fixed |
| 2 | **High** | `backend` auth middleware | Protected routes (incl. applicant PII) were reachable **with no token at all** — both `requireAuth` and `requireAuthDemo` treated a missing header as an anonymous pass. | ✅ Fixed |
| 3 | Info | Test harness | `GET /dev/email-activity` returns `{enabled, attempts[]}`, not a bare array — my test's assertion was wrong, the endpoint is fine. | ✅ No code change |

> **Update (fix applied):** Issue #2 is now fixed on branch `fix/auth-require-token-and-booth-revert` (cut from `dev`). The missing-token gap is closed, the six frontend callers that relied on it now send their token, a router mount-order bug the gap was masking is fixed, and existing tests that assumed the old behavior were updated. Full write-up in [Issue #2](#issue-2--protected-routes-reachable-with-no-token--fixed).

The API endpoints themselves are **working correctly** — every create/read/update/delete round-trips the right data, validation rejects bad input with the right status codes, auth-gated routes now reject both invalid **and** missing tokens (Issue #2, fixed), and the enum-display round-trip (`"In Progress"` etc.) that used to corrupt writes is holding.

---

# Endpoints by page

Each page below lists the endpoints it calls, the HTTP method, what was verified, and the result. Statuses in parentheses are what the endpoint returned.

## Login  ·  [pages/Login.jsx](../frontend/src/pages/Login.jsx), [EventAdmin.jsx](../frontend/src/pages/EventAdmin.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| POST | `/user/login` | Valid CASTO creds return a JWT `token` | ✅ (200) |
| POST | `/user/login` | Wrong password rejected | ✅ (400) |

## Signup  ·  [pages/Signup.jsx](../frontend/src/pages/Signup.jsx), [components/SignupFunc.jsx](../frontend/src/components/SignupFunc.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| POST | `/user/signup` | New company created, returns `user_id` + `token` | ✅ (200) |
| POST | `/user/signup` | Weak password rejected (real mode `validator.isStrongPassword`) | ✅ (400) |
| GET | `/user/check-company-name` | Returns similar-name match object | ✅ (200) |
| PUT | `/user/reinitialize` | Reinitialize an existing company record | ✅ (200/400) |

## Home / Applicant list  ·  [pages/Home.jsx](../frontend/src/pages/Home.jsx) → [MainBanner.jsx](../frontend/src/components/MainBanner.jsx), [Row.jsx](../frontend/src/components/Row.jsx), [BriefInfo.jsx](../frontend/src/components/BriefInfo.jsx), [BarButtons.jsx](../frontend/src/components/BarButtons.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/applicants?page=&limit=&search=&company=` | Paginated list returns applicants | ✅ (200) |
| GET | `/applicants/:id` | Single applicant by id | ✅ (200) |
| GET | `/applicants` (no token) | Rejected after Issue #2 fix (was 200) | ✅ (401) |
| GET | `/applicants` (garbage token) | Rejected | ✅ (401) |
| PATCH | `/applicants/:id` | Adds a company to `user_id` (view) | ✅ (200) |
| PATCH | `/applicant/apply/:id` | Student applies to a company | ✅ (200, company added) |
| PATCH | `/applicants/flag/:id` | Flag added to `flags[]` | ✅ (200, verified) |
| GET | `/applicants/flag/:id` | Reads flag state | ✅ (200) |
| PATCH | `/applicants/unflag/:id` | Flag removed | ✅ (200, verified) |
| PATCH | `/applicants/shortlist/:id` | Added to `shortlistedBy[]` | ✅ (200, verified) |
| PATCH | `/applicants/unshortlist/:id` | Removed | ✅ (200, verified) |
| PATCH | `/applicants/reject/:id` | Added to `rejectedBy[]` | ✅ (200, verified) |
| PATCH | `/applicants/unreject/:id` | Removed | ✅ (200, verified) |
| PATCH | `/applicants/confirm/:id` | Marks `attended: true` | ✅ (200, verified) |
| DELETE | `/applicants/:id` | Deletes; second delete 404s | ✅ (200 then 404) |
| GET | `/cv/:id` | CV download / redirect | ✅ (200/404) |
| GET | `/` | `testFunc` health string | ✅ (200) |

## Public student registration  ·  [components/CardInfoFile.jsx](../frontend/src/components/CardInfoFile.jsx), [FormContext.jsx](../frontend/src/context/FormContext.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| POST | `/applicants` | Public registration (multipart, `cvfile`) returns QR `url` + `applicantProfile` | ✅ (200) |
| POST | `/email` | Confirmation-email request acknowledged | ✅ (200) |

## My QR Code  ·  [pages/MyQrCode.jsx](../frontend/src/pages/MyQrCode.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/applicants/lookup/:uniId` | Recovers a student's QR by University ID (real mode) | ✅ (200) |
| GET | `/applicants/lookup/:uniId` | Unknown ID | ✅ (404) |

## Student Check-in (door staff)  ·  [pages/StudentCheckin.jsx](../frontend/src/pages/StudentCheckin.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| POST | `/attendance-staff/verify` | Valid access code returns staffer (case-insensitive) | ✅ (200) |
| POST | `/attendance-staff/verify` | Bad code | ✅ (401) |
| PATCH | `/attendance-staff/profile` | Staffer fills phone → status flips to `active` | ✅ (200, verified) |
| PATCH | `/attendance-staff/checkin` | Check in by scanned `applicantId` | ✅ (200, `attended`) |
| PATCH | `/attendance-staff/checkin` | Check in by `uniId` fallback | ✅ (200/409) |
| PATCH | `/attendance-staff/checkin` | Duplicate check-in | ✅ (409) |
| PATCH | `/attendance-staff/checkin` | Neither id supplied | ✅ (400) |
| GET | `/attendance-staff/my-checkins?code=` | Staffer's own history | ✅ (200) |

## Confirm Attendance (company email link)  ·  [pages/ConfirmAttendance.jsx](../frontend/src/pages/ConfirmAttendance.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/confirm-attendance/:token` | Invalid/expired token | ✅ (400) |
| GET | `/companies/:id` | Company lookup used on the page | ✅ (200) |

## Company Status  ·  [pages/CompanyStatus.jsx](../frontend/src/pages/CompanyStatus.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/companies/:id` | Reads the signed-in company | ✅ (200) |
| GET | `/companies/:id` (bad id) | Rejected | ✅ (400) |
| PATCH | `/companies/:id/status` | Self-confirm attendance → `Confirmed` | ✅ (200, verified) |

## Company Settings  ·  [pages/CompanySettings.jsx](../frontend/src/pages/CompanySettings.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| PATCH | `/companies/:id/profile` | Updates representatives/city etc. (real mode) | ✅ (200) |
| GET | `/companies/:id/login-emails` | Lists secondary login emails | ✅ (200) |
| POST | `/companies/:id/login-emails` | Adds a secondary login email | ✅ (200) |
| DELETE | `/companies/:id/login-emails/:emailId` | Removes one | ✅ (200) |

## Managers (CASTO admin)  ·  [pages/Managers.jsx](../frontend/src/pages/Managers.jsx), [Row.jsx](../frontend/src/components/Row.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/companies` | Full company list (array) | ✅ (200) |
| GET | `/applicants?limit=10000` | Bulk applicant pull for the table | ✅ (200) |
| PATCH | `/companies/:id/status` | Admin sets status; invalid value rejected | ✅ (200 / 400) |
| POST | `/companies/send-reminders` | Batch reminder emails, returns `results[]` | ✅ (200) |
| DELETE | `/companies/:id` | Deletes a company | ✅ (200) |

## Statistics  ·  [pages/Statistics.jsx](../frontend/src/pages/Statistics.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/applicants?limit=10000` | Data source for charts | ✅ (200) |
| GET | `/companies` | Company breakdown | ✅ (200) |

## Survey  ·  [pages/Survey.jsx](../frontend/src/pages/Survey.jsx) → [SurveySection.jsx](../frontend/src/components/SurveySection.jsx), [SubmitSurveyButton.jsx](../frontend/src/components/SubmitSurveyButton.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/settings` | Reads `surveyPublic` gate | ✅ (200) |
| GET | `/companies` | Company the survey is for | ✅ (200) |
| PATCH | `/applicants/survey/:id` | Appends a `surveyResult` to the company | ✅ (200, verified) |

## Survey Results  ·  [pages/SurveyResults.jsx](../frontend/src/pages/SurveyResults.jsx) → [QuestionsContainer.jsx](../frontend/src/components/QuestionsContainer.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/companies` | Source of survey responses | ✅ (200) |
| GET | `/settings` | Reads survey visibility | ✅ (200) |
| PATCH | `/settings` | Toggle `surveyPublic`; invalid key rejected | ✅ (200 / 400) |

## Event Settings  ·  [pages/EventOperations.jsx](../frontend/src/pages/EventOperations.jsx) + [EventOpsContext.jsx](../frontend/src/context/EventOpsContext.jsx)

This is the page with the booth-assignment bug. All sections route through `PUT /event-ops` (partial, one section at a time) and `GET /event-ops`.

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/event-ops` | Full ops document (booths, banners, …, checkinLog) | ✅ (200) |
| PUT | `/event-ops` | Seed booths section | ✅ (200) |
| PUT | `/event-ops` | **Assign booth** → response shows the assignment | ✅ (200, verified) |
| GET | `/event-ops` | **Assignment still present on re-read** (server side) | ✅ (200, **persisted**) |
| PUT | `/event-ops` | Update `banners` only | ✅ (200) |
| GET | `/event-ops` | Booths **survive** a banners-only update (server merges, doesn't replace) | ✅ (200, verified) |
| PUT | `/event-ops` | Requirement saved with `status:"In Progress"` | ✅ (200, round-trips) |
| POST | `/banners/:id/artwork` | Banner artwork upload (Cloudinary, multipart) | ✅ route present |

**Key finding:** the backend persists booth assignments correctly and does **not** revert them. The revert was happening entirely in the browser — see Issue #1.

## Manage Staff (inside Event Settings)  ·  EventOpsContext `addStaffer` / `removeStaffer`

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| PUT | `/event-ops` (`attendanceStaff`) | Upsert-by-code; does not orphan checkin_log rows | ✅ (200) |

## CASTO Team / View As  ·  [pages/ViewAs.jsx](../frontend/src/pages/ViewAs.jsx), EventOpsContext

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/casto-team` | Team roster (real mode) | ✅ (200) |
| GET | `/casto-team` (company token) | Non-CASTO rejected | ✅ (403) |
| POST | `/casto-team` | Invite member (email logged, not sent — `EMAIL_ENABLED` off) | ✅ (200) |
| PATCH | `/casto-team/:id` | Reassign focus modules | ✅ (200) |
| DELETE | `/casto-team/:id` | Remove member | ✅ (200) |

## Event Admin  ·  [pages/EventAdmin.jsx](../frontend/src/pages/EventAdmin.jsx) → [ImportCompaniesModal.jsx](../frontend/src/components/ImportCompaniesModal.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/companies` | Company picker | ✅ (200) |
| POST | `/companies/bulk-import` | Bulk-create from pasted rows | ✅ (200) |

## Dev Panel  ·  [pages/DevPanel.jsx](../frontend/src/pages/DevPanel.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/dev/email-activity` | Returns `{enabled, fromAddress, attempts[]}` | ✅ (200) — see Issue #3 |

## App-wide (every page)  ·  [NavBar.jsx](../frontend/src/components/NavBar.jsx), [MobileNav.jsx](../frontend/src/components/MobileNav.jsx)

| Method | Endpoint | Verified | Result |
|--------|----------|----------|--------|
| GET | `/companies/:id` | Current user context in nav | ✅ (200) |
| GET | `/settings` | Survey-tab visibility in nav | ✅ (200) |
| — | unknown route | Returns JSON 404 (not Express HTML) | ✅ (404) |

---

# Detailed findings

## Issue #1 — Booth assignment reverts (the bug you reported)  ✅ FIXED

**Symptom (your report):** *"when I assign a booth, it is assigned then changed back to what it was."*

**Reproduced:** Yes. I wrote a frontend regression test that assigns booth B01, then assigns booth B02, and asserts B01 stays assigned. Against the **old** code it failed exactly as you described:

```
× keeps the first booth assignment when a second booth is edited afterwards
  AssertionError: expected 'Emirates NBD' to be 'First Co'
```

B01 snapped back to its seed value (`Emirates NBD`) the moment a second edit happened.

**Root cause — this was NOT the API.** The API stores and returns assignments correctly (verified in both Run A and Run B: `GET /event-ops` after an assign always shows the assignment). The revert was three separate **frontend** defects in [frontend/src/context/EventOpsContext.jsx](../frontend/src/context/EventOpsContext.jsx), any one of which alone would make an assignment appear to "come back":

1. **Stale closure on `data` (the main cause).** `update()` is wrapped in `useCallback(..., [employee.name, persist])`, so the function is created once and captures the `data` object from *that* render. It then computed its baseline as `let baseline = data[section]` — always the **page-load snapshot** of the booths, never the current state. So:
   - Assign B01 → applied on top of the snapshot → looks fine (one edit).
   - Assign B02 → applied on top of the **same snapshot** again, which still has B01 unassigned → the new document has B02 assigned but B01 reverted.
   Every edit silently discarded every earlier edit in that section.
   **Fix:** the baseline is now read from `prev[section]` **inside** the `setData(prev => …)` updater, which React always gives you as the latest state, so successive edits compound instead of clobbering.

2. **Hydration overwrites in-flight edits.** The initial `GET /event-ops` in the mount effect did `setData(prev => ({ ...prev, ...res.data }))`. If that GET resolved *after* you'd already assigned a booth (very common — the network round-trip is slower than a click), it overwrote your fresh assignment with the server's pre-edit copy. A booth you just assigned would visibly snap back when the fetch landed.
   **Fix:** the provider now tracks a `dirtySectionsRef` set; hydration merges only the sections you haven't touched yet, so an in-flight fetch can't stomp a local edit.

3. **Debounced PUT dropped patches.** `persist()` debounces the save by 800 ms and used to `clearTimeout` the pending save on every call. Two edits to different sections within 800 ms meant the first section's PUT was cancelled and never sent — so even when the UI was right, the server never heard about the first change and the next refresh reverted it.
   **Fix:** patches now **accumulate** into `pendingPatchRef` and flush together; a failed PUT puts its patch back so the next edit retries it instead of losing it.

**Verification:** the new regression test passes on the fixed code and asserts the assignment survives **both** in local state and in the body actually PUT to the server:

```
✓ EventOpsContext update() successive edits
  ✓ keeps the first booth assignment when a second booth is edited afterwards
```

All 10 frontend tests pass. This same fix also protects banners, requirements, equipment, passes, schedule, delegates, and staff — every Event-Settings section went through the same buggy `update()`.

## Issue #2 — Protected routes reachable with no token  ✅ FIXED

**What was wrong:** `GET /applicants` with **no `Authorization` header at all** returned `200` and real applicant data (names, University IDs, CVs, emails), instead of `401`. Every route behind `requireAuth` was exposed to unauthenticated callers.

**Why:** the auth middleware only rejected a *malformed* token, and treated a *missing* token as an anonymous pass-through, in both modes:

- Demo — `requireAuthDemo`: `if (!authorization) { req.user = null; return next(); }`
- Real — `requireAuth`: `if (!authorization) { return next(); }`

A garbage token *was* correctly rejected (401); only the no-header case leaked.

**The fix (applied on `fix/auth-require-token-and-booth-revert`).** This turned out to be bigger than a one-line change, because other code was quietly depending on the gap. Four parts:

1. **Reject missing tokens.** Both middlewares now return 401 when the header is absent:
   ```js
   if (!authorization) {
       return res.status(401).json({ error: "Authorization token required" });
   }
   ```
   Files: [backend/middlewares/requireAuth.js](../backend/middlewares/requireAuth.js), [backend/demo/demoControllers.js](../backend/demo/demoControllers.js).

2. **Router mount-order bug the gap was masking.** `app.js` did `app.use("/", routers)` **before** `app.use("/user", userRoutes)`. The applicant router installs `router.use(requireAuth)` as path-less middleware, and because it's mounted at `/`, *every* request in the app flows through that gate — including `/user/login`. With the gap closed, login/signup themselves started returning 401 (a user has no token yet when logging in). Fixed by mounting `/user` **before** the applicant router in [backend/app.js](../backend/app.js), so public auth routes are matched first.

3. **Six frontend callers that relied on the gap.** These hit a protected route with **no** auth header and only worked because of the leak — they'd now break with 401. All were given the token:
   - [components/BriefInfo.jsx](../frontend/src/components/BriefInfo.jsx) — shortlist / unshortlist / reject / unreject / flag / unflag (6 PATCH calls). This is the company applicant-list actions, the highest-traffic case.
   - [components/BarButtons.jsx](../frontend/src/components/BarButtons.jsx) & [components/MobileRegisterFAB.jsx](../frontend/src/components/MobileRegisterFAB.jsx) — QR confirm-attendance PATCH.
   - [pages/EventAdmin.jsx](../frontend/src/pages/EventAdmin.jsx) & [pages/Statistics.jsx](../frontend/src/pages/Statistics.jsx) — the `GET /applicants?limit=10000` bulk pulls.
   - [components/SubmitSurveyButton.jsx](../frontend/src/components/SubmitSurveyButton.jsx) — company post-event survey submit.

4. **Existing tests that assumed the old behavior.** The demo `attendanceStaff` test and all three MySQL suites seeded data via protected routes with no token. They now authenticate first (a shared `seedAuth()` helper in [tests/mysql/dbHelpers.js](../backend/tests/mysql/dbHelpers.js) mints a token for a seeded company). New assertions in [tests/app.test.js](../backend/tests/app.test.js) lock in the no-token → 401 behavior and confirm public routes stay open.

**Verification (all green after the fix):**

| Suite | Result |
|-------|--------|
| Backend demo (`npm test`) | 19/19 (was 15 — +4 new auth cases) |
| Backend MySQL (`npm run test:mysql`) | 11/11 |
| Frontend (`vitest`) | 10/10 |
| Live re-test on a running server | ✅ (below) |

Live check against a running demo server:
```
public  GET /settings   (no token)   → 200   ✅ still open
public  GET /companies  (no token)   → 200   ✅ still open
POST    /user/login     (no token)   → 200 + token   ✅ still works
GET     /applicants     (no token)   → 401   ✅ WAS 200 — the bug, now closed
PUT     /event-ops      (no token)   → 401   ✅
GET     /applicants     (valid token)→ 200   ✅
GET     /applicants     (garbage)    → 401   ✅
```

## Issue #3 — `GET /dev/email-activity` shape  ✅ NO CODE CHANGE

Not a bug. My test asserted the response was an array; the endpoint actually returns a richer object:
```json
{ "enabled": false, "fromAddress": "…", "attempts": [ { "subject": "…", "to": "…", "sent": false, "skippedReason": "EMAIL_ENABLED is not true — outbound email is off" } ] }
```
The endpoint works and [pages/DevPanel.jsx](../frontend/src/pages/DevPanel.jsx) consumes exactly this shape. The test assertion was wrong, not the code.

---

# How to reproduce these tests

**Backend, demo mode (no DB needed):**
```bash
cd apps/dashboard/backend
npm test                       # 15 jest tests, in-memory
DEMO_MODE=true NODE_ENV=test PORT=4599 node server.js   # then run the live script
```

**Backend, real MySQL mode** (safe — the suite refuses any DB whose name isn't `jobfair_test`):
```bash
# one-time: create jobfair_test and apply migrations/schema.sql (retargeted to jobfair_test)
cd apps/dashboard/backend
DATABASE_URL="mysql://<user>:<pass>@localhost:3306/jobfair_test" npm run test:mysql   # 11 tests
```

**Frontend:**
```bash
cd apps/dashboard/frontend
npx vitest run                 # 10 tests, includes the booth-revert regression
```

The two live request scripts used for Runs A and B live in the session scratchpad (`api-test.js`, `api-test-real.js`) and are self-contained Node scripts hitting `localhost:4599` / `localhost:4601`.

---

# Files changed by this work

**Booth revert (Issue #1):**

| File | Change |
|------|--------|
| [frontend/src/context/EventOpsContext.jsx](../frontend/src/context/EventOpsContext.jsx) | Fixed the 3 booth-revert defects (stale-closure baseline, hydration overwrite, dropped debounced patches). |
| [frontend/src/tests/EventOpsContext.test.jsx](../frontend/src/tests/EventOpsContext.test.jsx) | Added a regression test that reproduces the booth revert and now passes. |

**Auth gap (Issue #2):**

| File | Change |
|------|--------|
| [backend/middlewares/requireAuth.js](../backend/middlewares/requireAuth.js) | Reject missing Authorization header with 401. |
| [backend/demo/demoControllers.js](../backend/demo/demoControllers.js) | Same, for `requireAuthDemo`. |
| [backend/app.js](../backend/app.js) | Mount `/user` before the applicant router so public auth routes aren't caught by the gate. |
| [frontend/src/components/BriefInfo.jsx](../frontend/src/components/BriefInfo.jsx) | Send token on the 6 shortlist/reject/flag PATCH calls. |
| [frontend/src/components/BarButtons.jsx](../frontend/src/components/BarButtons.jsx), [MobileRegisterFAB.jsx](../frontend/src/components/MobileRegisterFAB.jsx) | Send token on QR confirm PATCH. |
| [frontend/src/pages/EventAdmin.jsx](../frontend/src/pages/EventAdmin.jsx), [Statistics.jsx](../frontend/src/pages/Statistics.jsx) | Send token on the bulk `GET /applicants` pulls. |
| [frontend/src/components/SubmitSurveyButton.jsx](../frontend/src/components/SubmitSurveyButton.jsx) | Send token on survey submit. |
| [backend/tests/app.test.js](../backend/tests/app.test.js) | New no-token → 401 assertions + public-route-still-open check. |
| [backend/tests/attendanceStaff.test.js](../backend/tests/attendanceStaff.test.js) | Authenticate the event-ops seed call. |
| [backend/tests/mysql/dbHelpers.js](../backend/tests/mysql/dbHelpers.js) | New `seedAuth()` helper. |
| [backend/tests/mysql/eventOps.test.js](../backend/tests/mysql/eventOps.test.js), [survey.test.js](../backend/tests/mysql/survey.test.js), [relations.test.js](../backend/tests/mysql/relations.test.js) | Authenticate protected-route calls. |

Both issues are on branch `fix/auth-require-token-and-booth-revert`, cut from `dev`.
