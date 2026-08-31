const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Not Authenticated - no token provided"));
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    return next(
      new ApiError(401, "Not Authenticated - invalid or expired token"),
    );
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    return next(new ApiError(401, "Not Authenticated - user no longer exist"));
  }
  req.user = user;
  next();
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Not Authenticated - no user context"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Forbidden — insufficient permissions"));
    }
    next();
  };
};

module.exports = { protect, authorize };
