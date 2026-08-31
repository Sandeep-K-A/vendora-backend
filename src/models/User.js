const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [50, "Full name must be under 50 characters"],
      // Letters (incl. accented) and spaces only.
      match: [
        /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ]+)*$/,
        "Full name may only contain letters and spaces",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
      validate: {
        validator: function (value) {
          if (!this.isModified("password")) return true; // skip re-check on hash
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
            value,
          );
        },
        message:
          "Password must include an uppercase letter, a lowercase letter, a number, and a special character",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVendor: {
      type: Boolean,
      default: false,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: Store,
      default: null,
    },

    // --- Email verification (OTP) ---
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    resetPasswordTokenHash: {
      type: String,
      select: false,
    },
    resetPasswordExpiresAt: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }, // adds createdAt / updatedAt — createdAt is what
  // our TTL index below keys off of
);

// --- Partial TTL index: auto-delete UNVERIFIED users 24h after creation ---
// This only applies to documents matching the partialFilterExpression, so
// verified users are never touched by this index, no matter how old.
userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24, // 24 hours
    partialFilterExpression: { isVerified: false },
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// --- Instance method: compare a plaintext password against the stored hash ---
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// --- Instance method: hash and store a new OTP, with expiry ---
// Returns the PLAINTEXT otp so the controller can email it — only the
// hash ever gets persisted.
userSchema.methods.setOtp = async function (plainOtp, expiresInMinutes = 10) {
  const salt = await bcrypt.genSalt(10);
  this.otpHash = await bcrypt.hash(plainOtp, salt);
  this.otpExpiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
};

// --- Instance method: verify a submitted OTP against the stored hash ---
userSchema.methods.verifyOtp = async function (candidateOtp) {
  if (!this.otpHash || !this.otpExpiresAt) return false;
  if (this.otpExpiresAt < new Date()) return false; // expired
  return bcrypt.compare(candidateOtp, this.otpHash);
};

// --- Instance method: generate and store a password reset token --
userSchema.methods.setResetPasswordToken = function (expiresInMinutes = 30) {
  const plainToken = crypto.randomBytes(32).toString("Hex");
  this.resetPasswordTokenHash = crypto
    .createHash("sha256")
    .update(plainToken)
    .digest("hex");
  this.resetPasswordExpiresAt = new Date(
    Date.now() + expiresInMinutes * 60 * 1000,
  );

  return plainToken;
};

// --- Instance method: verify a submitted reset token against the stored hash ---
userSchema.methods.verifyResetPasswordToken = function (candidateToken) {
  if (!this.resetPasswordTokenHash || !this.resetPasswordExpiresAt) {
    return false;
  }
  if (this.resetPasswordExpiresAt < new Date()) return false; // expired

  const candidateHash = crypto
    .createHash("sha256")
    .update(candidateToken)
    .digest("hex");
  const storedBuffer = Buffer.from(this.resetPasswordTokenHash, "hex");
  const candidateBuffer = Buffer.from(candidateHash, "hex");

  if (storedBuffer.length !== candidateBuffer.length) return false;

  return crypto.timingSafeEqual(storedBuffer, candidateBuffer);
};

// --- Instance method: clear the reset token (after use, or on request) ---
userSchema.methods.clearResetPasswordToken = function () {
  this.resetPasswordTokenHash = undefined;
  this.resetPasswordExpiresAt = undefined;
};
module.exports = mongoose.model("User", userSchema);
