const express = require("express");
const {signupUser, loginUser, checkSimilarCompanyName, reinitializeCompany} = require("../controllers/userController")


const router = express.Router();

//login
router.post("/login", loginUser)

//sign in
router.post("/signup", signupUser)

// Check for similar company names
router.get("/check-company-name", checkSimilarCompanyName)

// Reinitialize existing company
router.put("/reinitialize", reinitializeCompany)


module.exports = router