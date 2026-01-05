const User = require("../models/userModel");
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv");
dotenv.config();


//this token is the key to sned and retrieve the adata safely between backend and front end 
//review that vid again
const createToken = (_id) => {
    return jwt.sign({_id}, process.env.TOKEN_SIGN , {expiresIn: "3d"})

}



const loginUser = async (req, res) => {
    const { email, password, fields, representitives, companyName } = req.body;
    try{
        //modify the path later
        const user = await User.login(email, password);
        const user_id = user._id;
        const token = createToken(user._id);
        
        
        res.status(200).json({user_id, email, token, fields, representitives, companyName})

    } catch(error){
        if(req.password){
            console.log("Incorrect password");
            res.json({error: "Incorrect password"})
        }
        res.status(400).json({error: error.message})
}
}



const signupUser = async (req, res) => {
    const { email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities } = req.body;
    try{
        //modify the path later
        const user = await User.signup(email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities);
        const user_id = user._id;
        const token = createToken(user._id);


        res.status(200).json({user_id, email, token, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities})

    } catch(error){
        console.log("ERROR....");
        res.status(400).json({error: error.message})
}
}

// Check for similar company names
const checkSimilarCompanyName = async (req, res) => {
    const { companyName } = req.query;

    if (!companyName || companyName.trim().length < 2) {
        return res.status(200).json({ similarCompanies: [] });
    }

    try {
        const normalizedInput = companyName.toLowerCase().trim();

        // Find all companies
        const allCompanies = await User.find({}, 'companyName email');

        // Filter for similar names using Levenshtein distance-like approach
        const similarCompanies = allCompanies.filter(company => {
            if (!company.companyName) return false;

            const normalizedCompany = company.companyName.toLowerCase().trim();

            // Check for exact match (case-insensitive)
            if (normalizedCompany === normalizedInput) {
                return true;
            }

            // Check if one contains the other
            if (normalizedCompany.includes(normalizedInput) || normalizedInput.includes(normalizedCompany)) {
                return true;
            }

            // Check for similar words (at least 70% of words match)
            const inputWords = normalizedInput.split(/\s+/).filter(w => w.length > 2);
            const companyWords = normalizedCompany.split(/\s+/).filter(w => w.length > 2);

            if (inputWords.length > 0 && companyWords.length > 0) {
                const matchingWords = inputWords.filter(iw =>
                    companyWords.some(cw =>
                        cw.includes(iw) || iw.includes(cw) ||
                        (iw.length > 3 && cw.length > 3 && levenshteinDistance(iw, cw) <= 2)
                    )
                );

                const matchRatio = matchingWords.length / Math.max(inputWords.length, companyWords.length);
                if (matchRatio >= 0.5) {
                    return true;
                }
            }

            // Check for overall string similarity (typos, minor differences)
            if (normalizedInput.length > 5 && normalizedCompany.length > 5) {
                const distance = levenshteinDistance(normalizedInput, normalizedCompany);
                const maxLen = Math.max(normalizedInput.length, normalizedCompany.length);
                const similarity = 1 - (distance / maxLen);

                if (similarity >= 0.7) {
                    return true;
                }
            }

            return false;
        }).map(company => ({
            id: company._id,
            companyName: company.companyName,
            email: company.email
        }));

        res.status(200).json({ similarCompanies });
    } catch (error) {
        console.error("Error checking similar company names:", error);
        res.status(500).json({ error: error.message });
    }
};

// Helper function: Calculate Levenshtein distance
function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1[i - 1] === str2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }

    return dp[m][n];
}

// Update existing company data (for reinitialization)
const reinitializeCompany = async (req, res) => {
    const { existingCompanyId, email, password, fields, representitives, companyName, sector, city, noOfPositions, preferredMajors, opportunityTypes, preferredQualities } = req.body;

    try {
        const bcrypt = require("bcrypt");
        const validator = require("validator");

        // Validate inputs
        if (!email || !password || !representitives || !fields || !companyName) {
            throw Error("All fields must be filled");
        }
        if (!validator.isEmail(email)) {
            throw Error("Email is not valid");
        }
        if (!validator.isStrongPassword(password)) {
            throw Error("Password is not strong enough");
        }

        // Check if the new email is already in use by another company
        const emailExists = await User.findOne({ email, _id: { $ne: existingCompanyId } });
        if (emailExists) {
            throw Error("Email already in use by another company");
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Update the existing company
        const updatedUser = await User.findByIdAndUpdate(
            existingCompanyId,
            {
                email,
                password: hash,
                fields,
                representitives,
                companyName,
                sector,
                city,
                noOfPositions,
                preferredMajors,
                opportunityTypes,
                preferredQualities,
                status: 'Pending', // Reset status on reinitialization
                surveyResult: [] // Clear previous survey results
            },
            { new: true }
        );

        if (!updatedUser) {
            throw Error("Company not found");
        }

        const user_id = updatedUser._id;
        const token = createToken(user_id);

        res.status(200).json({
            user_id,
            email: updatedUser.email,
            token,
            fields: updatedUser.fields,
            representitives: updatedUser.representitives,
            companyName: updatedUser.companyName,
            sector: updatedUser.sector,
            city: updatedUser.city,
            noOfPositions: updatedUser.noOfPositions,
            preferredMajors: updatedUser.preferredMajors,
            opportunityTypes: updatedUser.opportunityTypes,
            preferredQualities: updatedUser.preferredQualities
        });
    } catch (error) {
        console.error("Error reinitializing company:", error);
        res.status(400).json({ error: error.message });
    }
};

module.exports = { loginUser, signupUser, checkSimilarCompanyName, reinitializeCompany }