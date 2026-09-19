import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import * as academicService from '../../../services/academicService';
import * as timetableService from '../../../services/timetableService';
import * as staffService from '../../../services/staffService';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const schema = z.object({
  academicYearId: z.string().min(1, 'Required'),
  classId: z.string().min(1, 'Required'),
  sectionId: z.string().min(1, 'Required'),
  subjectId: z.string().min(1, 'Required'),
  staffId: z.string().min(1, 'Required'),
  day: z.enum(DAYS),
  period: z.string().min(1, 'Required'),
  startTime: z.string().min(1, 'Required'),
  endTime: z.string().min(1, 'Required'),
  room: z.string().optional(),
});

function TimetablePage() {
  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
    setValue('classId', '');
    setValue('sectionId', '');
    setValue('subjectId', '');
  }, [selectedYearId, setValue]);

  useEffect(() => {
    Promise.all([academicService.listAcademicYears(), academicService.listClasses(), staffService.listStaff({ pageSize: 100 })]).then(
      ([y, c, s]) => {
        setYears(y.data.data.items);
        setClasses(c.data.data.items);
        setStaff(s.data.data.items);
      }
    );
  }, []);

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

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (classFilter) params.classId = classFilter;
      const { data } = await timetableService.listTimetable(params);
      setEntries(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await timetableService.createTimetableEntry({ ...values, period: Number(values.period) });
      toast.success('Timetable entry created');
      setShowCreate(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create entry');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await timetableService.deleteTimetableEntry(deleteTarget._id);
      toast.success('Entry removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove entry');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const columns = [
    { key: 'day', label: 'Day' },
    { key: 'period', label: 'Period' },
    { key: 'time', label: 'Time', render: (r) => `${r.startTime} - ${r.endTime}` },
    { key: 'class', label: 'Class', render: (r) => `${r.classId?.className} - ${r.sectionId?.name}` },
    { key: 'subject', label: 'Subject', render: (r) => r.subjectId?.subjectName },
    { key: 'teacher', label: 'Teacher', render: (r) => r.staffId?.fullName },
    { key: 'room', label: 'Room', render: (r) => r.room || '-' },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button type="button" className="icon-button" title="Remove" onClick={() => setDeleteTarget(r)}>
          <FiTrash2 />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="Weekly class schedule with conflict detection"
        actions={
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> Add Entry
          </button>
        }
      />

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

      <DataTable columns={columns} rows={entries} rowKey={(r) => r._id} loading={loading} emptyMessage="No timetable entries yet." />

      {showCreate && (
        <Modal title="Add Timetable Entry" onClose={() => setShowCreate(false)} width={480}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
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
                <label>Day *</label>
                <select {...register('day')}>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Period *</label>
                <input type="number" min="1" max="12" {...register('period')} />
                {errors.period && <p className="field-error">{errors.period.message}</p>}
              </div>
              <div className="form-field">
                <label>Start time *</label>
                <input type="time" {...register('startTime')} />
                {errors.startTime && <p className="field-error">{errors.startTime.message}</p>}
              </div>
              <div className="form-field">
                <label>End time *</label>
                <input type="time" {...register('endTime')} />
                {errors.endTime && <p className="field-error">{errors.endTime.message}</p>}
              </div>
              <div className="form-field">
                <label>Room</label>
                <input {...register('room')} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove timetable entry"
          message={`Remove ${deleteTarget.subjectId?.subjectName} on ${deleteTarget.day} period ${deleteTarget.period}?`}
          danger
          submitting={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default TimetablePage;
