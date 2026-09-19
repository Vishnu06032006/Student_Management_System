const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const authService = require('../services/auth.service');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
  };
}

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, req);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  sendSuccess(res, {
    message: 'Login successful',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  const { user, accessToken, refreshToken } = await authService.refresh(token, req);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  sendSuccess(res, {
    message: 'Token refreshed',
    data: { user: user.toSafeJSON(), accessToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  await authService.logout(token);
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  sendSuccess(res, { message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { message: 'Current user', data: { user: req.user.toSafeJSON() } });
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await authService.changePassword(req.user, req.body, req);
  sendSuccess(res, { message: 'Password changed successfully', data: { user: user.toSafeJSON() } });
});

const firstLoginPasswordChange = asyncHandler(async (req, res) => {
  const user = await authService.firstLoginPasswordChange(req.user, req.body, req);
  sendSuccess(res, { message: 'Password set successfully', data: { user: user.toSafeJSON() } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body, req);
  sendSuccess(res, { message: result.message });
});

const verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetOtp(req.body, req);
  sendSuccess(res, { message: 'Code verified', data: result });
});

const resetPasswordWithToken = asyncHandler(async (req, res) => {
  const user = await authService.resetPasswordWithToken(req.body, req);
  sendSuccess(res, { message: 'Password reset successfully', data: { user: user.toSafeJSON() } });
});

module.exports = {
  login,
  refresh,
  logout,
  me,
  changePassword,
  firstLoginPasswordChange,
  forgotPassword,
  verifyResetOtp,
  resetPasswordWithToken,
};
