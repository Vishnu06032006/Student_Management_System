const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const PasswordResetOTP = require('../models/PasswordResetOTP');
const ApiError = require('../utils/ApiError');
const { hashPassword, comparePassword } = require('../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} = require('../utils/jwt');
const { logActivity } = require('../utils/activityLogger');
const { generateOtp, hashOtp } = require('../utils/otp');
const { sendMail } = require('../utils/email');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
// Generic response for both branches so the endpoint never confirms or
// denies whether a given loginId exists (account enumeration protection).
const GENERIC_OTP_RESPONSE_MESSAGE = 'If that account exists, a verification code has been sent to its registered email.';

async function issueTokens(user, req) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshSession.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
}

async function revokeAllSessions(userId) {
  await RefreshSession.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

async function login({ loginId, password }, req) {
  const user = await User.findOne({ loginId: loginId.trim().toUpperCase() }).select('+passwordHash');

  if (!user) {
    throw new ApiError(401, 'Invalid login ID or password');
  }

  if (user.status === 'DISABLED') {
    throw new ApiError(403, 'Your account has been disabled. Please contact the administrator.');
  }

  if (user.status === 'LOCKED') {
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.accountLockedUntil - new Date()) / 60000);
      throw new ApiError(423, `Account is locked. Please try again in ${minutesLeft} minute(s).`);
    }
    // Lock duration has passed; auto-unlock before checking the password.
    user.status = 'ENABLED';
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.status = 'LOCKED';
      user.accountLockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await user.save();
    await logActivity({ user, action: 'LOGIN_FAILED', entityType: 'User', entityId: user.id, req });
    throw new ApiError(401, 'Invalid login ID or password');
  }

  user.failedLoginAttempts = 0;
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = await issueTokens(user, req);
  await logActivity({ user, action: 'LOGIN_SUCCESS', entityType: 'User', entityId: user.id, req });

  return { user, accessToken, refreshToken };
}

async function refresh(refreshToken, req) {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token missing');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const session = await RefreshSession.findOne({ tokenHash });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    throw new ApiError(401, 'Session expired, please log in again');
  }

  const user = await User.findById(decoded.sub);
  if (!user || user.status !== 'ENABLED') {
    throw new ApiError(401, 'Account is not active');
  }

  // Rotate: revoke the used refresh token and issue a new pair.
  session.revokedAt = new Date();
  await session.save();

  const tokens = await issueTokens(user, req);
  return { user, ...tokens };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await RefreshSession.updateOne({ tokenHash, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

async function changePassword(user, { currentPassword, newPassword }, req) {
  const fullUser = await User.findById(user._id).select('+passwordHash');
  const matches = await comparePassword(currentPassword, fullUser.passwordHash);
  if (!matches) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  fullUser.passwordHash = await hashPassword(newPassword);
  fullUser.mustChangePassword = false;
  fullUser.passwordChangedAt = new Date();
  await fullUser.save();
  await revokeAllSessions(fullUser._id);
  await logActivity({ user: fullUser, action: 'PASSWORD_CHANGED', entityType: 'User', entityId: fullUser.id, req });

  return fullUser;
}

async function firstLoginPasswordChange(user, { currentPassword, newPassword }, req) {
  if (!user.mustChangePassword) {
    throw new ApiError(400, 'Password has already been set');
  }
  return changePassword(user, { currentPassword, newPassword }, req);
}

async function requestPasswordReset({ loginId }, req) {
  const user = await User.findOne({ loginId: loginId.trim().toUpperCase() });

  // Always the same response/timing-shape regardless of whether the account
  // exists, is disabled, or is locked - don't let this endpoint be used to
  // probe which login IDs are real. A disabled account also must not be able
  // to self-service its way back into an active session, so it's silently
  // skipped rather than told "your account is disabled."
  if (!user || user.status !== 'ENABLED') {
    return { message: GENERIC_OTP_RESPONSE_MESSAGE };
  }

  const otp = generateOtp();
  await PasswordResetOTP.updateMany({ userId: user._id, consumed: false }, { $set: { consumed: true } });
  await PasswordResetOTP.create({
    userId: user._id,
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendMail({
    to: user.email,
    subject: 'Your password reset code',
    text: `Your verification code is ${otp}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Your verification code is <strong style="font-size:20px">${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  });

  await logActivity({
    user,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'User',
    entityId: user.id,
    description: 'Requested a password reset OTP',
    req,
  });

  return { message: GENERIC_OTP_RESPONSE_MESSAGE };
}

async function verifyResetOtp({ loginId, otp }, req) {
  const user = await User.findOne({ loginId: loginId.trim().toUpperCase() });
  if (!user || user.status !== 'ENABLED') {
    throw new ApiError(400, 'Invalid or expired code');
  }

  const record = await PasswordResetOTP.findOne({ userId: user._id, consumed: false }).sort({ createdAt: -1 });
  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'Invalid or expired code');
  }

  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    record.consumed = true;
    await record.save();
    throw new ApiError(429, 'Too many incorrect attempts. Please request a new code.');
  }

  if (record.otpHash !== hashOtp(otp)) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, 'Invalid or expired code');
  }

  record.consumed = true;
  await record.save();

  await logActivity({
    user,
    action: 'PASSWORD_RESET_OTP_VERIFIED',
    entityType: 'User',
    entityId: user.id,
    description: 'Verified password reset OTP',
    req,
  });

  return { resetToken: signPasswordResetToken(user) };
}

async function resetPasswordWithToken({ resetToken, newPassword }, req) {
  let decoded;
  try {
    decoded = verifyPasswordResetToken(resetToken);
  } catch (err) {
    throw new ApiError(401, 'This reset session has expired. Please start again.');
  }

  const user = await User.findById(decoded.sub);
  if (!user || user.status !== 'ENABLED') {
    throw new ApiError(401, 'This reset session is no longer valid.');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0;
  await user.save();
  await revokeAllSessions(user._id);

  await logActivity({
    user,
    action: 'PASSWORD_RESET_SELF_SERVICE',
    entityType: 'User',
    entityId: user.id,
    description: 'Reset password via email OTP verification',
    req,
  });

  return user;
}

module.exports = {
  login,
  refresh,
  logout,
  changePassword,
  firstLoginPasswordChange,
  revokeAllSessions,
  requestPasswordReset,
  verifyResetOtp,
  resetPasswordWithToken,
};
