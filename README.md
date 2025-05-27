# Job Fair Web Application

An interactive, real-time web application designed to streamline and digitize the internship and job application process at the University of Sharjah's **CASTO Office**. This system facilitates a **paperless**, **efficient**, and **automated** experience for students, graduates, and participating companies during career and internship fairs.

**Live Preview:** [job-fair-lilac.vercel.app](https://job-fair-lilac.vercel.app)  
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
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

The Job Fair Web Application is tailored for the CASTO office to reduce the administrative burden of managing student applications during job fairs. The platform includes two main user roles:

- **Applicants (Students/Graduates)**: Register and apply using a ticket-based QR system.
- **Managers (Company Representatives)**: Scan applicant tickets, review applications, and view live statistics through a dashboard.

This system enables quick interactions at booths, instant access to applications, and powerful data tracking during the entire event lifecycle.

---

## Features

### Applicant Side
- Register and submit job/internship applications.
- Automatically generate and download a personal ticket with a **unique QR code**.
- Receive confirmation email with ticket and details.
- Real-time confirmation of ticket usage.

### Manager Side
- Secure login with credential validation.
- Scan applicant QR codes to access their full application instantly.
- Live dashboard with statistics, top applicant data, and company-specific insights.
- Receive real-time updates as applicants scan their tickets.

### Admin (CASTO Office)
- Monitor global statistics for all applicants and companies.
- Supervise system activity during the fair.

---

## Tech Stack

### Frontend
- **React.js**
- **Tailwind CSS**
- **Socket.io Client**
- **React Router DOM**
- **Axios**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** (via Mongoose)
- **Socket.io Server**
- **Nodemailer** (for transactional emails)
- **QR Code Generator**

### Hosting
- **Frontend**: Vercel
- **Backend**: Render / Railway (optional)

---

## System Architecture

```
Client (React)
   |
   |---> REST API (Express)
   |
   |---> WebSocket (Socket.io)
   |
   |---> MongoDB (Applications, Managers, Tickets)
   |
   |---> Nodemailer (Emails with Ticket QR)
```

---

## Installation

### Prerequisites

- Node.js v16+
- MongoDB (local or cloud instance)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/amxr21/jobFair.git
   cd jobFair
   ```

2. **Install dependencies for both client and server**
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   npm install
   ```

3. **Configure environment variables**

Create a `.env` file in the `server/` directory with the following:

```env
PORT=5000
MONGO_URI=your_mongo_connection_string
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
BASE_CLIENT_URL=http://localhost:3000
```

4. **Run the development servers**

In two separate terminals:

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

The app should be running on:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## Usage

1. **Applicants** visit the homepage, fill in their application, and receive a ticket with a QR code.
2. **Managers** log in to a secure dashboard and scan applicant tickets using a QR scanner.
3. The system fetches applicant data in real-time and logs their visit.
4. Both the CASTO office and companies can view insights and applicant stats live.

---

## Project Structure

```
jobFair/
│
├── client/               # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── App.jsx
│   └── tailwind.config.js
│
├── server/               # Backend (Node/Express)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── index.js
│
├── README.md
└── package.json
```

---

## Screenshots

> Add relevant screenshots below (e.g., homepage, QR ticket, manager dashboard, etc.)  
> Screenshots should be placed inside `/assets/screenshots/` if you include them in the repo.

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
```
