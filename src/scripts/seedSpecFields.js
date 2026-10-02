require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");

const specFieldsBySlug = {
  // Electronics
  mobile: [
    { key: "brand", label: "Brand", required: true, filterable: true },
    { key: "ram", label: "RAM", required: true, filterable: true },
    { key: "storage", label: "Storage", required: true, filterable: false },
    {
      key: "batteryCapacity",
      label: "Battery Capacity",
      required: true,
      filterable: false,
    },
  ],
  laptops: [
    { key: "ram", label: "RAM", required: true, filterable: true },
    { key: "storage", label: "Storage", required: true, filterable: true },
    { key: "processor", label: "Processor", required: true, filterable: false },
    {
      key: "screenSize",
      label: "Screen Size",
      required: true,
      filterable: false,
    },
  ],

  // Sports
  football: [
    { key: "size", label: "Size", required: true, filterable: true },
    { key: "material", label: "Material", required: true, filterable: true },
    { key: "weight", label: "Weight", required: true, filterable: false },
    { key: "brand", label: "Brand", required: true, filterable: false },
  ],
  fitness: [
    {
      key: "equipmentType",
      label: "Equipment Type",
      required: true,
      filterable: true,
    },
    { key: "brand", label: "Brand", required: true, filterable: true },
    { key: "material", label: "Material", required: true, filterable: false },
    {
      key: "weightCapacity",
      label: "Weight Capacity",
      required: true,
      filterable: false,
    },
  ],

  // Books
  programming: [
    { key: "author", label: "Author", required: true, filterable: true },
    { key: "language", label: "Language", required: true, filterable: true },
    { key: "isbn", label: "ISBN", required: true, filterable: false },
    { key: "pages", label: "Pages", required: true, filterable: false },
  ],
  fiction: [
    { key: "author", label: "Author", required: true, filterable: true },
    { key: "language", label: "Language", required: true, filterable: true },
    { key: "isbn", label: "ISBN", required: true, filterable: false },
    { key: "pages", label: "Pages", required: true, filterable: false },
  ],

  // Fashion
  men: [
    { key: "size", label: "Size", required: true, filterable: true },
    { key: "color", label: "Color", required: true, filterable: true },
    { key: "material", label: "Material", required: true, filterable: false },
    { key: "brand", label: "Brand", required: true, filterable: false },
  ],
  women: [
    { key: "size", label: "Size", required: true, filterable: true },
    { key: "color", label: "Color", required: true, filterable: true },
    { key: "material", label: "Material", required: true, filterable: false },
    { key: "brand", label: "Brand", required: true, filterable: false },
  ],

  // Home & Kitchen
  decor: [
    { key: "material", label: "Material", required: true, filterable: true },
    { key: "color", label: "Color", required: true, filterable: true },
    {
      key: "dimensions",
      label: "Dimensions",
      required: true,
      filterable: false,
    },
    { key: "style", label: "Style", required: true, filterable: false },
  ],
  "kitchen-dining": [
    { key: "material", label: "Material", required: true, filterable: true },
    {
      key: "dishwasherSafe",
      label: "Dishwasher Safe",
      required: true,
      filterable: true,
    },
    { key: "capacity", label: "Capacity", required: true, filterable: false },
    { key: "setSize", label: "Set Size", required: true, filterable: false },
  ],
};

async function seedSpecFields() {
  await mongoose.connect(process.env.MONGO_URI);

  const categories = await Category.find({});

  for (const category of categories) {
    let modified = false;

    for (const subcategory of category.subcategories) {
      const specFields = specFieldsBySlug[subcategory.slug];
      if (specFields) {
        subcategory.specFields = specFields;
        modified = true;
        console.log(
          `Set specFields for "${category.name} > ${subcategory.name}"`,
        );
      }
    }

    if (modified) {
      await category.save();
    }
  }

  console.log("specFields seeding complete.");
  process.exit(0);
}

seedSpecFields().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
