const mongoose = require("mongoose");
const slugify = require("slugify");
const { required } = require("zod/mini");

const storeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one Vendor doc per User — enforced at the DB level,
      // not just in application logic
    },

    // --- Filled in later, during store onboarding — not at registration ---
    storeName: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 50,
      trim: true,
    },
    storeDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    logo: {
      type: String,
    },

    banner: {
      type: String,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    categoryMode: {
      type: String,
      enum: ["all", "selected"],
      default: "selected",
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    phone: {
      type: String,
      required: true,
    },

    gstNumber: {
      type: String,
      trim: true,
      required: true,
    },

    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
        default: "India",
      },
      postalCode: {
        type: String,
        required: true,
      },
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected", "disabled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

storeSchema.pre("validate", async function () {
  if (!this.isModified("storeName")) return;

  const baseSlug = slugify(this.storeName, { lower: true, strict: true });
  let candidateSlug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.Store.findOne({
      slug: candidateSlug,
      _id: { $ne: this._id },
    })
  ) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = candidateSlug;
  // no next() call at all — returning naturally signals completion
});

module.exports = mongoose.model("Store", storeSchema);
