import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiLock, FiUnlock, FiKey, FiEdit2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import PageHeader from '../../../components/common/PageHeader';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import CredentialsModal from '../../../components/common/CredentialsModal';
import StudentForm from '../../../components/admin/StudentForm';
import * as studentService from '../../../services/studentService';

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await studentService.getStudent(id);
      setStudent(data.data.student);
    } catch {
      toast.error('Could not load student');
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !student) {
    return <div className="page-card">Loading...</div>;
  }

  const handleUpdate = async (values) => {
    setSaving(true);
    try {
      await studentService.updateStudent(id, values);
      toast.success('Student updated');
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
        await studentService.setStudentStatus(id, confirmAction.nextStatus);
        toast.success('Account status updated');
        load();
      } else if (confirmAction.type === 'reset') {
        const { data: res } = await studentService.resetStudentPassword(id);
        setCredentials({ loginId: res.data.loginId, temporaryPassword: res.data.temporaryPassword });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionBusy(false);
      setConfirmAction(null);
    }
  };

  const isEnabled = student.user?.status === 'ENABLED';

  return (
    <div>
      <Link to="/admin/students" className="back-link">
        <FiArrowLeft /> Back to Students
      </Link>

      <PageHeader
        title={student.fullName}
        subtitle={`${student.studentId} · ${student.user?.email || ''}`}
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
                  message: `${isEnabled ? 'Disable' : 'Enable'} login access for ${student.fullName}?`,
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
                  message: `Generate a new temporary password for ${student.fullName}?`,
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
            <dd>{student.user?.loginId}</dd>
            <dt>Account status</dt>
            <dd>
              <Badge value={student.user?.status} />
            </dd>
            <dt>Must change password</dt>
            <dd>{student.user?.mustChangePassword ? 'Yes' : 'No'}</dd>
            <dt>Last login</dt>
            <dd>{student.user?.lastLoginAt ? new Date(student.user.lastLoginAt).toLocaleString() : 'Never'}</dd>
          </dl>
        </div>

        <div className="page-card">
          <h2>Personal information</h2>
          <dl className="detail-list">
            <dt>Phone</dt>
            <dd>{student.phone || '-'}</dd>
            <dt>Gender</dt>
            <dd>{student.gender || '-'}</dd>
            <dt>Date of birth</dt>
            <dd>{formatDate(student.dateOfBirth)}</dd>
            <dt>Blood group</dt>
            <dd>{student.bloodGroup || '-'}</dd>
            <dt>Address</dt>
            <dd>{student.address || '-'}</dd>
          </dl>
        </div>

        <div className="page-card">
          <h2>Admission</h2>
          <dl className="detail-list">
            <dt>Admission number</dt>
            <dd>{student.admissionNumber || '-'}</dd>
            <dt>Roll number</dt>
            <dd>{student.rollNumber || '-'}</dd>
            <dt>Year / Section</dt>
            <dd>{student.className ? `${student.className} - Section ${student.sectionName || '-'}` : '-'}</dd>
            <dt>Academic year</dt>
            <dd>{student.academicYearName || '-'}</dd>
            <dt>Admission date</dt>
            <dd>{formatDate(student.admissionDate)}</dd>
            <dt>Status</dt>
            <dd>
              <Badge value={student.studentStatus} />
            </dd>
          </dl>
        </div>

        <div className="page-card">
          <h2>Parent / Guardian</h2>
          <dl className="detail-list">
            <dt>Father's name</dt>
            <dd>{student.fatherName || '-'}</dd>
            <dt>Mother's name</dt>
            <dd>{student.motherName || '-'}</dd>
            <dt>Guardian's name</dt>
            <dd>{student.guardianName || '-'}</dd>
            <dt>Parent phone</dt>
            <dd>{student.parentPhone || '-'}</dd>
            <dt>Parent email</dt>
            <dd>{student.parentEmail || '-'}</dd>
          </dl>
        </div>
      </div>

      {showEdit && (
        <Modal title="Edit Student" onClose={() => setShowEdit(false)} width={720}>
          <StudentForm
            defaultValues={{
              fullName: student.fullName,
              email: student.user?.email,
              phone: student.phone || '',
              gender: student.gender || '',
              dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
              bloodGroup: student.bloodGroup || '',
              address: student.address || '',
              admissionNumber: student.admissionNumber || '',
              rollNumber: student.rollNumber || '',
              admissionDate: student.admissionDate ? student.admissionDate.slice(0, 10) : '',
              fatherName: student.fatherName || '',
              motherName: student.motherName || '',
              guardianName: student.guardianName || '',
              parentPhone: student.parentPhone || '',
              parentEmail: student.parentEmail || '',
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

export default StudentDetail;
