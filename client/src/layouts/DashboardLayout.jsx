import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/common/NotificationBell';
import LiveClock from '../components/common/LiveClock';
import ThemeToggle from '../components/common/ThemeToggle';

const DOCS_PATH = {
  ADMIN: '/admin/docs',
  STAFF: '/staff/docs',
  STUDENT: '/student/docs',
};

// Accepts either a flat `navItems` array (rendered as one unlabeled group)
// or `navGroups` ([{ label?, items }]) so a long menu can be organized into
// scannable sections instead of one undifferentiated list.
function DashboardLayout({ roleLabel, navItems, navGroups }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const groups = navGroups || [{ items: navItems || [] }];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">{roleLabel} Panel</div>
        <nav>
          {groups.map((group, i) => (
            <div className="nav-group" key={group.label || i}>
              {group.label && <div className="nav-group__label">{group.label}</div>}
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}>
                  {item.icon && <item.icon />}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span>
            {user?.loginId} · {user?.role}
          </span>
          <div className="topbar__actions">
            <LiveClock />
            <ThemeToggle />
            {user?.role && (
              <NavLink to={DOCS_PATH[user.role] || '#'} className="icon-button" title="Help & Documentation" aria-label="Help & Documentation">
                <FiBookOpen />
              </NavLink>
            )}
            <NotificationBell />
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
