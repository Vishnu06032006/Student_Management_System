import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import DataTable from '../../../components/common/DataTable';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import * as academicService from '../../../services/academicService';

const schema = z.object({
  className: z.string().trim().min(1, 'Class name is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  description: z.string().optional(),
});

function ClassesTab({ years, onChanged }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeYear = years.find((y) => y.isActive);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { academicYearId: activeYear?._id || '' } });

  const load = async (academicYearId) => {
    setLoading(true);
    try {
      const { data } = await academicService.listClasses(academicYearId ? { academicYearId } : {});
      setClasses(data.data.items);
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
      await academicService.createClass(values);
      toast.success('Class created');
      setShowCreate(false);
      reset();
      load(yearFilter);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create class');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (row) => {
    try {
      await academicService.updateClass(row._id, { status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      load(yearFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update class');
    }
  };

  const columns = [
    { key: 'className', label: 'Class' },
    { key: 'academicYear', label: 'Academic Year', render: (r) => r.academicYearId?.name || '-' },
    { key: 'description', label: 'Description', render: (r) => r.description || '-' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button
          type="button"
          className="icon-button"
          title={r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          onClick={() => toggleStatus(r)}
        >
          {r.status === 'ACTIVE' ? <FiToggleRight /> : <FiToggleLeft />}
        </button>
      ),
    },
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
            <FiPlus /> Add Class
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={classes} rowKey={(r) => r._id} loading={loading} emptyMessage="No classes yet." />

      {showCreate && (
        <Modal title="Add Class" onClose={() => setShowCreate(false)} width={420}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Class name *</label>
                <input placeholder="e.g. Class 10" {...register('className')} />
                {errors.className && <p className="field-error">{errors.className.message}</p>}
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
              <div className="form-field form-field--wide">
                <label>Description</label>
                <input {...register('description')} />
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

export default ClassesTab;
