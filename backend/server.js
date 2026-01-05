const mongoose = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");
const routers = require("./routers/applicantRouter")
const userRoutes = require("./routers/userRoutes")

const dotenv = require("dotenv");
dotenv.config();

// Allowed origins for CORS - add your production URLs here
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://job-fair-control.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};

app.use(cors(corsOptions));
app.use(express.json());

const connection = mongoose.connection;

connection.once("open", ()=> {
  console.log('DB Connected successfully');
  app.use("/",routers);
  app.use("/user", userRoutes);
})

app.listen(process.env.PORT, ()=>{
    console.log("Server works fine on PORT:", process.env.PORT);
})