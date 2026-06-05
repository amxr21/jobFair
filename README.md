# Job Fair Portal — Dashboard & Analytics

A full-stack web application built to digitize and streamline career fair management for university events. Handles applicant registration, company coordination, shortlisting workflows, real-time analytics, and attendance confirmation — entirely paperless.

🔗 **Live:** [job-fair-control.vercel.app](https://job-fair-control.vercel.app)

---

## Overview

The platform serves two user roles:

- **Admin (Event Coordinator)** — Full access to all applicants, companies, statistics, and event management tools
- **Company Representative** — Access to applicants who selected their company, shortlisting/flagging tools, and company status page

---

## Features

| Area | Details |
|---|---|
| **Applicant list** | Paginated, searchable (name highlight), 12+ dropdown filters, deduplication by student ID |
| **Applicant modal** | Full profile, QR code, CV download, shortlist / reject / flag with undo |
| **Company management** | Status tracking (Pending / Confirmed / Canceled), representative list, confirmation emails |
| **Statistics** | Live counters + 6-tab advanced analytics: Demographics, Education, Companies, Skills, Recruitment, Profiles |
| **UX** | Step-by-step tour guide, smooth animations, responsive design, smart 404 page |
| **Demo mode** | Runs fully in-memory — no MongoDB, Cloudinary, or email service needed |

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, MUI X-Charts, React Router, Axios |
| Backend | Node.js, Express, Mongoose, JWT, Cloudinary, Nodemailer |
| Demo data | In-memory store — no database required |
| Hosting | Vercel (frontend) · Render (backend) |

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

---

## Environment variables

**`backend/.env`** — copy from [`backend/.env.example`](backend/.env.example)

```
DEMO_MODE=true          # false → real MongoDB + Cloudinary
PORT=2000
URI=                    # MongoDB URI (production only)
TOKEN_SIGN=             # JWT secret (production only)
CLOUDINARY_CLOUD_NAME=  # (production only)
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=             # Gmail address (production only)
EMAIL_PASS=             # Gmail app password (production only)
```

**`frontend/.env`** — copy from [`frontend/.env.example`](frontend/.env.example)

```
VITE_DB_MODE=demo       # demo | local | production
```

---

## Project structure

```
jobFair/
├── backend/
│   ├── config/          # Cloudinary setup
│   ├── controllers/     # Business logic
│   ├── demo/            # In-memory controllers + seed data
│   ├── middlewares/     # JWT auth
│   ├── models/          # Mongoose schemas
│   ├── routers/         # Express routes
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI
│   │   ├── pages/       # Route-level pages
│   │   ├── Context/     # Auth + state
│   │   └── Hooks/
│   └── .env.example
│
└── README.md
```

---

## Demo access

Interested in a live walkthrough? Feel free to reach out.

---

## License

MIT
