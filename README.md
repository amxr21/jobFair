# Job Fair Portal — Dashboard & Event Operations

A full-stack web application that digitizes and runs a university career fair end to end — applicant registration, company coordination, shortlisting workflows, live analytics, event-day operations (booths, banners, passes, attendance), and a paperless check-in flow.

🔗 **Live:** [job-fair-control.vercel.app](https://job-fair-control.vercel.app)

---

## Objectives

- Replace paper and spreadsheets with one portal for the whole event lifecycle: **before** (registration, company setup, shortlisting), **during** (booths, check-in, schedule), and **after** (survey, post-event report).
- Give the organizing office (CASTO) full operational control while giving each company a self-service view of everything that concerns them.
- Keep every action attributable, reversible where sensible, and visible to the people who need it (in-app notifications + activity log).

---

## Roles & abilities

The platform serves three kinds of users:

### 1. CASTO Office (admin / event coordinator)
One shared office account, optionally split across several named officers (each owning specific modules).

- **Applicants** — see every applicant across all companies; open full profiles, CVs, and QR tickets.
- **Companies** — manage all registered companies: profiles, representatives, status (Pending / Confirmed / Canceled), reminders, cancel/delete.
- **Statistics** — live counters plus multi-tab advanced analytics (demographics, education, companies, skills, recruitment, profiles).
- **Event Settings (operations)** — booth assignments + floor map, banners & branding, special requirements, equipment & logistics (fully editable), delegate lists, attendance & check-in, staff management (support staff + task lists, and code-gated check-in volunteers), event schedule (editable), and access passes (with parking slot/location + optional Google Maps link). All coverage spans **every** registered company, not just a sample.
- **Event Admin** — post-event report, team & roles (reassign module owners behind two-step verification, with notifications describing exactly what changed), company import, activity log, and the **View As** preview.
- **View As** (`/view-as`) — preview exactly what a company, an attendance staffer, or the public student check-in sees — read-only, without touching the live session.
- **Developer panel** (`/dev`) — confirm whether outbound email is on/off and inspect the log of send attempts.
- **Notifications** — bell in the top bar surfacing applicant flag/shortlist/reject actions and team reassignments.

### 2. Company Representative
Each company logs in to a self-service portal.

- **Applicants** — the applicants who selected their company; shortlist / flag / reject with undo (each action confirmed in the notification bell).
- **My Status** — Overview (profile, applicant count) and **Event Day** (booth QR, banners & status, parking slot/location with an "Open in Maps" link, entry passes, the live event schedule, self check-in, and a form to raise special requirements).
- **Self check-in** — on arrival, scan the booth QR or tap "I've arrived"; an hourly reminder nudges until checked in.
- **Company Settings** — edit profile, manage additional login emails, confirm attendance, and set display preferences (font/size).

### 3. Attendance Staff & Students (public, code-gated)
- **Attendance staff** (`/student-checkin`) — helpers log in with a short access code (no full account) to check students in at the door; each staffer sees only their own check-ins.
- **Students** (`/my-qr-code`) — retrieve their own QR ticket by University ID if they lost the confirmation email.

---

## Features in depth

The platform covers the full event lifecycle. Every feature below is implemented and exercised by the automated test suites.

### Authentication & accounts

- **Login / signup** with email + password. Signup captures company name, representatives, industry fields, sector, city, number of open positions, preferred majors, opportunity types, and ideal-candidate qualities. Passwords are validated for strength server-side and stored as bcrypt hashes; sessions are JWT-based.
- **Missing/invalid tokens are rejected** — every protected route requires a valid `Authorization: Bearer` token (public routes such as login, signup, company list, settings, student check-in, and the confirm-attendance link stay open by design).
- **Multiple login emails per company** — a company can approve additional emails that log in with the *same* shared password, so several people at one company can use the dashboard without sharing a single login (managed from Company Settings). Mirrors the CASTO office's one-shared-login-across-staff model.
- **Similar-company-name detection** at signup flags likely duplicates and offers to update the existing record instead of creating a second one.
- **Reinitialize company** — a full re-signup path for an existing company that resets status to Pending and clears prior survey answers.

### Applicants (CASTO view)

- Paginated list (50/page) of **every** applicant across all companies, with a **name search that highlights the match**, and a bulk "Load all" mode.
- **12+ dropdown filters**: major, nationality, CGPA range, attendance, CV presence, shortlist/rejection status, languages, skills, expected graduation, and more. Automatic **dedupe by student ID**.
- **Applicant profile modal**: full details, downloadable **CV**, and the applicant's **QR ticket**.
- **Shortlist / reject / flag with undo** — flags are private per company; shortlist/reject status is visible across the office. Each action is confirmed in the notification bell.
- **QR register & confirm attendance** — camera-based scanner (desktop and a mobile FAB) to register an applicant to a company or mark them attended on the spot.

### Companies (CASTO view — Managers page)

- List of every registered company with **status** (Pending / Confirmed / Canceled), sector, city, and applicant count.
- Filter by attendance status, sector, city, industry fields, whether they have applicants, and reminder-email status.
- **Bulk confirmation reminders** — multi-select companies and send reminder emails; the last-reminded timestamp is tracked per company.
- **Change status** directly, or **delete** a company.
- Expandable company card with a readable representative list, collapsible applicant list, and a compose-and-send email action via the default mail app.
- **Bulk import from Excel** (in Event Settings) — upload a spreadsheet, preview parsed rows with validation, resolve duplicate conflicts (update vs. keep existing), and submit as one batch with per-row success/failure reporting; a downloadable template is provided.

### Statistics (CASTO view)

- Live top-line counters plus **multi-tab advanced analytics** (demographics, education, companies, skills, recruitment, profiles) rendered with MUI X-Charts. Covers all applicants and companies, not a sample.

### Event Settings — the operations console (CASTO view)

A tabbed console covering everything CASTO manages on event day. Each tab is searchable with match highlighting and spans **every** registered company.

- **Venue & Booths** — assign companies to booths, track status (Available / Reserved / Assigned), and an **interactive floor map** (modal) with click-to-assign. Booth changes are attributed (who/when) and audited.
- **Banners & Branding** — per-company signage orders (type, dimensions, quantity, print deadline, artwork upload, contact) with a progress stepper: Not Submitted → Submitted → Approved → Printed → Placed. Artwork uploads go to Cloudinary.
- **Special Requirements** — accessibility / AV / custom-setup requests per company with priority levels and Open → In Progress → Fulfilled status.
- **Equipment & Logistics** — equipment requests per booth (tables, chairs, power, screens) with requested-vs-fulfilled quantities.
- **Delegate List** — event-day delegate roster per company (name, role, contact) with **printable name badges** (real print layout + browser print dialog).
- **Attendance & Check-in** — company check-in (QR or manual), student check-in, and a **Booth QR Codes** view with per-booth downloadable codes plus a copyable link to the staff check-in terminal.
- **Manage Staff** — create **code-gated door-staff accounts** (no full login) for volunteers who check students in; each staffer's check-in activity is logged and attributed separately. Editing the roster never orphans existing check-in history (enforced by a DB constraint + upsert-by-code).
- **Schedule** — editable event-day session schedule (time, title, host, location, capacity, registrations).
- **Access Passes** — issue and track entry/parking passes per delegate, including parking slot and location.
- **Post-Event Report** — summary statistics plus **CSV export** of company and student data.
- **Team & Roles** — CASTO officers each own a "focus" set of modules (marked with a colored dot on their tabs); reassigning responsibilities is gated behind a password + confirmation-code flow, and each change fires a notification describing exactly what moved.
- **Activity Log** — a running, attributed audit trail of who changed what and when across every module.

### Company self-service (Company Status & Settings)

- **Live status view** — attendance-confirmation state, applicant count, open positions, representatives, industry fields, opportunity types, preferred majors, and ideal-candidate qualities.
- **Event Day panel** — a real-time mirror of what CASTO manages for that company: assigned **booth + QR code**, banner/branding status and print deadline, equipment fulfillment, special requirements (with visible internal notes), and access passes (parking slot/location included).
- **Self check-in** — on arrival, scan the booth QR or tap "I've arrived"; an hourly reminder nudges until checked in.
- **Account Settings** — edit login email (becomes the new login going forward), phone, city, sector, positions, industry fields, and candidate qualities without a full re-signup.
- **Manage Login Access** — add/remove additional approved login emails.
- **Customize** — per-account font family and text-size preference applied across the dashboard.

### Survey & Survey Results

- Companies complete a **post-event survey** (multiple-choice, numeric, and open-ended) from their status page. Resubmitting **replaces** each answer rather than duplicating it (a real bug fixed in the MySQL migration, now regression-tested).
- CASTO views aggregated results — response rates, per-question breakdowns, sentiment-at-a-glance, per-company detail, and an "awaiting response" list. Survey visibility (public/hidden) is toggleable.

### Public / code-gated pages

- **Confirm Attendance** (`/confirm-attendance/:token`) — the link a company clicks from its reminder email to confirm participation.
- **Student Check-in** (`/student-checkin`) — the code-gated terminal door staff use to scan or manually check students in; no CASTO or company account required. Handles duplicate check-ins (409) and unknown IDs (404) cleanly.
- **My QR Code** (`/my-qr-code`) — a student retrieves their own QR ticket by University ID if they lost the confirmation email.

### Cross-cutting

| Area | Details |
|---|---|
| **Parking passes** | Per-delegate slot + exact location, plus an optional **Google Maps link** — the company sees an "Open in Maps" action and a map preview on their Event Day page. |
| **Staff management** | Two rosters: **Support Staff** (services/printing/logistics helpers with an assignable task list, Pending → In Progress → Done) and **Check-in Staff** (code-gated door volunteers, activity logged per person). |
| **Notifications** | In-app bell for flag/shortlist/reject actions, team reassignments, and the hourly check-in reminder; plus app-wide toasts (success/error/info/warning). |
| **View As** | Full-page **read-only** preview of the company, attendance-staff, or student experience — without touching your live session. |
| **Per-page help** | A "?" in every page header (auto-opens once per page/session) with an icon, tagline, and links to related pages. |
| **Attribution & audit** | Every operations change records who made it and when, surfaced in the Activity Log. |
| **Email safety** | Outbound email **off by default** (`EMAIL_ENABLED`); intended sends are logged and auditable at `/dev`. |
| **Demo mode** | Runs fully in-memory — no database, Cloudinary, or email needed. |
| **Collapsible top bar** | On the operations page the clock/avatar bar hides by default and reveals on hover, without shifting page content. |

---

## API surface

All routes are served by the Express backend. Public routes are open; everything else requires a valid JWT.

| Group | Representative endpoints |
|---|---|
| **Auth** (`/user`) | `POST /login`, `POST /signup`, `GET /check-company-name`, `PUT /reinitialize` |
| **Public** | `GET /companies`, `GET /companies/:id`, `GET /settings`, `POST /applicants` (registration), `POST /email`, `GET /confirm-attendance/:token`, `GET /applicants/lookup/:uniId`, `GET /cv/:id` |
| **Attendance staff** (code-gated) | `POST /attendance-staff/verify`, `PATCH /attendance-staff/checkin`, `PATCH /attendance-staff/profile`, `GET /attendance-staff/my-checkins` |
| **Applicants** (protected) | `GET /applicants`, `GET /applicants/:id`, `PATCH /applicants/:id`, `.../flag`, `.../shortlist`, `.../reject` (+ un- variants), `.../confirm`, `.../survey`, `DELETE /applicants/:id` |
| **Companies** (protected) | `PATCH /companies/:id/status`, `DELETE /companies/:id`, `POST /companies/send-reminders`, `POST /companies/bulk-import`, `PATCH /companies/:id/profile`, `.../login-emails` (GET/POST/DELETE) |
| **Event ops** (protected) | `GET /event-ops`, `PUT /event-ops` (section-scoped writes: booths, banners, requirements, equipment, delegates, attendance, schedule, passes, staff, support-staff, audit), `POST /banners/:id/artwork` |
| **Team** (protected, CASTO-only) | `GET/POST /casto-team`, `PATCH/DELETE /casto-team/:id` |
| **Dev** (protected) | `GET /dev/email-activity` |

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, MUI X-Charts, React Router, Axios |
| Backend | Node.js, Express, **Prisma (MySQL / MariaDB)**, JWT, Cloudinary, Nodemailer |
| Demo data | In-memory store — no database required |
| Hosting | Vercel (frontend) · Render (backend) |

> The backend was migrated from MongoDB/Mongoose to a relational MySQL schema via Prisma; every event-ops entity (booths, banners, passes, requirements, delegates, attendance, schedule, team, audit) now has real tables and constraints.

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

Sample accounts are seeded automatically when the server starts in demo mode.

For the real database, set `DEMO_MODE=false` and a `DATABASE_URL`, then apply the schema / seeds in `backend/migrations/` (Prisma schema lives in `backend/prisma/`).

---

## Environment variables

**`backend/.env`** — copy from [`backend/.env.example`](backend/.env.example)

```
DEMO_MODE=true          # false → real MySQL + Cloudinary
PORT=2000
DATABASE_URL=           # mariadb://user:pass@host:3306/jobfair (real mode only)
TOKEN_SIGN=             # JWT secret (real mode only)
CLOUDINARY_CLOUD_NAME=  # (real mode only)
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_ENABLED=false     # outbound email OFF unless explicitly true
EMAIL_USER=             # Gmail address (real mode only)
EMAIL_PASS=             # Gmail app password (real mode only)
```

> **Email is off by default.** With `EMAIL_ENABLED` unset or `false`, nothing is sent — every attempt is logged instead and visible at `/dev`. Set it to `true` only when you intend real emails to go out.

**`frontend/.env`** — copy from [`frontend/.env.example`](frontend/.env.example)

```
VITE_DB_MODE=demo       # demo | local | production
VITE_API_URL=           # optional override for the backend URL
```

---

## Project structure

```
jobFair/
├── backend/
│   ├── config/          # Prisma client + Cloudinary setup
│   ├── controllers/     # Business logic
│   ├── demo/            # In-memory controllers + seed data
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
│   │   ├── pages/       # Route-level pages (Applicants, Companies, EventOperations, EventAdmin, ViewAs, …)
│   │   ├── context/     # Auth, EventOps, Notifications
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
