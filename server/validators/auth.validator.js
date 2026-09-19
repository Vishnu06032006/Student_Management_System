const { z } = require('zod');
const { PASSWORD_POLICY_REGEX } = require('../utils/password');

const passwordField = z
  .string()
  .regex(
    PASSWORD_POLICY_REGEX,
    'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character'
  );

const loginSchema = z.object({
  loginId: z.string().trim().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const firstLoginPasswordSchema = changePasswordSchema;

const forgotPasswordSchema = z.object({
  loginId: z.string().trim().min(1, 'Login ID is required'),
});

const verifyResetOtpSchema = z.object({
  loginId: z.string().trim().min(1, 'Login ID is required'),
  otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

const resetPasswordWithTokenSchema = z
  .object({
    resetToken: z.string().min(1, 'Reset token is required'),
    newPassword: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

module.exports = {
  loginSchema,
  changePasswordSchema,
  firstLoginPasswordSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordWithTokenSchema,
};
