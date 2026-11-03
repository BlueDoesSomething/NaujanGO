// Format stored amounts in the listing's currency; this does not convert money.
export const formatHotelCurrency = (value, currency = 'PHP', options = {}) => {
  const amount = parseFloat(value);
  if (!Number.isFinite(amount)) return '—';
  const code = String(currency || 'PHP').trim().toUpperCase() || 'PHP';
  const digits = { minimumFractionDigits: 0, maximumFractionDigits: 2, ...options };
  try {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: code, ...digits }).format(amount);
  } catch {
    // Legacy listings may contain a non-ISO currency value. Do not silently
    // relabel it as dollars or pesos.
    return `${code} ${new Intl.NumberFormat('en-PH', digits).format(amount)}`;
  }
};
