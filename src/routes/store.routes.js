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

router.get("/me", protect, requireVendor, getMyStore);

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
