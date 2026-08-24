const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
      unique: true, // creates a unique index — also what makes duplicate
      // registrations surface as a Mongo 11000 error, which
      // our error handler already normalizes to a 409
      lowercase: true,
      trim: true,
      // Standard pragmatic email pattern: local-part@domain.tld — not
      // trying to fully implement RFC 5322 (that regex is genuinely
      // enormous and still imperfect); this catches the real-world
      // malformed-input case without being a research project.
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned by default — must opt in with
      // .select('+password') in the login controller
      // At least one lowercase, one uppercase, one digit, one special
      // character. Uses a `validate` function (not `match`) gated on
      // isModified/isNew — a plain `match` would re-run against the
      // bcrypt HASH on every later save() (e.g. updating fullname),
      // since by then this.password is no longer plaintext, and the
      // hash would never match the pattern, breaking unrelated updates.
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
      enum: ["user", "vendor", "admin"],
      default: "user", // server-side default — never trust the client's
      // role field blindly, even though the frontend
      // form pre-selects one
    },

    // --- Email verification (OTP) ---
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      select: false, // same reasoning as password — never leak by default
    },
    otpExpiresAt: {
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

// --- Hash password before saving, but only if it was actually modified ---
// The isModified check matters: without it, every save() (even one that
// only updates, say, fullname) would re-hash an already-hashed password,
// silently breaking login.
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

module.exports = mongoose.model("User", userSchema);
