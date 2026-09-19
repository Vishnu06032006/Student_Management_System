import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import * as examService from '../../../services/examService';
import * as academicService from '../../../services/academicService';

const schema = z
  .object({
    examId: z.string().min(1, 'Required'),
    classId: z.string().min(1, 'Required'),
    subjectId: z.string().min(1, 'Required'),
    examDate: z.string().min(1, 'Required'),
    startTime: z.string().min(1, 'Required'),
    endTime: z.string().min(1, 'Required'),
    maximumMarks: z.string().min(1, 'Required'),
    passMarks: z.string().min(1, 'Required'),
  })
  .refine((d) => Number(d.passMarks) <= Number(d.maximumMarks), {
    message: 'Pass marks cannot exceed maximum marks',
    path: ['passMarks'],
  });

function ScheduleTab({ exams, classes }) {
  const [examFilter, setExamFilter] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { maximumMarks: '100', passMarks: '35' } });

  const selectedClassId = watch('classId');

  useEffect(() => {
    setValue('subjectId', '');
    if (selectedClassId) {
      academicService.listSubjects({ classId: selectedClassId }).then(({ data }) => setSubjects(data.data.items));
    } else {
      setSubjects([]);
    }
  }, [selectedClassId, setValue]);

  const load = async (examId) => {
    setLoading(true);
    try {
      const { data } = await examService.listExamSchedules(examId ? { examId } : {});
      setSchedules(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(examFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examFilter]);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await examService.createExamSchedule({
        ...values,
        maximumMarks: Number(values.maximumMarks),
        passMarks: Number(values.passMarks),
      });
      toast.success('Exam schedule created');
      setShowCreate(false);
      reset();
      load(examFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create schedule entry');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'exam', label: 'Exam', render: (r) => exams.find((e) => e._id === r.examId)?.examName || r.examId },
    { key: 'class', label: 'Class', render: (r) => r.classId?.className },
    { key: 'subject', label: 'Subject', render: (r) => r.subjectId?.subjectName },
    { key: 'examDate', label: 'Date', render: (r) => new Date(r.examDate).toLocaleDateString() },
    { key: 'time', label: 'Time', render: (r) => `${r.startTime} - ${r.endTime}` },
    { key: 'maximumMarks', label: 'Max Marks' },
    { key: 'passMarks', label: 'Pass Marks' },
    { key: 'room', label: 'Room', render: (r) => r.room || '-' },
  ];

  return (
    <div>
      <div className="toolbar">
        <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)}>
          <option value="">All exams</option>
          {exams.map((e) => (
            <option key={e._id} value={e._id}>
              {e.examName}
            </option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> Add Schedule Entry
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={schedules} rowKey={(r) => r._id} loading={loading} emptyMessage="No schedule entries yet." />

      {showCreate && (
        <Modal title="Add Exam Schedule Entry" onClose={() => setShowCreate(false)} width={480}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Exam *</label>
                <select {...register('examId')}>
                  <option value="">Select</option>
                  {exams.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.examName}
                    </option>
                  ))}
                </select>
                {errors.examId && <p className="field-error">{errors.examId.message}</p>}
              </div>
              <div className="form-field">
                <label>Class *</label>
                <select {...register('classId')}>
                  <option value="">Select</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className}
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="field-error">{errors.classId.message}</p>}
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
              <div className="form-field">
                <label>Exam date *</label>
                <input type="date" {...register('examDate')} />
                {errors.examDate && <p className="field-error">{errors.examDate.message}</p>}
              </div>
              <div className="form-field">
                <label>Start time *</label>
                <input type="time" {...register('startTime')} />
              </div>
              <div className="form-field">
                <label>End time *</label>
                <input type="time" {...register('endTime')} />
              </div>
              <div className="form-field">
                <label>Maximum marks *</label>
                <input type="number" min="1" {...register('maximumMarks')} />
              </div>
              <div className="form-field">
                <label>Pass marks *</label>
                <input type="number" min="0" {...register('passMarks')} />
                {errors.passMarks && <p className="field-error">{errors.passMarks.message}</p>}
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
    </div>
  );
}

export default ScheduleTab;
