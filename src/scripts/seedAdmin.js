// scripts/seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN_EMAIL = "kasandeep45@gmail.com";
const ADMIN_PASSWORD = "AdminPass@123"; // meets schema: upper, lower, digit, special, 8+ chars
const ADMIN_FULLNAME = "Sandeep K A";

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin with email "${ADMIN_EMAIL}" already exists — skipping.`);
    process.exit(0);
  }

  await User.create({
    fullname: ADMIN_FULLNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD, // hashed automatically by the pre("save") hook
    role: "admin",
    isVerified: true, // bypasses OTP entirely — admin can log in immediately
  });

  console.log(`Admin account created: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Admin seeding failed:", err);
  process.exit(1);
});
