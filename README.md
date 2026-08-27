# Job Fair Portal — Dashboard & Event Operations

A full-stack web application that digitizes and runs a university career fair end to end — applicant registration, company coordination, shortlisting workflows, live analytics, event-day operations (booths, banners, passes, attendance), and a paperless check-in flow.

🔗 **Live:** [job-fair-control.vercel.app](https://job-fair-control.vercel.app)

---

## Table of contents

- [What this solves](#what-this-solves)
- [User types at a glance](#user-types-at-a-glance)
- [Demo accounts](#demo-accounts)
- [End-to-end workflows](#end-to-end-workflows)
- [The user experience](#the-user-experience)
- [Features in depth](#features-in-depth)
- [Technical brief](#technical-brief)
- [API surface](#api-surface)
- [Run locally](#run-locally)
- [Environment variables](#environment-variables)
- [Testing](#testing)
- [Project structure](#project-structure)

---

## What this solves

A career fair is normally coordinated across spreadsheets, email threads, printed lists, and a lot of walking around on the day. This portal replaces that with one system covering the whole lifecycle:

| Phase | What happens | Who drives it |
|---|---|---|
| **Before** | Companies register, CASTO confirms them, students apply, companies shortlist | Companies + CASTO |
| **Setup** | Booths assigned, banners approved and printed, equipment allocated, passes issued, delegates badged | CASTO |
| **During** | Companies self check-in at their booth, door staff scan students in, the schedule runs | Everyone |
| **After** | Companies complete a survey, CASTO exports the post-event report | CASTO + Companies |

Three design commitments shape the whole app:

1. **Every action is attributable.** Operations changes record who made them and when, surfaced in a running Activity Log.
2. **Everyone sees their own slice.** A company sees only its applicants and its booth; door staff see only their own check-ins; CASTO sees everything.
3. **Nothing destructive is one click away.** Shortlist/reject/flag are undoable, team reassignment is two-step verified, and outbound email is off by default.

---

## User types at a glance

| | **CASTO Office** | **Company / Employer** | **Check-in Staff** | **Student** |
|---|---|---|---|---|
| **How they get in** | Email + password | Email + password | Short access code | No login |
| **Account type** | `main_manager` | `manager` | Code-gated, no account | Public page |
| **Scope** | Every company, every applicant | Their own company only | The check-in terminal only | Their own QR ticket |
| **Home** | `/` → operations | `/company-status` | `/student-checkin` | `/my-qr-code` |
| **Sees other companies?** | Yes | No | No | No |

### 1. CASTO Office — admin / event coordinator

One shared office account, optionally split across several named officers who each own specific modules.

- **Applicants** — every applicant across all companies; full profiles, CVs, QR tickets.
- **Companies** (Managers page) — all registered companies: profiles, representatives, status, reminders, cancel/delete.
- **Statistics** — live counters plus multi-tab analytics (demographics, education, companies, skills, recruitment, profiles).
- **Event Settings** — the operations console: booths + floor map, banners, special requirements, equipment, delegates, attendance & check-in, staff management, schedule, access passes.
- **Event Admin** — post-event report, team & roles, company import, activity log, View As.
- **View As** (`/view-as`) — read-only preview of what a company, a staffer, or a student sees, without touching your own session.
- **Dev panel** (`/dev`) — whether outbound email is on, and the log of send attempts.

**Module ownership.** CASTO officers each own a *focus* set of modules, marked with a colored dot on their tabs. The **Event Lead** sees every module and is the only role that can reassign others' responsibilities — gated behind a password + confirmation-code flow, with a notification describing exactly what moved.

### 2. Company Representative — employer

Each company logs into a self-service portal scoped entirely to itself.

- **Applicants** — the applicants who selected their company; shortlist / flag / reject with undo.
- **My Status** — Overview (profile, applicant count) and **Event Day** (booth QR, banners, parking slot with an "Open in Maps" link, entry passes, live schedule, self check-in, and a form to raise special requirements).
- **Company Settings** — edit profile, manage additional login emails, confirm attendance, set display preferences.

**Multiple people, one company.** A company can approve additional login emails that share the same password, so several colleagues use the dashboard without passing one login around.

### 3. Check-in Staff — code-gated, no account

Volunteers working the door. CASTO creates them in *Event Settings → Manage Staff* with just a name and email; the system issues a short code. They open `/student-checkin`, enter the code, fill in their own remaining details once, then scan students in. **Every check-in is logged under their name**, and each staffer sees only their own list.

Editing the staff roster never orphans existing check-in history — enforced by a database constraint plus upsert-by-code.

### 4. Students — public

Students never log in. They receive a QR ticket by email on registration, and can retrieve it at `/my-qr-code` with their University ID if they lose it.

---

## Demo accounts

The app ships with three seeded demo logins — one per role — so the whole permission model can be explored without a database. They exist **only** in demo mode (`DEMO_MODE=true`), against the in-memory store.

| Role | Login | What to explore |
|---|---|---|
| **CASTO office** (full permissions) | `casto.demo@jobfair.demo` | Everything: operations console, statistics, team & roles, View As |
| **Employer / manager** | `employer.demo@jobfair.demo` | Company-scoped view: their applicants, booth, banners, passes, survey |
| **Check-in staff** | access code at `/student-checkin` | The door terminal: scan or manually check students in |

### Getting the passwords

**No password is committed to this repository.** Each demo login reads its password from an environment variable. When one is not set, the server generates a random password for that boot and prints it to the console on startup:

```
[DEMO MODE] Server running on PORT 2000
[DEMO MODE] Demo accounts: CASTO office, employer, and check-in staff

  Demo accounts (generated for this run - set the env vars to pin them):
    CASTO office (demo)        k3Jx9pQmR2Tv   [DEMO_CASTO_PASSWORD]
    Employer / manager         wN7bY4hLsE1a   [DEMO_EMPLOYER_PASSWORD]
    Check-in staff (code)      A4F2C          [DEMO_CHECKIN_CODE]
```

To pin stable credentials — for a walkthrough, or a shared demo deployment — set them in `backend/.env`:

```bash
DEMO_CASTO_PASSWORD=your-choice
DEMO_EMPLOYER_PASSWORD=your-choice
DEMO_CHECKIN_CODE=DEMO1        # short, uppercased
```

Anything you pin is used as-is and **not** printed to the console.

> These credentials unlock nothing but the in-memory demo store. With `DEMO_MODE=false` the app authenticates against the real database and these accounts do not exist.

---

## End-to-end workflows

### Workflow 1 — Company registration → confirmation

```
Company signs up  →  status: Pending  →  CASTO reviews on the Managers page
       │                                          │
       │                                          ├─ sends a confirmation reminder (bulk or single)
       │                                          │
       └─ receives email  →  clicks /confirm-attendance/:token  →  status: Confirmed
```

At signup the app runs **similar-company-name detection** — if a close match already exists it offers to update that record instead of creating a duplicate. An existing company can also be **reinitialized**: a full re-signup that resets status to Pending and clears prior survey answers.

CASTO can also **bulk import companies from Excel** — upload a spreadsheet, preview parsed rows with validation, resolve duplicate conflicts (update vs. keep existing), and submit as one batch with per-row success/failure reporting. A downloadable template is provided.

### Workflow 2 — Student applies → company shortlists

```
Student submits the registration form  →  applicant record + QR ticket emailed
                    │
                    ├─→ appears in CASTO's Applicants list (all companies)
                    └─→ appears in the selected company's list only
                                │
                                └─ company flags / shortlists / rejects  →  undo available
                                          │
                                          └─ confirmation lands in the notification bell
```

**Flags are private to the company that set them.** Shortlist and rejection status are visible across the office, so CASTO can see recruitment outcomes without companies seeing each other's notes.

CASTO can also register or confirm an applicant on the spot with the **camera QR scanner** (desktop, plus a mobile floating button).

### Workflow 3 — Event setup (CASTO)

Each tab of the operations console is a stage, and every change is attributed and audited:

```
Venue & Booths     assign company → booth        (Available → Reserved → Assigned)
Banners            artwork upload → print        (Not Submitted → Submitted → Approved → Printed → Placed)
Requirements       company raises → CASTO fulfils (Open → In Progress → Resolved)
Equipment          request → allocate            (Requested → Approved → Delivered)
Delegates          roster → printable badges
Access Passes      issue entry / parking pass    (Pending → Issued → Collected)
Schedule           build the event-day timeline
```

The **interactive floor map** supports click-to-assign, and booth changes record who made them and when.

### Workflow 4 — Event day

```
COMPANY                          CASTO                        DOOR STAFF
   │                               │                              │
   ├─ arrives at booth             ├─ watches live attendance     ├─ enters access code
   ├─ scans booth QR               │                              ├─ scans student QR
   │  (or taps "I've arrived")     │                              │  (or types University ID)
   │                               │                              │
   └─ hourly reminder until        └─ Activity Log records        └─ own check-in list,
      checked in                      every change                   attributed by name
```

Duplicate check-ins return a clean **409** ("already checked in") rather than double-counting; unknown IDs return **404**.

### Workflow 5 — After the event

```
Company completes the survey  →  CASTO reads aggregated results  →  CSV export
      │                                    │
      └─ resubmitting REPLACES             ├─ response rates, per-question breakdowns
         each answer (never duplicates)    ├─ per-company detail
                                           └─ "awaiting response" list
```

Survey visibility is toggleable (public/hidden) by CASTO.

---

## The user experience

### Signing in

The login page routes each role to where it belongs: CASTO lands on the operations home, a company lands on its status page. Wrong credentials return a specific message (`Incorrect email` vs `Incorrect password`) rather than a generic failure.

### Finding things

- **Search with match highlighting** — every operations tab and the applicant list highlight the matched substring, so you can see *why* a row matched.
- **12+ applicant filters** — major, nationality, CGPA range, attendance, CV presence, shortlist/rejection status, languages, skills, expected graduation. Applicants are automatically deduped by student ID.
- **Pagination that does not hide data** — 50 per page by default, with a "Load all" mode when you need the full set.

### Getting help

Every page header carries a **"?"** that opens a short explainer — an icon, a one-line tagline, and links to related pages. It auto-opens once per page per session, then stays out of the way.

### Feedback and safety

- **Undo on destructive actions** — shortlist, reject, and flag can each be reversed, and every action is confirmed in the notification bell.
- **Toasts** for success/error/info/warning, app-wide.
- **Two-step verification** on team reassignment — password plus a confirmation code, because it changes who can edit what.
- **Email off by default** — with `EMAIL_ENABLED` unset, nothing is sent; every intended send is logged and inspectable at `/dev`.

### Accessibility and reach

- **Bilingual English / Arabic** with full RTL layout — the document direction flips with the language, not just the text.
- **Dark mode** across the app, via a semantic token palette.
- **Per-account display preferences** — font family and text size, applied dashboard-wide.
- **Mobile** — a dedicated mobile nav and a floating scan button, so event-day work happens on a phone.

### Small touches that matter on the day

- The operations top bar **collapses by default** and reveals on hover, without shifting page content.
- Booth QR codes are **downloadable per booth**, plus a copyable link to the staff check-in terminal.
- Delegate badges use a **real print layout** and the browser's print dialog.
- Parking passes carry slot, exact location, and an optional **Google Maps link** the company sees as "Open in Maps".

---

## Features in depth

### Authentication & accounts

- **Login / signup** with email + password. Signup captures company name, representatives, industry fields, sector, city, open positions, preferred majors, opportunity types, and ideal-candidate qualities. Passwords are strength-validated server-side and stored as bcrypt hashes; sessions are JWT-based.
- **Every protected route requires a valid `Authorization: Bearer` token.** Public routes (login, signup, company list, settings, student check-in, the confirm-attendance link) stay open by design.
- **Multiple login emails per company** — additional approved emails log in with the *same* shared password, mirroring the CASTO office's one-login-across-staff model.
- **Similar-company-name detection** at signup, and a **reinitialize** path for re-registering an existing company.

### Applicants (CASTO view)

- Paginated list (50/page) of every applicant across all companies, with name search + match highlighting and a bulk "Load all" mode.
- 12+ dropdown filters and automatic dedupe by student ID.
- **Applicant profile modal** — full details, downloadable CV, and the applicant's QR ticket.
- **Shortlist / reject / flag with undo**, each confirmed in the notification bell.
- **QR register & confirm attendance** — camera scanner on desktop and a mobile FAB.

### Companies (CASTO view — Managers page)

- Every registered company with status (Pending / Confirmed / Canceled), sector, city, applicant count.
- Filter by attendance status, sector, city, industry fields, whether they have applicants, and reminder-email status.
- **Bulk confirmation reminders** with a per-company last-reminded timestamp.
- Change status directly, or delete a company.
- Expandable company card with representative list, collapsible applicant list, and a compose-and-send email action.
- **Bulk import from Excel** with validation, duplicate-conflict resolution, and per-row reporting.

### Statistics (CASTO view)

Live top-line counters plus multi-tab advanced analytics — demographics, education, companies, skills, recruitment, profiles — rendered with MUI X-Charts across all applicants and companies.

### Event Settings — the operations console (CASTO view)

A tabbed console covering everything CASTO manages on event day. Each tab is searchable with match highlighting and spans **every** registered company.

| Tab | What it does |
|---|---|
| **Venue & Booths** | Assign companies to booths, track status, interactive floor map with click-to-assign. Changes attributed and audited. |
| **Banners & Branding** | Per-company signage orders (type, dimensions, quantity, print deadline, artwork upload, contact) with a five-step progress stepper. Artwork uploads go to Cloudinary. |
| **Special Requirements** | Accessibility / AV / custom-setup requests with priority levels and Open → In Progress → Fulfilled status. |
| **Equipment & Logistics** | Equipment requests per booth (tables, chairs, power, screens) with requested-vs-fulfilled quantities. |
| **Delegate List** | Event-day delegate roster per company with printable name badges. |
| **Attendance & Check-in** | Company check-in (QR or manual), student check-in, and per-booth downloadable QR codes. |
| **Manage Staff** | Code-gated door-staff accounts, each staffer's activity logged separately. |
| **Schedule** | Editable event-day session schedule (time, title, host, location, capacity, registrations). |
| **Access Passes** | Entry/parking passes per delegate, including parking slot and location. |

### Event Admin

- **Post-Event Report** — summary statistics plus CSV export of company and student data.
- **Team & Roles** — module ownership per officer, reassignment behind two-step verification.
- **Company Import** — the Excel bulk-import flow.
- **Activity Log** — a running, attributed audit trail across every module.
- **View As** — read-only preview of the company, staff, or student experience.

### Company self-service

- **Live status view** — attendance-confirmation state, applicant count, open positions, representatives, industry fields, opportunity types, preferred majors, ideal-candidate qualities.
- **Event Day panel** — a real-time mirror of what CASTO manages for that company: assigned booth + QR, banner status and print deadline, equipment fulfilment, special requirements (with visible internal notes), and access passes.
- **Self check-in** with an hourly reminder until done.
- **Account Settings** — edit login email, phone, city, sector, positions, industry fields, and candidate qualities without a full re-signup.
- **Manage Login Access** — add/remove additional approved login emails.
- **Customize** — per-account font family and text-size preference.

### Survey & Survey Results

Companies complete a post-event survey (multiple-choice, numeric, open-ended) from their status page. Resubmitting **replaces** each answer rather than duplicating it. CASTO views aggregated results: response rates, per-question breakdowns, sentiment at a glance, per-company detail, and an "awaiting response" list.

### Public / code-gated pages

| Route | Who | Purpose |
|---|---|---|
| `/confirm-attendance/:token` | Company | The link clicked from a reminder email to confirm participation |
| `/student-checkin` | Door staff | Code-gated terminal to scan or manually check students in |
| `/my-qr-code` | Student | Retrieve their QR ticket by University ID |

---

## Technical brief

### Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 17, Vite, Tailwind CSS 4, MUI + MUI X-Charts, React Router 6, Axios, i18next (EN/AR), html5-qrcode, xlsx |
| **Backend** | Node.js 22+, Express, Prisma ORM (MySQL / MariaDB), JWT, bcrypt, Cloudinary, Nodemailer |
| **Demo mode** | In-memory store — no database, Cloudinary, or email required |
| **Testing** | Jest + Supertest (backend), Vitest + React Testing Library (frontend) |
| **Hosting** | Vercel (frontend) · Render (backend) |

### Architecture

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  React (Vite)    │  HTTPS  │  Express API     │  Prisma │  MySQL /     │
│  Vercel          │ ──────► │  Render          │ ──────► │  MariaDB     │
│                  │  JWT    │                  │         │              │
└──────────────────┘         └────────┬─────────┘         └──────────────┘
                                      │
                             ┌────────┴────────┐
                             │  Cloudinary     │  banner artwork, CVs
                             │  Nodemailer     │  (off by default)
                             └─────────────────┘
```

**Two runtime modes, one codebase.** `DEMO_MODE=true` swaps the Prisma-backed controllers for in-memory equivalents in `backend/demo/` that mirror the same request/response contracts. Routes are conditionally mounted, so a capability that genuinely does not exist in demo mode (outbound email at `/dev/email-activity`) returns 404 rather than pretending to work.

### Data model

The backend was migrated from MongoDB/Mongoose to a relational MySQL schema via Prisma. Every event-ops entity — booths, banners, passes, requirements, delegates, attendance, schedule, team, audit, attendance staff, check-in log — has real tables and constraints rather than living inside one document blob.

Notable constraints that encode real rules:

- **Check-in history survives roster edits** — attendance staff are upserted by code, and check-in rows reference the staffer, so editing the roster never orphans history.
- **Survey answers are replaced, not appended** — resubmission updates in place, a bug caught and regression-tested during the migration.

### Security posture

| Concern | How it is handled |
|---|---|
| Password storage | bcrypt hashes, strength-validated at signup |
| Sessions | JWT bearer tokens; every protected route rejects missing/invalid tokens |
| Route authorization | CASTO-only routes gated in both the router and the frontend, on the same predicate |
| Credentials in the repo | None. Demo passwords come from env vars or are generated per boot |
| Outbound email | Disabled unless `EMAIL_ENABLED=true`; attempts logged and auditable |
| CORS | Explicit allowlist of origins (`ALLOWED_ORIGINS`) on top of localhost + Vercel defaults |
| Audit | Operations changes record actor and timestamp, surfaced in the Activity Log |

### Frontend conventions

- **Context per domain** — `UserAuthContext`, `EventOpsContext`, `NotificationsContext`, `ApplicantsContext`, `FiltersContext`, `SurveyContext`, `ThemeContext`.
- **Section-scoped writes** — `EventOpsContext` writes one section at a time (`booths`, `banners`, …) rather than the whole document, so concurrent edits to different tabs do not clobber each other.
- **Permission predicates are exported, not inlined** — `isEventLead()` and the CASTO check live in one place so nav links and route guards cannot drift apart.

---

## API surface

All routes are served by the Express backend. Public routes are open; everything else requires a valid JWT.

| Group | Representative endpoints |
|---|---|
| **Auth** (`/user`) | `POST /login`, `POST /signup`, `GET /check-company-name`, `PUT /reinitialize` |
| **Public** | `GET /companies`, `GET /companies/:id`, `GET /settings`, `POST /applicants`, `POST /email`, `GET /confirm-attendance/:token`, `GET /applicants/lookup/:uniId`, `GET /cv/:id` |
| **Attendance staff** (code-gated) | `POST /attendance-staff/verify`, `PATCH /attendance-staff/checkin`, `PATCH /attendance-staff/profile`, `GET /attendance-staff/my-checkins` |
| **Applicants** (protected) | `GET /applicants`, `GET /applicants/:id`, `PATCH /applicants/:id`, `.../flag`, `.../shortlist`, `.../reject` (+ un- variants), `.../confirm`, `.../survey`, `DELETE /applicants/:id` |
| **Companies** (protected) | `PATCH /companies/:id/status`, `DELETE /companies/:id`, `POST /companies/send-reminders`, `POST /companies/bulk-import`, `PATCH /companies/:id/profile`, `.../login-emails` (GET/POST/DELETE) |
| **Event ops** (protected) | `GET /event-ops`, `PUT /event-ops` (section-scoped writes), `POST /banners/:id/artwork` |
| **Team** (protected, CASTO-only) | `GET/POST /casto-team`, `PATCH/DELETE /casto-team/:id` |
| **Dev** (protected, real mode only) | `GET /dev/email-activity` |

### Routes

| Route | Access |
|---|---|
| `/` | Any logged-in user |
| `/managers`, `/statistics`, `/surveyResults`, `/event-settings`, `/event-admin`, `/view-as`, `/dev` | CASTO only |
| `/company-status`, `/company-settings` | Company only |
| `/survey` | Logged-in |
| `/login`, `/signup` | Logged-out |
| `/confirm-attendance/:token`, `/student-checkin`, `/my-qr-code` | Public |

---

## Run locally

**Demo mode** — no database or external services needed:

```bash
git clone https://github.com/amxr21/jobFair.git
cd jobFair

cd backend && npm install
cd ../frontend && npm install

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start backend (demo mode is on by default)
cd backend && node server.js

# Start frontend (separate terminal)
cd frontend && npm run dev
```

Frontend → `http://localhost:5173`
Backend → `http://localhost:2000`

The three [demo accounts](#demo-accounts) are seeded automatically, and the backend prints any generated passwords to the console on startup.

For the real database, set `DEMO_MODE=false` and a `DATABASE_URL`, then apply the schema/seeds in `backend/migrations/` (Prisma schema lives in `backend/prisma/`).

---

## Environment variables

**`backend/.env`** — copy from [`backend/.env.example`](backend/.env.example)

```
DEMO_MODE=true          # false → real MySQL + Cloudinary
PORT=2000
DATABASE_URL=           # mariadb://user:pass@host:3306/jobfair (real mode only)
ALLOWED_ORIGINS=        # comma-separated extra CORS origins
TOKEN_SIGN=             # JWT secret (real mode only)
CLOUDINARY_CLOUD_NAME=  # (real mode only)
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_ENABLED=false     # outbound email OFF unless explicitly true
EMAIL_USER=             # Gmail address (real mode only)
EMAIL_PASS=             # Gmail app password (real mode only)

# Demo accounts (DEMO_MODE=true only) — generated per boot when unset
DEMO_CASTO_PASSWORD=
DEMO_EMPLOYER_PASSWORD=
DEMO_TEST_COMPANY_PASSWORD=
DEMO_CHECKIN_CODE=
```

> **Email is off by default.** With `EMAIL_ENABLED` unset or `false`, nothing is sent — every attempt is logged instead and visible at `/dev`. Set it to `true` only when you intend real emails to go out.

**`frontend/.env`** — copy from [`frontend/.env.example`](frontend/.env.example)

```
VITE_DB_MODE=demo       # demo | local | production
VITE_API_URL=           # backend URL — REQUIRED for production builds
```

> `VITE_API_URL` is inlined by Vite at build time, so a production build must define it. It is not yet listed in `frontend/.env.example` — add it there when deploying.

---

## Testing

```bash
# Backend — Jest + Supertest
cd backend && npx jest

# Frontend — Vitest + React Testing Library
cd frontend && npm test
```

The backend suite has two halves: demo-mode tests (`tests/app.test.js`, `tests/attendanceStaff.test.js`) run anywhere with no setup, while the MySQL suite (`tests/mysql/`) needs a reachable `DATABASE_URL` and will fail on connection without one.

---

## Project structure

```
jobFair/
├── backend/
│   ├── config/          # Prisma client + Cloudinary setup
│   ├── controllers/     # Business logic (real mode)
│   ├── demo/            # In-memory controllers + seed data & demo accounts
│   ├── middlewares/     # JWT auth
│   ├── migrations/      # SQL schema + seed generators
│   ├── prisma/          # Prisma schema
│   ├── routers/         # Express routes
│   ├── tests/           # Jest (+ MySQL-backed suite)
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI (NavBar, Modal, NotificationBell, PageHelp, …)
│   │   ├── pages/       # Route-level pages (Applicants, Companies, EventOperations, …)
│   │   ├── context/     # Auth, EventOps, Notifications, Theme, …
│   │   ├── i18n/        # EN/AR locales + RTL direction handling
│   │   └── hooks/
│   └── .env.example
│
└── README.md
```

---

## Demo access

Interested in a live walkthrough of the platform?

📅 **[Book a demo call](https://calendly.com/ammar211080)** — happy to walk you through the features, answer questions, or discuss customisation for your event.

---

## License

MIT
