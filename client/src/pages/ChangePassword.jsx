import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import * as authService from '../services/authService';

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
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

function ChangePassword() {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await authService.changePassword(payload);
      toast.success('Password changed. Please use it next time you sign in.');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-card">
      <h2>Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="currentPassword">Current password</label>
        <input id="currentPassword" type="password" {...register('currentPassword')} />
        {errors.currentPassword && <p className="field-error">{errors.currentPassword.message}</p>}

        <label htmlFor="newPassword">New password</label>
        <input id="newPassword" type="password" {...register('newPassword')} />
        {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}

        <label htmlFor="confirmPassword">Confirm new password</label>
        <input id="confirmPassword" type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="field-error">{errors.confirmPassword.message}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Change password'}
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;
