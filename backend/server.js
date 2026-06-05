require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");

const isDemo = process.env.DEMO_MODE === "true";

// Fixed origins (localhost dev + production)
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://job-fair-control.vercel.app",
];

// Allow any Vercel preview/branch URL for this project, plus any
// origin explicitly listed in ALLOWED_ORIGINS env var (comma-separated).
const extraOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
    : [];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow server-to-server or same-origin requests (no Origin header)
        if (!origin) return callback(null, true);

        const isAllowedFixed = allowedOrigins.includes(origin);
        const isAllowedExtra = extraOrigins.includes(origin);
        // Allow any Vercel preview deployment URL (*.vercel.app)
        const isVercelPreview = /^https:\/\/[a-z0-9-]+-amxr22s-projects\.vercel\.app$/.test(origin)
            || origin === "https://job-fair-control.vercel.app";

        if (isAllowedFixed || isAllowedExtra || isVercelPreview) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
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

    // Register routes before connecting — Express queues them immediately.
    // Routes that need DB will fail gracefully if DB isn't ready yet,
    // but this eliminates the 404s caused by routes not being mounted.
    app.use("/", routers);
    app.use("/user", userRoutes);

    mongoose.connect(uri)
        .then(() => {
            console.log("DB Connected successfully");
        })
        .catch((err) => {
            console.error("DB connection error:", err.message);
        });

    app.listen(process.env.PORT || 2000, () => {
        console.log("Server running on PORT:", process.env.PORT || 2000);
    });
}
