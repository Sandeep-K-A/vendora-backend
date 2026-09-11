require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Store = require("../models/Store");
const Product = require("../models/Product");

// Placeholder image URLs — replace with real Cloudinary URLs if you
// want actual images, or leave as-is for testing (broken image icons
// are fine for seed/test data).
const PLACEHOLDER_IMAGES = [
  "https://via.placeholder.com/500x500?text=Product+Image",
];

const LAPTOP_PRODUCTS = [
  {
    name: "Dell XPS 15",
    about: "A powerful, sleek laptop built for creators and professionals.",
    price: 129999,
    stock: 15,
    specs: {
      processor: "Intel Core i7-13700H",
      ram: "32GB",
      storage: "1TB SSD",
      screenSize: "15.6 inch",
      batteryLife: "12 hours",
    },
  },
  {
    name: "MacBook Air M3",
    about: "Thin, light, and fast — ideal for everyday productivity.",
    price: 114900,
    stock: 20,
    specs: {
      processor: "Apple M3",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: "13.6 inch",
      batteryLife: "18 hours",
    },
  },
  {
    name: "HP Pavilion 15",
    about: "A reliable everyday laptop for work and study.",
    price: 54999,
    stock: 30,
    specs: {
      processor: "Intel Core i5-1235U",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: "15.6 inch",
      batteryLife: "8 hours",
    },
  },
  {
    name: "Lenovo ThinkPad E14",
    about: "Business-grade durability with solid performance.",
    price: 64999,
    stock: 18,
    specs: {
      processor: "AMD Ryzen 5 7530U",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: "14 inch",
      batteryLife: "10 hours",
    },
  },
  {
    name: "ASUS ROG Strix G16",
    about: "A gaming powerhouse with high refresh rate visuals.",
    price: 149999,
    stock: 10,
    specs: {
      processor: "Intel Core i9-13980HX",
      ram: "32GB",
      storage: "1TB SSD",
      screenSize: "16 inch",
      batteryLife: "6 hours",
    },
  },
  {
    name: "Acer Aspire 7",
    about: "Budget-friendly performance for students and casual gaming.",
    price: 59999,
    stock: 25,
    specs: {
      processor: "AMD Ryzen 7 5700U",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: "15.6 inch",
      batteryLife: "9 hours",
    },
  },
  {
    name: "MacBook Pro 14",
    about: "Pro-level performance in a compact, portable form.",
    price: 199999,
    stock: 8,
    specs: {
      processor: "Apple M3 Pro",
      ram: "18GB",
      storage: "512GB SSD",
      screenSize: "14.2 inch",
      batteryLife: "17 hours",
    },
  },
  {
    name: "Samsung Galaxy Book4",
    about: "A slim Windows laptop with vivid AMOLED display.",
    price: 84999,
    stock: 14,
    specs: {
      processor: "Intel Core i5-1340P",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: "15.6 inch",
      batteryLife: "10 hours",
    },
  },
];

