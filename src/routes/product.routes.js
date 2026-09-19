const express = require("express");
const router = express.Router();

const { protect, requireVendor } = require("../middleware/auth.middleware");
const {
  upload,
  handleMulterError,
} = require("../middleware/upload.middleware");

const {
  createProduct,
  getMyProducts,
  getProductById,
  getMyProductById,
  updateProduct,
  getSpecFilters,
  updateProductStock,
  deactivateProduct,
  getProducts,
  getTrendingProducts,
} = require("../controllers/product.controller");

router.post(
  "/",
  protect,
  requireVendor,
  upload.fields([{ name: "images", maxCount: 8 }]),
  handleMulterError,
  createProduct,
);

router.get("/me", protect, requireVendor, getMyProducts);
router.get("/spec-filters", getSpecFilters);
router.get("/", getProducts);
router.get("/trending", getTrendingProducts);
router.get("/:id", getProductById); // public — buyers view product details too

router.get("/me/:id", protect, requireVendor, getMyProductById);
router.patch(
  "/:id",
  protect,
  requireVendor,
  upload.fields([{ name: "images", maxCount: 8 }]),
  handleMulterError,
  updateProduct,
);

router.patch("/:id/stock", protect, requireVendor, updateProductStock);
router.patch("/:id/deactivate", protect, requireVendor, deactivateProduct);

module.exports = router;
