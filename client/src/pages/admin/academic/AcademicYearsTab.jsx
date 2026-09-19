import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus, FiCheckCircle } from 'react-icons/fi';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import * as academicService from '../../../services/academicService';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

function AcademicYearsTab({ onChanged }) {
  const [years, setYears] = useState([]);
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
      const { data } = await academicService.listAcademicYears();
      setYears(data.data.items);
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
      await academicService.createAcademicYear(values);
      toast.success('Academic year created');
      setShowCreate(false);
      reset();
      load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create academic year');
    } finally {
      setSubmitting(false);
    }
  };

  const activate = async (id) => {
    try {
      await academicService.activateAcademicYear(id);
      toast.success('Academic year activated');
      load();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not activate');
    }
  };

  const columns = [
    { key: 'name', label: 'Academic Year' },
    { key: 'startDate', label: 'Start Date', render: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: 'endDate', label: 'End Date', render: (r) => new Date(r.endDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r) => (r.isActive ? <Badge value="ACTIVE" /> : <Badge value="INACTIVE" label="Archived" />) },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        !r.isActive && (
          <button type="button" className="icon-button" title="Mark active" onClick={() => activate(r._id)}>
            <FiCheckCircle />
          </button>
        ),
    },
  ];

  return (
    <div>
      <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
        <button type="button" onClick={() => setShowCreate(true)}>
          <FiPlus /> Add Academic Year
        </button>
      </div>

      <DataTable columns={columns} rows={years} rowKey={(r) => r._id} loading={loading} emptyMessage="No academic years yet." />

      {showCreate && (
        <Modal title="Add Academic Year" onClose={() => setShowCreate(false)} width={420}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Name (e.g. 2026-27) *</label>
                <input {...register('name')} />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
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

export default AcademicYearsTab;
