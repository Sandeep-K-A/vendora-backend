const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const Product = require("../models/Product");
const Store = require("../models/Store");

const getMyOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { status } = req.query;

  const filter = { buyer: req.user._id };
  if (status && status !== "all") {
    filter.status =
      status === "active"
        ? { $in: ["placed", "confirmed", "shipped"] }
        : status;
  }

  // Find distinct checkouts matching the filter, newest first, paginated
  const checkoutGroups = await Order.aggregate([
    { $match: filter },
    { $group: { _id: "$checkout", latestCreatedAt: { $max: "$createdAt" } } },
    { $sort: { latestCreatedAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);
  const checkoutIds = checkoutGroups.map((c) => c._id);

  // Fetch ALL orders for those checkouts (not just ones matching the
  // status filter) — a buyer should see the full purchase context,
  // even if only one of two stores' orders matches the active tab.
  const orders = await Order.find({
    checkout: { $in: checkoutIds },
    buyer: req.user._id,
  })
    .populate("store", "storeName slug")
    .sort({ createdAt: -1 });

  const ordersByCheckout = {};
  for (const order of orders) {
    const key = order.checkout.toString();
    if (!ordersByCheckout[key]) ordersByCheckout[key] = [];
    ordersByCheckout[key].push(order);
  }

  const groups = checkoutIds.map((id) => ({
    checkoutId: id,
    orders: ordersByCheckout[id.toString()] ?? [],
  }));

  const totalCheckouts = (await Order.distinct("checkout", filter)).length;

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: {
      groups,
      page,
      totalPages: Math.ceil(totalCheckouts / limit),
      totalCount: totalCheckouts,
    },
  });
};

const getOrderById = async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("store", "storeName slug")
    .populate("checkout", "stripePaymentIntentId totalAmount paymentStatus");

  if (!order || order.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Order not found");
  }

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: { order },
  });
};

const cancelOrder = async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order || order.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Order not found");
  }

  const cancellableStatuses = ["placed", "confirmed"];
  if (!cancellableStatuses.includes(order.status)) {
    throw new ApiError(
      409,
      `This order can no longer be cancelled — it has already ${order.status}.`,
    );
  }

  order.status = "cancelled";
  await order.save();

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: { order },
  });
};

/*
 * GET /api/orders/seller/me
 * Seller's own store's orders — flat list, page-based pagination,
 * no checkout-grouping (that's a buyer-side concern only).
 */
const getMySellerOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { status, search, sort } = req.query;

  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const filter = { store: store._id };

  if (status && status !== "all") {
    filter.status =
      status === "needsAction" ? { $in: ["placed", "confirmed"] } : status;
  }

  if (search) {
    // Order IDs are ObjectIds — match if the search term is a valid
    // hex fragment; a full regex match against _id's string form.
    filter.$expr = {
      $regexMatch: {
        input: { $toString: "$_id" },
        regex: search,
        options: "i",
      },
    };
  }

  const sortOrder = sort === "oldest" ? 1 : -1;

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: {
      orders,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
};

/*
 * PATCH /api/orders/seller/:id/status
 * Seller-initiated status transition — manual, no automation.
 * Only forward transitions along the normal lifecycle are allowed;
 * a seller can't skip steps or move an order backward.
 */
const ALLOWED_TRANSITIONS = {
  confirmed: ["shipped"],
  shipped: ["delivered"],
};

const updateOrderStatus = async (req, res, next) => {
  const { status: nextStatus } = req.body;

  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const order = await Order.findOne({ _id: req.params.id, store: store._id });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowedNext.includes(nextStatus)) {
    throw new ApiError(
      409,
      `Cannot move an order from "${order.status}" to "${nextStatus}".`,
    );
  }

  order.status = nextStatus;
  await order.save();

  res.status(200).json({
    success: true,
    message: `Order marked as ${nextStatus}`,
    data: { order },
  });
};
/*
 * GET /api/order/seller/:id
 * Single order detail, scoped to the seller's own store.
 */
const getMySellerOrderById = async (req, res, next) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) {
    throw new ApiError(404, "Store not found");
  }

  const order = await Order.findOne({
    _id: req.params.id,
    store: store._id,
  }).populate("checkout", "stripePaymentIntentId paymentStatus");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: { order },
  });
};

module.exports = {
  getMyOrders,
  getOrderById,
  cancelOrder,
  getMySellerOrders,
  updateOrderStatus,
  getMySellerOrderById,
};
