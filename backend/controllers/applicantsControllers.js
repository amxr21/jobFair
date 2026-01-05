const mongoose = require("mongoose");
const ApplicantModel = require("../models/applicantFormModel");
const UserModel = require("../models/userModel");
const SettingsModel = require("../models/settingsModel");
const QRCode = require("qrcode");

const dotenv = require("dotenv");
dotenv.config();

const nodemailer = require("nodemailer");
// const env = require("dotenv").config()

const sendEmail = async (subject, message, send_to, sent_from) => {
    const transporter = nodemailer.createTransport({
        host : "smtp.gmail.com",
        service: "Gmail",
        port: "465",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        // tls: {
        //     rejectUnauthorized: false
        // }
    })

    const options = {
        from: sent_from,
        to: send_to,
        subject: subject,
        html: message
    }


    transporter.sendMail(options, function(err, info){
        if(err) console.log(err);
        else {console.log("Email sent");}
    })
}


const testFunc =  async (req, res) => {
    res.json("Make it work");
}

const getAllApplicants = async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Search/filter parameters
        const search = req.query.search || '';
        const companyFilter = req.query.company || '';

        // Build query - only get applicants with valid applicantDetails
        let query = { applicantDetails: { $exists: true, $ne: null } };

        // Add search filter if provided
        if (search) {
            query.$or = [
                { 'applicantDetails.firstName': { $regex: search, $options: 'i' } },
                { 'applicantDetails.lastName': { $regex: search, $options: 'i' } },
                { 'applicantDetails.uniId': { $regex: search, $options: 'i' } },
                { 'applicantDetails.email': { $regex: search, $options: 'i' } }
            ];
        }

        // Add company filter if provided
        if (companyFilter) {
            query.user_id = companyFilter;
        }

        // Get total count for pagination info
        const total = await ApplicantModel.countDocuments(query);

        // Get unique student count (by uniId) - this excludes duplicate submissions
        const uniqueCountResult = await ApplicantModel.aggregate([
            { $match: query },
            { $group: { _id: "$applicantDetails.uniId" } },
            { $count: "uniqueCount" }
        ]);
        const uniqueStudentCount = uniqueCountResult[0]?.uniqueCount || 0;

        // Fetch paginated results
        const applicants = await ApplicantModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            applicants,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                uniqueStudentCount: uniqueStudentCount,
                itemsPerPage: limit,
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });

    } catch(error) {
        res.status(500).json({error: error.message})
    }
};


const addApplicant =  async (req, res) => {
    const userId = !req.user ? "662d20b4754626de2c3ac2b7" : req.user._id;
    try{
        console.log("Recieved POST request to /applicants");
        console.log("Request body: ",req.body);
        console.log("Uploaded applicant CV: ", req.file);

        // Cloudinary file info - store URL and public_id
        const cvData = req.file ? {
            url: req.file.path,           // Cloudinary URL
            public_id: req.file.filename, // Cloudinary public_id for deletion
            originalname: req.file.originalname
        } : null;

        const applicantProfile = await ApplicantModel.create({
            cv: cvData,
            applicantDetails: req.body,
            user_id: userId
        })
        //this must be the exact the same as the one inn the model
        console.log(applicantProfile);

        const qrData = JSON.stringify(req.body);
        QRCode.toDataURL(JSON.stringify(applicantProfile._id), (err, url)=>{
            // console.log("--------qr code url--------------",url,"--------qr code url--------------");
            // res.status(200).json( url );
            res.status(200).json( {url: url ,applicantProfile: applicantProfile } );
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,//u22200731

                `<div style=\"max-width:600px;padding:20px;background-color:#fff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1);\"><h1 style=\"color:#333;text-align:center;\">Your Ticket Confirmation</h1><p style=\"color:#555;line-height:1.6;\">Dear ${req.body.fullName},We are pleased to inform you that your ticket has been confirmed for the upcoming academic conference.Ticket Details:<ul><li><strong>ID Number:</strong>${req.body.uniId}</li><li><strong>Name:</strong>${req.body.fullName}</li><li><strong>Email:</strong>${req.body.email}</li><li><strong>Conference Date:</strong>[Conference Date]</li><li><strong>File Name:</strong>${req.file?.originalname}</li></ul></p><img src=${url} alt=\"QR Code\" style=\"display:block;margin:20px auto;max-width:100%;height:auto;border-radius:5px;\"><p style=\"color:#555;line-height:1.6;\">Please ensure that you have your ticket ready for verification upon arrival at the conference venue.</p><footer style=\"text-align:center;margin-top:20px;\"><p style=\"color:#999;font-size:14px;\">Best Regards,</p><p style=\"color:#999;font-size:14px;\">CASTO Office</p></footer></div>`
    ,

                `${req.body.email}`,

                `CASTO Office 🏢🚨 <${process.env.USER_EMAIL}>`,
            )
        
    });


    } catch(error){
        console.log("----this is the error---\n\n\n\n\n\n\n\n\n\n\n\n-",error,"---------\n\n\n\n\n\n\n\n");
        res.status(500).json({error: "Request is never sent...T-T"})
    }

}


