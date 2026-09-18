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
      required: false,
      filterable: false,
    },
    {
      key: "screenSize",
      label: "Screen Size",
      required: false,
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
      required: false,
      filterable: false,
    },
    {
      key: "batteryLife",
      label: "Battery Life",
      required: false,
      filterable: false,
    },
  ],

  // Sports
  football: [
    { key: "size", label: "Size", required: true, filterable: true },
    { key: "material", label: "Material", required: true, filterable: true },
    { key: "weight", label: "Weight", required: false, filterable: false },
    { key: "brand", label: "Brand", required: false, filterable: false },
    { key: "type", label: "Type", required: false, filterable: false },
  ],
  fitness: [
    {
      key: "equipmentType",
      label: "Equipment Type",
      required: true,
      filterable: true,
    },
    { key: "material", label: "Material", required: false, filterable: false },
    {
      key: "weightCapacity",
      label: "Weight Capacity",
      required: false,
      filterable: false,
    },
    { key: "brand", label: "Brand", required: false, filterable: true },
  ],

  // Books
  programming: [
    { key: "author", label: "Author", required: true, filterable: true },
    { key: "language", label: "Language", required: false, filterable: true },
    { key: "isbn", label: "ISBN", required: true, filterable: false },
    { key: "pages", label: "Pages", required: false, filterable: false },
    {
      key: "publisher",
      label: "Publisher",
      required: false,
      filterable: false,
    },
  ],
  fiction: [
    { key: "author", label: "Author", required: true, filterable: true },
    { key: "language", label: "Language", required: false, filterable: true },
    { key: "isbn", label: "ISBN", required: true, filterable: false },
    { key: "pages", label: "Pages", required: false, filterable: false },
    {
      key: "publisher",
      label: "Publisher",
      required: false,
      filterable: false,
    },
  ],

  // Fashion
  men: [
    { key: "size", label: "Size", required: true, filterable: true },
    { key: "color", label: "Color", required: false, filterable: true },
    { key: "material", label: "Material", required: false, filterable: false },
    { key: "brand", label: "Brand", required: false, filterable: false },
  ],
  women: [
    { key: "size", label: "Size", required: true, filterable: true },
    { key: "color", label: "Color", required: false, filterable: true },
    { key: "material", label: "Material", required: false, filterable: false },
    { key: "brand", label: "Brand", required: false, filterable: false },
  ],

  // Home & Kitchen
  decor: [
    { key: "material", label: "Material", required: true, filterable: true },
    { key: "color", label: "Color", required: false, filterable: true },
    {
      key: "dimensions",
      label: "Dimensions",
      required: false,
      filterable: false,
    },
  ],
  "kitchen-dining": [
    { key: "material", label: "Material", required: true, filterable: true },
    {
      key: "dishwasherSafe",
      label: "Dishwasher Safe",
      required: false,
      filterable: true,
    },
    { key: "capacity", label: "Capacity", required: false, filterable: false },
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
