const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  addressSchema,
  updateAddressSchema,
} = require("../validators/address.validators");
const {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");

router.get("/", protect, getMyAddresses);
router.post("/", protect, validate(addressSchema), createAddress);
router.patch("/:id", protect, validate(updateAddressSchema), updateAddress);
router.delete("/:id", protect, deleteAddress);
router.patch("/:id/default", protect, setDefaultAddress);

module.exports = router;
