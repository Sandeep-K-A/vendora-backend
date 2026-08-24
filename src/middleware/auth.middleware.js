const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.starsWith("Bearer ")) {
    return next(new ApiError(401, "Not Authenticated - no token provided"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return next(
      new ApiError(401, "Not Authenticatd - invalid or expired token"),
    );
  }
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
