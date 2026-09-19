import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import * as academicService from '../../services/academicService';
import * as examService from '../../services/examService';

function StaffMarksEntry() {
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [roster, setRoster] = useState([]);
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    academicService.listMyAssignments().then(({ data }) => setAssignments(data.data.items));
    examService.listExams().then(({ data }) => setExams(data.data.items));
  }, []);

  const examName = (id) => exams.find((e) => e._id === id)?.examName || id;

  const assignment = useMemo(() => assignments.find((a) => a._id === assignmentId), [assignments, assignmentId]);

  useEffect(() => {
    if (!assignment) {
      setSchedules([]);
      return;
    }
    examService.listExamSchedules({ classId: assignment.classId._id }).then(({ data }) => {
      setSchedules(data.data.items.filter((s) => s.subjectId._id === assignment.subjectId._id));
    });
    setExamId('');
    setRoster([]);
  }, [assignment]);

  const loadRoster = async () => {
    if (!assignment || !examId) return;
    setLoading(true);
    try {
      const { data } = await examService.getResultRoster({ examId, subjectId: assignment.subjectId._id });
      setScheduleInfo(data.data.schedule);
      setRoster(data.data.students.map((s) => ({ ...s, marksInput: s.marksObtained ?? '' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

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
      await examService.enterMarks({ examId, subjectId: assignment.subjectId._id, records });
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
      <PageHeader title="Marks Entry" subtitle="Enter exam marks for your assigned class and subject" />

      <div className="toolbar">
        <select value={assignmentId} onChange={(e) => setAssignmentId(e.target.value)}>
          <option value="">Select class / subject</option>
          {assignments.map((a) => (
            <option key={a._id} value={a._id}>
              {a.classId?.className} - {a.sectionId?.name} · {a.subjectId?.subjectName}
            </option>
          ))}
        </select>
        <select value={examId} onChange={(e) => setExamId(e.target.value)} disabled={!assignmentId}>
          <option value="">Select exam</option>
          {schedules.map((s) => (
            <option key={s._id} value={s.examId}>
              {examName(s.examId)}
            </option>
          ))}
        </select>
      </div>

      {!assignmentId && <p>Select a class and subject to see scheduled exams.</p>}
      {assignmentId && schedules.length === 0 && <p>No exams scheduled yet for this class/subject.</p>}

      {examId && (
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
                    No students enrolled.
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

      {examId && roster.length > 0 && (
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="button" onClick={submit} disabled={submitting}>
            <FiCheck /> {submitting ? 'Saving...' : 'Save Marks'}
          </button>
        </div>
      )}
    </div>
  );
}

export default StaffMarksEntry;
