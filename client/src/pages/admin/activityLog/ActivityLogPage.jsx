import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/common/DataTable';
import useServerTable from '../../../hooks/useServerTable';
import * as activityLogService from '../../../services/activityLogService';

function ActivityLogPage() {
  const { data, loading, setPage } = useServerTable(activityLogService.listActivityLogs, {
    pageSize: 20,
    sortBy: 'createdAt',
    sortDir: 'desc',
  });

  const columns = [
    { key: 'createdAt', label: 'Timestamp', render: (r) => new Date(r.createdAt).toLocaleString() },
    { key: 'user', label: 'User', render: (r) => (r.userId ? `${r.userId.loginId} (${r.userId.role})` : 'System') },
    { key: 'action', label: 'Action' },
    { key: 'entityType', label: 'Entity' },
    { key: 'description', label: 'Description' },
  ];

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="Audit trail of important actions across the system" />
      <DataTable
        columns={columns}
        rows={data.items}
        rowKey={(r) => r._id}
        loading={loading}
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        totalPages={data.totalPages}
        onPageChange={setPage}
        emptyMessage="No activity recorded yet."
      />
    </div>
  );
}

export default ActivityLogPage;
