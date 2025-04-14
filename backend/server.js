const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const routers = require("./routers/applicantRouter")
const userRoutes = require("./routers/userRoutes")

const dotenv = require("dotenv");
dotenv.config();


// app.use((req, res, next) => {
//     res.setHeader(
//       "Access-Control-Allow-Origin",
//       "https://job-fair-cd5j.onrender.com" // change this later
//     );
//     res.setHeader(
//       "Access-Control-Allow-Methods",
//       "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS,CONNECT,TRACE"
//     );
//     res.setHeader(
//       "Access-Control-Allow-Headers",
//       "Content-Type, Authorization, X-Content-Type-Options, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers"
//     );
//     res.setHeader("Access-Control-Allow-Credentials", true);
//     res.setHeader("Access-Control-Allow-Private-Network", true);
//     //  Firefox caps this at 24 hours (86400 seconds). Chromium (starting in v76) caps at 2 hours (7200 seconds). The default value is 5 seconds.
//     res.setHeader("Access-Control-Max-Age", 7200);
  
//     next();
//   });

const corsOptions = {
  origin: "*", // or '*' if open access is OK
  // origin: "https://job-fair-cd5j.onrender.com", // or '*' if open access is OK
  // origin: "http://localhost:3000", // or '*' if open access is OK
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};

app.use(cors(corsOptions))


app.use(express.json());

app.use((req, res, next)=>{
    console.log("Request type: ", req.method);
    console.log("Request path: ", req.path);
    console.log("Request body: ", req.body);
    next();
})

const connection = mongoose.connection;

connection.once("open", ()=> {
  console.log('DB Connected successfully');
  app.use("/",routers);
  app.use("/user", userRoutes);
})





app.listen(process.env.PORT, ()=>{
    console.log("Server works fine on PORT:", process.env.PORT);
})