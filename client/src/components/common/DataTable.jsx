import { FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from 'react-icons/fi';

function DataTable({ columns, rows, rowKey, loading, emptyMessage = 'No records found', sortBy, sortDir, onSort, page, pageSize, total, totalPages, onPageChange }) {
  const paginated = typeof onPageChange === 'function';
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'is-sortable' : ''}
                onClick={col.sortable ? () => onSort(col.key) : undefined}
              >
                <span>
                  {col.label}
                  {col.sortable && sortBy === col.key && (sortDir === 'asc' ? <FiChevronUp /> : <FiChevronDown />)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="data-table__empty">
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="data-table__empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {paginated && !loading && rows.length > 0 && (
        <div className="data-table__footer">
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="pagination">
            <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <FiChevronLeft />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <FiChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
