import { useAuth } from '../../context/AuthContext';

function StaffDashboard() {
  const { user } = useAuth();

  return (
    <div className="page-card">
      <h2>Welcome, {user.loginId}</h2>
      <p>Signed in as {user.role}.</p>
      <p>Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'first session'}</p>
      <p>Assigned classes, attendance, and marks entry will appear here once academic assignment is built.</p>
    </div>
  );
}

export default StaffDashboard;
