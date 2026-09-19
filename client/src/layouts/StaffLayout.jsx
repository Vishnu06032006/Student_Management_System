import { FiGrid, FiCalendar, FiKey, FiEdit3, FiClipboard, FiMessageSquare, FiFileText } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';

const NAV_GROUPS = [
  { items: [{ to: '/staff/dashboard', label: 'Dashboard', end: true, icon: FiGrid }] },
  {
    label: 'My Work',
    items: [
      { to: '/staff/attendance', label: 'Attendance', icon: FiCalendar },
      { to: '/staff/marks', label: 'Marks Entry', icon: FiEdit3 },
      { to: '/staff/od-requests', label: 'OD Requests', icon: FiFileText },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/staff/leave', label: 'Leave', icon: FiClipboard },
      { to: '/staff/announcements', label: 'Announcements', icon: FiMessageSquare },
    ],
  },
  { label: 'Account', items: [{ to: '/staff/change-password', label: 'Change Password', icon: FiKey }] },
];

function StaffLayout() {
  return <DashboardLayout roleLabel="Staff" navGroups={NAV_GROUPS} />;
}

export default StaffLayout;
