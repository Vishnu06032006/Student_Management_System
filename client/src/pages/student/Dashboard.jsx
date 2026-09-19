import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPercent, FiCalendar, FiClipboard, FiMessageSquare, FiClock, FiAward, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import DonutChart from '../../components/common/DonutChart';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import PercentBar from '../../components/common/PercentBar';
import { colorFor } from '../../utils/chartColors';
import * as attendanceService from '../../services/attendanceService';
import * as timetableService from '../../services/timetableService';
import * as leaveService from '../../services/leaveService';
import * as announcementService from '../../services/announcementService';

const ATTENDED_STATUSES = ['PRESENT', 'LATE', 'ON_DUTY'];
const STATUS_LABELS = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Excused', ON_DUTY: 'On Duty' };
const JS_DAY_TO_CODE = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function StudentDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState(null);
  const [timetableItems, setTimetableItems] = useState(null);
  const [context, setContext] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(null);
  const [announcements, setAnnouncements] = useState(null);

  useEffect(() => {
    attendanceService.getStudentSummary('me').then(({ data }) => setSummary(data.data.items)).catch(() => setSummary([]));
    attendanceService.getStudentDaily('me').then(({ data }) => setDaily(data.data.items)).catch(() => setDaily([]));
    timetableService.listTimetable().then(({ data }) => {
      setTimetableItems(data.data.items);
      setContext(data.data.context);
    });
    leaveService
      .listLeaves()
      .then(({ data }) => setPendingLeaves(data.data.items.filter((l) => l.status === 'PENDING').length))
      .catch(() => setPendingLeaves(0));
    announcementService
      .listAnnouncements()
      .then(({ data }) => setAnnouncements(data.data.items.slice(0, 4)))
      .catch(() => setAnnouncements([]));
  }, []);

  const stats = useMemo(() => {
    const list = daily || [];
    const conducted = list.length;
    const attended = list.filter((r) => ATTENDED_STATUSES.includes(r.status)).length;
    const percentage = conducted ? Math.round((attended / conducted) * 1000) / 10 : 0;
    const statusCounts = {};
    list.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    return { conducted, attended, percentage, statusCounts };
  }, [daily]);

  const donutData = Object.keys(STATUS_LABELS)
    .filter((key) => stats.statusCounts[key] > 0)
    .map((key) => ({ label: STATUS_LABELS[key], value: stats.statusCounts[key], color: colorFor('attendance', key) }));

  const todayCode = JS_DAY_TO_CODE[new Date().getDay()];
  const todayClasses = (timetableItems || []).filter((e) => e.day === todayCode).sort((a, b) => a.period - b.period);

  const summaryColumns = [
    { key: 'subjectName', label: 'Subject' },
    { key: 'classesConducted', label: 'Conducted' },
    { key: 'classesAttended', label: 'Attended' },
    { key: 'percentage', label: 'Attendance', render: (r) => <PercentBar value={r.percentage} /> },
  ];

  return (
    <div>
      <h1 className="page-header__title">Welcome, {user.fullName || user.loginId}</h1>
      <p className="page-header__subtitle">
        {context ? `${context.className} - Section ${context.sectionName} · Roll No ${context.rollNumber} · ${context.academicYearName} · ` : ''}
        Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'first session'}
      </p>

      <div className="stat-grid">
        <Link to="/student/attendance" className="stat-card-link">
          <StatCard icon={FiPercent} label="Overall Attendance" value={`${stats.percentage}%`} />
        </Link>
        <Link to="/student/timetable" className="stat-card-link">
          <StatCard icon={FiClock} label="Today's Classes" value={todayClasses.length} />
        </Link>
        <Link to="/student/leave" className="stat-card-link">
          <StatCard icon={FiClipboard} label="Pending Leave Requests" value={pendingLeaves ?? '...'} />
        </Link>
        <Link to="/student/announcements" className="stat-card-link">
          <StatCard icon={FiMessageSquare} label="Announcements" value={announcements ? announcements.length : '...'} />
        </Link>
      </div>

      <div className="dashboard-charts-grid">
        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>Attendance Breakdown</h2>
          <p className="chart-subtitle">All subjects, all recorded classes</p>
          <DonutChart data={donutData} emptyLabel="No attendance recorded yet" />
        </div>

        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>
            <FiCalendar /> Today's Timetable
          </h2>
          <p className="chart-subtitle">{context ? `${context.className} - Section ${context.sectionName}` : 'Your schedule for today'}</p>
          {timetableItems === null && <p>Loading...</p>}
          {timetableItems !== null && todayClasses.length === 0 && <p>No classes scheduled for today.</p>}
          {todayClasses.length > 0 && (
            <ul className="dashboard-list">
              {todayClasses.map((entry) => (
                <li key={entry._id}>
                  <span>
                    P{entry.period} · {entry.subjectId?.subjectName} · {entry.room || 'TBA'}
                  </span>
                  <span className="dashboard-list__meta">
                    {entry.startTime}-{entry.endTime}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="dashboard-list-grid">
        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>
            <FiAward /> Attendance by Subject
          </h2>
          <DataTable
            columns={summaryColumns}
            rows={summary || []}
            rowKey={(r) => r.subjectId}
            loading={summary === null}
            emptyMessage="No attendance recorded yet."
          />
        </div>

        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>
            <FiBriefcase /> Recent Announcements
          </h2>
          {announcements === null && <p>Loading...</p>}
          {announcements !== null && announcements.length === 0 && <p>No announcements yet.</p>}
          {announcements !== null && announcements.length > 0 && (
            <ul className="dashboard-list">
              {announcements.map((a) => (
                <li key={a._id}>
                  <span>
                    {a.title} <Badge value={a.priority} />
                  </span>
                  <span className="dashboard-list__meta">{new Date(a.publishDate || a.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
