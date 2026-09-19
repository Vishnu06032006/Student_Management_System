const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../utils/jwt');

// Verifies the access token AND re-checks current account status on every
// request, so a disabled/locked user cannot keep using an old valid token.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new ApiError(401, 'Account no longer exists');
  }
  if (user.status === 'DISABLED') {
    throw new ApiError(403, 'Your account has been disabled. Please contact the administrator.');
  }
  if (user.status === 'LOCKED') {
    throw new ApiError(423, 'Your account is locked. Please contact the administrator.');
  }

  req.user = user;
  next();
});

// Blocks access to normal protected routes until a forced password change is
// completed. Only allowed through when a route explicitly opts out (logout,
// /me, the password-change endpoints themselves).
function requirePasswordChanged(req, res, next) {
  if (req.user.mustChangePassword) {
    throw new ApiError(403, 'Password change required before continuing');
  }
  next();
}

module.exports = { authenticate, requirePasswordChanged };
