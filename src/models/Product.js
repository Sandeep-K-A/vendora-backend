const mongoose = require("mongoose");

const specificationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true },
});

const productSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // References the _id of one entry within category.subcategories —
    // NOT a separate collection, since subcategories are embedded.
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    aboutThisProduct: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    keyHighlights: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0 && arr.length <= 5,
        message: "Provide between 1 and 5 key highlights",
      },
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one product image is required",
      },
    },

    // The variable part — validated against the subcategory's
    // specFields template at the CONTROLLER level, not here (schema
    // can't reach into a different document to check valid keys).
    specifications: [specificationSchema],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Helpful for the products list page: fast lookups by store, plus
// supports sorting/filtering by category within a store's catalog.
productSchema.index({ store: 1, category: 1 });
productSchema.index({ store: 1, isActive: 1 });

module.exports = mongoose.model("Product", productSchema);
