import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  ADMIN: '/admin/dashboard',
  STAFF: '/staff/dashboard',
  STUDENT: '/student/dashboard',
};

function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/first-login-password') {
    return <Navigate to="/first-login-password" replace />;
  }

  if (!user.mustChangePassword && location.pathname === '/first-login-password') {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
export { ROLE_HOME };
