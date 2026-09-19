import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowRight } from 'react-icons/fi';
import PageHeader from '../../../components/common/PageHeader';
import * as academicService from '../../../services/academicService';
import * as promotionService from '../../../services/promotionService';

function PromotionPage() {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [fromYear, setFromYear] = useState('');
  const [fromClass, setFromClass] = useState('');
  const [fromSection, setFromSection] = useState('');
  const [fromSections, setFromSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [toYear, setToYear] = useState('');
  const [toClass, setToClass] = useState('');
  const [toSection, setToSection] = useState('');
  const [toSections, setToSections] = useState([]);
  const [status, setStatus] = useState('PROMOTED');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    academicService.listAcademicYears().then(({ data }) => setYears(data.data.items));
    academicService.listClasses().then(({ data }) => setClasses(data.data.items));
  }, []);

  const classesForFromYear = useMemo(() => classes.filter((c) => c.academicYearId?._id === fromYear), [classes, fromYear]);
  const classesForToYear = useMemo(() => classes.filter((c) => c.academicYearId?._id === toYear), [classes, toYear]);

  useEffect(() => {
    if (fromClass) {
      academicService.listSections({ classId: fromClass }).then(({ data }) => setFromSections(data.data.items));
    } else {
      setFromSections([]);
    }
    setFromSection('');
  }, [fromClass]);

  useEffect(() => {
    if (toClass) {
      academicService.listSections({ classId: toClass }).then(({ data }) => setToSections(data.data.items));
    } else {
      setToSections([]);
    }
    setToSection('');
  }, [toClass]);

  useEffect(() => {
    if (fromYear && fromClass && fromSection) {
      academicService
        .listEnrollments({ academicYearId: fromYear, classId: fromClass, sectionId: fromSection })
        .then(({ data }) => {
          setEnrollments(data.data.items.filter((e) => e.status === 'ACTIVE'));
          setSelected(new Set());
        });
    } else {
      setEnrollments([]);
    }
  }, [fromYear, fromClass, fromSection]);

  const toggleStudent = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === enrollments.length) setSelected(new Set());
    else setSelected(new Set(enrollments.map((e) => e.studentId._id)));
  };

  const submit = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one student');
      return;
    }
    if (!toYear || !toClass || !toSection) {
      toast.error('Select the target academic year, class and section');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await promotionService.bulkPromote({
        fromAcademicYearId: fromYear,
        fromClassId: fromClass,
        fromSectionId: fromSection,
        toAcademicYearId: toYear,
        toClassId: toClass,
        toSectionId: toSection,
        studentIds: [...selected],
        status,
      });
      setSummary(data.data);
      toast.success(`${data.data.promoted.length} student(s) processed`);
      academicService
        .listEnrollments({ academicYearId: fromYear, classId: fromClass, sectionId: fromSection })
        .then(({ data: d }) => {
          setEnrollments(d.data.items.filter((e) => e.status === 'ACTIVE'));
          setSelected(new Set());
        });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promotion failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Student Promotion" subtitle="Promote, retain, transfer or graduate students in bulk" />

      <div className="promotion-grid">
        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>From</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Academic year</label>
              <select value={fromYear} onChange={(e) => setFromYear(e.target.value)}>
                <option value="">Select</option>
                {years.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Class</label>
              <select value={fromClass} onChange={(e) => setFromClass(e.target.value)} disabled={!fromYear}>
                <option value="">Select</option>
                {classesForFromYear.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Section</label>
              <select value={fromSection} onChange={(e) => setFromSection(e.target.value)} disabled={!fromClass}>
                <option value="">Select</option>
                {fromSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="promotion-arrow">
          <FiArrowRight size={24} />
        </div>

        <div className="page-card" style={{ maxWidth: 'none' }}>
          <h2>To</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>Academic year</label>
              <select value={toYear} onChange={(e) => setToYear(e.target.value)}>
                <option value="">Select</option>
                {years.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Class</label>
              <select value={toClass} onChange={(e) => setToClass(e.target.value)} disabled={!toYear}>
                <option value="">Select</option>
                {classesForToYear.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Section</label>
              <select value={toSection} onChange={(e) => setToSection(e.target.value)} disabled={!toClass}>
                <option value="">Select</option>
                {toSections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Action</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="PROMOTED">Promote</option>
                <option value="RETAINED">Retain</option>
                <option value="TRANSFERRED">Transfer</option>
                <option value="GRADUATED">Graduate</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {fromYear && fromClass && fromSection && (
        <div className="page-card" style={{ maxWidth: 'none', marginTop: 20 }}>
          <h2>
            Select students ({selected.size} of {enrollments.length} selected)
          </h2>
          {enrollments.length === 0 ? (
            <p>No active students in this class/section.</p>
          ) : (
            <>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <input type="checkbox" checked={selected.size === enrollments.length} onChange={toggleAll} /> Select all
              </label>
              <div className="promotion-student-list">
                {enrollments.map((e) => (
                  <label key={e.studentId._id} className="promotion-student-item">
                    <input
                      type="checkbox"
                      checked={selected.has(e.studentId._id)}
                      onChange={() => toggleStudent(e.studentId._id)}
                    />
                    {e.studentId.fullName} ({e.studentId.studentId})
                  </label>
                ))}
              </div>
              <div className="form-actions">
                <button type="button" onClick={submit} disabled={submitting}>
                  {submitting ? 'Processing...' : 'Promote Selected Students'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {summary && (
        <div className="page-card" style={{ maxWidth: 'none', marginTop: 20 }}>
          <h2>Last Run Summary</h2>
          <p>{summary.promoted.length} processed successfully.</p>
          {summary.skipped.length > 0 && (
            <>
              <p>{summary.skipped.length} skipped:</p>
              <ul>
                {summary.skipped.map((s) => (
                  <li key={s.studentId}>{s.reason}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PromotionPage;
