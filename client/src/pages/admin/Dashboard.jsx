import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiUserCheck, FiBookOpen, FiLayers, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import DonutChart from '../../components/common/DonutChart';
import BarChart from '../../components/common/BarChart';
import { colorFor, colorForSorted } from '../../utils/chartColors';
import * as studentService from '../../services/studentService';
import * as staffService from '../../services/staffService';
import * as academicService from '../../services/academicService';
import * as reportService from '../../services/reportService';

const ATTENDANCE_LABELS = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Excused' };
const ATTENDANCE_ORDER = ['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'];

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function buildAttendanceData(counts) {
  return ATTENDANCE_ORDER.filter((key) => counts.some((c) => c.status === key)).map((key) => ({
    label: ATTENDANCE_LABELS[key],
    value: counts.find((c) => c.status === key)?.count || 0,
    color: colorFor('attendance', key),
  }));
}

function buildGenderData(counts) {
  return counts.map((c) => ({
    label: c.status.charAt(0) + c.status.slice(1).toLowerCase(),
    value: c.count,
    color: colorFor('gender', c.status),
  }));
}

function buildDepartmentData(counts) {
  const sortedKeys = [...counts.map((c) => c.status)].sort();
  return counts.map((c) => ({ label: c.status, value: c.count, color: colorForSorted(c.status, sortedKeys) }));
}

function buildPassFailData(passFail) {
  if (!passFail) return [];
  return [
    { label: 'Pass', value: passFail.pass, color: colorFor('resultStatus', 'PASS') },
    { label: 'Fail', value: passFail.fail, color: colorFor('resultStatus', 'FAIL') },
  ];
}

function AdminDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ students: null, staff: null, classes: null, subjects: null });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    Promise.all([
      studentService.listStudents({ pageSize: 1 }),
      staffService.listStaff({ pageSize: 1 }),
      academicService.listClasses(),
      academicService.listSubjects(),
      reportService.getDashboardSummary(),
    ]).then(([studentsRes, staffRes, classesRes, subjectsRes, summaryRes]) => {
      setCounts({
        students: studentsRes.data.data.total,
        staff: staffRes.data.data.total,
        classes: classesRes.data.data.items.length,
        subjects: subjectsRes.data.data.items.length,
      });
      setSummary(summaryRes.data.data);
    });
  }, []);

  return (
    <div>
      <h1 className="page-header__title">Welcome, {user.loginId}</h1>
      <p className="page-header__subtitle">
        Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'first session'}
      </p>

      <div className="stat-grid">
        <Link to="/admin/students" className="stat-card-link">
          <StatCard icon={FiUsers} label="Total Students" value={counts.students ?? '...'} />
        </Link>
        <Link to="/admin/staff" className="stat-card-link">
          <StatCard icon={FiUserCheck} label="Total Staff" value={counts.staff ?? '...'} />
        </Link>
        <Link to="/admin/academic" className="stat-card-link">
          <StatCard icon={FiLayers} label="Total Classes" value={counts.classes ?? '...'} />
        </Link>
        <Link to="/admin/academic" className="stat-card-link">
          <StatCard icon={FiBookOpen} label="Total Subjects" value={counts.subjects ?? '...'} />
        </Link>
        <Link to="/admin/reports" className="stat-card-link">
          <StatCard
            icon={FiAlertTriangle}
            label="Students Needing Attention"
            value={summary?.needsAttentionCount ?? '...'}
            tone={summary?.needsAttentionCount > 0 ? 'default' : 'muted'}
          />
        </Link>
      </div>

      {summary && (
        <>
          <div className="dashboard-charts-grid">
            <div className="page-card" style={{ maxWidth: 'none' }}>
              <h2>Attendance Breakdown</h2>
              <p className="chart-subtitle">All subject-wise attendance marked so far</p>
              <DonutChart data={buildAttendanceData(summary.attendanceStatusCounts)} emptyLabel="No attendance marked yet" />
            </div>

            <div className="page-card" style={{ maxWidth: 'none' }}>
              <h2>Gender Distribution</h2>
              <p className="chart-subtitle">Across all enrolled students</p>
              <DonutChart data={buildGenderData(summary.genderDistribution)} emptyLabel="No gender data recorded" />
            </div>

            {summary.latestExamPassFail && (
              <div className="page-card" style={{ maxWidth: 'none' }}>
                <h2>{summary.latestExamPassFail.examName}</h2>
                <p className="chart-subtitle">Pass / fail outcome</p>
                <DonutChart data={buildPassFailData(summary.latestExamPassFail)} emptyLabel="No results yet" />
              </div>
            )}

            <div className="page-card" style={{ maxWidth: 'none' }}>
              <h2>Staff by Department</h2>
              <p className="chart-subtitle">Where teaching staff are assigned</p>
              <DonutChart data={buildDepartmentData(summary.staffByDepartment)} emptyLabel="No department data recorded" />
            </div>
          </div>

          <div className="dashboard-bars-grid">
            <div className="page-card" style={{ maxWidth: 'none' }}>
              <h2>Students per Class</h2>
              <BarChart data={summary.studentsByClass.map((c) => ({ label: c.className, value: c.count }))} />
            </div>

            <div className="page-card" style={{ maxWidth: 'none' }}>
              <h2>Attendance Trend (last 2 weeks)</h2>
              <p className="chart-subtitle">% of students present or late, per school day</p>
              <BarChart
                data={summary.attendanceTrend.map((t) => ({
                  label: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  value: t.percentage,
                }))}
                unit="%"
                max={100}
              />
            </div>
          </div>

          <div className="dashboard-list-grid">
            <div className="page-card" style={{ maxWidth: 'none' }}>
              <h2>Upcoming Exams</h2>
              {summary.upcomingExamSchedules.length === 0 && <p>No upcoming exams scheduled.</p>}
              {summary.upcomingExamSchedules.length > 0 && (
                <ul className="dashboard-list">
                  {summary.upcomingExamSchedules.map((s) => (
                    <li key={s._id}>
                      <span>
                        {s.examId?.examName} - {s.subjectId?.subjectName} ({s.classId?.className})
                      </span>
                      <span className="dashboard-list__meta">{new Date(s.examDate).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="page-card" style={{ maxWidth: 'none' }}>
              <h2>Recent Activity</h2>
              {summary.recentActivity.length === 0 && <p>No activity recorded yet.</p>}
              {summary.recentActivity.length > 0 && (
                <ul className="dashboard-list">
                  {summary.recentActivity.map((a) => (
                    <li key={a._id}>
                      <span>
                        {a.userId ? `${a.userId.loginId}` : 'System'} - {a.description || a.action}
                      </span>
                      <span className="dashboard-list__meta">{timeAgo(a.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
