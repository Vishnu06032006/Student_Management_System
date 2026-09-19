import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import * as announcementService from '../../../services/announcementService';
import * as academicService from '../../../services/academicService';

const PRIORITY_TONE = { NORMAL: 'INFO', IMPORTANT: 'ON_LEAVE', URGENT: 'SUSPENDED' };

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  message: z.string().trim().min(1, 'Message is required'),
  audience: z.enum(['ALL', 'ALL_STUDENTS', 'ALL_STAFF', 'CLASS', 'SECTION']),
  audienceRef: z.string().optional(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']),
  expiryDate: z.string().optional(),
});

function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { audience: 'ALL', priority: 'NORMAL' } });

  const audience = watch('audience');

  useEffect(() => {
    academicService.listClasses().then(({ data }) => setClasses(data.data.items));
    academicService.listSections().then(({ data }) => setSections(data.data.items));
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await announcementService.listAnnouncements();
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
      const payload = { ...values };
      if (values.audience !== 'CLASS' && values.audience !== 'SECTION') {
        delete payload.audienceRef;
      }
      if (!payload.expiryDate) delete payload.expiryDate;
      await announcementService.createAnnouncement(payload);
      toast.success('Announcement created');
      setShowCreate(false);
      reset();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'audience', label: 'Audience' },
    { key: 'priority', label: 'Priority', render: (r) => <Badge value={PRIORITY_TONE[r.priority]} label={r.priority} /> },
    { key: 'publishDate', label: 'Published', render: (r) => new Date(r.publishDate).toLocaleDateString() },
    { key: 'expiryDate', label: 'Expires', render: (r) => (r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : 'Never') },
  ];

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle="Broadcast notices to students, staff, or specific classes"
        actions={
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> New Announcement
          </button>
        }
      />

      <DataTable columns={columns} rows={items} rowKey={(r) => r._id} loading={loading} emptyMessage="No announcements yet." />

      {showCreate && (
        <Modal title="New Announcement" onClose={() => setShowCreate(false)} width={480}>
          <form className="entity-form" onSubmit={handleSubmit(onCreate)} noValidate>
            <div className="form-grid">
              <div className="form-field form-field--wide">
                <label>Title *</label>
                <input {...register('title')} />
                {errors.title && <p className="field-error">{errors.title.message}</p>}
              </div>
              <div className="form-field form-field--wide">
                <label>Message *</label>
                <input {...register('message')} />
                {errors.message && <p className="field-error">{errors.message.message}</p>}
              </div>
              <div className="form-field">
                <label>Audience *</label>
                <select {...register('audience')}>
                  <option value="ALL">Everyone</option>
                  <option value="ALL_STUDENTS">All Students</option>
                  <option value="ALL_STAFF">All Staff</option>
                  <option value="CLASS">Specific Class</option>
                  <option value="SECTION">Specific Section</option>
                </select>
              </div>
              {audience === 'CLASS' && (
                <div className="form-field">
                  <label>Class *</label>
                  <select {...register('audienceRef')}>
                    <option value="">Select</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.className}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {audience === 'SECTION' && (
                <div className="form-field">
                  <label>Section *</label>
                  <select {...register('audienceRef')}>
                    <option value="">Select</option>
                    {sections.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.classId?.className} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-field">
                <label>Priority</label>
                <select {...register('priority')}>
                  <option value="NORMAL">Normal</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="form-field">
                <label>Expiry date</label>
                <input type="date" {...register('expiryDate')} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default AnnouncementsPage;
