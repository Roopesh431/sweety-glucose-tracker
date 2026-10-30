
const express = require("express");
const cors = require("cors");
const { query } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const readingRoutes = require("./routes/readingRoutes");

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Sweety API"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        const result = await query("SELECT NOW() AS database_time");

        res.status(200).json({
            success: true,
            message: "Sweety API is running",
            database: "Connected",
            timestamp: result.rows[0].database_time
        });
    } catch (error) {
        console.error("Health check failed:", error.message);

        res.status(503).json({
            success: false,
            message: "Database connection unavailable"
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/readings", readingRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

module.exports = app;
