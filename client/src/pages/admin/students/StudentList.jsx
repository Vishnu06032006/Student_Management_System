import { useEffect, useState } from 'react';
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
import StudentForm from '../../../components/admin/StudentForm';
import useServerTable from '../../../hooks/useServerTable';
import * as studentService from '../../../services/studentService';
import * as academicService from '../../../services/academicService';

const COLUMNS = [
  { key: 'studentId', label: 'Student ID', sortable: true },
  { key: 'rollNumber', label: 'Roll No.', render: (r) => r.rollNumber || '-' },
  { key: 'name', label: 'Name', sortable: true, render: (r) => r.fullName },
  { key: 'batch', label: 'Year / Section', render: (r) => (r.className ? `${r.className} - ${r.sectionName || '-'}` : '-') },
  { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
  { key: 'accountStatus', label: 'Account', render: (r) => <Badge value={r.user?.status} /> },
  { key: 'studentStatus', label: 'Status', render: (r) => <Badge value={r.studentStatus} /> },
];

function StudentList() {
  const navigate = useNavigate();
  const { params, data, loading, setSearch, setPage, setFilter, setSort } = useServerTable(
    studentService.listStudents
  );

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [years, setYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [yearFilter, setYearFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Lets the admin narrow the list to a specific year (semester) and
  // section/batch before searching by roll number - or skip straight to
  // typing a roll number in the search box, since roll numbers are globally
  // unique across the department.
  useEffect(() => {
    academicService.listAcademicYears().then(({ data }) => setYears(data.data.items));
    academicService.listClasses().then(({ data }) => setClasses(data.data.items));
  }, []);

  useEffect(() => {
    if (classFilter) {
      academicService.listSections({ classId: classFilter }).then(({ data }) => setSections(data.data.items));
    } else {
      setSections([]);
    }
  }, [classFilter]);

  const classesForYear = classes.filter((c) => !yearFilter || c.academicYearId?._id === yearFilter || c.academicYearId === yearFilter);

  const reload = () => setPage(params.page);

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const { data: res } = await studentService.createStudent(values);
      setShowCreate(false);
      setCredentials({ loginId: res.data.loginId, temporaryPassword: res.data.temporaryPassword });
      toast.success('Student created successfully');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create student');
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
      message: `${nextStatus === 'DISABLED' ? 'Disable' : 'Enable'} login access for ${row.fullName} (${row.studentId})?`,
      danger: nextStatus === 'DISABLED',
    });
  };

  const handleResetPassword = (row) => {
    setConfirmAction({
      type: 'reset',
      row,
      title: 'Reset password',
      message: `Generate a new temporary password for ${row.fullName} (${row.studentId})? They will need to set a new password on next login.`,
    });
  };

  const runConfirmedAction = async () => {
    setActionBusy(true);
    try {
      if (confirmAction.type === 'status') {
        await studentService.setStudentStatus(confirmAction.row.id, confirmAction.nextStatus);
        toast.success('Account status updated');
        reload();
      } else if (confirmAction.type === 'reset') {
        const { data: res } = await studentService.resetStudentPassword(confirmAction.row.id);
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
          <button type="button" className="icon-button" title="View" onClick={() => navigate(`/admin/students/${row.id}`)}>
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
        title="Students"
        subtitle="Manage student accounts and profiles"
        actions={
          <button type="button" onClick={() => setShowCreate(true)}>
            <FiPlus /> Add Student
          </button>
        }
      />

      <div className="toolbar">
        <SearchInput value={params.search} onChange={setSearch} placeholder="Enter roll number, name, student ID or email" />
        <select
          value={yearFilter}
          onChange={(e) => {
            const v = e.target.value;
            setYearFilter(v);
            setClassFilter('');
            setFilter('academicYearId', v);
            setFilter('classId', '');
            setFilter('sectionId', '');
          }}
        >
          <option value="">All academic years</option>
          {years.map((y) => (
            <option key={y._id} value={y._id}>
              {y.name}
            </option>
          ))}
        </select>
        <select
          value={classFilter}
          onChange={(e) => {
            const v = e.target.value;
            setClassFilter(v);
            setFilter('classId', v);
            setFilter('sectionId', '');
          }}
        >
          <option value="">All years (semester)</option>
          {classesForYear.map((c) => (
            <option key={c._id} value={c._id}>
              {c.className}
            </option>
          ))}
        </select>
        <select onChange={(e) => setFilter('sectionId', e.target.value)} defaultValue="" disabled={!classFilter}>
          <option value="">All sections</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              Section {s.name}
            </option>
          ))}
        </select>
        <select onChange={(e) => setFilter('studentStatus', e.target.value)} defaultValue="">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="GRADUATED">Graduated</option>
          <option value="TRANSFERRED">Transferred</option>
          <option value="SUSPENDED">Suspended</option>
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
        emptyMessage="No students yet. Click Add Student to create the first one."
      />

      {showCreate && (
        <Modal title="Add Student" onClose={() => setShowCreate(false)} width={720}>
          <StudentForm onSubmit={handleCreate} submitting={creating} />
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

export default StudentList;
