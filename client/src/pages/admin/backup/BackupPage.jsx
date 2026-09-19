import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiDatabase } from 'react-icons/fi';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import Badge from '../../../components/common/Badge';
import * as backupService from '../../../services/backupService';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BackupPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await backupService.listBackups();
      setItems(data.data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runBackup = async () => {
    setRunning(true);
    try {
      await backupService.createBackup();
      toast.success('Backup created');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Backup failed');
    } finally {
      setRunning(false);
    }
  };

  const columns = [
    { key: 'createdAt', label: 'Created', render: (r) => new Date(r.createdAt).toLocaleString() },
    { key: 'type', label: 'Type' },
    { key: 'createdBy', label: 'Triggered By', render: (r) => r.createdBy?.loginId || 'System (scheduled)' },
    { key: 'size', label: 'Size', render: (r) => formatSize(r.size) },
    { key: 'status', label: 'Status', render: (r) => <Badge value={r.status === 'SUCCESS' ? 'ACTIVE' : 'SUSPENDED'} label={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Backup"
        subtitle="Manual and scheduled database backups"
        actions={
          <button type="button" onClick={runBackup} disabled={running}>
            <FiDatabase /> {running ? 'Backing up...' : 'Run Backup Now'}
          </button>
        }
      />

      <DataTable columns={columns} rows={items} rowKey={(r) => r._id} loading={loading} emptyMessage="No backups yet." />
    </div>
  );
}

export default BackupPage;
