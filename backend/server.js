require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");

const isDemo = process.env.DEMO_MODE === "true";

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://job-fair-control.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
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

const routers = require("./routers/applicantRouter");
const userRoutes = require("./routers/userRoutes");

if (isDemo) {
    // Demo mode: no MongoDB needed — routes work immediately
    app.use("/", routers);
    app.use("/user", userRoutes);
    app.listen(process.env.PORT || 2000, () => {
        console.log(`[DEMO MODE] Server running on PORT ${process.env.PORT || 2000}`);
        console.log("[DEMO MODE] Using in-memory data — no MongoDB required");
        console.log("[DEMO MODE] Demo login: use any credentials from the seed data");
    });
} else {
    const mongoose = require("mongoose");
    const uri = process.env.URI;
    mongoose.connect(uri);
    const connection = mongoose.connection;
    connection.once("open", () => {
        console.log("DB Connected successfully");
        app.use("/", routers);
        app.use("/user", userRoutes);
    });
    app.listen(process.env.PORT || 2000, () => {
        console.log("Server running on PORT:", process.env.PORT || 2000);
    });
}
