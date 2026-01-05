require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const requireAuth = require("../middlewares/requireAuth");

// Cloudinary configuration
const { cloudinary, upload } = require("../config/cloudinary");

const {getAllApplicants, getApplicant, addApplicant, testFunc, updateApplicant, addApplicantPublic, emailRequest, apply, getCompanies, getCompany, confirmAttendant, flagApplicant, getApplicantFlag, shortlistApplicant, rejectApplicant, submitSurvey, deleteApplicant, sendCompanyReminders, confirmCompanyAttendance, updateCompanyStatus, deleteCompany, getSettings, updateSettings} = require("../controllers/applicantsControllers")

const router = express.Router();

const uri = process.env.URI;

mongoose.connect(uri);
const connection = mongoose.connection;

connection.once("open", ()=>{
    console.log("DB connected successfully");
});


// Download CV - now redirects to Cloudinary URL
const downloadCV = async (req, res) => {
    try {
        const cvUrl = req.params.id;

        // If it's a Cloudinary URL, redirect to it
        if (cvUrl.startsWith('http')) {
            return res.redirect(cvUrl);
        }

        // For legacy GridFS IDs, return not found (or handle migration)
        return res.status(404).json({ message: 'File not found. Please re-upload CV.' });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// route to get the company
router.get("/companies", getCompanies);

// route to get the company details from its id
router.get("/companies/:id", getCompany);



router.get("/cv/:id", downloadCV);

router.patch("/applicant/apply/:id", apply);




router.post("/email", emailRequest);

router.post("/applicants", upload.single("cvfile"), addApplicantPublic);

// Company confirmation route (public - no auth required)
router.get("/confirm-attendance/:token", confirmCompanyAttendance);

// Settings route (public - for checking survey visibility)
router.get("/settings", getSettings);

router.use(requireAuth);

// Settings update route (requires auth - admin only)
router.patch("/settings", updateSettings);

// Company reminder routes (requires auth - admin only)
router.post("/companies/send-reminders", sendCompanyReminders);
router.patch("/companies/:id/status", updateCompanyStatus);
router.delete("/companies/:id", deleteCompany);

router.get("/", testFunc);

router.get("/applicants/:id", getApplicant);

router.get("/applicants", getAllApplicants);

router.patch("/applicants/:id", updateApplicant);
router.patch("/applicants/flag/:id", flagApplicant);
router.get("/applicants/flag/:id", getApplicantFlag);

router.patch("/applicants/shortlist/:id", shortlistApplicant);
router.patch("/applicants/reject/:id", rejectApplicant);

router.patch("/applicants/confirm/:id", confirmAttendant);

router.patch("/applicants/survey/:id", submitSurvey)


router.post("/applicants", upload.single("cvfile"), addApplicant)

router.delete("/applicants/:id", deleteApplicant);

// an applicant will open a simple page that ask him for his id
// once he gets in he will have to open a QR code scanner
// + the applicant will be able to see the companies he/she applied for
// the scanner will identify the company by reading the id stored in the Qr code
// once he scanned it, a success message will show up and the applicant will be stored in the company dashboard

// We need a page, a new router
// the success will result in adding the applicant name to the list of companies he applied for

module.exports = router;
