const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { loginLimiter, otpRequestLimiter, otpVerifyLimiter } = require('../middleware/rateLimit.middleware');
const {
  loginSchema,
  changePasswordSchema,
  firstLoginPasswordSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordWithTokenSchema,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Self-service password reset (public, no session): request an OTP email,
// verify it for a short-lived reset token, then use that token to set a new
// password. Independent of the authenticated change-password flow below.
router.post('/forgot-password', otpRequestLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-otp', otpVerifyLimiter, validate(verifyResetOtpSchema), authController.verifyResetOtp);
router.put(
  '/reset-password-with-token',
  otpVerifyLimiter,
  validate(resetPasswordWithTokenSchema),
  authController.resetPasswordWithToken
);

// Authenticated, but intentionally NOT gated by requirePasswordChanged —
// a user with mustChangePassword=true still needs these to complete setup.
router.get('/me', authenticate, authController.me);
router.put(
  '/first-login-password',
  authenticate,
  validate(firstLoginPasswordSchema),
  authController.firstLoginPasswordChange
);
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
