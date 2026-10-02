const express = require("express");
const router = express.Router();
const { protect, requireVendor } = require("../middleware/auth.middleware");
const {
  upload,
  handleMulterError,
} = require("../middleware/upload.middleware");

const {
  createStore,
  getMyStore,
  updateStore,
  deactivateStore,
  getFeaturedStores,
  getStores,
  getStoreBySlug,
  getMyStoreAnalytics,
} = require("../controllers/store.controller");

router.post(
  "/",
  protect,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  handleMulterError,
  createStore,
);

router.get("/", getStores);

router.get("/slug/:slug", getStoreBySlug);

router.get("/featured", getFeaturedStores);

router.get("/me", protect, requireVendor, getMyStore);

router.get("/me/analytics", protect, requireVendor, getMyStoreAnalytics);

router.patch(
  "/me",
  protect,
  requireVendor,
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  handleMulterError,
  updateStore,
);

router.patch("/me/deactivate", protect, requireVendor, deactivateStore);

module.exports = router;