const getApplicant = async (req, res) => {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: "No such id for an applicant"})
    }

    const applicant = await ApplicantModel.findById(id);

    try{
        res.status(200).json(applicant);
    } catch(error){
        console.log(error);
        res.status(401).json({error: "did not find the applicant"});
    }
}


const updateApplicant = async (req, res) => {

    try {
        const { id } = req.params;
        
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error: "No such id for an applicant"})
        }


        let updateData = {};
        if(req.body.hasOwnProperty("user_id")){
            updateData.$addToSet = { user_id: req.body.user_id[0] }
        };



        const applicant = await ApplicantModel.findOneAndUpdate({_id: id},
            updateData,
            {new: false}
        );
        console.log(id);
        console.log(applicant);

        res.status(200).json(applicant)

    } catch(error){
        console.log({error: error.message});
    }
}


const flagApplicant = async (req, res) => {

    try {
        const { id } = req.params;
        
        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error: "No such id for an applicant"})
        }


        let updateData = {};
        // if(req.body.hasOwnProperty("user_id")){
        //     updateData.$addToSet = { flags: req.body.flags }
        // };

        if (req.body.flags && Array.isArray(req.body.flags)) {
            updateData.$addToSet = { flags: req.body.flags[0] };
        }




        const applicant = await ApplicantModel.findOneAndUpdate({_id: id},
            updateData,
            {new: false}
        );
        console.log(id);
        console.log(applicant);

        res.status(200).json(applicant)

    } catch(error){
        console.log({error: error.message});
    }
}




const shortlistApplicant = async (req, res) => {

    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error: "No such id for an applicant"})
        }

        let updateData = {};


        if(req.body.hasOwnProperty){
            updateData.$addToSet = { shortlistedBy: req.body.shortlistedBy[0] }
        }




        const applicant = await ApplicantModel.findOneAndUpdate({_id: id},
            updateData,
            {new: true}
        );
        console.log(id);
        console.log(applicant);

        res.status(200).json(applicant)

    } catch(error){
        console.log({error: error.message});
    }
}

const rejectApplicant = async (req, res) => {

    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error: "No such id for an applicant"})
        }

        let updateData = {};


        if(req.body.hasOwnProperty){
            updateData.$addToSet = { rejectedBy: req.body.rejectedBy[0] }
        }




        const applicant = await ApplicantModel.findOneAndUpdate({_id: id},
            updateData,
            {new: true}
        );
        console.log(id);
        console.log(applicant);

        res.status(200).json(applicant)

    } catch(error){
        console.log({error: error.message});
    }
}


const submitSurvey = async (req, res) => {
    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({error: "No such id for an applicant"})
        

        let updateData = {}
        if(req.body.hasOwnProperty('surveyResult')){
            updateData.$addToSet = { surveyResult: req.body.surveyResult }

            // console.log(req.body);
            
        }
        
        const applicant = await UserModel.findByIdAndUpdate({_id: id}, 
            updateData,
            {new: false}
        )

        res.status(200).json(applicant)




    } catch (error) {
        console.log({error: error.message});
    }
}



const getApplicantFlag = async (req, res) => {
    
    const { id } = req.params;
    
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).json({error: "No such id for an applicant"})
    }
    
    
    
    const applicant = await ApplicantModel.findById(id);
    try {
        // console.log(id);
        // console.log(applicant);

        res.status(200).json(applicant)

    } catch(error){
        console.log({error: error.message});
    }

        
}








