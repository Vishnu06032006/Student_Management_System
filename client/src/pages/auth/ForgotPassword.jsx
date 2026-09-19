import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiBookOpen, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import * as authService from '../../services/authService';
import ThemeToggle from '../../components/common/ThemeToggle';

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const loginIdSchema = z.object({ loginId: z.string().trim().min(1, 'Login ID is required') });
const otpSchema = z.object({ otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code') });
const passwordSchema = z
  .object({
    newPassword: z
      .string()
      .regex(PASSWORD_POLICY_REGEX, 'Must be 8+ characters with uppercase, lowercase, number, and special character'),
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('loginId'); // loginId -> otp -> password -> done
  const [loginId, setLoginId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loginIdForm = useForm({ resolver: zodResolver(loginIdSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const submitLoginId = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await authService.forgotPassword(values.loginId);
      setLoginId(values.loginId);
      toast.success(data.message);
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const submitOtp = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await authService.verifyResetOtp(loginId, values.otp);
      setResetToken(data.data.resetToken);
      setStep('password');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setSubmitting(false);
    }
  };

  const submitPassword = async (values) => {
    setSubmitting(true);
    try {
      await authService.resetPasswordWithToken({ resetToken, ...values });
      toast.success('Password reset. You can now sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggle className="auth-page__theme-toggle" />

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand__mark">
            <FiBookOpen />
          </span>
          <div>
            <div className="auth-brand__name">Student &amp; Staff Management</div>
            <div className="auth-brand__tagline">Institutional ERP</div>
          </div>
        </div>

        {step === 'loginId' && (
          <form onSubmit={loginIdForm.handleSubmit(submitLoginId)} noValidate>
            <h1>Reset your password</h1>
            <p className="auth-subtitle">Enter your Login ID and we'll email a verification code to your registered address.</p>

            <label htmlFor="loginId">Login ID</label>
            <input id="loginId" autoComplete="username" placeholder="e.g. STU0001" {...loginIdForm.register('loginId')} />
            {loginIdForm.formState.errors.loginId && (
              <p className="field-error">{loginIdForm.formState.errors.loginId.message}</p>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send code'}
              {!submitting && <FiArrowRight />}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={otpForm.handleSubmit(submitOtp)} noValidate>
            <h1>Enter verification code</h1>
            <p className="auth-subtitle">We sent a 6-digit code to the email on file for {loginId}. It expires in 10 minutes.</p>

            <label htmlFor="otp">Verification code</label>
            <input id="otp" inputMode="numeric" maxLength={6} placeholder="123456" {...otpForm.register('otp')} />
            {otpForm.formState.errors.otp && <p className="field-error">{otpForm.formState.errors.otp.message}</p>}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify code'}
              {!submitting && <FiArrowRight />}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(submitPassword)} noValidate>
            <h1>Set a new password</h1>
            <p className="auth-subtitle">Code verified. Choose a new password for your account.</p>

            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
            {passwordForm.formState.errors.newPassword && (
              <p className="field-error">{passwordForm.formState.errors.newPassword.message}</p>
            )}

            <label htmlFor="confirmPassword">Confirm new password</label>
            <input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="field-error">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Reset password'}
              {!submitting && <FiArrowRight />}
            </button>
          </form>
        )}

        <Link to="/login" className="auth-back-link">
          <FiArrowLeft /> Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;
