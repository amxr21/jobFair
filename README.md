<div align="center">
🏢 Job Fair Portal
Show Image
Show Image
Show Image
Show Image
Show Image
Show Image
Show Image
A specialized platform for University of Sharjah's job fair events
Features •
Tech Stack •
Usage •
Project Structure •
License •
Contact
</div>
📋 Overview
Job Fair Portal streamlines the University of Sharjah's job fair experience for the CASTO office and participating companies. The platform facilitates efficient management of company registrations, positions, and candidate interactions through an innovative QR ticketing system. Built specifically for the University of Sharjah's career events, this application serves as a centralized hub for employers participating in campus recruitment activities.
✨ Features
🔐 Company Authentication
Secure company registration and login system using JWT (JSON Web Tokens) authentication, ensuring that only authorized company representatives can access their respective dashboards. The authentication system features role-based access control to differentiate between company users and CASTO office administrators.
📱 QR Ticketing System
An advanced QR code scanning functionality allowing company representatives to instantly register candidates they meet at the job fair. When a company representative scans a candidate's QR code, the system automatically logs their information to the company's dashboard for later review and follow-up.
👔 Company Profiles
Companies can create comprehensive profiles showcasing their:

Organization details and industry information
Available job positions and internship opportunities
Required qualifications and skills
Company culture and values
Contact information for interested candidates

These profiles serve as a digital representation of the company at the job fair and help streamline the candidate registration process.
👥 Candidate Management
A robust candidate tracking system enabling companies to:

View all scanned candidate information in one dashboard
Sort and filter candidates by qualifications, positions of interest, or academic background
Add notes and status updates for each candidate
Export candidate data for integration with company ATS (Applicant Tracking Systems)
Track candidate engagement metrics

📊 Data Analytics & Reporting
CASTO office administrators can access comprehensive analytics including:

Total companies registered and participation metrics
Popular positions and fields of interest
Real-time attendance tracking
Candidate interaction statistics
Custom report generation for event effectiveness evaluation

🏫 CASTO Office Administration
Special administrative features for the University of Sharjah's CASTO office including:

Company registration approval system
Master dashboard for monitoring all job fair activities
System configuration and access control management
Communication tools for announcements and updates
Event scheduling and coordination capabilities

📱 Responsive Design
The application is fully responsive with adaptive layouts optimized for:

Desktop workstations for administrative tasks
Tablets for company representatives at job fair booths
Mobile devices for on-the-go access and QR scanning

🛠️ Tech Stack
TechnologyDescriptionFrontendReact - Component-based UI library for building the interactive user interface with reusable components, state management, and responsive designBackendNode.js & Express - Server-side JavaScript runtime and web application framework handling API endpoints, business logic, authentication, and database communicationDatabaseMongoDB with Mongoose - NoSQL database storing company profiles, candidate information, and system data with Mongoose ODM for data modeling and validationAuthenticationJWT (JSON Web Tokens) - Secure authentication implementation for protected routes and user sessions with role-based access controlDevelopment & DeploymentVercel - Platform for frontend and backend deployment with continuous integration, preview deployments, and serverless functionsOther ToolsQR code generation and scanning libraries, data visualization tools, PDF generation for reports, and responsive design framework
📖 Usage
🏢 For Participating Companies
Initial Setup

Receive login credentials from the CASTO office before the job fair
Log in to the Job Fair Portal using the provided credentials
Complete your company profile with detailed information about:

Company background and industry
Available positions and required qualifications
Recruitment process and contact details



During the Job Fair

Use the integrated QR scanner in the application to scan candidate QR codes
View captured candidate information immediately on your dashboard
Add notes or tags to prioritize candidates of interest
Track the number of interactions throughout the event

Post-Fair Activities

Access your company dashboard to view all registered candidates
Filter and sort candidates based on qualifications or interests
Export candidate data for integration with your recruitment systems
Generate reports on job fair participation and candidate engagement

🏫 For CASTO Office Administrators
System Setup

Configure job fair event details including date, location, and participating departments
Create company accounts and generate login credentials
Set up system preferences and access control permissions

Management Functions

Monitor real-time company registrations and participation
Track overall event metrics and attendance
Generate comprehensive reports on job fair effectiveness
Provide support to participating companies through the integrated messaging system
Configure system settings including:

Access permissions and role assignments
Notification preferences
Data retention policies
Branding and customization options



📁 Project Structure
The repository follows a modular architecture separating frontend and backend components:
jobFair/
│
├── client/                     # Frontend React application
│   ├── public/                 # Static assets and index.html
│   ├── src/                    # Source files
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── company/        # Company profile components
│   │   │   ├── dashboard/      # Dashboard elements
│   │   │   ├── layout/         # Layout components (header, footer, etc.)
│   │   │   └── qr/             # QR code scanning components
│   │   ├── contexts/           # React contexts for state management
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Main application pages
│   │   ├── services/           # API service integrations
│   │   ├── utils/              # Utility functions
│   │   ├── App.js              # Main application component
│   │   └── index.js            # Application entry point
│   └── package.json            # Frontend dependencies
│
├── server/                     # Backend Node.js/Express application
│   ├── config/                 # Configuration files
│   ├── controllers/            # Request handlers
│   ├── middleware/             # Custom middleware (auth, validation, etc.)
│   ├── models/                 # Mongoose models for MongoDB
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic services
│   ├── utils/                  # Utility functions
│   ├── app.js                  # Express application setup
│   ├── server.js               # Server entry point
│   └── package.json            # Backend dependencies
│
├── .gitignore                  # Git ignore file
├── package.json                # Root package.json for scripts
└── README.md                   # Project documentation
📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
📞 Contact
Amaar Shamsi - GitHub Profile
Project Link: https://github.com/amxr21/jobFair

<div align="center">
  <sub>Built for the University of Sharjah CASTO Office</sub>
</div>
