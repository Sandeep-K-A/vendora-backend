const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  // Guard against duplicate connections — low-value in a plain long-running
  // server (we only ever call this once), but cheap insurance and essential
  // if this code ever runs in a serverless/hot-reload context later.
  if (mongoose.connection.readyState === 1) {
    logger.info("MongoDB already connected.");
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    // Throw, don't exit here — db.js shouldn't decide to kill the process.
    // That decision belongs to whatever orchestrates the app (server.js).
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  const conn = await mongoose.connect(uri);
  logger.info(`MongoDB connected: ${conn.connection.host}`);

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected.");
  });
  mongoose.connection.on("reconnected", () => {
    logger.info("MongoDB reconnected.");
  });
  mongoose.connection.on("error", (err) => {
    logger.error({ err }, "MongoDB connection error");
  });
};

module.exports = connectDB;
