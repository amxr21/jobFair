# API Endpoint Test Report

**Date:** 2026-07-07
**Scope:** Every backend endpoint in `apps/dashboard/backend`, tested live with real request/response content.
**Trigger:** Booth assignments in Event Settings were being applied and then reverting to their previous value.

---

## How the tests were run

Production (Aiven MySQL) was **never touched**. Two throwaway local servers were used:

| Server | Mode | Data store | What it covered |
|---|---|---|---|
| `:4599` | `DEMO_MODE=true` | In-memory demo store | All routes the demo store implements (58 checks) |
| `:4601` | Real mode (Prisma) | Local MySQL `jobfair_test` (fresh schema from `migrations/schema.sql`) | Real controllers incl. routes demo mode doesn't have (36 checks) |

Plus the repo's own suites:

| Suite | Result |
|---|---|
| Backend `npm test` (demo-mode supertest) | **15/15 passed** |
| Backend `npm run test:mysql` (real Prisma against `jobfair_test`) | **11/11 passed** |
| Frontend `npx vitest run` | **10/10 passed** (includes 1 new regression test, see Bug #1) |
| Live demo-mode endpoint sweep | **58/58 behaved correctly** |
| Live real-mode endpoint sweep | **36/36 behaved correctly** ¹ |

¹ One check was initially marked FAIL by my own script because it expected `GET /dev/email-activity` to return a bare array; the endpoint correctly returns `{ enabled, fromAddress, attempts[] }`. Endpoint behavior is correct.

`EMAIL_ENABLED` was left off, so no real emails were sent (the code correctly logs skipped attempts — verified via `/dev/email-activity`).

---

## 🐛 What was wrong (root causes, not just fixes)

### Bug #1 — Booth assigned, then reverts (THE reported bug) — **frontend, not the API**

The API is innocent: `PUT /event-ops` followed by `GET /event-ops` kept booth assignments correctly in **both** demo mode and the real MySQL database, and the repo's own MySQL integration tests pass. The revert happens in the browser, in [EventOpsContext.jsx](../frontend/src/context/EventOpsContext.jsx). There were **two independent causes**:

**Cause A — stale-closure baseline (the visible "snap back").**
`update()` (the central mutation for all Event Settings sections) is memoized with `useCallback(..., [employee.name, persist])`, but it read `data[section]` from its own closure. Since `data` is not in the dependency list, the callback keeps the `data` **from the render in which it was created** — i.e. the page-load snapshot. Every edit was therefore applied to that frozen snapshot:

1. Assign booth **B03** → works (snapshot + B03).
2. Assign booth **B04** (or edit *anything else* in the booths section) → the updater runs against the *original snapshot again*, so the result contains B04's change but **B03 reverts to its page-load value** — on screen *and* in the `PUT` sent to the server.

Proven by test: the new regression test in [EventOpsContext.test.jsx](../frontend/src/tests/EventOpsContext.test.jsx) fails on the old code with exactly the reported symptom (`expected 'Emirates NBD' to be 'First Co'` — the booth snapped back to its page-load company) and passes after the fix.

**Fix:** the baseline is now taken from `prev[section]` *inside* the `setData` functional updater (always current), with the pre-hydration server re-fetch kept for the fresh-tab case.

**Cause B — debounced saves cancelling each other (the "reverts after refresh").**
`persist()` debounces the `PUT /event-ops` by 800 ms and `clearTimeout`s the previous save — **discarding the previous patch object entirely**. Two quick edits in *different* sections (e.g. assign a booth, then within 800 ms touch attendance/equipment/anything) meant the booth patch was never sent at all. The UI looked right, but the server never heard about the booth — the next page load reverted it.

**Fix:** patches now **accumulate** in a pending buffer that is merged and flushed once, and a failed `PUT` puts its patch back into the buffer so a later edit retries it instead of losing it.

**Also hardened (same family):** the initial `GET /event-ops` hydration used to blind-merge the server copy over local state; if the user edited within the first moments of page load, the response could overwrite the fresh edit. Hydration now skips any section already edited locally this session.

### Bug #2 — "Protected" routes accept requests with **no token at all** — security

[requireAuth.js](../backend/middlewares/requireAuth.js) (and its demo twin) does:

```js
if (!authorization) { return next(); }   // ← lets the request straight through
```

Only a *present-but-invalid* token gets a 401. A request with **no** `Authorization` header sails through to every "protected" route. Verified live:

- `GET /applicants` with no token → **200** (full applicant PII list)
- `PUT /event-ops` with no token → **200** (writes accepted)
- `DELETE /companies/:id` with no token → reaches the handler (404 only because the id didn't exist)
- `GET /applicants` with a garbage token → 401 (the only case that's actually blocked)

Handlers that check `req.user` themselves (casto-team, company profile/login-emails, bulk-import → 401/403) are safe; everything else (applicants CRUD, event-ops, settings, send-reminders, company status/delete) is effectively public. **Not fixed in this pass** — flagging it clearly: the intended behavior is almost certainly `if (!authorization) return res.status(401)...`, but that needs a coordinated check that every legitimate frontend call actually sends its token (a few currently rely on the hole, e.g. `EventOpsContext` calls `/event-ops` before login state exists on some routes). Say the word and I'll do that sweep.

### Minor findings (not fixed, worth knowing)

1. **`migrations/schema