const Address = require("../models/Address");
const ApiError = require("../utils/ApiError");

const getMyAddresses = async (req, res, next) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    createdAt: 1,
  });

  res.status(200).json({
    success: true,
    message: "Addresses fetched successfully",
    data: { addresses },
  });
};

const createAddress = async (req, res, next) => {
  const { label, name, phone, address, landmark, city, state, pincode } =
    req.body;

  const existing = await Address.findOne({ user: req.user._id, label });
  if (existing) {
    throw new ApiError(
      409,
      `You already have a ${label} address. Edit or delete it to add a new one.`,
    );
  }

  const addressCount = await Address.countDocuments({ user: req.user._id });
  const isFirstAddress = addressCount === 0;

  const newAddress = await Address.create({
    user: req.user._id,
    label,
    name,
    phone,
    address,
    landmark,
    city,
    state,
    pincode,
    isDefault: isFirstAddress, // auto-default the very first one, per our earlier decision
  });

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    data: { address: newAddress },
  });
};

const updateAddress = async (req, res, next) => {
  const { id } = req.params;
  const { label, name, phone, address, landmark, city, state, pincode } =
    req.body;

  const existingAddress = await Address.findById(id);
  if (
    !existingAddress ||
    existingAddress.user.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(404, "Address not found");
  }

  if (label && label !== existingAddress.label) {
    const labelTaken = await Address.findOne({
      user: req.user._id,
      label,
      _id: { $ne: id },
    });
    if (labelTaken) {
      throw new ApiError(409, `You already have a ${label} address.`);
    }
    existingAddress.label = label;
  }

  if (name !== undefined) existingAddress.name = name;
  if (phone !== undefined) existingAddress.phone = phone;
  if (address !== undefined) existingAddress.address = address;
  if (landmark !== undefined) existingAddress.landmark = landmark;
  if (city !== undefined) existingAddress.city = city;
  if (state !== undefined) existingAddress.state = state;
  if (pincode !== undefined) existingAddress.pincode = pincode;

  await existingAddress.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: { address: existingAddress },
  });
};

const deleteAddress = async (req, res, next) => {
  const { id } = req.params;

  const existingAddress = await Address.findById(id);
  if (
    !existingAddress ||
    existingAddress.user.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(404, "Address not found");
  }

  const wasDefault = existingAddress.isDefault;
  await existingAddress.deleteOne();

  if (wasDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id }).sort({
      createdAt: 1,
    });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
};

const setDefaultAddress = async (req, res, next) => {
  const { id } = req.params;

  const existingAddress = await Address.findById(id);
  if (
    !existingAddress ||
    existingAddress.user.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(404, "Address not found");
  }

  await Address.updateMany({ user: req.user._id }, { isDefault: false });
  existingAddress.isDefault = true;
  await existingAddress.save();

  res.status(200).json({
    success: true,
    message: "Default address updated",
    data: { address: existingAddress },
  });
};

module.exports = {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
