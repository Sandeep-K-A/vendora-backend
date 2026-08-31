const rateLimit = require("express-rate-limit");

function rateLimitResponse(message) {
  return {
    success: false,
    message,
  };
}

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Too many password reset requests. Please try again in a few minutes.",
  ),
});

const resendOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    "Too many resend attempts. Please try again in a few minutes.",
  ),
});

module.exports = { forgotPasswordLimiter, resendOtpLimiter };
