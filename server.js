require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    logger.error({ err }, "Failed to connect to DB");
    process.exit(1); // the only place we decide to kill the process on startup failure
  }

  const server = app.listen(PORT, () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
    );
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      // 1. stop accepting new HTTP requests
      await mongoose.connection.close(); // 2. then close the DB connection
      logger.info("Shutdown complete.");
      process.exit(0); // 3. then exit
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C, local dev
  process.on("SIGTERM", () => shutdown("SIGTERM")); // sent by most deploy platforms/process managers on restart
};

startServer();
