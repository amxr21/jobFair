const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator")

const Schema = mongoose.Schema;

const userSchema = new Schema({
    companyName : {
        type: String,
        required: true,
    },
    email : {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    fields: {
        type: String,
        required: true,
    },
    representitives: {
        type: String,
        required: true,
    },
    sector: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    noOfPositions: {
        type: String,
        required: true,
    },
    surveyResult: {
        type: Array
    }



})

userSchema.statics.signup = async function(email, password, fields, representitives, companyName, sector, city, noOfPositions ) {
    if(!email || !password || !representitives || !fields || !companyName ){
        throw Error("All fields must be filled");
    }
    if(!validator.isEmail(email)){
        throw Error("Email is not valid");
    }
    if(!validator.isStrongPassword(password)){
        throw Error("Password is not strong enough");
    }
    
    const exist = await this.findOne({ email });

    if(exist){
        throw Error("Email already in use")
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await this.create({email, password: hash, fields, representitives, companyName, sector, city, noOfPositions})

    return user;
}

userSchema.statics.login = async function( email, password ) {
    if(!email || !password){
        throw Error("All fields must be filled");
    }
    //must be await variable
    const user = await this.findOne({ email });

    if(!user){
        throw Error("Incorrect email");
    }

    const match = await bcrypt.compare(password, user.password);


    if(!match){
        throw Error("Incorrect password");
    }

    return user;

}





module.exports = mongoose.model("User", userSchema)