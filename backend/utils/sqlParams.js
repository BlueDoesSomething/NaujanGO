// SQL values must stay separate from SQL syntax. Serialize intentional JSON at
// the call site; never let a request object become a column assignment or SQL.
export const normalizeSqlParams = (params = []) => {
  if (!Array.isArray(params)) throw new TypeError('SQL parameters must be an array');
  return params.map(value => {
    if (value == null) return null;
    if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'bigint') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (value instanceof Date && Number.isFinite(value.getTime())) return value;
    if (Buffer.isBuffer(value)) return value;
    throw Object.assign(new TypeError('Invalid SQL parameter type'), { status: 400 });
  });
};

// Only the number of placeholders is interpolated, never the list's values.
// Callers must handle empty lists explicitly instead of generating IN ().
export const sqlPlaceholders = values => {
  if (!Array.isArray(values) || values.length === 0) throw new TypeError('SQL list must not be empty');
  return values.map(() => '?').join(', ');
};
