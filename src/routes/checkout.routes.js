const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const {
  createCheckout,
  getCheckoutByPaymentIntent,
} = require("../controllers/checkout.controller");

router.post("/", protect, createCheckout);
router.get("/success", protect, getCheckoutByPaymentIntent);

module.exports = router;
