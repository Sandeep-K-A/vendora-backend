const { z } = require("zod");

const fullnameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be atleast 2 characters")
  .max(50, "Full name must be under 50 characters")
  .regex(
    /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ]+)*$/,
    "Full name may only contain letters and spaces",
  );

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
    "Password must include an uppercase letter, a lowercase letter, a number, and a special character",
  );

const registerSchema = z.object({
  fullname: fullnameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

const resendOtpSchema = z.object({
  email: emailSchema,
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
};