const addApplicantPublic = async (req, res) => {
    try{
        // Cloudinary file info - store URL and public_id
        const cvData = req.file ? {
            url: req.file.path,           // Cloudinary URL
            public_id: req.file.filename, // Cloudinary public_id for deletion
            originalname: req.file.originalname
        } : null;

        const applicantProfile = await ApplicantModel.create({
            cv: cvData,
            applicantDetails: req.body,
            user_id: [],
            attended: false
        })

        console.log(applicantProfile,"------this is the added applicant publically-----");


        const qrData = JSON.stringify(req.body);
        QRCode.toDataURL((JSON.stringify(applicantProfile._id)), (err, url)=>{
            // console.log("--------qr code url--------------",url,"--------qr code url--------------");
            // res.status(200).json( url );


            res.status(200).json( {url: url ,applicantProfile: applicantProfile } );
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,//u22200731

                `<div style=\"max-width:600px;padding:20px;background-color:#fff;border-radius:10px;box-shadow:0 0 10px rgba(0,0,0,0.1);\"><h1 style=\"color:#333;text-align:center;\">Your Ticket Confirmation</h1><p style=\"color:#555;line-height:1.6;\">Dear ${req.body.fullName},We are pleased to inform you that your ticket has been confirmed for the upcoming academic conference.Ticket Details:<ul><li><strong>ID Number:</strong>${req.body.uniId}</li><li><strong>Name:</strong>${req.body.fullName}</li><li><strong>Email:</strong>${req.body.email}</li><li><strong>Conference Date:</strong>[Conference Date]</li><li><strong>File Name:</strong>${req.file?.originalname}</li></ul></p><img src=${url} alt=\"QR Code\" style=\"display:block;margin:20px auto;max-width:100%;height:auto;border-radius:5px;\"><p style=\"color:#555;line-height:1.6;\">Please ensure that you have your ticket ready for verification upon arrival at the conference venue.</p><footer style=\"text-align:center;margin-top:20px;\"><p style=\"color:#999;font-size:14px;\">Best Regards,</p><p style=\"color:#999;font-size:14px;\">CASTO Office</p></footer></div>`
    ,

                `${req.body.email}`,

                "🥲 <ammar211080@gmail.com>",
            )
        })



    } catch(error){
        res.status(401).json({error: error.essage})
    }
}



const emailRequest = async (req, res) => {
    console.log(req.body, "This is the request\n\n\n\n\n");

    const emailTemplate = {
        i :`<div style="max-width:600px; padding:20px; background-color:#f9f9f9; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); text-align:center; font-family:Arial, sans-serif; color:#333; line-height:1.6;">
            <h1 style="margin-bottom:20px; font-size:24px;">Interview Invitation</h1>
            <p>Dear ${req.body.fullName},</p>
            <p>Congratulations! We are pleased to inform you that you have been selected for an interview.</p>
            <p><strong>Interview Details:</strong></p>
            <ul style="list-style-type:none; padding:0;">
                <li><strong>Name:</strong> ${req.body.fullName}</li>
                <li><strong>Email:</strong> ${req.body.email}</li>
                <li><strong>Interview Date:</strong> [Interview Date]</li>
                <li><strong>Interview Time:</strong> [Interview Time]</li>
                <li><strong>Interview Location:</strong> [Interview Location]</li>
            </ul>
            <p>Please confirm your availability for the interview by replying to this email at your earliest convenience.</p>
            <p>We look forward to meeting you.</p>
            <p>Best Regards,<br>Interview Team</p>
        </div>
        `,
        r: `<div style="max-width:600px; padding:20px; background-color:#f9f9f9; border-radius:10px; box-shadow:0 0 10px rgba(0,0,0,0.1); text-align:center; font-family:Arial, sans-serif; color:#333; line-height:1.6;">
        <h1 style="margin-bottom:20px; font-size:24px;">Application Update</h1>
        <p>Dear ${req.body.fullName},</p>
        <p>We regret to inform you that your application for the position has not been successful. We sincerely appreciate the time and effort you put into your application.</p>
        <p>We received a high number of qualified applicants, and after careful consideration, we have selected candidates whose qualifications more closely match our needs at this time.</p>
        <p>Thank you for your interest in joining our team. We wish you all the best in your future endeavors.</p>
        <p>Best Regards,<br>The Hiring Team</p>
    </div>
    `,
        o: `Hala`

}

    switch(req.body.type){
        case "interview":
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,//u22200731
                emailTemplate["i"],
        
                `${req.body.email}`,
        
                "🥲 <ammar211080@gmail.com>",
            )
            break;
        case "rejection":
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,//u22200731
                emailTemplate["r"],
        
                `${req.body.email}`,
        
                "🥲 <ammar211080@gmail.com>",
            )
            break;
        case "other":
            sendEmail(
                `JobFair ticket #${req.body.uniId}`,//u22200731
                emailTemplate["o"],
        
                `${req.body.email}`,
        
                "🥲 <ammar211080@gmail.com>",
            )
    }


    

    res.status(200).json({message: "email sent!"})

}


