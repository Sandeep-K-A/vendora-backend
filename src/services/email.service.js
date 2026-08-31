const { Resend } = require("resend");
const logger = require("../utils/logger");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (toEmail, otp) => {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: "Verify your Vendora Account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Your verification code is:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
          <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error({ err, toEmail }, "Failed to send OTP email");
    throw err;
  }
};

const sendPasswordResetEmail = async (toEmail, plainToken) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${plainToken}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: toEmail,
      subject: "Reset your Vendora password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>We received a request to reset your Vendora password. Click the
          button below to choose a new one. This link will expire in
          30 minutes.</p>
          
            href="${resetLink}"
            style="display: inline-block; background: #2d6a4f; color: #fff;
                   padding: 12px 24px; border-radius: 8px; text-decoration: none;
                   font-weight: 600; margin: 16px 0;"
          >
            Reset Password
          </a>
          <p style="color: #8a8a8a; font-size: 13px; line-height: 1.6;">
            If you didn't request this, you can safely ignore this email —
            your password will remain unchanged. This link can only be used
            once and expires automatically.
          </p>
          <p style="color: #8a8a8a; font-size: 12px;">
            Or copy and paste this link into your browser:<br />
            <span style="word-break: break-all;">${resetLink}</span>
          </p>
        </div>
      `,
    });
  } catch (err) {
    logger.error({ err, toEmail }, "Failed to send password reset email");
    throw err;
  }
};

module.exports = { sendOtpEmail, sendPasswordResetEmail };
