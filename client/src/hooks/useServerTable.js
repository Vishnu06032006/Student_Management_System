import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_PARAMS = { page: 1, pageSize: 10, search: '', sortBy: 'createdAt', sortDir: 'desc' };

// Drives a server-paginated/sorted/searched table: owns the query params,
// fetches whenever they change, and guards against out-of-order responses
// when a fast typist fires several searches before the first reply lands.
function useServerTable(fetcher, initialParams = {}) {
  const [params, setParams] = useState({ ...DEFAULT_PARAMS, ...initialParams });
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = (requestId.current += 1);
    setLoading(true);
    try {
      const { data: response } = await fetcher(params);
      if (id === requestId.current) {
        setData(response.data);
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, [fetcher, params]);

  useEffect(() => {
    const timeout = setTimeout(load, params.search ? 300 : 0);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  const setSearch = (search) => setParams((p) => ({ ...p, search, page: 1 }));
  const setPage = (page) => setParams((p) => ({ ...p, page }));
  const setFilter = (key, value) => setParams((p) => ({ ...p, [key]: value || undefined, page: 1 }));
  const setSort = (sortBy) =>
    setParams((p) => ({
      ...p,
      sortBy,
      sortDir: p.sortBy === sortBy && p.sortDir === 'asc' ? 'desc' : 'asc',
    }));

  return { params, data, loading, setSearch, setPage, setFilter, setSort, reload: load };
}

export default useServerTable;
