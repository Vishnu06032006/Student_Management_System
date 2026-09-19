import {
  FiGrid,
  FiUsers,
  FiUserCheck,
  FiKey,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiClipboard,
  FiMessageSquare,
  FiBarChart2,
  FiTrendingUp,
  FiList,
  FiDatabase,
} from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';

const NAV_GROUPS = [
  {
    items: [{ to: '/admin/dashboard', label: 'Dashboard', end: true, icon: FiGrid }],
  },
  {
    label: 'People',
    items: [
      { to: '/admin/students', label: 'Students', icon: FiUsers },
      { to: '/admin/staff', label: 'Staff', icon: FiUserCheck },
    ],
  },
  {
    label: 'Academics',
    items: [
      { to: '/admin/academic', label: 'Academic Structure', icon: FiBookOpen },
      { to: '/admin/attendance', label: 'Attendance', icon: FiCalendar },
      { to: '/admin/timetable', label: 'Timetable', icon: FiClock },
      { to: '/admin/exams', label: 'Examinations', icon: FiEdit3 },
      { to: '/admin/promotion', label: 'Promotion', icon: FiTrendingUp },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/admin/leave', label: 'Leave', icon: FiClipboard },
      { to: '/admin/announcements', label: 'Announcements', icon: FiMessageSquare },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/admin/reports', label: 'Reports', icon: FiBarChart2 }],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/activity-logs', label: 'Activity Logs', icon: FiList },
      { to: '/admin/backup', label: 'Backup', icon: FiDatabase },
      { to: '/admin/change-password', label: 'Change Password', icon: FiKey },
    ],
  },
];

function AdminLayout() {
  return <DashboardLayout roleLabel="Admin" navGroups={NAV_GROUPS} />;
}

export default AdminLayout;
