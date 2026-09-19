const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, loginId: user.loginId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), jti: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Short-lived, single-purpose token proving the holder just verified an OTP
// for this user - not a session token, only accepted by the password-reset
// endpoint (checked via the `type` claim).
function signPasswordResetToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), type: 'password_reset', jti: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '10m' }
  );
}

function verifyPasswordResetToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  if (decoded.type !== 'password_reset') {
    throw new Error('Invalid token type');
  }
  return decoded;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
};
