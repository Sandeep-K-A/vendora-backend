const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/auth.middleware");
const {
  getAdminOverview,
  getAllStores,
  getStoreDetailForAdmin,
  approveStore,
  reActivateStore,
  suspendStore,
  rejectStore,
  getAllUsers,
  getUserDetailForAdmin,
  getAllCategoriesForAdmin,
  getCategoryDetailForAdmin,
} = require("../controllers/admin.controller");

router.get("/overview", protect, authorize("admin"), getAdminOverview);
router.get("/stores", protect, authorize("admin"), getAllStores);
router.get("/stores/:id", protect, authorize("admin"), getStoreDetailForAdmin);
router.patch("/stores/:id/approve", protect, authorize("admin"), approveStore);
router.patch("/stores/:id/reject", protect, authorize("admin"), rejectStore);
router.patch("/stores/:id/suspend", protect, authorize("admin"), suspendStore);
router.patch(
  "/stores/:id/reactivate",
  protect,
  authorize("admin"),
  reActivateStore,
);
router.get("/users", protect, authorize("admin"), getAllUsers);
router.get("/users/:id", protect, authorize("admin"), getUserDetailForAdmin);
router.get(
  "/categories",
  protect,
  authorize("admin"),
  getAllCategoriesForAdmin,
);
router.get(
  "/categories/:id",
  protect,
  authorize("admin"),
  getCategoryDetailForAdmin,
);

module.exports = router;
