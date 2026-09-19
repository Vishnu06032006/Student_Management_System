import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { FiFileText, FiCheckCircle } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import * as odService from '../../services/odService';

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const schema = z
  .object({
    eventName: z.string().trim().min(1, 'Event name is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    session: z.enum(['FULL_DAY', 'HALF_DAY']),
    halfDaySession: z.string().optional(),
    proofFile: z
      .any()
      .refine((files) => files && files.length === 1, 'Proof document is required')
      .refine((files) => files?.[0]?.size <= MAX_PROOF_BYTES, 'File must be 5MB or smaller')
      .refine((files) => files?.[0] && ALLOWED_TYPES.includes(files[0].type), 'Only JPG, PNG, WEBP or PDF files are allowed'),
  })
  .refine((d) => d.session !== 'HALF_DAY' || !!d.halfDaySession, { message: 'Select FN or AN', path: ['halfDaySession'] })
  .refine((d) => new Date(d.endDate) >= new Date(d.startDate), { message: 'End date must be on or after start date', path: ['endDate'] });

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function ODRequests() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { session: 'FULL_DAY' } });

  const [computedClasses, setComputedClasses] = useState(null);
  const [computing, setComputing] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState(null);

  const session = watch('session');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const halfDaySession = watch('halfDaySession');

  const loadMyRequests = () => {
    odService
      .listMyODRequests()
      .then(({ data }) => setMyRequests(data.data.items))
      .catch(() => setMyRequests([]));
  };

  useEffect(() => {
    loadMyRequests();
  }, []);

  useEffect(() => {
    setComputedClasses(null);
    setSelectedKeys(new Set());
  }, [startDate, endDate, session, halfDaySession]);

  const onComputeClasses = async () => {
    if (!startDate || !endDate) {
      toast.error('Pick a start and end date first');
      return;
    }
    if (session === 'HALF_DAY' && !halfDaySession) {
      toast.error('Select FN or AN for a half day');
      return;
    }
    setComputing(true);
    try {
      const { data } = await odService.computeClasses({ startDate, endDate, session, halfDaySession });
      setComputedClasses(data.data.items);
      setSelectedKeys(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not compute classes');
    } finally {
      setComputing(false);
    }
  };

  const groupedByDate = useMemo(() => {
    const map = new Map();
    (computedClasses || []).forEach((item) => {
      const key = new Date(item.date).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return map;
  }, [computedClasses]);

  const toggleItem = (item) => {
    const key = `${new Date(item.date).toISOString().slice(0, 10)}:${item.subjectId}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onSubmit = async (values) => {
    if (selectedKeys.size === 0) {
      toast.error('Compute classes and select at least one subject');
      return;
    }
    const items = (computedClasses || [])
      .filter((item) => selectedKeys.has(`${new Date(item.date).toISOString().slice(0, 10)}:${item.subjectId}`))
      .map((item) => ({ date: item.date, subjectId: item.subjectId }));

    const formData = new FormData();
    formData.append('eventName', values.eventName);
    formData.append('startDate', values.startDate);
    formData.append('endDate', values.endDate);
    formData.append('session', values.session);
    if (values.session === 'HALF_DAY') formData.append('halfDaySession', values.halfDaySession);
    formData.append('items', JSON.stringify(items));
    formData.append('proof', values.proofFile[0]);

    setSubmitting(true);
    try {
      await odService.createODRequest(formData);
      toast.success('OD request submitted');
      reset({ eventName: '', startDate: '', endDate: '', session: 'FULL_DAY', halfDaySession: '', proofFile: null });
      setComputedClasses(null);
      setSelectedKeys(new Set());
      loadMyRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit OD request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="OD Requests" subtitle="Apply for On-Duty leave when you attend a college-related event" />

      <div className="page-card" style={{ maxWidth: 'none' }}>
        <h2>Apply for OD</h2>
        <form className="entity-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            <div className="form-field form-field--wide">
              <label>Event name *</label>
              <input placeholder="e.g. Inter-college Tech Symposium" {...register('eventName')} />
              {errors.eventName && <p className="field-error">{errors.eventName.message}</p>}
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
            <div className="form-field">
              <label>Session *</label>
              <select {...register('session')}>
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
            </div>
            {session === 'HALF_DAY' && (
              <div className="form-field">
                <label>Half day session *</label>
                <select {...register('halfDaySession')}>
                  <option value="">Select</option>
                  <option value="FN">Forenoon (FN)</option>
                  <option value="AN">Afternoon (AN)</option>
                </select>
                {errors.halfDaySession && <p className="field-error">{errors.halfDaySession.message}</p>}
              </div>
            )}
            <div className="form-field form-field--wide">
              <label>Proof document (image or PDF, max 5MB) *</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" {...register('proofFile')} />
              {errors.proofFile && <p className="field-error">{errors.proofFile.message}</p>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onComputeClasses} disabled={computing}>
              <FiFileText /> {computing ? 'Computing...' : 'Compute Classes'}
            </button>
          </div>

          {computedClasses !== null && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: '0 0 8px' }}>Select the subjects to apply OD for</h3>
              {computedClasses.length === 0 && <p>No classes are scheduled on the selected date(s)/session.</p>}
              {[...groupedByDate.entries()].map(([dateKey, items]) => (
                <div key={dateKey} style={{ marginBottom: 10 }}>
                  <strong>{fmtDate(dateKey)}</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                    {items.map((item) => {
                      const key = `${dateKey}:${item.subjectId}`;
                      return (
                        <label key={key} className="role-select-option" style={{ padding: '8px 12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedKeys.has(key)}
                            onChange={() => toggleItem(item)}
                            style={{ marginRight: 8 }}
                          />
                          <span className="role-select-option__text">
                            <span className="role-select-option__label">{item.subjectName}</span>
                            <span className="role-select-option__description">
                              P{item.period} · {item.startTime}-{item.endTime} · {item.staffName}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {computedClasses.length > 0 && (
                <div className="form-actions">
                  <button type="submit" disabled={submitting || selectedKeys.size === 0}>
                    <FiCheckCircle /> {submitting ? 'Submitting...' : `Submit OD Request (${selectedKeys.size} selected)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      <div className="page-card" style={{ maxWidth: 'none', marginTop: 20 }}>
        <h2>My OD Requests</h2>
        {myRequests === null && <p>Loading...</p>}
        {myRequests !== null && myRequests.length === 0 && <p>No OD requests submitted yet.</p>}
        {myRequests !== null &&
          myRequests.map((r) => (
            <div key={r._id} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
              <div className="page-header" style={{ marginTop: 0 }}>
                <div>
                  <strong>{r.eventName}</strong>
                  <p className="chart-subtitle" style={{ margin: '2px 0 0' }}>
                    {fmtDate(r.startDate)} - {fmtDate(r.endDate)} ·{' '}
                    {r.session === 'FULL_DAY' ? 'Full Day' : `Half Day (${r.halfDaySession})`}
                  </p>
                </div>
                <a href={`${odService.UPLOADS_ORIGIN}${r.proofUrl}`} target="_blank" rel="noreferrer" className="auth-inline-link">
                  View proof
                </a>
              </div>
              <ul className="dashboard-list">
                {r.items.map((item) => (
                  <li key={item._id}>
                    <span>
                      {item.subjectId?.subjectName} · {fmtDate(item.date)}
                    </span>
                    <span className="dashboard-list__meta">
                      <Badge value={item.status} />
                      {item.status === 'REJECTED' && item.decisionComment ? ` - ${item.decisionComment}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}

export default ODRequests;
