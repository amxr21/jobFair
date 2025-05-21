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
├── backend/            # Backend source code
│   ├── controllers/    # Handles request logic
│   ├── models/         # Mongoose schemas and models
│   ├── routes/         # Express route definitions
│   ├── utils/          # Utility functions
│   ├── server.js       # Entry point for the backend server
│   └── ...             # Additional backend files
├── frontend/           # Frontend source code
│   ├── public/         # Static assets
│   ├── src/            # React components and pages
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── App.js      # Main React component
│   │   └── index.js    # Entry point for React
│   └── ...             # Additional frontend files
├── .vscode/            # Visual Studio Code settings
├── .gitignore          # Specifies files to ignore in Git
├── README.md           # Project documentation
├── package.json        # Project metadata and scripts
├── vercel.json         # Vercel deployment configuration
└── ...                 # Other configuration files
```

## 🧑‍💻 Roles & Flows

### 🧑‍💼 **Companies (Managers)**

- 🔐 **Secure login** to access the control dashboard  
- 👁️ **View live applicant data** in real-time as it’s submitted  
- 📷 **Scan QR codes** to instantly pull applicant profiles  
- 📊 **Track statistics and booth performance** with integrated analytics  

---

## 📊 Key Features – **Admin Dashboard**

- 🔄 **Real-time applicant list** updates via Socket.io  
- 🔍 **Instant search and filter** functionality  
- 📩 **Email feedback system** for confirmations and messages  
- 📸 **QR Code scanning** to access applicant details on the spot  
- 📈 **Analytics dashboard** with top applicants and booth insights  

---

## 🙌 Acknowledgements

- 💼 **CASTO Office – University of Sharjah**  
  For supporting and enabling this digital transformation of the career fair process  

- 🤝 **All testers, users, and contributors**  
  Your feedback, ideas, and time made this project better at every step  
