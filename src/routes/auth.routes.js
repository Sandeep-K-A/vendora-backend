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
  login,
  refresh,
  logout,
} = require("../controllers/auth.controller");

router.post("/register", validate(registerSchema), registerUser);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
