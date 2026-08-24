const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // we'll query "all sessions for this user" often —
      // e.g. "log out of all devices"
    },
    tokenHash: {
      type: String,
      required: true,
      // Never store the raw refresh token — if the DB were ever
      // compromised, plaintext refresh tokens would mean instant
      // account takeover for every active session.
    },
    expiresAt: {
      type: Date,
      required: true,
    },

    // Optional session metadata — enables a future "active sessions" UI
    // ("Chrome on Windows, last active 2 hours ago")
    userAgent: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

// TTL index — MongoDB automatically deletes the document once expiresAt
// has passed. No manual cleanup cron job needed.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
