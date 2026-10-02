const mongoose = require("mongoose");

const specFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  required: { type: Boolean, default: false },
  filterable: { type: Boolean, default: false },
});

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  specFields: {
    type: [specFieldSchema],
    validate: {
      validator: function (specFields) {
        if (specFields.length !== 4) return false;
        const filterableCount = specFields.filter((f) => f.filterable).length;
        return filterableCount === 2;
      },
      message:
        "A subcategory must have exactly 4 spec fields, with exactly 2 marked filterable.",
    },
  },
});

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
    },
    subcategories: [subcategorySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Category", categorySchema);
