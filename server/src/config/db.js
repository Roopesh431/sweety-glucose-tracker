
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL pool error:", err.message);
});

const query = (text, params) => {
    return pool.query(text, params);
};

const connectDB = async () => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");
        console.log("PostgreSQL connected successfully!");
        console.log("Database time:", result.rows[0].current_time);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        throw error;
    }
};

module.exports = {
    pool,
    query,
    connectDB
};