const MOBILE_PRODUCTS = [
  {
    name: "iQOO Neo 10R",
    about:
      "The iQOO Neo 10R 5G is a performance-focused smartphone powered by the Snapdragon 8s Gen 3.",
    price: 24999,
    stock: 20,
    specs: {
      brand: "iQOO",
      ram: "12GB",
      storage: "128GB",
      batteryCapacity: "6400 mAh",
      screenSize: "6.78 inches",
    },
  },
  {
    name: "iPhone 15",
    about: "Apple's latest with a durable design and A16 Bionic chip.",
    price: 79999,
    stock: 12,
    specs: {
      brand: "Apple",
      ram: "6GB",
      storage: "128GB",
      batteryCapacity: "3349 mAh",
      screenSize: "6.1 inches",
    },
  },
  {
    name: "Samsung Galaxy S24",
    about: "Flagship performance with a stunning Dynamic AMOLED display.",
    price: 74999,
    stock: 15,
    specs: {
      brand: "Samsung",
      ram: "8GB",
      storage: "256GB",
      batteryCapacity: "4000 mAh",
      screenSize: "6.2 inches",
    },
  },
  {
    name: "OnePlus 12R",
    about: "Flagship-level performance at a mid-range price.",
    price: 39999,
    stock: 22,
    specs: {
      brand: "OnePlus",
      ram: "16GB",
      storage: "256GB",
      batteryCapacity: "5500 mAh",
      screenSize: "6.78 inches",
    },
  },
  {
    name: "Redmi Note 13 Pro",
    about: "A camera-focused mid-ranger with a curved AMOLED display.",
    price: 21999,
    stock: 30,
    specs: {
      brand: "Redmi",
      ram: "8GB",
      storage: "128GB",
      batteryCapacity: "5100 mAh",
      screenSize: "6.67 inches",
    },
  },
  {
    name: "Nothing Phone 2",
    about: "A distinctive design with a clean software experience.",
    price: 34999,
    stock: 16,
    specs: {
      brand: "Nothing",
      ram: "12GB",
      storage: "256GB",
      batteryCapacity: "4700 mAh",
      screenSize: "6.7 inches",
    },
  },
  {
    name: "Realme GT 6",
    about: "Flagship-tier specs aimed at performance enthusiasts.",
    price: 35999,
    stock: 19,
    specs: {
      brand: "Realme",
      ram: "12GB",
      storage: "256GB",
      batteryCapacity: "5500 mAh",
      screenSize: "6.78 inches",
    },
  },
];

async function seedProducts() {
  await mongoose.connect(process.env.MONGO_URI);

  // 1. Find the Electronics category and its Laptops/Mobile subcategories
  const electronics = await Category.findOne({ slug: "electronics" });
  if (!electronics) {
    throw new Error(
      'Category "electronics" not found — run the category seed script first.',
    );
  }

  const laptopsSubcategory = electronics.subcategories.find(
    (s) => s.slug === "laptops",
  );
  const mobileSubcategory = electronics.subcategories.find(
    (s) => s.slug === "mobile",
  );

  if (!laptopsSubcategory || !mobileSubcategory) {
    throw new Error(
      'Subcategories "laptops" or "mobile" not found under Electronics.',
    );
  }

  // 2. Find a store to own these products — the FIRST store in your DB.
  // Adjust the filter if you want a specific seller's store instead.
  const store = await Store.findOne({});
  if (!store) {
    throw new Error(
      "No store found — create a store first before seeding products.",
    );
  }

  console.log(`Seeding products for store: ${store.storeName} (${store._id})`);
  console.log(`Electronics category: ${electronics._id}`);
  console.log(`Laptops subcategory: ${laptopsSubcategory._id}`);
  console.log(`Mobile subcategory: ${mobileSubcategory._id}`);

  const toSpecArray = (specsObj, specFields) =>
    Object.entries(specsObj).map(([key, value]) => {
      const field = specFields.find((f) => f.key === key);
      return { key, label: field ? field.label : key, value };
    });

  const laptopDocs = LAPTOP_PRODUCTS.map((p) => ({
    store: store._id,
    category: electronics._id,
    subcategoryId: laptopsSubcategory._id,
    name: p.name,
    aboutThisProduct: p.about,
    keyHighlights: [p.about], // simple placeholder highlight; edit later if desired
    price: p.price,
    stock: p.stock,
    images: PLACEHOLDER_IMAGES,
    specifications: toSpecArray(p.specs, laptopsSubcategory.specFields),
  }));

  const mobileDocs = MOBILE_PRODUCTS.map((p) => ({
    store: store._id,
    category: electronics._id,
    subcategoryId: mobileSubcategory._id,
    name: p.name,
    aboutThisProduct: p.about,
    keyHighlights: [p.about],
    price: p.price,
    stock: p.stock,
    images: PLACEHOLDER_IMAGES,
    specifications: toSpecArray(p.specs, mobileSubcategory.specFields),
  }));

  const allDocs = [...laptopDocs, ...mobileDocs];

  await Product.insertMany(allDocs);

  console.log(
    `Seeded ${allDocs.length} products (${laptopDocs.length} laptops, ${mobileDocs.length} mobiles).`,
  );
  process.exit(0);
}

seedProducts().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
