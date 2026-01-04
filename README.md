# Job Fair Dashboard – Management & Analytics Platform

An interactive, real-time web application designed to streamline and digitize the internship and job application process at the University of Sharjah's **CASTO Office**. This dashboard facilitates a **paperless**, **efficient**, and **automated** experience for managers and administrators during career and internship fairs.

**Live Preview:** [Job Fair Dashboard](https://job-fair-control.vercel.app)
**Repository:** [GitHub - amxr21/jobFair](https://github.com/amxr21/jobFair)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Recent Updates](#recent-updates)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

The Job Fair Dashboard is tailored for the CASTO office to reduce the administrative burden of managing student applications during job fairs. The platform includes multiple user roles:

- **Admin (CASTO Office)**: Full access to all applicants, companies, statistics, and management features
- **Managers (Company Representatives)**: Scan applicant tickets, review applications, shortlist/reject candidates, and view company-specific insights

This system enables quick interactions at booths, instant access to applications, and powerful data tracking during the entire event lifecycle.

Works seamlessly with the [JobFairForm](https://github.com/amxr21/jobFairForm) applicant submission portal.

---

## Features

### Applicant Management
- View all applicants with pagination and search
- Filter by major, nationality, study level, city, GPA range, status, and more
- **Deduplication**: Automatically shows only the latest submission per student (by University ID)
- Expandable applicant cards with full details modal
- Delete incorrect applicant entries (admin only)
- Flag, shortlist, and reject applicants
- Download applicant CVs (stored on Cloudinary)

### Company/Manager Management
- View all registered companies
- Expandable company rows with detailed modal
- Display preferred majors, opportunity types, and preferred qualities
- Track company representatives

### Statistics & Analytics
- **Overview Tab**: Quick stats (students, companies, CEOs, tech fields)
- **Advanced Analytics** with 6 tabs:
  - **Demographics**: Gender distribution, nationality breakdown, city distribution
  - **Education**: Study level, GPA distribution, college, top majors
  - **Companies**: Sector distribution, opportunity types, preferred majors
  - **Skills**: Technical and non-technical skills distribution
  - **Recruitment**: Shortlist rates, flagged applicants, company popularity
  - **Profiles**: CV upload rates, LinkedIn profiles, experience rates
- Interactive charts (Pie, Bar) using MUI X-Charts
- Unique student count (excludes duplicate submissions)

### Authentication & Security
- JWT-based authentication
- Role-based access control (Admin vs Manager)
- Secure API endpoints

### UI/UX Features
- Modern, responsive design with Tailwind CSS
- Smooth animations and transitions
- Dark/light mode ready styling
- Mobile-optimized interface

---

## Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS**
- **MUI X-Charts** (PieChart, BarChart)
- **React Router DOM**
- **Axios**
- **Context API** for state management

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** (via Mongoose)
- **Cloudinary** (file storage)
- **Nodemailer** (transactional emails)
- **JWT** (authentication)

### Hosting
- **Frontend**: Vercel
- **Backend**: Railway

---

## System Architecture

```
Frontend (React + Vite)
   |
   |---> REST API (Express.js)
   |        |
   |        |---> MongoDB
   |        |      ├── Applicants collection
   |        |      ├── Companies/Managers collection
   |        |      └── Users collection
   |        |
   |        |---> Cloudinary (CV storage)
   |        |
   |        |---> Nodemailer (emails)
   |
   |<--- JobFairForm (applicant submissions)
```

---

## Installation

### Prerequisites

- Node.js v16+
- MongoDB (local or cloud instance)
- Cloudinary account

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/amxr21/jobFair.git
   cd jobFair
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the `backend/` directory:

   ```env
   PORT=2000
   URI=your_mongo_connection_string
   TOKEN_SIGN=your_jwt_secret

   # Email Configuration
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run the development servers**

   In two separate terminals:

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

   The app should be running on:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:2000`

---

## Usage

### Admin (CASTO Office)
1. Log in with admin credentials (casto@sharjah.ac.ae)
2. Access all applicants, companies, and full statistics
3. Use filters to find specific applicants
4. View advanced analytics for insights
5. Delete incorrect applicant entries if needed

### Managers (Company Representatives)
1. Log in with company credentials
2. View applicants who applied to your company
3. Scan QR codes to access applicant details
4. Shortlist or reject candidates
5. Flag interesting profiles for later review

---

## Project Structure

```
jobFair/
├── backend/                        # Backend source code
│   ├── config/
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── applicantsControllers.js  # Pagination, search, delete, unique count
│   │   └── userController.js
│   ├── middlewares/
│   │   └── requireAuth.js
│   ├── models/
│   │   ├── applicantFormModel.js
│   │   └── userModel.js              # With preferredMajors, opportunityTypes
│   ├── routers/
│   │   └── applicantRouter.js
│   └── server.js
│
├── frontend/                       # Frontend source code
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdvancedAnalytics.jsx  # 6-tab analytics dashboard
│   │   │   ├── MainBanner.jsx         # Applicants list with filters
│   │   │   ├── Row.jsx                # Expandable row with modal
│   │   │   ├── FilterDropdown.jsx     # Multi-filter component
│   │   │   ├── StatisticsElement.jsx  # Stat cards with deduplication
│   │   │   ├── PageContainer.jsx      # Reusable page layout
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Statistics.jsx         # Overview + Advanced toggle
│   │   │   ├── Managers.jsx           # Companies list
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   ├── Context/
│   │   ├── Hooks/
│   │   └── App.jsx
│   └── style.css
│
├── README.md
└── package.json
```

---

## Recent Updates

### v2.0 (January 2025)

#### Backend
- **Pagination API**: Added page/limit params for efficient data loading
- **Search Functionality**: Search by name, University ID, email
- **Unique Student Count**: MongoDB aggregation for accurate deduplication
- **Delete Endpoint**: Remove incorrect applicant entries
- **Cloudinary Integration**: CV file storage
- **Extended User Model**: preferredMajors, opportunityTypes, preferredQualities fields

#### Frontend
- **Advanced Analytics Dashboard**: 6 interactive tabs with charts
  - Demographics, Education, Companies, Skills, Recruitment, Profiles
- **Filter Dropdown**: Multi-select filtering with 12+ filter categories
- **Deduplication**: Shows only latest submission per student
- **Delete Functionality**: Admin can remove incorrect entries
- **Managers Page**: Expandable rows with company modals
- **UI Improvements**: PageContainer, AuthText, improved styling
- **Consistent Counts**: All pages use deduplicated unique student count

---

## Screenshots

> Screenshots can be added to `/assets/screenshots/`

### Statistics Overview
![Statistics Overview](assets/screenshots/statistics-overview.png)

### Advanced Analytics
![Advanced Analytics](assets/screenshots/advanced-analytics.png)

### Applicants List with Filters
![Applicants List](assets/screenshots/applicants-list.png)

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your message"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contact

**Ammar Obad**
Full-stack Developer | Computer Engineer
Website: [ammarobad.info](https://www.ammarobad.info)
GitHub: [@amxr21](https://github.com/amxr21)
Email: ammar211080@gmail.com
