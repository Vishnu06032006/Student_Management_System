import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiX } from 'react-icons/fi';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import * as leaveService from '../../../services/leaveService';

const STATUS_TONE = { PENDING: 'ON_LEAVE', APPROVED: 'ACTIVE', REJECTED: 'SUSPENDED', CANCELLED: 'INACTIVE' };

function LeaveManagement() {
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await leaveService.listLeaves(statusFilter ? { status: statusFilter } : {});
      setItems(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const submitDecision = async () => {
    setSubmitting(true);
    try {
      await leaveService.decideLeave(decision.id, { status: decision.status, approvalComment: comment });
      toast.success(`Leave ${decision.status.toLowerCase()}`);
      setDecision(null);
      setComment('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'user', label: 'User', render: (r) => `${r.userId?.loginId} (${r.role})` },
    { key: 'leaveType', label: 'Type' },
    { key: 'fromDate', label: 'From', render: (r) => new Date(r.fromDate).toLocaleDateString() },
    { key: 'toDate', label: 'To', render: (r) => new Date(r.toDate).toLocaleDateString() },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (r) => <Badge value={STATUS_TONE[r.status]} label={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'PENDING' && (
          <div className="row-actions">
            <button type="button" className="icon-button" title="Approve" onClick={() => setDecision({ id: r._id, status: 'APPROVED' })}>
              <FiCheck />
            </button>
            <button type="button" className="icon-button" title="Reject" onClick={() => setDecision({ id: r._id, status: 'REJECTED' })}>
              <FiX />
            </button>
          </div>
        ),
    },
  ];

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Review and decide on leave requests" />

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable columns={columns} rows={items} rowKey={(r) => r._id} loading={loading} emptyMessage="No leave requests found." />

      {decision && (
        <Modal
          title={decision.status === 'APPROVED' ? 'Approve Leave' : 'Reject Leave'}
          onClose={() => setDecision(null)}
          width={400}
          footer={
            <>
              <button type="button" className="button--secondary" onClick={() => setDecision(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" onClick={submitDecision} disabled={submitting}>
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </>
          }
        >
          <div className="form-field">
            <label>Comment (optional)</label>
            <input value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default LeaveManagement;
