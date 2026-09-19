import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import * as academicService from '../../../services/academicService';
import * as staffService from '../../../services/staffService';

const schema = z.object({
  staffId: z.string().min(1, 'Staff is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  isClassTeacher: z.boolean().optional(),
});

function TeacherAssignmentTab({ years, classes }) {
  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
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
    staffService.listStaff({ pageSize: 100 }).then(({ data }) => setStaff(data.data.items));
  }, []);

  // Same reasoning as the enrollment form: an uncontrolled RHF select doesn't
  // notice its options changed out from under it, so the stale child value
  // has to be cleared by hand whenever the parent selection changes.
  useEffect(() => {
    setValue('classId', '');
    setValue('sectionId', '');
    setValue('subjectId', '');
  }, [selectedYearId, setValue]);

  useEffect(() => {
    setValue('sectionId', '');
    setValue('subjectId', '');
    if (selectedClassId) {
      academicService.listSections({ classId: selectedClassId }).then(({ data }) => setSections(data.data.items));
      academicService.listSubjects({ classId: selectedClassId }).then(({ data }) => setSubjects(data.data.items));
    } else {
      setSections([]);
      setSubjects([]);
    }
  }, [selectedClassId, setValue]);

  const load = async (academicYearId) => {
    setLoading(true);
    try {
      const { data } = await academicService.listTeacherAssignments(academicYearId ? { academicYearId } : {});
      setAssignments(data.data.items);
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
      await academicService.createTeacherAssignment(values);
      toast.success('Teacher assigned');
      setShowCreate(false);
      reset();
      load(yearFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not assign teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'staff', label: 'Teacher', render: (r) => `${r.staffId?.fullName} (${r.staffId?.staffId})` },
    { key: 'year', label: 'Academic Year', render: (r) => r.academicYearId?.name },
    { key: 'class', label: 'Class', render: (r) => r.classId?.className },
    { key: 'section', label: 'Section', render: (r) => r.sectionId?.name },
    { key: 'subject', label: 'Subject', render: (r) => r.subjectId?.subjectName },
    { key: 'classTeacher', label: 'Class Teacher', render: (r) => (r.isClassTeacher ? 'Yes' : '-') },
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
            <FiPlus /> Assign Teacher
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={assignments} rowKey={(r) => r._id} loading={loading} emptyMessage="No teacher assignments yet." />

      {showCreate && (
        <Modal title="Assign Teacher" onClose={() => setShowCreate(false)} width={480}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Teacher *</label>
                <select {...register('staffId')}>
                  <option value="">Select</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.staffId})
                    </option>
                  ))}
                </select>
                {errors.staffId && <p className="field-error">{errors.staffId.message}</p>}
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
                <label>Subject *</label>
                <select {...register('subjectId')}>
                  <option value="">Select</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.subjectName}
                    </option>
                  ))}
                </select>
                {errors.subjectId && <p className="field-error">{errors.subjectId.message}</p>}
              </div>
              <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="isClassTeacher" {...register('isClassTeacher')} style={{ width: 'auto' }} />
                <label htmlFor="isClassTeacher" style={{ margin: 0 }}>
                  Make class teacher for this section
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Assign'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default TeacherAssignmentTab;
