const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");
const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const app = express();

// --- Core middleware ---
app.use(pinoHttp({ logger }));
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// --- Health check route ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Vendora backend is running" });
});

// --- Routes will be mounted here as we build them ---
// app.use('/api/auth', require('./routes/auth.routes'));

// --- 404 handler ---
app.use(notFound);

// --- Centralized error handler ---
app.use(errorHandler);

module.exports = app;
