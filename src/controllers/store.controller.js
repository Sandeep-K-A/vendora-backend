const Store = require("../models/Store");
const User = require("../models/User");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");
const { uploadImageToCloudinary } = require("../utils/uploadImage");

/*
 * POST /api/stores
 * Creates a new store for the authenticated user. Immediately flips
 * isVendor and sets storeId on the User document — dashboard access is
 * granted right away; `status` (default "pending") gates public
 * visibility/selling, not seller access.
 */

const createStore = async (req, res, next) => {
  console.log("1. Request reached createStore");
  const { storeName, storeDescription, categoryMode, gstNumber, phone } =
    req.body;

  let categories = [];
  let address = {};

  try {
    categories = req.body.categories ? JSON.parse(req.body.categories) : [];
    address = req.body.address ? JSON.parse(req.body.address) : {};
  } catch (parseErr) {
    throw new ApiError(400, "Invalid categories or address format");
  }

  const existingStore = await Store.findOne({ owner: req.user._id });
  if (existingStore) {
    throw new ApiError(409, "You already have a store");
  }

  let logoUrl = null;
  let bannerUrl = null;

  if (req.files?.logo) {
    logoUrl = await uploadImageToCloudinary(
      req.files.logo[0].buffer,
      "vendora/store-logos",
    );
  }
  if (req.files?.banner) {
    bannerUrl = await uploadImageToCloudinary(
      req.files.banner[0].buffer,
      "vendora/store-banners",
    );
  }

  const store = await Store.create({
    owner: req.user._id,
    storeName,
    storeDescription,
    logo: logoUrl,
    banner: bannerUrl,
    categoryMode,
    categories,
    phone,
    gstNumber,
    address,
  });

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      isVendor: true,
      storeId: store._id,
    },
    { returnDocument: "after" },
  );

  res.status(201).json({
    success: true,
    message: "Store created successfully. It's now pending review.",
    data: {
      store,
      user: {
        id: updatedUser._id,
        fullname: updatedUser.fullname,
        email: updatedUser.email,
        role: updatedUser.role,
        isVendor: updatedUser.isVendor,
        storeId: updatedUser.storeId,
      },
    },
  });
};

/*
 * GET /api/stores/me
 * Returns the authenticated user's own store, regardless of status —
 * this powers the seller's dashboard, where they need to see their
 * store even while pending/suspended.
 */
const getMyStore = async (req, res, next) => {
  const store = await Store.findOne({ owner: req.user._id }).populate(
    "categories",
    "name slug",
  );

  if (!store) {
    throw new ApiError(404, "You don't have a store yet");
  }

  res.status(200).json({
    success: true,
    message: "Store fetched successfully",
    data: { store },
  });
};

const updateStore = async (req, res, next) => {
  const store = await Store.findOne({ owner: req.user._id });

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const {
    storeName,
    storeDescription,
    categoryMode,
    categories,
    phone,
    address,
  } = req.body;

  if (storeName !== undefined) store.storeName = storeName;
  if (storeDescription !== undefined) store.storeDescription = storeDescription;
  if (categoryMode !== undefined) store.categoryMode = categoryMode;
  if (categories !== undefined) store.categories = JSON.parse(categories);
  if (phone !== undefined) store.phone = phone;
  if (address !== undefined) store.address = JSON.parse(address);

  // logo/banner handled separately below, since they arrive as files

  if (req.files?.logo) {
    store.logo = await uploadImageToCloudinary(
      req.files.logo[0].buffer,
      "vendora/store-logos",
    );
  }
  if (req.files?.banner) {
    store.banner = await uploadImageToCloudinary(
      req.files.banner[0].buffer,
      "vendora/store-banners",
    );
  }

  // Any successful edit requires re-approval
  store.verificationStatus = "pending";

  await store.save();

  res.status(200).json({
    success: true,
    message: "Store updated. Your changes are pending review.",
    data: { store },
  });
};

const deactivateStore = async (req, res, next) => {
  const store = await Store.findOne({ owner: req.user._id });

  if (!store) {
    throw new ApiError(404, "You don't have a store yet");
  }

  if (store.status === "suspended") {
    throw new ApiError(409, "Your store is already deactivated");
  }

  store.status = "suspended";
  await store.save();

  res.status(200).json({
    success: true,
    message: "Your store has been deactivated",
    data: { store },
  });
};

