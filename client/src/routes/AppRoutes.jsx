import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute, { ROLE_HOME } from './ProtectedRoute';

import Login from '../pages/auth/Login';
import RoleSelect from '../pages/auth/RoleSelect';
import ForgotPassword from '../pages/auth/ForgotPassword';
import FirstLoginPasswordChange from '../pages/auth/FirstLoginPasswordChange';
import ChangePassword from '../pages/ChangePassword';

import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import StudentLayout from '../layouts/StudentLayout';

import AdminDashboard from '../pages/admin/Dashboard';
import StaffDashboard from '../pages/staff/Dashboard';
import StudentDashboard from '../pages/student/Dashboard';

import StudentList from '../pages/admin/students/StudentList';
import StudentDetail from '../pages/admin/students/StudentDetail';
import StaffList from '../pages/admin/staff/StaffList';
import StaffDetail from '../pages/admin/staff/StaffDetail';
import AcademicStructure from '../pages/admin/academic/AcademicStructure';
import AttendanceShortagePage from '../pages/admin/attendance/AttendanceShortagePage';
import TimetablePage from '../pages/admin/timetable/TimetablePage';
import ExamsPage from '../pages/admin/exams/ExamsPage';
import StaffAttendance from '../pages/staff/Attendance';
import StaffMarksEntry from '../pages/staff/MarksEntry';
import StudentResults from '../pages/student/Results';
import StudentAttendanceCalendar from '../pages/student/AttendanceCalendar';
import StudentTimetable from '../pages/student/Timetable';
import StudentODRequests from '../pages/student/ODRequests';
import StaffODRequests from '../pages/staff/ODRequests';
import LeaveManagement from '../pages/admin/leave/LeaveManagement';
import AdminAnnouncementsPage from '../pages/admin/announcements/AnnouncementsPage';
import ReportsPage from '../pages/admin/reports/ReportsPage';
import PromotionPage from '../pages/admin/promotion/PromotionPage';
import ActivityLogPage from '../pages/admin/activityLog/ActivityLogPage';
import BackupPage from '../pages/admin/backup/BackupPage';
import Leave from '../pages/Leave';
import Announcements from '../pages/Announcements';
import AdminDocs from '../pages/docs/AdminDocs';
import StaffDocs from '../pages/docs/StaffDocs';
import StudentDocs from '../pages/docs/StudentDocs';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<RoleSelect />} />
      <Route path="/login/:role" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/first-login-password" element={<FirstLoginPasswordChange />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<StudentList />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="staff" element={<StaffList />} />
          <Route path="staff/:id" element={<StaffDetail />} />
          <Route path="academic" element={<AcademicStructure />} />
          <Route path="attendance" element={<AttendanceShortagePage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="exams" element={<ExamsPage />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="activity-logs" element={<ActivityLogPage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="docs" element={<AdminDocs />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STAFF']} />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="attendance" element={<StaffAttendance />} />
          <Route path="marks" element={<StaffMarksEntry />} />
          <Route path="od-requests" element={<StaffODRequests />} />
          <Route path="leave" element={<Leave />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="docs" element={<StaffDocs />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="attendance" element={<StudentAttendanceCalendar />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="od-requests" element={<StudentODRequests />} />
          <Route path="leave" element={<Leave />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="docs" element={<StudentDocs />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
