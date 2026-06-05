# Job Fair Portal — Dashboard & Analytics

A web application for managing internship and career fair events. Built for event administrators and company representatives to handle applicant registration, shortlisting, analytics, and company coordination — entirely paperless.

**Live demo:** [job-fair-control.vercel.app](https://job-fair-control.vercel.app)

---

## Quick start (demo mode — no database needed)

```bash
git clone https://github.com/amxr21/jobFair.git
cd jobFair

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure backend (demo mode is on by default)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start both servers
cd backend && npm run dev        # → http://localhost:2000
cd frontend && npm run dev       # → http://localhost:5173
```

**Demo mode** (`DEMO_MODE=true` in `backend/.env`) runs entirely in-memory — no MongoDB, no Cloudinary, no email service required. Sample data is pre-loaded automatically.

Demo login credentials are printed in the terminal when the backend starts in demo mode.

---

## Features

**Applicant management**
- Paginated list with name search and 12+ filters (major, nationality, GPA, city, status…)
- Expandable applicant detail modal — full profile, QR code, CV download
- Shortlist / reject / flag applicants with undo support
- Deduplication — only the latest submission per student is shown

**Company management**
- Company list with status tracking (Pending / Confirmed / Canceled)
- Expandable company modals — representatives, fields, preferred majors
- Send confirmation reminder emails to pending companies (production mode)

**Statistics & analytics**
- Overview: live counters for students, companies, fields, representatives
- Advanced analytics (6 tabs): Demographics, Education, Companies, Skills, Recruitment, Profiles
- Interactive pie and bar charts

**UX**
- Step-by-step tour guide on first visit
- In-place search highlight (Ctrl+F style)
- Smooth modal open/close animations
- Responsive — works on desktop, tablet, and mobile
- 404 page with smart redirect suggestions

---

## Two modes

| | Demo mode | Production mode |
|---|---|---|
| `DEMO_MODE` | `true` | `false` |
| Database | In-memory (no setup) | MongoDB (Atlas or local) |
| File storage | Disabled | Cloudinary |
| Emails | Disabled | Nodemailer / Gmail |
| Purpose | Local dev, demos | Real deployment |

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, MUI X-Charts, React Router, Axios |
| Backend | Node.js, Express, Mongoose, JWT, Cloudinary, Nodemailer |
| Database | MongoDB Atlas (production) / in-memory (demo) |
| Hosting | Vercel (frontend), Railway (backend) |

---

## Project structure

```
jobFair/
├── backend/
│   ├── config/          # Cloudinary setup
│   ├── controllers/     # Business logic (applicants, users)
│   ├── demo/            # In-memory controllers + seed data (demo mode)
│   ├── middlewares/     # JWT auth guard
│   ├── models/          # Mongoose schemas
│   ├── routers/         # Express route definitions
│   ├── server.js
│   └── .env.example     # Environment variable template
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level pages
│   │   ├── Context/     # React context providers
│   │   ├── Hooks/       # Custom hooks
│   │   └── App.jsx
│   └── .env.example
│
├── .gitignore
├── README.md
├── package.json         # Root convenience scripts
└── vercel.json
```

---

## Environment variables

Copy the example files and fill in your values for production. Demo mode requires no changes.

**`backend/.env`** — see [`backend/.env.example`](backend/.env.example)

```
DEMO_MODE=true          # set to false for production
PORT=2000
URI=                    # MongoDB connection string (production only)
TOKEN_SIGN=             # JWT secret (production only)
CLOUDINARY_CLOUD_NAME=  # Cloudinary (production only)
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=             # Gmail address (production only)
EMAIL_PASS=             # Gmail app password (production only)
```

**`frontend/.env`** — see [`frontend/.env.example`](frontend/.env.example)

```
VITE_DB_MODE=demo       # demo | local | production
```

---

## Root scripts

```bash
npm run install-server   # install backend deps
npm run install-client   # install frontend deps
npm run start-server     # start backend (node)
npm run start-client     # start frontend (vite dev)
npm run build-client     # build frontend for production
```

---

## License

MIT
