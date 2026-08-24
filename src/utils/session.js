const bcrypt = require("bcryptjs");
const RefreshToken = require("../models/RefreshToken");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");

const parseDurationToMs = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // fallback: 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * unitMs[unit];
};

const issueTokens = async (user, req) => {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // Never store the raw refresh token — same reasoning as password/OTP.
  const tokenHash = await bcrypt.hash(refreshToken, 10);

  const expiresAt = new Date(
    Date.now() + parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN || "7d"),
  );

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    userAgent: req.headers["user-agent"] || null,
    ip: req.ip || null,
  });
  return { accessToken, refreshToken };
};

module.exports = { issueTokens };
