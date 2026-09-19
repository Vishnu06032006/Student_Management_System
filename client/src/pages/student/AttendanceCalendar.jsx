import { useEffect, useMemo, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, FiPercent, FiBriefcase } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import DonutChart from '../../components/common/DonutChart';
import { colorFor } from '../../utils/chartColors';
import * as attendanceService from '../../services/attendanceService';

const ATTENDED_STATUSES = ['PRESENT', 'LATE', 'ON_DUTY'];
const STATUS_LABELS = { PRESENT: 'Present', ABSENT: 'Absent', LATE: 'Late', EXCUSED: 'Excused', ON_DUTY: 'On Duty' };
const STATUS_PRIORITY = ['ABSENT', 'LATE', 'EXCUSED', 'ON_DUTY', 'PRESENT'];
const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function AttendanceCalendar() {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [allRecords, setAllRecords] = useState(null);
  const [subjectSummary, setSubjectSummary] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    attendanceService
      .getStudentSummary('me')
      .then(({ data }) => setSubjectSummary(data.data.items))
      .catch(() => setSubjectSummary([]));
  }, []);

  useEffect(() => {
    const from = startOfMonth(monthDate);
    const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    attendanceService
      .getStudentDaily('me', { from: fmt(from), to: fmt(to) })
      .then(({ data }) => setAllRecords(data.data.items))
      .catch(() => setAllRecords([]));
  }, [monthDate]);

  const records = useMemo(() => {
    if (!allRecords) return allRecords;
    if (!selectedSubjectId) return allRecords;
    return allRecords.filter((r) => r.subjectId === selectedSubjectId);
  }, [allRecords, selectedSubjectId]);

  const recordsByDate = useMemo(() => {
    const map = new Map();
    (records || []).forEach((r) => {
      const key = fmt(new Date(r.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return map;
  }, [records]);

  const stats = useMemo(() => {
    const list = records || [];
    const conducted = list.length;
    const attended = list.filter((r) => ATTENDED_STATUSES.includes(r.status)).length;
    const percentage = conducted ? Math.round((attended / conducted) * 1000) / 10 : 0;
    const onDuty = list.filter((r) => r.status === 'ON_DUTY').length;
    const statusCounts = {};
    list.forEach((r) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    return { conducted, attended, percentage, onDuty, statusCounts };
  }, [records]);

  const donutData = Object.keys(STATUS_LABELS)
    .filter((key) => stats.statusCounts[key] > 0)
    .map((key) => ({ label: STATUS_LABELS[key], value: stats.statusCounts[key], color: colorFor('attendance', key) }));

  const cells = useMemo(() => {
    const first = startOfMonth(monthDate);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const leading = first.getDay();
    const list = [];
    for (let i = 0; i < leading; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) list.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), d));
    return list;
  }, [monthDate]);

  const today = new Date();
  const isCurrentMonth = isSameMonth(monthDate, today);

  return (
    <div>
      <PageHeader
        title="Attendance Calendar"
        subtitle="Day-by-day record of your attendance across all subjects"
        actions={
          <div className="calendar-nav">
            <button type="button" className="icon-button" onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
              <FiChevronLeft />
            </button>
            <span className="calendar-nav__label">{monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
            <button
              type="button"
              className="icon-button"
              disabled={isCurrentMonth}
              onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            >
              <FiChevronRight />
            </button>
          </div>
        }
      />

      <div className="page-card" style={{ maxWidth: 'none' }}>
        <h2>By Subject</h2>
        <p className="chart-subtitle">Click a subject to see its attendance only, or All Subjects for the combined view</p>
        <div className="subject-chip-row">
          <button
            type="button"
            className={`subject-chip${selectedSubjectId === null ? ' subject-chip--active' : ''}`}
            onClick={() => setSelectedSubjectId(null)}
          >
            All Subjects
          </button>
          {(subjectSummary || []).map((s) => (
            <button
              key={s.subjectId}
              type="button"
              className={`subject-chip${selectedSubjectId === s.subjectId ? ' subject-chip--active' : ''}`}
              onClick={() => setSelectedSubjectId(s.subjectId)}
            >
              <span>{s.subjectName}</span>
              <span className="subject-chip__percent">{s.percentage}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon={FiPercent} label="This Month" value={`${stats.percentage}%`} />
        <StatCard icon={FiCheckCircle} label="Classes Attended" value={stats.attended} />
        <StatCard icon={FiXCircle} label="Classes Conducted" value={stats.conducted} />
        <StatCard icon={FiBriefcase} label="On Duty" value={stats.onDuty} />
      </div>

      <div className="dashboard-charts-grid" style={{ gridTemplateColumns: '320px 1fr' }}>
        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>Status Breakdown</h2>
          <p className="chart-subtitle">
            {selectedSubjectId ? subjectSummary?.find((s) => s.subjectId === selectedSubjectId)?.subjectName : 'All subjects'}, this month
          </p>
          <DonutChart data={donutData} emptyLabel="No attendance recorded this month" />
        </div>

        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>Calendar</h2>
          <p className="chart-subtitle">Hover a day to see per-subject status</p>
          {records === null ? (
            <p>Loading...</p>
          ) : (
            <div className="attendance-calendar">
              {WEEKDAY_HEADERS.map((w) => (
                <div key={w} className="attendance-calendar__weekday">
                  {w}
                </div>
              ))}
              {cells.map((date, idx) => {
                if (!date) return <div key={`blank-${idx}`} className="attendance-calendar__cell attendance-calendar__cell--blank" />;
                const key = fmt(date);
                const dayRecords = recordsByDate.get(key) || [];
                const worst = STATUS_PRIORITY.find((s) => dayRecords.some((r) => r.status === s));
                const isToday = fmt(today) === key;
                const conducted = dayRecords.length;
                const attended = dayRecords.filter((r) => ATTENDED_STATUSES.includes(r.status)).length;
                const title = dayRecords.length
                  ? dayRecords.map((r) => `${r.subjectName}: ${STATUS_LABELS[r.status]}`).join('\n')
                  : 'No classes recorded';
                return (
                  <div
                    key={key}
                    title={title}
                    className={`attendance-calendar__cell${worst ? ` attendance-calendar__cell--${worst.toLowerCase()}` : ''}${
                      isToday ? ' attendance-calendar__cell--today' : ''
                    }`}
                  >
                    <span className="attendance-calendar__date">{date.getDate()}</span>
                    {conducted > 0 && (
                      <span className="attendance-calendar__count">
                        {attended}/{conducted}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <ul className="attendance-calendar__legend">
            {STATUS_PRIORITY.map((s) => (
              <li key={s}>
                <span className={`attendance-calendar__swatch attendance-calendar__swatch--${s.toLowerCase()}`} />
                {STATUS_LABELS[s]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AttendanceCalendar;
