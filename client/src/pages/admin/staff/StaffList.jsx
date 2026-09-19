import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiLock, FiUnlock, FiKey } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PageHeader from '../../../components/common/PageHeader';
import SearchInput from '../../../components/common/SearchInput';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import CredentialsModal from '../../../components/common/CredentialsModal';
import StaffForm from '../../../components/admin/StaffForm';
import useServerTable from '../../../hooks/useServerTable';
import * as staffService from '../../../services/staffService';

const COLUMNS = [
  { key: 'staffId', label: 'Staff ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true, render: (r) => r.fullName },
  { key: 'department', label: 'Department', render: (r) => r.department || '-' },
  { key: 'designation', label: 'Designation', render: (r) => r.designation || '-' },
  { key: 'accountStatus', label: 'Account', render: (r) => <Badge value={r.user?.status} /> },
  { key: 'staffStatus', label: 'Status', render: (r) => <Badge value={r.staffStatus} /> },
];

function StaffList() {
  const navigate = useNavigate();
  const { params, data, loading, setSearch, setPage, setFilter, setSort } = useServerTable(staffService.listStaff);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const reload = () => setPage(params.page);

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const { data: res } = await staffService.createStaff(values);
      setShowCreate(false);
      setCredentials({ loginId: res.data.loginId, temporaryPassword: res.data.temporaryPassword });
      toast.success('Staff created successfully');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create staff');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = (row) => {
    const nextStatus = row.user?.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    setConfirmAction({
      type: 'status',
      row,
      nextStatus,
      title: nextStatus === 'DISABLED' ? 'Disable account' : 'Enable account',
      message: `${nextStatus === 'DISABLED' ? 'Disable' : 'Enable'} login access for ${row.fullName} (${row.staffId})?`,
      danger: nextStatus === 'DISABLED',
    });
  };

  const handleResetPassword = (row) => {
    setConfirmAction({
      type: 'reset',
      row,
      title: 'Reset password',
      message: `Generate a new temporary password for ${row.fullName} (${row.staffId})? They will need to set a new password on next login.`,
    });
  };

  const runConfirmedAction = async () => {
    setActionBusy(true);
    try {
      if (confirmAction.type === 'status') {
        await staffService.setStaffStatus(confirmAction.row.id, confirmAction.nextStatus);
        toast.success('Account status updated');
        reload();
      } else if (confirmAction.type === 'reset') {
        const { data: res } = await staffService.resetStaffPassword(confirmAction.row.id);
        setCredentials({ loginId: res.data.loginId, temporaryPassword: res.data.temporaryPassword });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionBusy(false);
      setConfirmAction(null);
    }
  };

  const columns = [
    ...COLUMNS,
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button type="button" className="icon-button" title="View" onClick={() => navigate(`/admin/staff/${row.id}`)}>
            <FiEye />
          </button>
          <button
            type="button"
            className="icon-button"
            title={row.user?.status === 'ENABLED' ? 'Disable' : 'Enable'}
            onClick={() => handleToggleStatus(row)}
          >
            {row.user?.status === 'ENABLED' ? <FiLock /> : <FiUnlock />}
          </button>
          <button type="button" className="icon-button" title="Reset password" onClick={() => handleResetPassword(row)}>
            <FiKey />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage staff accounts and profiles"
        actions={
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> Add Staff
          </button>
        }
      />

      <div className="toolbar">
        <SearchInput value={params.search} onChange={setSearch} placeholder="Search by name, ID or email" />
        <select onChange={(e) => setFilter('staffStatus', e.target.value)} defaultValue="">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="INACTIVE">Inactive</option>
          <option value="RESIGNED">Resigned</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select onChange={(e) => setFilter('accountStatus', e.target.value)} defaultValue="">
          <option value="">All accounts</option>
          <option value="ENABLED">Enabled</option>
          <option value="DISABLED">Disabled</option>
          <option value="LOCKED">Locked</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data.items}
        rowKey={(r) => r.id}
        loading={loading}
        sortBy={params.sortBy}
        sortDir={params.sortDir}
        onSort={setSort}
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        totalPages={data.totalPages}
        onPageChange={setPage}
        emptyMessage="No staff yet. Click Add Staff to create the first one."
      />

      {showCreate && (
        <Modal title="Add Staff" onClose={() => setShowCreate(false)} width={720}>
          <StaffForm onSubmit={handleCreate} submitting={creating} />
        </Modal>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          danger={confirmAction.danger}
          confirmLabel={confirmAction.type === 'reset' ? 'Reset password' : 'Confirm'}
          submitting={actionBusy}
          onConfirm={runConfirmedAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {credentials && <CredentialsModal {...credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
}

export default StaffList;
