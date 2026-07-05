require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");

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

app.use("/", routers);
app.use("/user", userRoutes);

// Anything not matched by the routers above (typo'd path, wrong method, etc.)
// — without this Express 5 falls through to its default HTML 404 page.
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// Last-resort safety net: any error a route handler forgot to catch (or a
// middleware error, e.g. the CORS origin check throwing) lands here instead
// of Express's default HTML error page / stack trace leak.
app.use((err, req, res, next) => {
    if (err.message?.startsWith("CORS:")) {
        return res.status(403).json({ error: "Origin not allowed" });
    }
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

module.exports = app;
