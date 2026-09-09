const Store = require("../models/Store");
const User = require("../models/User");
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
  const store = await store.findOne({ owner: req.user._id });

  if (!store) {
    throw new ApiError(404, "You don't have a store yet");
  }

  const {
    storeDescription,
    categoryMode,
    categories,
    phone,
    gstNumber,
    address,
  } = req.body;

  if (storeDescription !== undefined) store.storeDescription = storeDescription;
  if (categoryMode !== undefined) store.categoryMode = categoryMode;
  if (categories !== undefined) store.categories = categories;
  if (phone !== undefined) store.phone = phone;
  if (gstNumber !== undefined) store.gstNumber = gstNumber;
  if (address !== undefined) store.address = address;

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

  await store.save();

  res.status(200).json({
    success: true,
    message: "Store updated successfully",
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

module.exports = { createStore, getMyStore, updateStore, deactivateStore };
