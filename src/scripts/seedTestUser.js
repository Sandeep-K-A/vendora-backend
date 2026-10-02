// scripts/seedTestUser.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const TEST_EMAIL = "floodlightshadows@gmail.com";
const TEST_PASSWORD = "Testuser@123"; // meets schema: upper, lower, digit, special, 8+ chars
const TEST_FULLNAME = "Test UserTwo";

async function seedTestUser() {
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: TEST_EMAIL });
  if (existing) {
    existing.isVerified = true;
    await existing.save();
    console.log("verified");
    process.exit(0);
  }

  await User.create({
    fullname: TEST_FULLNAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD, // hashed automatically by the pre("save") hook
    role: "user",
    isVerified: true, // bypasses OTP entirely — can log in immediately
  });

  console.log(`Test user created: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}`);
  process.exit(0);
}

seedTestUser().catch((err) => {
  console.error("Test user seeding failed:", err);
  process.exit(1);
});
