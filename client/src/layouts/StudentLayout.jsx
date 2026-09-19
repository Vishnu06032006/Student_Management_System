import { FiGrid, FiKey, FiAward, FiClipboard, FiMessageSquare, FiCalendar, FiClock, FiFileText } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';

const NAV_GROUPS = [
  { items: [{ to: '/student/dashboard', label: 'Dashboard', end: true, icon: FiGrid }] },
  {
    label: 'Academics',
    items: [
      { to: '/student/attendance', label: 'Attendance', icon: FiCalendar },
      { to: '/student/timetable', label: 'Timetable', icon: FiClock },
      { to: '/student/results', label: 'Results', icon: FiAward },
      { to: '/student/od-requests', label: 'OD Requests', icon: FiFileText },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/student/leave', label: 'Leave', icon: FiClipboard },
      { to: '/student/announcements', label: 'Announcements', icon: FiMessageSquare },
    ],
  },
  { label: 'Account', items: [{ to: '/student/change-password', label: 'Change Password', icon: FiKey }] },
];

function StudentLayout() {
  return <DashboardLayout roleLabel="Student" navGroups={NAV_GROUPS} />;
}

export default StudentLayout;
