Job Fair Portal
A web application for managing company registrations and candidate interactions at the University of Sharjah job fairs.
Overview
Job Fair Portal streamlines the job fair experience for the CASTO office and participating companies at the University of Sharjah. Companies can register, scan candidate QR codes, and manage potential recruits all in one platform.
Features

Company Authentication: Secure login system for company representatives
QR Ticketing System: Companies can scan candidate QR codes for quick registration
Company Profiles: Companies can create and manage their profiles
Candidate Management: Track and organize potential candidates
CASTO Office Administration: Management tools for university administrators

Technology Stack

Frontend: React
Backend: Node.js, Express
Database: MongoDB with Mongoose
Authentication: JWT
Deployment: Vercel

Usage
For Companies

Log in with credentials provided by CASTO office
Complete your company profile
Use the QR scanner to register candidates during the job fair
Review candidate information and manage records

For CASTO Office

Manage the job fair system
Monitor company registrations
Generate reports on job fair participation
Provide support to participating companies
Configure system settings

Project Structure
jobFair/
├── client/                # React frontend
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # UI components
│       ├── pages/         # Application pages
│       └── services/      # API services
│
├── server/                # Node.js/Express backend
│   ├── controllers/       # Request handlers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── middleware/        # Custom middleware
│
└── README.md              # Project documentation
License
MIT License
Contact
Amaar Shamsi - GitHub Profile
Project Link: https://github.com/amxr21/jobFair
