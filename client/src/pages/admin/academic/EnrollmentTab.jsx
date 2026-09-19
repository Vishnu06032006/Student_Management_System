import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import * as academicService from '../../../services/academicService';
import * as studentService from '../../../services/studentService';

const schema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  rollNumber: z.string().optional(),
});

function EnrollmentTab({ years, classes }) {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [yearFilter, setYearFilter] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const selectedYearId = watch('academicYearId');
  const selectedClassId = watch('classId');

  const classesForYear = useMemo(
    () => classes.filter((c) => !selectedYearId || c.academicYearId?._id === selectedYearId),
    [classes, selectedYearId]
  );

  useEffect(() => {
    studentService.listStudents({ pageSize: 100 }).then(({ data }) => setStudents(data.data.items));
  }, []);

  // Changing the year invalidates whatever class/section was picked under the
  // old year - clear both so the form never silently submits a stale ID that
  // no longer matches what the dropdowns visually show.
  useEffect(() => {
    setValue('classId', '');
    setValue('sectionId', '');
  }, [selectedYearId, setValue]);

  useEffect(() => {
    setValue('sectionId', '');
    if (selectedClassId) {
      academicService.listSections({ classId: selectedClassId }).then(({ data }) => setSections(data.data.items));
    } else {
      setSections([]);
    }
  }, [selectedClassId, setValue]);

  const load = async (academicYearId) => {
    setLoading(true);
    try {
      const { data } = await academicService.listEnrollments(academicYearId ? { academicYearId } : {});
      setEnrollments(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(yearFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearFilter]);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await academicService.createEnrollment(values);
      toast.success('Student enrolled');
      setShowCreate(false);
      reset();
      load(yearFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'student', label: 'Student', render: (r) => `${r.studentId?.fullName} (${r.studentId?.studentId})` },
    { key: 'year', label: 'Academic Year', render: (r) => r.academicYearId?.name },
    { key: 'class', label: 'Class', render: (r) => r.classId?.className },
    { key: 'section', label: 'Section', render: (r) => r.sectionId?.name },
    { key: 'rollNumber', label: 'Roll No.', render: (r) => r.rollNumber || '-' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
  ];

  return (
    <div>
      <div className="toolbar">
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All academic years</option>
          {years.map((y) => (
            <option key={y._id} value={y._id}>
              {y.name}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> Enroll Student
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={enrollments} rowKey={(r) => r._id} loading={loading} emptyMessage="No enrollments yet." />

      {showCreate && (
        <Modal title="Enroll Student" onClose={() => setShowCreate(false)} width={480}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Student *</label>
                <select {...register('studentId')}>
                  <option value="">Select</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentId})
                    </option>
                  ))}
                </select>
                {errors.studentId && <p className="field-error">{errors.studentId.message}</p>}
              </div>
              <div className="form-field">
                <label>Academic year *</label>
                <select {...register('academicYearId')}>
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y._id} value={y._id}>
                      {y.name}
                    </option>
                  ))}
                </select>
                {errors.academicYearId && <p className="field-error">{errors.academicYearId.message}</p>}
              </div>
              <div className="form-field">
                <label>Class *</label>
                <select {...register('classId')}>
                  <option value="">Select</option>
                  {classesForYear.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className}
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="field-error">{errors.classId.message}</p>}
              </div>
              <div className="form-field">
                <label>Section *</label>
                <select {...register('sectionId')}>
                  <option value="">Select</option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.sectionId && <p className="field-error">{errors.sectionId.message}</p>}
              </div>
              <div className="form-field">
                <label>Roll number</label>
                <input {...register('rollNumber')} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Enroll'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default EnrollmentTab;
