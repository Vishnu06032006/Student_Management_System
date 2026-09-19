import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus, FiX } from 'react-icons/fi';
import PageHeader from '../components/common/PageHeader';
import DataTable from '../components/common/DataTable';
import Badge from '../components/common/Badge';
import Modal from '../components/common/Modal';
import * as leaveService from '../services/leaveService';

const schema = z
  .object({
    leaveType: z.enum(['SICK', 'CASUAL', 'EMERGENCY', 'OTHER']),
    fromDate: z.string().min(1, 'Required'),
    toDate: z.string().min(1, 'Required'),
    reason: z.string().trim().min(1, 'Reason is required'),
  })
  .refine((d) => new Date(d.toDate) >= new Date(d.fromDate), {
    message: 'To date must be on or after from date',
    path: ['toDate'],
  });

const STATUS_TONE = { PENDING: 'ON_LEAVE', APPROVED: 'ACTIVE', REJECTED: 'SUSPENDED', CANCELLED: 'INACTIVE' };

function Leave() {
  const [items, setItems] = useState([]);
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
      const { data } = await leaveService.listLeaves();
      setItems(data.data.items);
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
      await leaveService.createLeave(values);
      toast.success('Leave request submitted');
      setShowCreate(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (id) => {
    try {
      await leaveService.cancelLeave(id);
      toast.success('Leave request cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    }
  };

  const columns = [
    { key: 'leaveType', label: 'Type' },
    { key: 'fromDate', label: 'From', render: (r) => new Date(r.fromDate).toLocaleDateString() },
    { key: 'toDate', label: 'To', render: (r) => new Date(r.toDate).toLocaleDateString() },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={STATUS_TONE[r.status]} label={r.status} /> },
    { key: 'approvalComment', label: 'Comment', render: (r) => r.approvalComment || '-' },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r.status === 'PENDING' && (
          <button type="button" className="icon-button" title="Cancel" onClick={() => cancel(r._id)}>
            <FiX />
          </button>
        ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave"
        subtitle="Apply for leave and track your requests"
        actions={
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> Apply for Leave
          </button>
        }
      />

      <DataTable columns={columns} rows={items} rowKey={(r) => r._id} loading={loading} emptyMessage="No leave requests yet." />

      {showCreate && (
        <Modal title="Apply for Leave" onClose={() => setShowCreate(false)} width={420}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Leave type *</label>
                <select {...register('leaveType')}>
                  <option value="SICK">Sick</option>
                  <option value="CASUAL">Casual</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-field">
                <label>From date *</label>
                <input type="date" {...register('fromDate')} />
                {errors.fromDate && <p className="field-error">{errors.fromDate.message}</p>}
              </div>
              <div className="form-field">
                <label>To date *</label>
                <input type="date" {...register('toDate')} />
                {errors.toDate && <p className="field-error">{errors.toDate.message}</p>}
              </div>
              <div className="form-field form-field--wide">
                <label>Reason *</label>
                <input {...register('reason')} />
                {errors.reason && <p className="field-error">{errors.reason.message}</p>}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Leave;
