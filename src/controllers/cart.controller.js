const Cart = require("../models/Cart");
const Product = require("../models/Product");
const ApiError = require("../utils/ApiError");

const CART_POPULATE_OPTIONS = [
  {
    path: "items.product",
    select: "name images price stock isActive category",
    populate: { path: "category", select: "name" },
  },
  {
    path: "items.store",
    select: "storeName slug",
  },
];

const getCart = async (req, res, next) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    CART_POPULATE_OPTIONS,
  );

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({
    success: true,
    message: "Cart fetched successfully",
    data: { cart },
  });
};

const addToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    throw new ApiError(400, "A valid product and quantity are required");
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  if (product.stock < quantity) {
    throw new ApiError(400, `Only ${product.stock} unit(s) left in stock`);
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      throw new ApiError(400, `Only ${product.stock} unit(s) left in stock`);
    }
    existingItem.quantity = newQuantity;
    existingItem.priceAtAdd = product.price; // refresh snapshot on re-add
  } else {
    cart.items.push({
      product: product._id,
      store: product.store,
      quantity,
      priceAtAdd: product.price,
    });
  }

  await cart.save();
  await cart.populate(CART_POPULATE_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Added to cart",
    data: { cart },
  });
};

const updateCartItemQuantity = async (req, res, next) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "A valid quantity is required");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  const product = await Product.findById(item.product);
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product no longer available");
  }

  if (quantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} unit(s) left in stock`);
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate(CART_POPULATE_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Cart updated",
    data: { cart },
  });
};

const removeCartItem = async (req, res, next) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new ApiError(404, "Cart not found");
  }

  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, "Cart item not found");
  }

  item.deleteOne();
  await cart.save();
  await cart.populate(CART_POPULATE_OPTIONS);

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
    data: { cart },
  });
};

module.exports = { getCart, addToCart, updateCartItemQuantity, removeCartItem };
