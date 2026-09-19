import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiX } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import * as odService from '../../services/odService';

function fmtDate(d) {
  return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function StaffODRequests() {
  const [items, setItems] = useState(null);
  const [decideTarget, setDecideTarget] = useState(null); // { row, decision }
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    odService
      .listStaffODQueue()
      .then(({ data }) => setItems(data.data.items))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  const openDecide = (row, decision) => {
    setDecideTarget({ row, decision });
    setComment(decision === 'REJECTED' ? 'Your OD request is declined. Come and meet me for further process.' : '');
  };

  const confirmDecide = async () => {
    setSubmitting(true);
    try {
      await odService.decideODItem(decideTarget.row.requestId, decideTarget.row.itemId, {
        decision: decideTarget.decision,
        comment,
      });
      toast.success(`OD request ${decideTarget.decision === 'APPROVED' ? 'approved' : 'declined'}`);
      setDecideTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save decision');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'student', label: 'Student', render: (r) => `${r.student.fullName} (${r.student.studentId})` },
    { key: 'eventName', label: 'Event' },
    { key: 'subjectName', label: 'Subject', render: (r) => `${r.subjectName} (${r.subjectCode})` },
    { key: 'date', label: 'Date', render: (r) => fmtDate(r.date) },
    {
      key: 'session',
      label: 'Session',
      render: (r) => (r.session === 'FULL_DAY' ? 'Full Day' : `Half Day (${r.halfDaySession})`),
    },
    {
      key: 'proof',
      label: 'Proof',
      render: (r) => (
        <a href={`${odService.UPLOADS_ORIGIN}${r.proofUrl}`} target="_blank" rel="noreferrer" className="auth-inline-link">
          View
        </a>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status} /> },
    {
      key: 'actions',
      label: '',
      render: (r) =>
        r.status === 'PENDING' ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="icon-button" title="Approve" onClick={() => openDecide(r, 'APPROVED')}>
              <FiCheck />
            </button>
            <button type="button" className="icon-button" title="Decline" onClick={() => openDecide(r, 'REJECTED')}>
              <FiX />
            </button>
          </div>
        ) : (
          r.decisionComment || '-'
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="OD Requests" subtitle="On-Duty requests for the subjects you teach" />
      <DataTable
        columns={columns}
        rows={items || []}
        rowKey={(r) => r.itemId}
        loading={items === null}
        emptyMessage="No OD requests for your subjects yet."
      />

      {decideTarget && (
        <Modal
          title={decideTarget.decision === 'APPROVED' ? 'Approve OD request' : 'Decline OD request'}
          onClose={() => setDecideTarget(null)}
          width={440}
          footer={
            <>
              <button type="button" className="button--secondary" onClick={() => setDecideTarget(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={confirmDecide} disabled={submitting}>
                {submitting ? 'Saving...' : decideTarget.decision === 'APPROVED' ? 'Approve' : 'Decline'}
              </button>
            </>
          }
        >
          <p>
            {decideTarget.row.student.fullName} - {decideTarget.row.subjectName} on {fmtDate(decideTarget.row.date)}
          </p>
          <div className="form-field">
            <label>Message to student</label>
            <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default StaffODRequests;
