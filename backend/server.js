const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const routers = require("./routers/applicantRouter")
const userRoutes = require("./routers/userRoutes")

const dotenv = require("dotenv");
dotenv.config();

app.use(cors())
app.use(express.json());

app.use((req, res, next)=>{
    console.log("Request type: ", req.method);
    console.log("Request path: ", req.path);
    console.log("Request body: ", req.body);
    next();
})

const connection = mongoose.connection;

connection.once("open", ()=> {
    app.use("/user", userRoutes);
    app.use("/",routers);
})





app.listen(process.env.PORT, ()=>{
    console.log("Server works fine");
})