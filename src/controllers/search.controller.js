const Product = require("../models/Product");
const Store = require("../models/Store");

const search = async (req, res, next) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(200).json({
      success: true,
      message: "Search results fetched successfully",
      data: { products: [], stores: [] },
    });
  }

  const activeStores = await Store.find({
    verificationStatus: "active",
  }).select("_id");
  const activeStoreIds = activeStores.map((s) => s._id);

  const [products, stores] = await Promise.all([
    Product.find({
      name: { $regex: q, $options: "i" },
      isActive: true,
      store: { $in: activeStoreIds },
    })
      .select("name images price")
      .limit(3),
    Store.find({
      storeName: { $regex: q, $options: "i" },
      verificationStatus: "active",
    })
      .select("storeName slug logo")
      .limit(3),
  ]);

  const combinedProducts = products.slice(0, 3);
  const remainingSlots = 3 - combinedProducts.length;
  const combinedStores =
    remainingSlots > 0 ? stores.slice(0, remainingSlots) : [];

  res.status(200).json({
    success: true,
    message: "Search results fetched successfully",
    data: { products: combinedProducts, stores: combinedStores },
  });
};

module.exports = { search };
