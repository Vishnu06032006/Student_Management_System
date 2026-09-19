import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiArrowLeft, FiUserCheck } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import * as academicService from '../../services/academicService';
import * as attendanceService from '../../services/attendanceService';

const todayISO = () => new Date().toISOString().slice(0, 10);

function StaffAttendance() {
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [assignmentId, setAssignmentId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [roster, setRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    academicService
      .listMyAssignments()
      .then(({ data }) => setAssignments(data.data.items))
      .finally(() => setLoadingAssignments(false));
  }, []);

  // A staff member can teach more than one subject, and the same subject to
  // more than one section - group their assignments by subject first, so
  // "Select a subject" always comes before "which batch".
  const subjects = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      const id = a.subjectId?._id;
      if (!id) return;
      if (!map.has(id)) {
        map.set(id, { id, name: a.subjectId.subjectName, code: a.subjectId.subjectCode, batchCount: 0 });
      }
      map.get(id).batchCount += 1;
    });
    return [...map.values()];
  }, [assignments]);

  const batchesForSubject = useMemo(
    () => assignments.filter((a) => a.subjectId?._id === selectedSubjectId),
    [assignments, selectedSubjectId]
  );

  const assignment = useMemo(() => assignments.find((a) => a._id === assignmentId), [assignments, assignmentId]);

  const loadRoster = async () => {
    if (!assignment) return;
    setLoadingRoster(true);
    try {
      const { data } = await attendanceService.getRoster({
        classId: assignment.classId._id,
        sectionId: assignment.sectionId._id,
        academicYearId: assignment.academicYearId._id,
        subjectId: assignment.subjectId._id,
        date,
      });
      setRoster(data.data.items.map((r) => ({ ...r, status: r.status || 'PRESENT' })));
    } finally {
      setLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (assignmentId) loadRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, date]);

  const setStatus = (studentId, status) => {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  };

  const markAllPresent = () => setRoster((prev) => prev.map((r) => ({ ...r, status: 'PRESENT' })));

  const submit = async () => {
    setSubmitting(true);
    try {
      await attendanceService.markAttendance({
        academicYearId: assignment.academicYearId._id,
        classId: assignment.classId._id,
        sectionId: assignment.sectionId._id,
        subjectId: assignment.subjectId._id,
        date,
        records: roster.map((r) => ({ studentId: r.studentId, status: r.status })),
      });
      toast.success('Attendance saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const backToSubjects = () => {
    setSelectedSubjectId(null);
    setAssignmentId('');
    setRoster([]);
  };

  const backToBatches = () => {
    setAssignmentId('');
    setRoster([]);
  };

  if (loadingAssignments) {
    return (
      <div>
        <PageHeader title="Mark Attendance" subtitle="Mark attendance for the classes you teach" />
        <p>Loading your subjects...</p>
      </div>
    );
  }

  if (!subjects.length) {
    return (
      <div>
        <PageHeader title="Mark Attendance" subtitle="Mark attendance for the classes you teach" />
        <div className="page-card">
          <p>You are not currently assigned to teach any subject. Contact the admin if this looks wrong.</p>
        </div>
      </div>
    );
  }

  // Step 1: pick a subject.
  if (!selectedSubjectId) {
    return (
      <div>
        <PageHeader title="Mark Attendance" subtitle="Step 1 of 3 - select the subject you want to mark attendance for" />
        <div className="page-card" style={{ maxWidth: 'none' }}>
          <div className="subject-chip-row">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                className="subject-chip"
                onClick={() => setSelectedSubjectId(s.id)}
              >
                <span>{s.name}</span>
                <span className="subject-chip__percent">
                  {s.batchCount} batch{s.batchCount === 1 ? '' : 'es'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Step 2: pick which batch/section studying that subject.
  if (!assignmentId) {
    return (
      <div>
        <PageHeader
          title={`Mark Attendance - ${currentSubject?.name}`}
          subtitle="Step 2 of 3 - select the batch (class & section) you want to mark"
          actions={
            <button type="button" className="button--secondary" onClick={backToSubjects}>
              <FiArrowLeft /> Change subject
            </button>
          }
        />
        <div className="page-card" style={{ maxWidth: 'none' }}>
          <div className="subject-chip-row">
            {batchesForSubject.map((a) => (
              <button key={a._id} type="button" className="subject-chip" onClick={() => setAssignmentId(a._id)}>
                <span>
                  {a.classId?.className} - Section {a.sectionId?.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: date + roster with a Present/Absent toggle per student.
  return (
    <div>
      <PageHeader
        title={`Mark Attendance - ${currentSubject?.name}`}
        subtitle={`${assignment?.classId?.className} - Section ${assignment?.sectionId?.name} · Step 3 of 3`}
        actions={
          <button type="button" className="button--secondary" onClick={backToBatches}>
            <FiArrowLeft /> Change batch
          </button>
        }
      />

      <div className="toolbar">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} />
        <button type="button" className="button--secondary" onClick={markAllPresent} disabled={!roster.length}>
          <FiUserCheck /> Mark all Present
        </button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Student</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {loadingRoster ? (
              <tr>
                <td colSpan={3} className="data-table__empty">
                  Loading...
                </td>
              </tr>
            ) : roster.length === 0 ? (
              <tr>
                <td colSpan={3} className="data-table__empty">
                  No students enrolled in this class/section yet.
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
                    <div className="status-picker">
                      <button
                        type="button"
                        className={`status-chip status-chip--present ${r.status === 'PRESENT' ? 'is-selected' : ''}`}
                        onClick={() => setStatus(r.studentId, 'PRESENT')}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        className={`status-chip status-chip--absent ${r.status === 'ABSENT' ? 'is-selected' : ''}`}
                        onClick={() => setStatus(r.studentId, 'ABSENT')}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {roster.length > 0 && (
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="button" onClick={submit} disabled={submitting}>
            <FiCheck /> {submitting ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  );
}

export default StaffAttendance;
