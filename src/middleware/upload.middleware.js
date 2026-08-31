const multer = require("multer");
const ApiError = require("../utils/ApiError");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new ApiError(400, "Only JPEG, PNG, and WebP images are allowed"),
      );
    }
    cb(null, true);
  },
});

function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "Image must be smaller than 5MB"));
    }
    return next(new ApiError(400, err.message));
  }
  next(err);
}

module.exports = { upload, handleMulterError };
