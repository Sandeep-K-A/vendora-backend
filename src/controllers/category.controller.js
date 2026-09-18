const Product = require("../models/Product");
const Category = require("../models/Category");
const Store = require("../models/Store");

const getCategories = async (req, res, next) => {
  const categories = await Category.find({ isActive: true });

  const activeStores = await Store.find({
    verificationStatus: "active",
  }).select("_id");
  const activeStoreIds = activeStores.map((s) => s._id);

  const [categoryCounts, subcategoryCounts] = await Promise.all([
    Product.aggregate([
      { $match: { isActive: true, store: { $in: activeStoreIds } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Product.aggregate([
      { $match: { isActive: true, store: { $in: activeStoreIds } } },
      { $group: { _id: "$subcategoryId", count: { $sum: 1 } } },
    ]),
  ]);

  const categoryCountMap = Object.fromEntries(
    categoryCounts.map((c) => [c._id.toString(), c.count]),
  );
  const subcategoryCountMap = Object.fromEntries(
    subcategoryCounts.map((c) => [c._id.toString(), c.count]),
  );

  const categoriesWithCounts = categories.map((cat) => {
    const catObj = cat.toObject();
    return {
      ...catObj,
      productCount: categoryCountMap[cat._id.toString()] ?? 0,
      subcategories: catObj.subcategories.map((sub) => ({
        ...sub,
        productCount: subcategoryCountMap[sub._id.toString()] ?? 0,
      })),
    };
  });

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: { categories: categoriesWithCounts },
  });
};

module.exports = { getCategories };
