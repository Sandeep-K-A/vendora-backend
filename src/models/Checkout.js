const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true },
);

checkoutSchema.index({ buyer: 1 });

module.exports = mongoose.model("Checkout", checkoutSchema);
