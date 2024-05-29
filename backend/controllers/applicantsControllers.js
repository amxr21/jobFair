const mongoose = require("mongoose");
const ApplicantModel = require("../models/applicantFormModel");
const UserModel = require("../models/userModel");
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
    res.json("Make it works dump");
}

const getAllApplicants = async (req, res) => {
    try{
        const filteredUserIds = await ApplicantModel.find({})

        const a = filteredUserIds.map((aa) => aa?.user_id)[0][0];
        console.log(a);


        const allApplicants = (await ApplicantModel.find({}))
        // .filter((app)=> {
        //     console.log(a, app.user_id[0], a.equals(app.user_id[0]));
        //     return app.user_id[0], a.equals(app.user_id[0])
        // })
        // console.log(req.user._id, );
        res.status(200).json(allApplicants.filter((applicant)=>applicant.applicantDetails != undefined).sort(() => {return -1}))

    } catch(error) {
        res.status(500).json({error: error.message})
        // console.log({error: error.message});
    }
};

const addApplicant =  async (req, res) => {
    const userId = !req.user ? "662d20b4754626de2c3ac2b7" : req.user._id;
    console.log("\n\n\n\n\n\n",req,"\n\n\n\n\n\n");
    try{
        // const { uniId, name, birthdate, nationality, gender, email, college, major, cgpa, phoneNumber, studyLevel, experience, languages, skills, linkedIn, portfolio, brief } = req.body;
        console.log("Recieved POST request to /applicants");
        console.log("Request body: ",req.body);
        console.log("Uploaded applicant CV: ", req.file);
        console.log("\n\n\n\n\n\n\n");

        const applicantProfile = await ApplicantModel.create({
            cv: req.file,
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

const addApplicantPublic = async (req, res) => {
    try{
        
        const applicantProfile = await ApplicantModel.create({
            cv: req.file,
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
            {new: false}
        );
        console.log(id);
        console.log(applicant);

        res.status(200).json(applicant)

    } catch(error){
        console.log({error: error.message});
    }
}









module.exports = {getAllApplicants, addApplicant, getApplicant, updateApplicant, testFunc, addApplicantPublic, emailRequest, apply, getCompanies, getCompany, confirmAttendant}