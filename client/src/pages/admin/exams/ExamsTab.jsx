import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus, FiSend, FiCheckCircle, FiLock } from 'react-icons/fi';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import * as examService from '../../../services/examService';

const schema = z
  .object({
    examName: z.string().trim().min(1, 'Exam name is required'),
    academicYearId: z.string().min(1, 'Academic year is required'),
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().min(1, 'Required'),
  })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });

function ExamsTab({ years, onChanged }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await examService.listExams();
      setExams(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await examService.createExam(values);
      toast.success('Exam created');
      setShowCreate(false);
      reset();
      load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const transition = async (id, action, label) => {
    try {
      await action(id);
      toast.success(label);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const columns = [
    { key: 'examName', label: 'Exam' },
    { key: 'year', label: 'Academic Year', render: (r) => r.academicYearId?.name },
    { key: 'startDate', label: 'Start', render: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End', render: (r) => new Date(r.endDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <div className="row-actions">
          {r.status === 'DRAFT' && (
            <button type="button" className="icon-button" title="Publish" onClick={() => transition(r._id, examService.publishExam, 'Exam published')}>
              <FiSend />
            </button>
          )}
          {(r.status === 'PUBLISHED' || r.status === 'ONGOING') && (
            <button type="button" className="icon-button" title="Mark completed" onClick={() => transition(r._id, examService.completeExam, 'Exam marked completed')}>
              <FiCheckCircle />
            </button>
          )}
          {r.status === 'COMPLETED' && (
            <button type="button" className="icon-button" title="Lock" onClick={() => transition(r._id, examService.lockExam, 'Exam locked')}>
              <FiLock />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => setShowCreate(true)}>
          <FiPlus /> Add Exam
        </button>
      </div>

      <DataTable columns={columns} rows={exams} rowKey={(r) => r._id} loading={loading} emptyMessage="No exams yet." />

      {showCreate && (
        <Modal title="Add Exam" onClose={() => setShowCreate(false)} width={420}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Exam name *</label>
                <input placeholder="e.g. Unit Test 1" {...register('examName')} />
                {errors.examName && <p className="field-error">{errors.examName.message}</p>}
              </div>
              <div className="form-field form-field--wide">
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
                <label>Start date *</label>
                <input type="date" {...register('startDate')} />
                {errors.startDate && <p className="field-error">{errors.startDate.message}</p>}
              </div>
              <div className="form-field">
                <label>End date *</label>
                <input type="date" {...register('endDate')} />
                {errors.endDate && <p className="field-error">{errors.endDate.message}</p>}
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

export default ExamsTab;