const apply = async (req, res) => {
    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error: "No such a comapny with this id"});
        }

        let updatedApplicantData = {};
        if(req.body.hasOwnProperty("user_id")){
            updatedApplicantData.$addToSet = { user_id: req.body.user_id[0] };
        }


        const updateApplicant = await ApplicantModel.findOneAndUpdate({_id: id},
            updatedApplicantData,
            {new: false});

        console.log(id);
        console.log(updateApplicant.data);


        res.status(200).json(updateApplicant);

    } catch(error){
        res.status(404).json({error: error.message});
    }
}




const getCompanies = async (req, res) => {
    const companies = await UserModel.find({});

    res.json(companies)
}


const getCompany = async (req, res) => {
    const { id } = req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({message: "Not a valid id"+id})
    }


    const company = await UserModel.findById(id)

    try{
        res.json(company)
    } catch(error){
        return res.json({error: error});
    }
}




const confirmAttendant = async (req, res) => {

    try {
        const { id } = req.params;

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).json({error: "No such id for an applicant"})
        }


        let updateData = {};
        if(req.body.hasOwnProperty("attended")){
            updateData.$set = { attended: true }
        };



        const applicant = await ApplicantModel.findOneAndUpdate({_id: id},
            updateData,
            {new: true}
        );
        console.log(id);
        console.log(applicant);

        res.status(200).json(applicant)

    } catch(error){
        console.log({error: error.message});
    }
}









