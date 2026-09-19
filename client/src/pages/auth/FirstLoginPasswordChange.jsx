import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiBookOpen, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import { ROLE_HOME } from '../../routes/ProtectedRoute';
import ThemeToggle from '../../components/common/ThemeToggle';

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current temporary password is required'),
    newPassword: z
      .string()
      .regex(
        PASSWORD_POLICY_REGEX,
        'Must be 8+ characters with an uppercase letter, lowercase letter, number, and special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

function FirstLoginPasswordChange() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const { data } = await authService.firstLoginPasswordChange(payload);
      setUser(data.data.user);
      toast.success('Password set. Welcome!');
      navigate(ROLE_HOME[data.data.user.role] || '/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not set password');
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

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h1>Set a new password</h1>
          <p className="auth-subtitle">This is your first login. Set a permanent password to continue.</p>

          <label htmlFor="currentPassword">Temporary password</label>
          <input id="currentPassword" type="password" {...register('currentPassword')} />
          {errors.currentPassword && <p className="field-error">{errors.currentPassword.message}</p>}

          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" type="password" {...register('newPassword')} />
          {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input id="confirmPassword" type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : 'Set password'}
            {!submitting && <FiArrowRight />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FirstLoginPasswordChange;
