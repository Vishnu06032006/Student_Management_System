const rateLimit = require('express-rate-limit');

// Stricter limiter for login specifically, on top of the general /api limiter,
// to slow down credential-stuffing/brute-force attempts. Keyed by the loginId
// being attempted (not by IP) so one account being hammered - or one person
// mistyping their own password - never blocks anyone else signing in from the
// same network/browser, e.g. a shared campus computer or a college lab.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (typeof req.body?.loginId === 'string' ? req.body.loginId.trim().toLowerCase() : 'unknown'),
  message: { success: false, message: 'Too many login attempts for this account. Please try again later.', errors: [] },
});

// Limits how often a client can request an OTP email - independent of the
// per-OTP wrong-attempt cap enforced in the service layer.
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset requests. Please try again later.', errors: [] },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.', errors: [] },
});

module.exports = { loginLimiter, otpRequestLimiter, otpVerifyLimiter };
