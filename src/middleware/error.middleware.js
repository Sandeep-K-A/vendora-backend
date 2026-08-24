const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  // Normalize known Mongoose error shapes into proper HTTP responses —
  // otherwise things like duplicate emails or missing required fields
  // show up as generic 500s instead of clear 400/409s.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => e.message);
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  const log = req.log || logger;
  const isOperational = err.isOperational || statusCode < 500;

  if (isOperational) {
    log.warn({ err }, message); // expected errors — bad input, auth failure, duplicate key
  } else {
    log.error({ err }, message); // unexpected bugs — always full detail
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
