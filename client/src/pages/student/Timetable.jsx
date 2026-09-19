import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import * as timetableService from '../../services/timetableService';
import * as attendanceService from '../../services/attendanceService';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS = { MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday', THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday' };
const JS_DAY_TO_CODE = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function fmt(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function Timetable() {
  const [items, setItems] = useState(null);
  const [context, setContext] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);

  useEffect(() => {
    timetableService.listTimetable().then(({ data }) => {
      setItems(data.data.items);
      setContext(data.data.context);
    });
    const today = fmt(new Date());
    attendanceService
      .getStudentDaily('me', { from: today, to: today })
      .then(({ data }) => setTodayAttendance(data.data.items))
      .catch(() => setTodayAttendance([]));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map(DAYS.map((d) => [d, []]));
    (items || []).forEach((entry) => {
      if (map.has(entry.day)) map.get(entry.day).push(entry);
    });
    map.forEach((list) => list.sort((a, b) => a.period - b.period));
    return map;
  }, [items]);

  const periods = useMemo(() => {
    const set = new Set();
    (items || []).forEach((e) => set.add(e.period));
    return [...set].sort((a, b) => a - b);
  }, [items]);

  const attendanceBySubject = useMemo(() => {
    const map = new Map();
    todayAttendance.forEach((r) => map.set(r.subjectId, r.status));
    return map;
  }, [todayAttendance]);

  const todayCode = JS_DAY_TO_CODE[new Date().getDay()];
  const todayEntries = byDay.get(todayCode) || [];
  const currentTime = nowTime();

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle={
          context
            ? `${context.className} - Section ${context.sectionName} · Roll No ${context.rollNumber} · ${context.academicYearName}`
            : 'Your weekly class schedule'
        }
      />

      <div className="page-card" style={{ maxWidth: 'none' }}>
        <h2>Today - {DAY_LABELS[todayCode] || 'No classes (weekend)'}</h2>
        {items === null && <p>Loading...</p>}
        {items !== null && todayEntries.length === 0 && <p>No classes scheduled for today.</p>}
        {todayEntries.length > 0 && (
          <ul className="dashboard-list">
            {todayEntries.map((entry) => {
              const status = attendanceBySubject.get(entry.subjectId?._id);
              const upcoming = currentTime < entry.startTime;
              return (
                <li key={entry._id}>
                  <span>
                    P{entry.period} · {entry.startTime}-{entry.endTime} · {entry.subjectId?.subjectName} ({entry.staffId?.fullName}) · {entry.room || 'TBA'}
                  </span>
                  <span className="dashboard-list__meta">
                    {status ? (
                      <Badge value={status} label={status.replace('_', ' ')} />
                    ) : upcoming ? (
                      <Badge value="UPCOMING" label="Upcoming" />
                    ) : (
                      <Badge value="NOT_MARKED" label="Not marked yet" />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="page-card" style={{ maxWidth: 'none', marginTop: 20 }}>
        <h2>Weekly Schedule</h2>
        {items === null && <p>Loading...</p>}
        {items !== null && items.length === 0 && <p>No timetable has been published yet.</p>}
        {items !== null && items.length > 0 && (
          <div className="data-table-wrap">
            <table className="data-table timetable-grid">
              <thead>
                <tr>
                  <th>Period</th>
                  {DAYS.map((d) => (
                    <th key={d} className={d === todayCode ? 'timetable-grid__today-col' : ''}>
                      {DAY_LABELS[d]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period}>
                    <td>P{period}</td>
                    {DAYS.map((d) => {
                      const entry = byDay.get(d).find((e) => e.period === period);
                      return (
                        <td key={d} className={d === todayCode ? 'timetable-grid__today-col' : ''}>
                          {entry ? (
                            <div className="timetable-grid__cell">
                              <strong>{entry.subjectId?.subjectName}</strong>
                              <span>{entry.staffId?.fullName}</span>
                              <span>
                                {entry.startTime}-{entry.endTime} · {entry.room || 'TBA'}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Timetable;
