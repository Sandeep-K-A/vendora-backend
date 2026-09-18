const stripe = require("../config/stripe");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");

/*
 * POST /api/checkout
 * Validates the cart, creates a Stripe Payment Intent for the full
 * total, and creates the Checkout + per-store Order documents
 * (all in "pending"/"placed" state — confirmed only once the webhook
 * reports successful payment).
 */
const createCheckout = async (req, res, next) => {
  const { addressId } = req.body;

  if (!addressId) {
    throw new ApiError(400, "A shipping address is required");
  }

  const address = await Address.findById(addressId);
  if (!address || address.user.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Address not found");
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: "items.product",
    select: "name images price stock isActive store",
  });

  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "Your cart is empty");
  }

  // Stock re-validation — the check we designed for the out-of-stock modal
  const insufficientStock = [];

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive || product.stock < item.quantity) {
      insufficientStock.push({
        productId: item.product?._id ?? item.product,
        name: product?.name ?? "Unknown product",
        requestedQuantity: item.quantity,
        availableStock: product?.stock ?? 0,
      });
    }
  }

  if (insufficientStock.length > 0) {
    throw new ApiError(
      409,
      "Some items in your cart are no longer available in the requested quantity",
      { insufficientStock },
    );
  }

  // Group items by store
  const itemsByStore = {};
  for (const item of cart.items) {
    const storeId = item.store.toString();
    if (!itemsByStore[storeId]) itemsByStore[storeId] = [];
    itemsByStore[storeId].push(item);
  }

  const shippingAddressSnapshot = {
    name: address.name,
    phone: address.phone,
    address: address.address,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
  };

  let totalAmount = 0;
  const orderDrafts = [];

  for (const [storeId, items] of Object.entries(itemsByStore)) {
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    totalAmount += subtotal;

    orderDrafts.push({
      store: storeId,
      subtotal,
      items: items.map((item) => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.images[0] ?? null,
        quantity: item.quantity,
        priceAtPurchase: item.product.price,
      })),
    });
  }

  // Stripe amounts are in the smallest currency unit — paise for INR
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalAmount * 100),
    currency: "inr",
    metadata: {
      buyerId: req.user._id.toString(),
    },
  });

  const checkout = await Checkout.create({
    buyer: req.user._id,
    totalAmount,
    paymentStatus: "pending",
    stripePaymentIntentId: paymentIntent.id,
  });

  await Order.insertMany(
    orderDrafts.map((draft) => ({
      checkout: checkout._id,
      buyer: req.user._id,
      store: draft.store,
      items: draft.items,
      shippingAddress: shippingAddressSnapshot,
      subtotal: draft.subtotal,
      status: "placed",
    })),
  );

  res.status(201).json({
    success: true,
    message: "Checkout created",
    data: {
      clientSecret: paymentIntent.client_secret,
      checkoutId: checkout._id,
      totalAmount,
    },
  });
};

const getCheckoutByPaymentIntent = async (req, res, next) => {
  const { payment_intent } = req.query;

  if (!payment_intent) {
    throw new ApiError(400, "Missing payment_intent");
  }

  const checkout = await Checkout.findOne({
    stripePaymentIntentId: payment_intent,
  });

  if (!checkout || checkout.buyer.toString() !== req.user._id.toString()) {
    throw new ApiError(404, "Checkout not found");
  }

  const orders = await Order.find({ checkout: checkout._id }).populate(
    "store",
    "storeName",
  );

  res.status(200).json({
    success: true,
    message: "Checkout fetched successfully",
    data: { checkout, orders },
  });
};

module.exports = { createCheckout, getCheckoutByPaymentIntent };
