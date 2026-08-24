const bcrypt = require("bcryptjs");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const Vendor = require("../models/Vendor");
const ApiError = require("../utils/ApiError");
const { generateOtp, verifyRefreshToken } = require("../utils/jwt");
const { issueTokens } = require("../utils/session");
const { sendOtpEmail } = require("../services/email.service");

/*
 *POST /api/auth/register
 *Creates a new (unverified) User, and a skeleton Vendor doc if
 *role === 'vendor'. Sends an OTP for email verification.
 */

const registerUser = async (req, res, next) => {
  const { fullname, email, password, role } = req.body;

  const existingVerifiedUser = await User.findOne({ email, isVerified: true });
  if (existingVerifiedUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // If there's an existing UNVERIFIED user with this email (an abandoned
  // signup), remove it first — otherwise the unique index on email would
  // reject this new attempt even though the old one isn't "real" yet.
  await User.deleteOne({ email, isVerified: false });

  const user = await User.create({ fullname, email, password, role });

  if (role === "vendor") {
    await Vendor.create({ userId: user._id });
  }

  const otp = generateOtp();
  await user.setOtp(otp);
  await user.save();

  try {
    await sendOtpEmail(user.email, otp);
  } catch (err) {
    return res.status(201).json({
      success: true,
      message:
        "Account created, but we could not send the verification email. Please request a new code",
      data: { email: user.email, emailSent: false },
    });
  }
  res.status(201).json({
    success: true,
    message:
      "Account created. Please check your email for a verification code.",
    data: { email: user.email, emailSent: true },
  });
};

/*
 *POST /api/auth/verify-otp
 *Verifies the OTP, marks the user as verified, and auto-logs them in
 * by issuing an access + refresh token pair
 */

const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  // select('+otpHash +otpExpiresAt') — these are select:false on the
  // schema, so we must explicitly opt in here.
  const user = await User.findOne({ email }).select("+otpHash +otpExpiresAt");

  if (!user) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  if (user.isVerified) {
    throw new ApiError(409, "This account is already verified");
  }

  const isValid = await user.verifyOtp(otp);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired verification code");
  }

  user.isVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const { accessToken, refreshToken } = await issueTokens(user, req);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only over HTTPS in production
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // matches JWT_REFRESH_EXPIRES_IN default
  });

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
    data: {
      accessToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    },
  });
};

/**
 * POST /api/auth/login
 * Standard email+password login. Blocks unverified accounts. Issues a
 * fresh access+refresh token pair.
 */

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  // This person already knows this email is
  // theirs and registered; telling them "verify first"
  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  const { accessToken, refreshToken } = await issueTokens(user, req);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      accessToken,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    },
  });
};

/**
 * POST /api/auth/refresh
 * Verifies the refresh token cookie, confirms a matching LIVE session
 * still exists in the DB, then ROTATES: the old session is deleted and
 * a brand new access+refresh pair is issued.
 */

const refresh = async (req, res, next) => {
  const incomingToken = req.cookies?.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Not authenticated — no refresh token provided");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingToken);
  } catch (err) {
    res.clearCookie("refreshToken", cookieOptions);
    throw new ApiError(
      401,
      "Not authenticated — invalid or expired refresh token",
    );
  }

  // Signature/expiry alone isn't enough — confirm a LIVE session document
  // still exists. This is the actual revocation mechanism: logout or a
  // prior rotation deletes the document, so even a still-unexpired JWT
  // stops working once its matching session is gone.
  const candidateSessions = await RefreshToken.find({ userId: decoded.userId });

  let matchedSession = null;
  for (const session of candidateSessions) {
    if (await bcrypt.compare(incomingToken, session.tokenHash)) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession) {
    res.clearCookie("refreshToken", cookieOptions);
    throw new ApiError(
      401,
      "Not authenticated — session not found or already revoked",
    );
  }

  // Rotation: this specific session is consumed. A new one replaces it.
  await RefreshToken.deleteOne({ _id: matchedSession._id });

  const user = await User.findById(decoded.userId);
  if (!user) {
    res.clearCookie("refreshToken", cookieOptions);
    throw new ApiError(401, "Not authenticated — user no longer exists");
  }

  const { accessToken, refreshToken: newRefreshToken } = await issueTokens(
    user,
    req,
  );

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: { accessToken },
  });
};

/**
 * POST /api/auth/logout
 * Revokes the current device's session (deletes its RefreshToken
 * document) and clears the cookie.
 */

const logout = async (req, res, next) => {
  const incomingToken = req.cookies?.refreshToken;

  if (incomingToken) {
    try {
      // Decode first so we can scope the search to THIS user's sessions
      // only — scanning the whole collection would get slower with every
      // user added to the system
      const decoded = verifyRefreshToken(incomingToken);
      const candidateSessions = await RefreshToken.find({
        userId: decoded.userId,
      });

      for (const session of candidateSessions) {
        if (await bcrypt.compare(incomingToken, session.tokenHash)) {
          await RefreshToken.deleteOne({ _id: session._id });
          break;
        }
      }
    } catch (err) {
      // Token was already invalid/expired — nothing to revoke. Logout
      // should still succeed from the client's perspective; we're just
      // clearing a cookie that no longer points to anything live.
    }
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
module.exports = { registerUser, verifyOtp, login, refresh, logout };
