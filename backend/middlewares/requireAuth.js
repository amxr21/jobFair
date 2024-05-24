const jwt = require("jsonwebtoken")
const User = require("../models/userModel")
const dotenv = require("dotenv");
dotenv.config();


const requireAuth = async (req, res, next) => {
    //verify authentication
    const { authorization } = req.headers;

    if(!authorization){
        return next();
        // res.status(401).json( {error: "NOT AUTHORIZED"} );
    }
    // console.log(req.headers);
    // // return res.status(401).json({error: "Authoriztion token required"})
    const token = authorization.split(" ")[1];
    try{
        const { _id } = jwt.verify(token, process.env.TOKEN_SIGN);
        req.user = await User.findOne({ _id }).select( "_id" );
        console.log(req.user._id,"dsad");
        next();

    } catch(error){
        res.status(401).json({error: "tokent is missing somewhere"})
    }



}

module.exports = requireAuth