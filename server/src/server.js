
require("dotenv").config();

const app = require("./app");
const { connectDB, pool } = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Sweety server running on http://localhost:${PORT}`);
        });

        const shutdown = async () => {
            console.log("Shutting down server...");

            server.close(async () => {
                await pool.end();
                console.log("Database connections closed.");
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);

    } catch (error) {
        console.error("Failed to start server:", error.message);
        await pool.end();
        process.exit(1);
    }
};

startServer();
