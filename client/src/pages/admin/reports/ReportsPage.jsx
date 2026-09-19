import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import PercentBar from '../../../components/common/PercentBar';
import * as academicService from '../../../services/academicService';
import * as examService from '../../../services/examService';
import * as reportService from '../../../services/reportService';

function ReportsPage() {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [classPerf, setClassPerf] = useState(null);
  const [subjectPerf, setSubjectPerf] = useState([]);
  const [attention, setAttention] = useState([]);
  const [loadingAttention, setLoadingAttention] = useState(true);
  const [loadingPerf, setLoadingPerf] = useState(false);

  useEffect(() => {
    examService.listExams().then(({ data }) => setExams(data.data.items));
    academicService.listClasses().then(({ data }) => setClasses(data.data.items));
    reportService
      .getNeedsAttention()
      .then(({ data }) => setAttention(data.data.items))
      .finally(() => setLoadingAttention(false));
  }, []);

  useEffect(() => {
    if (!examId) {
      setSubjectPerf([]);
      return;
    }
    reportService.getSubjectPerformance({ examId }).then(({ data }) => setSubjectPerf(data.data.items));
  }, [examId]);

  useEffect(() => {
    if (!examId || !classId) {
      setClassPerf(null);
      return;
    }
    setLoadingPerf(true);
    reportService
      .getClassPerformance({ examId, classId })
      .then(({ data }) => setClassPerf(data.data))
      .finally(() => setLoadingPerf(false));
  }, [examId, classId]);

  const attentionColumns = [
    { key: 'studentCode', label: 'Student ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'reasons', label: 'Reason(s)', render: (r) => r.reasons.join(', ') },
  ];

  const studentColumns = useMemo(
    () => [
      { key: 'studentCode', label: 'Student ID' },
      { key: 'fullName', label: 'Name' },
      { key: 'totalObtained', label: 'Marks', render: (r) => `${r.totalObtained} / ${r.totalMaximum}` },
      { key: 'percentage', label: 'Percentage', render: (r) => <PercentBar value={r.percentage} /> },
      { key: 'failedSubjects', label: 'Failed Subjects' },
    ],
    []
  );

  const subjectColumns = [
    { key: 'subjectName', label: 'Subject' },
    { key: 'average', label: 'Average', render: (r) => <PercentBar value={r.average} /> },
    { key: 'highest', label: 'Highest' },
    { key: 'lowest', label: 'Lowest' },
    { key: 'passPercentage', label: 'Pass %', render: (r) => `${r.passPercentage}%` },
  ];

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Class/subject performance and students needing attention" />

      <div className="page-card" style={{ maxWidth: 'none', marginBottom: 24 }}>
        <h2>Students Needing Attention</h2>
        <p style={{ marginBottom: 12 }}>Flagged when attendance is below 75%, average marks are below 40%, or 2+ subjects are failed.</p>
        <DataTable
          columns={attentionColumns}
          rows={attention}
          rowKey={(r) => r.studentId}
          loading={loadingAttention}
          emptyMessage="No students currently flagged."
        />
      </div>

      <div className="toolbar">
        <select value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">Select exam</option>
          {exams.map((e) => (
            <option key={e._id} value={e._id}>
              {e.examName}
            </option>
          ))}
        </select>
        <select value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!examId}>
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.className}
            </option>
          ))}
        </select>
      </div>

      {examId && (
        <div className="page-card" style={{ maxWidth: 'none', marginBottom: 24 }}>
          <h2>Subject Performance</h2>
          <DataTable columns={subjectColumns} rows={subjectPerf} rowKey={(r) => r.subjectId} loading={false} emptyMessage="No results entered for this exam yet." />
        </div>
      )}

      {examId && classId && (
        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>Class Performance</h2>
          {classPerf && (
            <div className="stat-grid" style={{ marginBottom: 16 }}>
              <div className="stat-card">
                <div>
                  <div className="stat-card__value">{classPerf.classAverage}%</div>
                  <div className="stat-card__label">Class Average</div>
                </div>
              </div>
              <div className="stat-card">
                <div>
                  <div className="stat-card__value">{classPerf.highest}%</div>
                  <div className="stat-card__label">Highest</div>
                </div>
              </div>
              <div className="stat-card">
                <div>
                  <div className="stat-card__value">{classPerf.lowest}%</div>
                  <div className="stat-card__label">Lowest</div>
                </div>
              </div>
              <div className="stat-card">
                <div>
                  <div className="stat-card__value">
                    {classPerf.passCount}/{classPerf.passCount + classPerf.failCount}
                  </div>
                  <div className="stat-card__label">Passed</div>
                </div>
              </div>
            </div>
          )}
          <DataTable
            columns={studentColumns}
            rows={classPerf?.students || []}
            rowKey={(r) => r._id}
            loading={loadingPerf}
            emptyMessage="No results entered for this class/exam yet."
          />
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