/*
 * GET /api/stores/featured
 * Returns up to 3 random, active/verified stores, each with their
 * product count and newest product — for the homepage "verified
 * sellers" section.
 */
const getFeaturedStores = async (req, res, next) => {
  const stores = await Store.aggregate([
    { $match: { verificationStatus: "active" } },
    { $sample: { size: 3 } },
  ]);

  const enrichedStores = await Promise.all(
    stores.map(async (store) => {
      const [productCount, newestProduct] = await Promise.all([
        Product.countDocuments({ store: store._id, isActive: true }),
        Product.findOne({ store: store._id, isActive: true }).sort({
          createdAt: -1,
        }),
      ]);

      // Re-populate categories, since $sample/aggregate doesn't run
      // Mongoose populate automatically
      const populatedCategories = await Store.findById(store._id)
        .select("categories")
        .populate("categories", "name slug");

      return {
        _id: store._id,
        storeName: store.storeName,
        slug: store.slug,
        logo: store.logo,
        address: { city: store.address.city },
        categoryMode: store.categoryMode,
        categories: populatedCategories.categories,
        productCount,
        newestProduct,
      };
    }),
  );

  console.log(enrichedStores);

  res.status(200).json({
    success: true,
    message: "Featured stores fetched successfully",
    data: { stores: enrichedStores },
  });
};

const getStores = async (req, res, next) => {
  const limit = parseInt(req.query.limit) || 12;

  const { search, category, sort, cursor } = req.query;

  const filter = { verificationStatus: "active" };

  if (search) {
    filter.storeName = { $regex: search, $options: "i" };
  }

  if (category) {
    filter.categories = category;
  }

  const sortConfig = {
    newest: { field: "createdAt", order: -1 },
  };
  const { field: sortField, order: sortOrder } =
    sortConfig[sort] || sortConfig.newest;

  if (cursor) {
    filter[sortField] = sortOrder === -1 ? { $lt: cursor } : { $gt: cursor };
  }

  let stores = await Store.find(filter)
    .sort({ [sortField]: sortOrder })
    .limit(limit + 1);

  const hasMore = stores.length > limit;
  const pageItems = hasMore ? stores.slice(0, limit) : stores;
  const nextCursor = hasMore
    ? pageItems[pageItems.length - 1][sortField]
    : null;

  const enrichedStores = await Promise.all(
    pageItems.map(async (store) => {
      const [productCount, newestProduct, populatedCategories] =
        await Promise.all([
          Product.countDocuments({ store: store._id, isActive: true }),
          Product.findOne({ store: store._id, isActive: true }).sort({
            createdAt: -1,
          }),
          Store.findById(store._id)
            .select("categories")
            .populate("categories", "name slug"),
        ]);

      return {
        _id: store._id,
        storeName: store.storeName,
        slug: store.slug,
        logo: store.logo,
        address: { city: store.address.city },
        categoryMode: store.categoryMode,
        categories: populatedCategories?.categories ?? [],
        productCount,
        newestProduct,
      };
    }),
  );

  const finalStores =
    sort === "mostProducts"
      ? enrichedStores.sort((a, b) => b.productCount - a.productCount)
      : enrichedStores;

  res.status(200).json({
    success: true,
    message: "Stores fetched successfully",
    data: {
      stores: finalStores,
      nextCursor,
      hasMore,
    },
  });
};

const getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({
    slug: req.params.slug,
    verificationStatus: "active",
  }).populate("categories", "name slug");

  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const productCount = await Product.countDocuments({
    store: store._id,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    message: "Store fetched successfully",
    data: {
      store: {
        _id: store._id,
        storeName: store.storeName,
        storeDescription: store.storeDescription,
        slug: store.slug,
        logo: store.logo,
        banner: store.banner,
        address: { city: store.address.city, state: store.address.state },
        categoryMode: store.categoryMode,
        categories: store.categories,
        productCount,
        createdAt: store.createdAt,
      },
    },
  });
};

module.exports = {
  createStore,
  getStores,
  getMyStore,
  updateStore,
  deactivateStore,
  getFeaturedStores,
  getStoreBySlug,
};
