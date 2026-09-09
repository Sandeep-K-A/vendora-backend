const Category = require("../models/Category");

const getCategories = async (req, res, next) => {
  const categories = await Category.find({ isActive: true });

  res.status(200).json({
    success: true,
    message: "categories fetched successfully",
    data: { categories },
  });
};

module.exports = { getCategories };
