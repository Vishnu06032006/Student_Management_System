import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiUnlock, FiKey, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PageHeader from '../../../components/common/PageHeader';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import CredentialsModal from '../../../components/common/CredentialsModal';
import StaffForm from '../../../components/admin/StaffForm';
import * as staffService from '../../../services/staffService';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [workload, setWorkload] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await staffService.getStaff(id);
      setStaff(data.data.staff);
    } catch {
      toast.error('Could not load staff member');
      navigate('/admin/staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    staffService.getStaffWorkload(id).then(({ data }) => setWorkload(data.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !staff) {
    return <div className="page-card">Loading...</div>;
  }

  const handleUpdate = async (values) => {
    setSaving(true);
    try {
      await staffService.updateStaff(id, values);
      toast.success('Staff updated');
      setShowEdit(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const runConfirmedAction = async () => {
    setActionBusy(true);
    try {
      if (confirmAction.type === 'status') {
        await staffService.setStaffStatus(id, confirmAction.nextStatus);
        toast.success('Account status updated');
        load();
      } else if (confirmAction.type === 'reset') {
        const { data: res } = await staffService.resetStaffPassword(id);
        setCredentials({ loginId: res.data.loginId, temporaryPassword: res.data.temporaryPassword });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionBusy(false);
      setConfirmAction(null);
    }
  };

  const isEnabled = staff.user?.status === 'ENABLED';

  return (
    <div>
      <Link to="/admin/staff" className="back-link">
        <FiArrowLeft /> Back to Staff
      </Link>

      <PageHeader
        title={staff.fullName}
        subtitle={`${staff.staffId} · ${staff.user?.email || ''}`}
        actions={
          <>
            <button type="button" className="button--secondary" onClick={() => setShowEdit(true)}>
              <FiEdit2 /> Edit
            </button>
            <button
              type="button"
              className="button--secondary"
              onClick={() =>
                setConfirmAction({
                  type: 'status',
                  nextStatus: isEnabled ? 'DISABLED' : 'ENABLED',
                  title: isEnabled ? 'Disable account' : 'Enable account',
                  message: `${isEnabled ? 'Disable' : 'Enable'} login access for ${staff.fullName}?`,
                  danger: isEnabled,
                })
              }
            >
              {isEnabled ? <FiLock /> : <FiUnlock />} {isEnabled ? 'Disable' : 'Enable'}
            </button>
            <button
              type="button"
              className="button--secondary"
              onClick={() =>
                setConfirmAction({
                  type: 'reset',
                  title: 'Reset password',
                  message: `Generate a new temporary password for ${staff.fullName}?`,
                })
              }
            >
              <FiKey /> Reset Password
            </button>
          </>
        }
      />

      <div className="detail-grid">
        <div className="page-card">
          <h2>Account</h2>
          <dl className="detail-list">
            <dt>Login ID</dt>
            <dd>{staff.user?.loginId}</dd>
            <dt>Account status</dt>
            <dd>
              <Badge value={staff.user?.status} />
            </dd>
            <dt>Must change password</dt>
            <dd>{staff.user?.mustChangePassword ? 'Yes' : 'No'}</dd>
            <dt>Last login</dt>
            <dd>{staff.user?.lastLoginAt ? new Date(staff.user.lastLoginAt).toLocaleString() : 'Never'}</dd>
          </dl>
        </div>

        <div className="page-card">
          <h2>Personal information</h2>
          <dl className="detail-list">
            <dt>Phone</dt>
            <dd>{staff.phone || '-'}</dd>
            <dt>Gender</dt>
            <dd>{staff.gender || '-'}</dd>
            <dt>Date of birth</dt>
            <dd>{formatDate(staff.dateOfBirth)}</dd>
            <dt>Address</dt>
            <dd>{staff.address || '-'}</dd>
          </dl>
        </div>

        <div className="page-card">
          <h2>Employment</h2>
          <dl className="detail-list">
            <dt>Qualification</dt>
            <dd>{staff.qualification || '-'}</dd>
            <dt>Department</dt>
            <dd>{staff.department || '-'}</dd>
            <dt>Designation</dt>
            <dd>{staff.designation || '-'}</dd>
            <dt>Joining date</dt>
            <dd>{formatDate(staff.joiningDate)}</dd>
            <dt>Experience</dt>
            <dd>{staff.experience != null ? `${staff.experience} years` : '-'}</dd>
            <dt>Employment type</dt>
            <dd>{staff.employmentType}</dd>
            <dt>Status</dt>
            <dd>
              <Badge value={staff.staffStatus} />
            </dd>
          </dl>
        </div>

        <div className="page-card">
          <h2>Workload</h2>
          {!workload && <p>Loading...</p>}
          {workload && (
            <>
              <dl className="detail-list">
                <dt>Periods per week</dt>
                <dd>{workload.periodsPerWeek}</dd>
                <dt>Class teacher of</dt>
                <dd>{workload.classTeacherOf.length ? workload.classTeacherOf.join(', ') : 'None'}</dd>
              </dl>
              {workload.assignments.length > 0 && (
                <ul style={{ marginTop: 12, paddingLeft: 18 }}>
                  {workload.assignments.map((a, i) => (
                    <li key={i}>
                      {a.subjectName} - {a.className} {a.sectionName}
                      {a.isClassTeacher ? ' (Class Teacher)' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {showEdit && (
        <Modal title="Edit Staff" onClose={() => setShowEdit(false)} width={720}>
          <StaffForm
            defaultValues={{
              fullName: staff.fullName,
              email: staff.user?.email,
              phone: staff.phone || '',
              gender: staff.gender || '',
              dateOfBirth: staff.dateOfBirth ? staff.dateOfBirth.slice(0, 10) : '',
              address: staff.address || '',
              qualification: staff.qualification || '',
              department: staff.department || '',
              designation: staff.designation || '',
              joiningDate: staff.joiningDate ? staff.joiningDate.slice(0, 10) : '',
              experience: staff.experience ?? '',
              employmentType: staff.employmentType || 'FULL_TIME',
            }}
            onSubmit={handleUpdate}
            submitting={saving}
            submitLabel="Save changes"
          />
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

export default StaffDetail;
