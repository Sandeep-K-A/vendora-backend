require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");

const specFieldsBySlug = {
  // Electronics
  mobile: [
    { key: "brand", label: "Brand", required: true },
    { key: "ram", label: "RAM", required: true },
    { key: "storage", label: "Storage", required: true },
    { key: "batteryCapacity", label: "Battery Capacity", required: false },
    { key: "screenSize", label: "Screen Size", required: false },
  ],
  laptops: [
    { key: "processor", label: "Processor", required: true },
    { key: "ram", label: "RAM", required: true },
    { key: "storage", label: "Storage", required: true },
    { key: "screenSize", label: "Screen Size", required: false },
    { key: "batteryLife", label: "Battery Life", required: false },
  ],

  // Sports
  football: [
    { key: "size", label: "Size", required: true },
    { key: "material", label: "Material", required: true },
    { key: "weight", label: "Weight", required: false },
    { key: "brand", label: "Brand", required: false },
    { key: "type", label: "Type", required: false },
  ],
  fitness: [
    { key: "equipmentType", label: "Equipment Type", required: true },
    { key: "material", label: "Material", required: false },
    { key: "weightCapacity", label: "Weight Capacity", required: false },
    { key: "brand", label: "Brand", required: false },
  ],

  // Books
  programming: [
    { key: "author", label: "Author", required: true },
    { key: "isbn", label: "ISBN", required: true },
    { key: "pages", label: "Pages", required: false },
    { key: "language", label: "Language", required: false },
    { key: "publisher", label: "Publisher", required: false },
  ],
  fiction: [
    { key: "author", label: "Author", required: true },
    { key: "isbn", label: "ISBN", required: true },
    { key: "pages", label: "Pages", required: false },
    { key: "language", label: "Language", required: false },
    { key: "publisher", label: "Publisher", required: false },
  ],

  // Fashion
  men: [
    { key: "size", label: "Size", required: true },
    { key: "material", label: "Material", required: false },
    { key: "color", label: "Color", required: false },
    { key: "brand", label: "Brand", required: false },
  ],
  women: [
    { key: "size", label: "Size", required: true },
    { key: "material", label: "Material", required: false },
    { key: "color", label: "Color", required: false },
    { key: "brand", label: "Brand", required: false },
  ],

  // Home & Kitchen
  decor: [
    { key: "material", label: "Material", required: true },
    { key: "dimensions", label: "Dimensions", required: false },
    { key: "color", label: "Color", required: false },
  ],
  "kitchen-dining": [
    { key: "material", label: "Material", required: true },
    { key: "capacity", label: "Capacity", required: false },
    { key: "dishwasherSafe", label: "Dishwasher Safe", required: false },
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
