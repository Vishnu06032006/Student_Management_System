function parsePagination(query, { defaultSort = 'createdAt', defaultDir = 'desc' } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 10));
  const sortField = query.sortBy || defaultSort;
  const sortDir = query.sortDir === 'asc' ? 1 : query.sortDir === 'desc' ? -1 : defaultDir === 'asc' ? 1 : -1;

  return { page, pageSize, skip: (page - 1) * pageSize, sortField, sortDir };
}

module.exports = { parsePagination };
