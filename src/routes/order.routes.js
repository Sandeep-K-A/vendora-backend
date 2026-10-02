const express = require("express");
const router = express.Router();

const { protect, requireVendor } = require("../middleware/auth.middleware");
const {
  getMyOrders,
  getOrderById,
  cancelOrder,
  getMySellerOrders,
  updateOrderStatus,
  getMySellerOrderById,
} = require("../controllers/order.controller");

router.get("/me", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/cancel", protect, cancelOrder);

router.get("/seller/me", protect, requireVendor, getMySellerOrders);
router.patch("/seller/:id/status", protect, requireVendor, updateOrderStatus);
router.get("/seller/:id", protect, requireVendor, getMySellerOrderById);

module.exports = router;
