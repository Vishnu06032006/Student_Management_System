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
import * as staffService from '../../../services/staffService';

const schema = z.object({
  name: z.string().trim().min(1, 'Section name is required'),
  classId: z.string().min(1, 'Class is required'),
  classTeacherId: z.string().optional(),
  capacity: z.string().optional(),
});

function SectionsTab({ classes }) {
  const [classFilter, setClassFilter] = useState('');
  const [sections, setSections] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    staffService.listStaff({ pageSize: 100 }).then(({ data }) => setStaff(data.data.items));
  }, []);

  const load = async (classId) => {
    setLoading(true);
    try {
      const { data } = await academicService.listSections(classId ? { classId } : {});
      setSections(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(classFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter]);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await academicService.createSection({
        ...values,
        classTeacherId: values.classTeacherId || undefined,
        capacity: values.capacity ? Number(values.capacity) : undefined,
      });
      toast.success('Section created');
      setShowCreate(false);
      reset();
      load(classFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create section');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (row) => {
    try {
      await academicService.updateSection(row._id, { status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      load(classFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update section');
    }
  };

  const columns = [
    { key: 'name', label: 'Section' },
    { key: 'class', label: 'Class', render: (r) => r.classId?.className || '-' },
    { key: 'classTeacher', label: 'Class Teacher', render: (r) => r.classTeacherId?.fullName || 'Not assigned' },
    { key: 'capacity', label: 'Capacity', render: (r) => r.capacity ?? '-' },
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
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.className} ({c.academicYearId?.name})
            </option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> Add Section
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={sections} rowKey={(r) => r._id} loading={loading} emptyMessage="No sections yet." />

      {showCreate && (
        <Modal title="Add Section" onClose={() => setShowCreate(false)} width={420}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Class *</label>
                <select {...register('classId')}>
                  <option value="">Select</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.className} ({c.academicYearId?.name})
                    </option>
                  ))}
                </select>
                {errors.classId && <p className="field-error">{errors.classId.message}</p>}
              </div>
              <div className="form-field">
                <label>Section name *</label>
                <input placeholder="e.g. A" {...register('name')} />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>
              <div className="form-field">
                <label>Capacity</label>
                <input type="number" min="1" {...register('capacity')} />
              </div>
              <div className="form-field form-field--wide">
                <label>Class teacher</label>
                <select {...register('classTeacherId')}>
                  <option value="">Not assigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.staffId})
                    </option>
                  ))}
                </select>
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

export default SectionsTab;
