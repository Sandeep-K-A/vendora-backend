const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
} = require("../controllers/cart.controller");

router.get("/", protect, getCart);
router.post("/items", protect, addToCart);
router.patch("/items/:itemId", protect, updateCartItemQuantity);
router.delete("/items/:itemId", protect, removeCartItem);

module.exports = router;
