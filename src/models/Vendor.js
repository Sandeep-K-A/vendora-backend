const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one Vendor doc per User — enforced at the DB level,
      // not just in application logic
    },

    // --- Filled in later, during store onboarding — not at registration ---
    storeName: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vendor", vendorSchema);
