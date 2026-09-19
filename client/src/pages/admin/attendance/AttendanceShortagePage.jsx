import { useEffect, useState } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import * as academicService from '../../../services/academicService';
import * as attendanceService from '../../../services/attendanceService';

function levelBadge(percentage) {
  if (percentage >= 85) return <Badge value="ACTIVE" label={`${percentage}% - Good`} />;
  if (percentage >= 75) return <Badge value="ON_LEAVE" label={`${percentage}% - Warning`} />;
  return <Badge value="SUSPENDED" label={`${percentage}% - Critical`} />;
}

function AttendanceShortagePage() {
  const [classes, setClasses] = useState([]);
  const [classFilter, setClassFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academicService.listClasses().then(({ data }) => setClasses(data.data.items));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (classFilter) params.classId = classFilter;
      const { data } = await attendanceService.getShortage(params);
      setRows(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  const columns = [
    { key: 'studentCode', label: 'Student ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'classesConducted', label: 'Conducted' },
    { key: 'classesAttended', label: 'Attended' },
    { key: 'percentage', label: 'Attendance', render: (r) => levelBadge(r.percentage) },
  ];

  return (
    <div>
      <PageHeader title="Attendance Shortage" subtitle="Students below the 75% examination eligibility threshold" />

      <div className="toolbar">
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.className}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.studentId}
        loading={loading}
        emptyMessage="No students below the attendance threshold."
      />
    </div>
  );
}

export default AttendanceShortagePage;
