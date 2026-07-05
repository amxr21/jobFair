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
- **Event Settings (operations)** — booth assignments + floor map, banners & branding, special requirements, equipment & logistics (fully editable), delegate lists, attendance & check-in, event schedule (editable), and access passes. All coverage spans **every** registered company, not just a sample.
- **Event Admin** — post-event report, team & roles (reassign module owners behind two-step verification, with notifications describing exactly what changed), company import, activity log, and the **View As** preview.
- **View As** (`/view-as`) — preview exactly what a company, an attendance staffer, or the public student check-in sees — read-only, without touching the live session.
- **Developer panel** (`/dev`) — confirm whether outbound email is on/off and inspect the log of send attempts.
- **Notifications** — bell in the top bar surfacing applicant flag/shortlist/reject actions and team reassignments.

### 2. Company Representative
Each company logs in to a self-service portal.

- **Applicants** — the applicants who selected their company; shortlist / flag / reject with undo (each action confirmed in the notification bell).
- **My Status** — Overview (profile, applicant count) and **Event Day** (booth QR, banners & status, parking slot/location, entry passes, the live event schedule, self check-in, and a form to raise special requirements).
- **Self check-in** — on arrival, scan the booth QR or tap "I've arrived"; an hourly reminder nudges until checked in.
- **Company Settings** — edit profile, manage additional login emails, confirm attendance, and set display preferences (font/size).

### 3. Attendance Staff & Students (public, code-gated)
- **Attendance staff** (`/student-checkin`) — helpers log in with a short access code (no full account) to check students in at the door; each staffer sees only their own check-ins.
- **Students** (`/my-qr-code`) — retrieve their own QR ticket by University ID if they lost the confirmation email.

---

## Features

| Area | Details |
|---|---|
| **Applicant list** | Paginated, name search with match highlighting, 12+ dropdown filters, dedupe by student ID |
| **Applicant modal** | Full profile, QR ticket, CV download, shortlist / reject / flag with undo |
| **Company management** | Status tracking, representative list (readable, not pills), expandable card, collapsible applicants list, compose-and-send email via the default mail app |
| **Statistics** | Live counters + multi-tab advanced analytics |
| **Event operations** | Booths + floor map, banners, requirements, equipment (editable), delegates, passes, schedule — all covering every company, all with search + highlight |
| **Attendance & check-in** | Company self-scan is the primary flow; manual override for CASTO; per-booth QR codes; staff door check-in |
| **Notifications** | In-app bell (flag/shortlist/reject, reassignment, hourly check-in reminder) |
| **Per-page help** | A "?" in every page header (auto-opens once per page/session) with an icon, tagline, and links to related pages |
| **View As** | Full-page read-only preview of company / staff / student experiences |
| **Email safety** | Outbound email **off by default** (`EMAIL_ENABLED`); logs intended sends; developer `/dev` view to audit them |
| **Demo mode** | Runs fully in-memory — no database, Cloudinary, or email needed |

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
