import { Link } from 'react-router-dom';
import { FiBookOpen, FiShield, FiUserCheck, FiUser, FiArrowRight } from 'react-icons/fi';
import ThemeToggle from '../../components/common/ThemeToggle';

const ROLES = [
  { key: 'admin', label: 'Admin', description: 'Manage students, staff and academic records', icon: FiShield },
  { key: 'staff', label: 'Staff', description: 'Mark attendance, enter marks and view your classes', icon: FiUserCheck },
  { key: 'student', label: 'Student', description: 'View attendance, timetable and results', icon: FiUser },
];

function RoleSelect() {
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

        <h1>Welcome</h1>
        <p className="auth-subtitle">Choose how you&apos;d like to sign in.</p>

        <div className="role-select-list">
          {ROLES.map(({ key, label, description, icon: Icon }) => (
            <Link key={key} to={`/login/${key}`} className="role-select-option">
              <span className="role-select-option__icon">
                <Icon />
              </span>
              <span className="role-select-option__text">
                <span className="role-select-option__label">{label}</span>
                <span className="role-select-option__description">{description}</span>
              </span>
              <FiArrowRight className="role-select-option__arrow" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RoleSelect;
