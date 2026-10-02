const User = require("../models/User");
const Store = require("../models/Store");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Category = require("../models/Category");

const getAdminOverview = async (req, res, next) => {
  const [
    pendingStoresCount,
    activeStoresCount,
    totalUsers,
    totalOrders,
    pendingStores,
  ] = await Promise.all([
    Store.countDocuments({ verificationStatus: "pending" }),
    Store.countDocuments({ verificationStatus: "active" }),
    User.countDocuments({ role: "user" }),
    Order.countDocuments({}),
    Store.find({ verificationStatus: "pending" })
      .select("storeName logo categoryMode categories address createdAt")
      .populate("categories", "name")
      .sort({ createdAt: 1 }) // oldest-waiting first — fairness for sellers
      .limit(10),
  ]);

  res.status(200).json({
    success: true,
    message: "Admin overview fetched successfully",
    data: {
      stats: {
        pendingStores: pendingStoresCount,
        activeStores: activeStoresCount,
        totalUsers,
        totalOrders,
      },
      pendingStores,
    },
  });
};
/*
 * GET /api/admin/stores
 * All stores, page-based, filterable by verification status, search
 * by store name.
 */
const getAllStores = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { status, search, sort } = req.query;

  const filter = {};

  if (status && status !== "all") {
    filter.verificationStatus = status;
  }

  if (search) {
    filter.storeName = { $regex: search, $options: "i" };
  }

  const sortOrder = sort === "oldest" ? 1 : -1;

  const [stores, totalCount] = await Promise.all([
    Store.find(filter)
      .select("storeName logo verificationStatus address createdAt")
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
    Store.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Stores fetched successfully",
    data: {
      stores,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
};

const getStoreDetailForAdmin = async (req, res, next) => {
  const store = await Store.findById(req.params.id)
    .populate("categories", "name slug")
    .populate("owner", "fullname email createdAt");

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const [totalProducts, activeProducts, totalOrders] = await Promise.all([
    Product.countDocuments({ store: store._id }),
    Product.countDocuments({ store: store._id, isActive: true }),
    Order.countDocuments({ store: store._id, status: { $ne: "cancelled" } }),
  ]);

  res.status(200).json({
    success: true,
    message: "Store fetched successfully",
    data: {
      store,
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        totalOrders,
      },
    },
  });
};

const approveStore = async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  store.verificationStatus = "active";
  await store.save();

  res.status(200).json({
    success: true,
    message: "Store approved",
    data: { store },
  });
};

const reActivateStore = async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  store.verificationStatus = "active";
  await store.save();

  res.status(200).json({
    success: true,
    message: "Store reactivated",
    data: { store },
  });
};

const suspendStore = async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, "Store not found");

  store.verificationStatus = "suspended";
  await store.save();

  res
    .status(200)
    .json({ success: true, message: "Store suspended", data: { store } });
};

const rejectStore = async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  store.verificationStatus = "rejected";
  await store.save();

  res.status(200).json({
    success: true,
    message: "Store rejected",
    data: { store },
  });
};

const getAllUsers = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { type, search, sort } = req.query;

  const filter = {};

  if (type === "seller") {
    filter.isVendor = true;
  } else if (type === "buyer") {
    filter.isVendor = false;
    filter.role = "user";
  } else if (type === "unverified") {
    filter.isVerified = false;
  }

  if (search) {
    filter.$or = [
      { fullname: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const sortOrder = sort === "oldest" ? 1 : -1;

  const [users, totalCount] = await Promise.all([
    User.find(filter)
      .select("fullname email role isVendor isVerified createdAt storeId")
      .populate("storeId", "storeName slug")
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: {
      users,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
};

const getUserDetailForAdmin = async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select("fullname email role isVendor isVerified createdAt storeId")
    .populate("storeId", "storeName slug verificationStatus");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: { user },
  });
};

const getAllCategoriesForAdmin = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const [categories, totalCount] = await Promise.all([
    Category.find({})
      .select("name slug image isActive subcategories")
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Category.countDocuments({}),
  ]);

  // Product counts per category, same aggregation pattern used elsewhere
  const categoryIds = categories.map((c) => c._id);
  const productCounts = await Product.aggregate([
    { $match: { category: { $in: categoryIds }, isActive: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    productCounts.map((p) => [p._id.toString(), p.count]),
  );

  const categoriesWithCounts = categories.map((cat) => ({
    _id: cat._id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image,
    isActive: cat.isActive,
    subcategoryCount: cat.subcategories.length,
    productCount: countMap[cat._id.toString()] ?? 0,
  }));

  res.status(200).json({
    success: true,
    message: "Categories fetched successfully",
    data: {
      categories: categoriesWithCounts,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
};

const getCategoryDetailForAdmin = async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  res.status(200).json({
    success: true,
    message: "Category fetched successfully",
    data: { category },
  });
};

module.exports = {
  getAdminOverview,
  getAllStores,
  getStoreDetailForAdmin,
  approveStore,
  reActivateStore,
  suspendStore,
  rejectStore,
  getAllUsers,
  getUserDetailForAdmin,
  getAllCategoriesForAdmin,
  getCategoryDetailForAdmin,
};
