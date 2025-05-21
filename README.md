Job Fair Portal
Job Fair Portal is a specialized web application designed for the University of Sharjah's job fair events, primarily serving the CASTO office and participating companies. This platform streamlines employer participation and candidate management through an innovative QR ticketing system.
Show Image
Features

Company Authentication: Secure login and registration for company representatives
QR Ticketing System: Allows company managers to scan candidate QR codes for quick registration
Company Profiles: Dedicated profiles for companies participating in the University of Sharjah job fair
Candidate Management: Tools to organize and track potential candidates
Responsive Design: Seamless experience across devices
CASTO Office Integration: Special features for CASTO office management and oversight

Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v14.x or higher)
npm (v6.x or higher) or yarn (v1.22.x or higher)
Git

Tech Stack

Frontend: React, TailwindCSS
Backend: nodeJS, Express
Database: MongoDB (with Mongoose)
Authentication: JWT
Deployment: Vercel

Usage
For Participating Companies

Access the platform with company credentials provided by CASTO office
Set up your company profile with available positions and requirements
Use the QR scanner functionality to register interested candidates
Review candidate information
Manage candidate records and notes

For CASTO Office

Administer the entire job fair system
Monitor company registrations
Generate reports and analytics on job fair participation
Provide support to participating companies
Configure system settings and access controls

Project Structure
jobFair/
├── components/        # Reusable UI components
├── pages/             # Application pages and API routes
│   ├── api/           # Backend API endpoints
│   └── ...            # Frontend pages
├── public/            # Static assets
├── styles/            # CSS and styling files
├── models/            # Database models
├── lib/               # Utility functions and helpers
├── middleware/        # Custom middleware
└── ...
License
This project is licensed under the MIT License - see the LICENSE file for details.
Contact
Project Link: https://github.com/amxr21/jobFair
