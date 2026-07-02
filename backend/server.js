require("dotenv").config();

const app = require("./app");

const isDemo = process.env.DEMO_MODE === "true";

if (isDemo) {
    // Demo mode: no MongoDB needed — routes work immediately
    app.listen(process.env.PORT || 2000, () => {
        console.log(`[DEMO MODE] Server running on PORT ${process.env.PORT || 2000}`);
        console.log("[DEMO MODE] Using in-memory data — no MongoDB required");
        console.log("[DEMO MODE] Demo login: use any credentials from the seed data");
    });
} else {
    const mongoose = require("mongoose");
    const uri = process.env.URI;

    mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
    })
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
