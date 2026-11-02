export const initialSystemLogsState = () => ({ rows: [], total: null, loading: false, error: '' });

export const readSystemLogPage = data => {
  const total = typeof data?.total === 'number' || typeof data?.total === 'string' && /^\d+$/.test(data.total)
    ? Number(data.total) : NaN;
  if (!Array.isArray(data?.rows) || !Number.isSafeInteger(total) || total < 0) {
    throw new Error('Invalid system log response');
  }
  return { rows: data.rows, total };
};

export const systemLogErrorMessage = error => {
  if (error?.response?.status === 401) return 'Your session expired. Sign in again to view system logs.';
  if (error?.response?.status === 403) return 'Administrator access is required to view system logs.';
  return 'System logs could not be loaded. This does not mean there are no logs. Use Refresh to try again; if it continues, check the backend error for /api/admin/logs.';
};

// Shared by the dashboard and offline tests. Only the latest request may
// publish a result, so a slow earlier filter/page cannot overwrite a new one.
export const createSystemLogsLoader = ({ fetchPage, onChange }) => {
  let requestId = 0;
  return {
    async load(filters) {
      const current = ++requestId;
      onChange({ ...initialSystemLogsState(), loading: true });
      try {
        const page = readSystemLogPage(await fetchPage(filters));
        if (current !== requestId) return;
        onChange({ ...page, loading: false, error: '' });
      } catch (error) {
        if (current !== requestId) return;
        onChange({ ...initialSystemLogsState(), error: systemLogErrorMessage(error) });
      }
    },
    cancel() { requestId++; }
  };
};
