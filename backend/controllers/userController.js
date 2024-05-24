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
    const { email, password } = req.body;
    try{
        //modify the path later
        const user = await User.login(email, password);
        const user_id = user._id;
        const token = createToken(user._id);
        
        
        res.status(200).json({user_id, email, token})

    } catch(error){
        if(req.password){
            console.log("Incorrect password");
            res.json({error: "Incorrect password"})
        }
        res.status(400).json({error: error.message})
}
}



const signupUser = async (req, res) => {
    const { email, password } = req.body;
    try{
        //modify the path later
        const user = await User.signup(email, password);
        const user_id = user._id;
        const token = createToken(user._id);
        
        
        res.status(200).json({user_id,email, token})

    } catch(error){
        console.log("ERROR....");
        res.status(400).json({error: error.message})
}
}

module.exports = { loginUser, signupUser }