// Delete applicant
const deleteApplicant = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: "No such id for an applicant" });
        }

        const applicant = await ApplicantModel.findByIdAndDelete(id);

        if (!applicant) {
            return res.status(404).json({ error: "Applicant not found" });
        }

        // If applicant had a CV on Cloudinary, optionally delete it
        // (requires cloudinary import if you want to clean up storage)

        res.status(200).json({ message: "Applicant deleted successfully", applicant });

    } catch (error) {
        console.log({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// Generate random token for confirmation
const crypto = require('crypto');

const generateConfirmationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send confirmation reminder email to companies
const sendCompanyReminders = async (req, res) => {
    try {
        const { companyIds, frontendUrl } = req.body;

        if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
            return res.status(400).json({ error: "No companies selected" });
        }

        const results = [];
        const errors = [];

        for (const companyId of companyIds) {
            try {
                if (!mongoose.Types.ObjectId.isValid(companyId)) {
                    errors.push({ companyId, error: "Invalid company ID" });
                    continue;
                }

                const company = await UserModel.findById(companyId);
                if (!company) {
                    errors.push({ companyId, error: "Company not found" });
                    continue;
                }

                // Generate confirmation token
                const token = generateConfirmationToken();
                const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

                // Update company with token
                await UserModel.findByIdAndUpdate(companyId, {
                    confirmationToken: token,
                    confirmationTokenExpiry: tokenExpiry,
                    reminderSentAt: new Date()
                });

                // Generate confirmation URL
                const confirmUrl = `${frontendUrl || 'https://job-fair-control.vercel.app'}/confirm-attendance/${token}`;

                // Email content
                const emailHtml = `
                    <div style="max-width:600px; margin:0 auto; padding:30px; background-color:#ffffff; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.1); font-family:Arial, sans-serif;">
                        <div style="text-align:center; margin-bottom:30px;">
                            <h1 style="color:#0E7F41; margin-bottom:10px;">Job Fair Attendance Confirmation</h1>
                            <p style="color:#666; font-size:14px;">University of Sharjah Career Services</p>
                        </div>

                        <p style="color:#333; font-size:16px; line-height:1.6;">Dear <strong>${company.companyName}</strong>,</p>

                        <p style="color:#555; line-height:1.8;">
                            We are excited to have you participate in our upcoming Job Fair! To finalize your attendance, please confirm your participation by clicking the button below.
                        </p>

                        <div style="background-color:#f5f5f5; padding:20px; border-radius:8px; margin:20px 0;">
                            <h3 style="color:#333; margin-bottom:15px;">Your Account Details:</h3>
                            <p style="margin:5px 0;"><strong>Company:</strong> ${company.companyName}</p>
                            <p style="margin:5px 0;"><strong>Email:</strong> ${company.email}</p>
                            <p style="margin:5px 0;"><strong>Representatives:</strong> ${company.representitives}</p>
                            <p style="margin:5px 0;"><strong>City:</strong> ${company.city}</p>
                        </div>

                        <div style="text-align:center; margin:30px 0;">
                            <a href="${confirmUrl}" style="display:inline-block; padding:15px 40px; background-color:#0E7F41; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px;">
                                Confirm Attendance
                            </a>
                        </div>

                        <p style="color:#888; font-size:12px; text-align:center;">
                            This confirmation link will expire in 7 days.<br>
                            If you did not register for this event, please ignore this email.
                        </p>

                        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">

                        <footer style="text-align:center;">
                            <p style="color:#999; font-size:12px;">Best Regards,</p>
                            <p style="color:#0E7F41; font-weight:bold;">CASTO Office</p>
                            <p style="color:#999; font-size:11px;">University of Sharjah</p>
                        </footer>
                    </div>
                `;

                // Send email
                await sendEmail(
                    `Job Fair Attendance Confirmation - ${company.companyName}`,
                    emailHtml,
                    company.email,
                    `CASTO Office <${process.env.EMAIL_USER}>`
                );

                results.push({ companyId, companyName: company.companyName, status: "sent" });

            } catch (err) {
                errors.push({ companyId, error: err.message });
            }
        }

        res.status(200).json({
            message: `Sent ${results.length} reminder(s)`,
            results,
            errors
        });

    } catch (error) {
        console.error("Error sending reminders:", error);
        res.status(500).json({ error: error.message });
    }
};

// Confirm company attendance via token
const confirmCompanyAttendance = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        const company = await UserModel.findOne({
            confirmationToken: token,
            confirmationTokenExpiry: { $gt: new Date() }
        });

        if (!company) {
            return res.status(400).json({ error: "Invalid or expired confirmation link" });
        }

        // Update company status to Confirmed
        await UserModel.findByIdAndUpdate(company._id, {
            status: 'Confirmed',
            confirmationToken: null,
            confirmationTokenExpiry: null
        });

        res.status(200).json({
            message: "Attendance confirmed successfully!",
            companyName: company.companyName
        });

    } catch (error) {
        console.error("Error confirming attendance:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update company status manually (for admin)
const updateCompanyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid company ID" });
        }

        if (!['Pending', 'Confirmed', 'Canceled'].includes(status)) {
            return res.status(400).json({ error: "Invalid status value" });
        }

        const company = await UserModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.status(200).json({ message: "Status updated", company });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete company (admin only)
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid company ID" });
        }

        const company = await UserModel.findByIdAndDelete(id);

        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        // Optionally: Remove all applicants associated with this company
        // await ApplicantModel.updateMany(
        //     { user_id: id },
        //     { $pull: { user_id: id } }
        // );

        res.status(200).json({ message: "Company deleted successfully", company });

    } catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get app settings (public endpoint for certain settings)
const getSettings = async (req, res) => {
    try {
        const surveyPublic = await SettingsModel.getSetting('surveyPublic', false);

        res.status(200).json({
            surveyPublic
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update app settings (admin only)
const updateSettings = async (req, res) => {
    try {
        const { key, value } = req.body;
        const userEmail = req.user?.email;

        // Only allow certain keys to be updated
        const allowedKeys = ['surveyPublic'];
        if (!allowedKeys.includes(key)) {
            return res.status(400).json({ error: 'Invalid setting key' });
        }

        const setting = await SettingsModel.setSetting(key, value, userEmail);

        res.status(200).json({
            message: 'Setting updated successfully',
            setting: { key: setting.key, value: setting.value }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {getAllApplicants, addApplicant, getApplicant, updateApplicant, testFunc, addApplicantPublic, emailRequest, apply, getCompanies, getCompany, confirmAttendant, flagApplicant, getApplicantFlag, shortlistApplicant, rejectApplicant, submitSurvey, deleteApplicant, sendCompanyReminders, confirmCompanyAttendance, updateCompanyStatus, deleteCompany, getSettings, updateSettings}