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

const schema = z
  .object({
    subjectCode: z.string().trim().min(1, 'Subject code is required'),
    subjectName: z.string().trim().min(1, 'Subject name is required'),
    classId: z.string().min(1, 'Class is required'),
    maximumMarks: z.string().min(1, 'Required'),
    passMarks: z.string().min(1, 'Required'),
  })
  .refine((d) => Number(d.passMarks) <= Number(d.maximumMarks), {
    message: 'Pass marks cannot exceed maximum marks',
    path: ['passMarks'],
  });

function SubjectsTab({ classes }) {
  const [classFilter, setClassFilter] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { maximumMarks: '100', passMarks: '35' } });

  const load = async (classId) => {
    setLoading(true);
    try {
      const { data } = await academicService.listSubjects(classId ? { classId } : {});
      setSubjects(data.data.items);
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
      await academicService.createSubject({
        ...values,
        maximumMarks: Number(values.maximumMarks),
        passMarks: Number(values.passMarks),
      });
      toast.success('Subject created');
      setShowCreate(false);
      reset();
      load(classFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create subject');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (row) => {
    try {
      await academicService.updateSubject(row._id, { status: row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' });
      load(classFilter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update subject');
    }
  };

  const columns = [
    { key: 'subjectCode', label: 'Code' },
    { key: 'subjectName', label: 'Subject' },
    { key: 'class', label: 'Class', render: (r) => r.classId?.className || '-' },
    { key: 'maximumMarks', label: 'Max Marks' },
    { key: 'passMarks', label: 'Pass Marks' },
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
            <FiPlus /> Add Subject
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={subjects} rowKey={(r) => r._id} loading={loading} emptyMessage="No subjects yet." />

      {showCreate && (
        <Modal title="Add Subject" onClose={() => setShowCreate(false)} width={420}>
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
                <label>Subject code *</label>
                <input placeholder="e.g. MATH10" {...register('subjectCode')} />
                {errors.subjectCode && <p className="field-error">{errors.subjectCode.message}</p>}
              </div>
              <div className="form-field">
                <label>Subject name *</label>
                <input placeholder="e.g. Mathematics" {...register('subjectName')} />
                {errors.subjectName && <p className="field-error">{errors.subjectName.message}</p>}
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

export default SubjectsTab;
