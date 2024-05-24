const mongoose = require("mongoose");
const applicantSchema = mongoose.Schema;

// { uniId ,fullName ,birthdate ,gender ,nationality ,studyLevel, college , major ,email ,phoneNumber, cgpa , linkedIn,skills ,languages ,brief ,cv ,portfolio}

const applicantModel = new applicantSchema ({
    applicantDetails: {
        type: Object
    },
    cv: {
        type: Object
    },
    user_id: {
        type: String,
        // required: true
    },
    user_id: {
        type: Array,
        // required: true,
    },
    attended: {
        type: Boolean
    }
}, { timestamps: true })

module.exports = mongoose.model("applicants_details.file", applicantModel)

