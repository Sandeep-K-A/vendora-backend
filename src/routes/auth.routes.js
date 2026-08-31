const express = require("express");
const router = express.Router();

const validate = require("../middleware/validate.middleware");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
} = require("../validators/auth.validators");
const {
  registerUser,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
} = require("../controllers/auth.controller");

const {
  forgotPasswordLimiter,
  resendOtpLimiter,
} = require("../middleware/rateLimiter.middleware");

const { protect } = require("../middleware/auth.middleware");

router.post("/register", validate(registerSchema), registerUser);
router.post("/resend-otp", resendOtpLimiter, resendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/login", validate(loginSchema), login);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.get("/me", protect, getMe);
router.post("/reset-password", resetPassword);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
