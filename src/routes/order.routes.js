const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const {
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/order.controller");

router.get("/me", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.patch("/:id/cancel", protect, cancelOrder);

module.exports = router;
