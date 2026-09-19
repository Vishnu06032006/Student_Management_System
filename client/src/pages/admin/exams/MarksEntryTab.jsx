import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck } from 'react-icons/fi';
import * as examService from '../../../services/examService';

function MarksEntryTab({ exams }) {
  const [examId, setExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [roster, setRoster] = useState([]);
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (examId) {
      examService.listExamSchedules({ examId }).then(({ data }) => setSchedules(data.data.items));
    } else {
      setSchedules([]);
    }
    setSubjectId('');
    setRoster([]);
  }, [examId]);

  const loadRoster = async () => {
    if (!examId || !subjectId) return;
    setLoading(true);
    try {
      const { data } = await examService.getResultRoster({ examId, subjectId });
      setScheduleInfo(data.data.schedule);
      setRoster(data.data.students.map((s) => ({ ...s, marksInput: s.marksObtained ?? '' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, subjectId]);

  const setMarks = (studentId, value) => {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, marksInput: value } : r)));
  };

  const submit = async () => {
    const records = roster
      .filter((r) => r.marksInput !== '')
      .map((r) => ({ studentId: r.studentId, marksObtained: Number(r.marksInput), maximumMarks: scheduleInfo.maximumMarks }));

    if (records.length === 0) {
      toast.error('Enter marks for at least one student');
      return;
    }

    setSubmitting(true);
    try {
      await examService.enterMarks({ examId, subjectId, records });
      toast.success('Marks saved');
      loadRoster();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save marks');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <select value={examId} onChange={(e) => setExamId(e.target.value)}>
          <option value="">Select exam</option>
          {exams.map((e) => (
            <option key={e._id} value={e._id}>
              {e.examName}
            </option>
          ))}
        </select>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!examId}>
          <option value="">Select subject</option>
          {schedules.map((s) => (
            <option key={s._id} value={s.subjectId._id}>
              {s.subjectId.subjectName} ({s.classId.className})
            </option>
          ))}
        </select>
      </div>

      {examId && subjectId && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student</th>
                <th>Marks (max {scheduleInfo?.maximumMarks ?? '-'})</th>
                <th>Grade</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="data-table__empty">
                    Loading...
                  </td>
                </tr>
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="data-table__empty">
                    No students enrolled for this class.
                  </td>
                </tr>
              ) : (
                roster.map((r) => (
                  <tr key={r.studentId}>
                    <td>{r.rollNumber || '-'}</td>
                    <td>
                      {r.fullName} ({r.studentCode})
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={scheduleInfo?.maximumMarks}
                        value={r.marksInput}
                        onChange={(e) => setMarks(r.studentId, e.target.value)}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td>{r.grade || '-'}</td>
                    <td>{r.resultStatus || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {examId && subjectId && roster.length > 0 && (
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="button" onClick={submit} disabled={submitting}>
            <FiCheck /> {submitting ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
      )}
    </div>
  );
}

export default MarksEntryTab;
