require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const isDemo = process.env.DEMO_MODE === "true";

let requireAuth, upload, uploadArtwork, controllers;

if (isDemo) {
    const demo = require("../demo/demoControllers");
    requireAuth = demo.requireAuthDemo;
    upload = { single: () => (req, res, next) => next() };
    uploadArtwork = upload;
    controllers = demo;
    console.log("[DEMO MODE] Using in-memory data store — no MongoDB required");
} else {
    requireAuth = require("../middlewares/requireAuth");
    ({ upload, uploadArtwork } = require("../config/cloudinary"));
    controllers = require("../controllers/applicantsControllers");
}

const {
    getAllApplicants, getApplicant, addApplicant, testFunc, updateApplicant,
    addApplicantPublic, emailRequest, apply, getCompanies, getCompany,
    confirmAttendant, flagApplicant, getApplicantFlag, shortlistApplicant,
    rejectApplicant, unshortlistApplicant, unrejectApplicant, unflagApplicant,
    submitSurvey, deleteApplicant, sendCompanyReminders,
    confirmCompanyAttendance, updateCompanyStatus, deleteCompany,
    getSettings, updateSettings, getEventOps, updateEventOps,
    verifyAttendanceStaff, checkinByStaff, updateAttendanceStaffProfile,
    bulkImportCompanies, lookupApplicantByUniId, getMyCheckins,
    getCompanyLoginEmails, addCompanyLoginEmail, removeCompanyLoginEmail, updateCompanyProfile,
    getCastoTeam, inviteCastoTeamMember, updateCastoTeamMember, removeCastoTeamMember,
    uploadBannerArtwork, getEmailActivity,
} = controllers;

const router = express.Router();

const downloadCV = isDemo
    ? controllers.downloadCV
    : async (req, res) => {
        try {
            const cvUrl = req.params.id;
            if (cvUrl.startsWith("http")) return res.redirect(cvUrl);
            return res.status(404).json({ message: "File not found. Please re-upload CV." });
        } catch (error) {
            console.error("Download error:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

// Public routes
router.get("/companies", getCompanies);
router.get("/companies/:id", getCompany);
router.get("/cv/:id", downloadCV);
router.patch("/applicant/apply/:id", apply);
router.post("/email", emailRequest);
router.post("/applicants", upload.single("cvfile"), addApplicantPublic);
router.get("/confirm-attendance/:token", confirmCompanyAttendance);
router.get("/settings", getSettings);
// Attendance staff: code-gated, deliberately not behind requireAuth so a
// staffer can check students in without a CASTO/company account
router.post("/attendance-staff/verify", verifyAttendanceStaff);
router.patch("/attendance-staff/checkin", checkinByStaff);
router.patch("/attendance-staff/profile", updateAttendanceStaffProfile);
if (getMyCheckins) {
    router.get("/attendance-staff/my-checkins", getMyCheckins);
}
// Public: a student retrieves their own QR code after the fact by University
// ID, without needing to have kept the confirmation screen open
if (lookupApplicantByUniId) {
    router.get("/applicants/lookup/:uniId", lookupApplicantByUniId);
}

// Protected routes
router.use(requireAuth);

router.patch("/settings", updateSettings);
router.get("/event-ops", getEventOps);
router.put("/event-ops", updateEventOps);
router.post("/companies/send-reminders", sendCompanyReminders);
router.patch("/companies/:id/status", updateCompanyStatus);
router.delete("/companies/:id", deleteCompany);
// Real-mode only for now — no demo-store equivalent exists yet
if (bulkImportCompanies) {
    router.post("/companies/bulk-import", bulkImportCompanies);
}
if (updateCompanyProfile) {
    router.patch("/companies/:id/profile", updateCompanyProfile);
    router.get("/companies/:id/login-emails", getCompanyLoginEmails);
    router.post("/companies/:id/login-emails", addCompanyLoginEmail);
    router.delete("/companies/:id/login-emails/:emailId", removeCompanyLoginEmail);
}
if (getCastoTeam) {
    router.get("/casto-team", getCastoTeam);
    router.post("/casto-team", inviteCastoTeamMember);
    router.patch("/casto-team/:id", updateCastoTeamMember);
    router.delete("/casto-team/:id", removeCastoTeamMember);
}
if (uploadBannerArtwork) {
    router.post("/banners/:id/artwork", uploadArtwork.single("artwork"), uploadBannerArtwork);
}
// Developer-only email activity (real mode only — demo has no email path)
if (getEmailActivity) {
    router.get("/dev/email-activity", getEmailActivity);
}

router.get("/", testFunc);
router.get("/applicants/:id", getApplicant);
router.get("/applicants", getAllApplicants);
router.patch("/applicants/:id", updateApplicant);

router.patch("/applicants/flag/:id", flagApplicant);
router.patch("/applicants/unflag/:id", unflagApplicant);
router.get("/applicants/flag/:id", getApplicantFlag);

router.patch("/applicants/shortlist/:id", shortlistApplicant);
router.patch("/applicants/unshortlist/:id", unshortlistApplicant);
router.patch("/applicants/reject/:id", rejectApplicant);
router.patch("/applicants/unreject/:id", unrejectApplicant);

router.patch("/applicants/confirm/:id", confirmAttendant);
router.patch("/applicants/survey/:id", submitSurvey);
router.post("/applicants", upload.single("cvfile"), addApplicant);
router.delete("/applicants/:id", deleteApplicant);

module.exports = router;
