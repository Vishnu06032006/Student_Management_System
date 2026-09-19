import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import * as examService from '../../services/examService';

function StudentResults() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService
      .getStudentResults('me')
      .then(({ data }) => setItems(data.data.items))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'examName', label: 'Exam' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'marksObtained', label: 'Marks', render: (r) => `${r.marksObtained} / ${r.maximumMarks}` },
    { key: 'grade', label: 'Grade' },
    { key: 'resultStatus', label: 'Result', render: (r) => <Badge value={r.resultStatus === 'PASS' ? 'ACTIVE' : 'SUSPENDED'} label={r.resultStatus} /> },
  ];

  return (
    <div>
      <PageHeader title="My Results" subtitle="Published exam results" />
      <DataTable
        columns={columns}
        rows={items}
        rowKey={(r) => r.id}
        loading={loading}
        emptyMessage="No results published yet."
      />
    </div>
  );
}

export default StudentResults;
