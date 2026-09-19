import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, useParams, Navigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiBookOpen, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../routes/ProtectedRoute';
import ThemeToggle from '../../components/common/ThemeToggle';

const schema = z.object({
  loginId: z.string().trim().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
});

const ROLE_META = {
  admin: { heading: 'Admin Sign In', placeholder: 'Admin login ID' },
  staff: { heading: 'Staff Sign In', placeholder: 'e.g. STF0001' },
  student: { heading: 'Student Sign In', placeholder: 'e.g. STU0001' },
};

function Login() {
  const { role } = useParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ loginId, password }) => {
    setSubmitting(true);
    try {
      const user = await login(loginId, password);
      if (user.mustChangePassword) {
        navigate('/first-login-password', { replace: true });
        return;
      }
      const from = location.state?.from?.pathname;
      navigate(from || ROLE_HOME[user.role] || '/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ROLE_META[role]) {
    return <Navigate to="/login" replace />;
  }
  const { heading, placeholder } = ROLE_META[role];

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

        <Link to="/login" className="auth-back-link">
          <FiArrowLeft /> Change role
        </Link>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <h1>{heading}</h1>
          <p className="auth-subtitle">Sign in with the credentials your administrator gave you.</p>

          <label htmlFor="loginId">Login ID</label>
          <input id="loginId" autoComplete="username" placeholder={placeholder} {...register('loginId')} />
          {errors.loginId && <p className="field-error">{errors.loginId.message}</p>}

          <div className="auth-field-header">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" className="auth-inline-link">
              Forgot password?
            </Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="field-error">{errors.password.message}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
            {!submitting && <FiArrowRight />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
