require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");

const categories = [
  {
    name: "Electronics",
    slug: "electronics",
    subcategories: [
      { name: "Mobile", slug: "mobile" },
      { name: "Laptops", slug: "laptops" },
    ],
  },
  {
    name: "Sports",
    slug: "sports",
    subcategories: [
      { name: "Football", slug: "football" },
      { name: "Fitness", slug: "fitness" },
    ],
  },
  {
    name: "Books",
    slug: "books",
    subcategories: [
      { name: "Programming", slug: "programming" },
      { name: "Fiction", slug: "fiction" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    subcategories: [
      { name: "Men", slug: "men" },
      { name: "Women", slug: "women" },
    ],
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    subcategories: [
      { name: "Decor", slug: "decor" },
      { name: "Kitchen & Dining", slug: "kitchen-dining" },
    ],
  },
];

async function seedCategories() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const categoryData of categories) {
    const existing = await Category.findOne({ slug: categoryData.slug });
    if (existing) {
      console.log(`Skipping "${categoryData.name}" — already exists.`);
      continue;
    }

    await Category.create(categoryData);
    console.log(`Created category: ${categoryData.name}`);
  }

  console.log("Category seeding complete.");
  process.exit(0);
}

seedCategories().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
