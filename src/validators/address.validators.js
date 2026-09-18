const { z } = require("zod");

const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

const addressSchema = z.object({
  label: z.enum(["Home", "Work", "Other"]),
  name: z.string().min(2).max(50),
  phone: z.string().regex(phoneRegex, "Enter a valid 10-digit phone number"),
  address: z.string().min(5).max(200),
  landmark: z.string().max(100).optional(),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z
    .string()
    .length(6)
    .regex(/^\d+$/, "Pincode must contain only numbers"),
});

// updateAddress allows partial updates — every field optional, but
// still validated if present.
const updateAddressSchema = addressSchema.partial();

module.exports = { addressSchema, updateAddressSchema };
