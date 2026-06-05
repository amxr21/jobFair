# Job Fair Portal — Dashboard & Analytics

A web application that digitizes career fair management for event coordinators and company representatives. Handles applicant registration, shortlisting, company coordination, and live analytics — entirely paperless.

🔗 **Live demo:** [job-fair-control.vercel.app](https://job-fair-control.vercel.app)

---

## Try the demo

The live site runs against in-memory sample data — no account creation or database setup needed.

> **Want a guided walkthrough with demo access?**
> Reach out and I'm happy to set one up — [ammarobad21@gmail.com](mailto:ammarobad21@gmail.com)

---

## What you can do in the demo

**As Admin:**
- Browse the full applicants list with search, filters, and sort
- Open any applicant's detail modal — profile, QR code, CV link
- Shortlist, reject, or flag applicants (with undo)
- View the Statistics dashboard — overview counters and 6-tab advanced analytics
- Manage the companies list — confirm, cancel, or delete entries
- Send confirmation reminder emails *(disabled in demo — no real email sent)*

**As a Company Manager:**
- See applicants who applied to your company
- Shortlist, reject, or flag candidates
- View your company status page
- Browse other companies' applicants and add them to your list

---

## Run locally (no database needed)

Demo mode runs entirely in-memory. No MongoDB, no Cloudinary, no email setup.

```bash
# 1. Clone
git clone https://github.com/amxr21/jobFair.git
cd jobFair

# 2. Install
cd backend && npm install
cd ../frontend && npm install

# 3. Configure (copy examples — defaults already work for demo)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Start
cd backend && node server.js      # API → http://localhost:2000
cd ../frontend && npm run dev     # UI  → http://localhost:5173
```

Sample accounts are pre-loaded automatically when the server starts in demo mode.

---

## Features

| Area | Highlights |
|---|---|
| **Applicants** | Paginated list, name search with yellow highlight, 12+ dropdown filters, deduplication by student ID |
| **Detail modal** | QR code, full profile, skills tags, CV download, shortlist/reject/flag with undo |
| **Other tab** | Company reps can view all applicants and add them to their list |
| **Companies** | Status tracking (Pending / Confirmed / Canceled), representative list, reminder emails |
| **Statistics** | Live counters + 6-tab advanced analytics (Demographics, Education, Companies, Skills, Recruitment, Profiles) |
| **UX** | Step-by-step tour guide, smooth animations, responsive layout, smart 404 page |

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, MUI X-Charts, React Router, Axios |
| Backend | Node.js, Express, Mongoose, JWT, Cloudinary, Nodemailer |
| Demo data | In-memory store (no database required) |
| Hosting | Vercel (frontend) · Render (backend) |

---

## Project structure

```
jobFair/
├── backend/
│   ├── config/          # Cloudinary setup
│   ├── controllers/     # Business logic (applicants, users)
│   ├── demo/            # In-memory controllers + seed data
│   ├── middlewares/     # JWT auth guard
│   ├── models/          # Mongoose schemas
│   ├── routers/         # Express routes
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/  # Shared UI components
│   │   ├── pages/       # Route-level pages
│   │   ├── Context/     # Auth + state context
│   │   ├── Hooks/       # Custom hooks
│   │   └── App.jsx
│   └── .env.example
│
└── README.md
```

---

## Environment variables

Demo mode works with the `.env.example` defaults — no changes needed.

**`backend/.env`**
```
DEMO_MODE=true          # false → connects to MongoDB
PORT=2000
URI=                    # MongoDB URI (production only)
TOKEN_SIGN=             # JWT secret (production only)
CLOUDINARY_CLOUD_NAME=  # (production only)
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=             # Gmail (production only)
EMAIL_PASS=
```

**`frontend/.env`**
```
VITE_DB_MODE=demo       # demo | local | production
```

---

## License

MIT
