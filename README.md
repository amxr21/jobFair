# 🎓 JobFair – Smart, Paperless Career Fair Platform

Welcome to **JobFair**, a modern web application developed to streamline the student application process for job and internship fairs organized by **CASTO**. Built for performance and simplicity, this platform empowers admins and applicants with an intuitive, real-time, and fully digital experience — eliminating paper-based bottlenecks for good.

🌐 **Live Preview**: [job-fair-control.vercel.app](https://job-fair-control.vercel.app/)

---

## ✨ Highlights

✅ Paperless digital system to manage student & graduate applications  
✅ Admin dashboard with real-time updates and live applicant tracking  
✅ Seamless QR-based check-in system (scanner-ready)  
✅ Built-in email notification support for confirmations & alerts  
✅ Clean, responsive UI with a smooth user experience  
✅ Built on the **MERN** stack (MongoDB, Express, React, Node.js)

---

## 🚀 Tech Stack

| Layer        | Tech Used                            |
|--------------|--------------------------------------|
| **Frontend** | React, Tailwind CSS                   |
| **Backend**  | Node.js, Express                      |
| **Database** | MongoDB (Mongoose)                    |
| **Other**    | Nodemailer, QRCode, Vercel (frontend), Render (backend)

---

## 📂 Project Structure

```bash
jobFair/
├── client/             # React Frontend (Vite-based)
├── server/             # Express Backend with APIs and WebSocket
├── .env.example        # Environment Variables Sample
├── vercel.json         # Vercel Deployment Config
└── README.md           # You're reading it!
🧑‍💻 Roles & Flows
🎓 Applicants
Fill in and submit applications through a clean, mobile-friendly form.

Receive confirmation via email upon submission.

QR Code is auto-generated for scanning at booths.

🧑‍💼 Admins (Managers)
Log in securely to the admin dashboard.

View live applicant data as it’s submitted.

Scan QR codes to instantly pull applicant records.

Track and manage statistics & metrics for reporting.

⚙️ Getting Started
🛠️ Prerequisites
Node.js ≥ 16.x

MongoDB Atlas or local instance

Yarn or npm

📥 Installation
Clone the repository

bash
Copy
Edit
git clone https://github.com/amxr21/jobFair.git
cd jobFair
Install dependencies

bash
Copy
Edit
cd client
npm install
cd ../server
npm install
Configure environment variables

Duplicate .env.example into .env in the server folder and update the values:

env
Copy
Edit
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_password
Run the development servers

bash
Copy
Edit
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
Open http://localhost:5173 in your browser.

📊 Key Features (Admin Side)
🔄 Live applicant list with real-time updates

🔍 Search and filter applicants instantly

📩 Integrated email feedback system

📸 QR Code scanning to pull applicant info on the spot

📈 Statistics dashboard with top applicants and booth data

🧪 Demo Credentials (for testing)
Use these credentials on the live demo for a quick tour.

🙌 Acknowledgements
Big thanks to:

The CASTO Office, University of Sharjah, for their support and collaboration.

All testers and contributors who helped refine the platform.

