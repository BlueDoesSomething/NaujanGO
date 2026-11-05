import { philippineToday } from './stayBooking.js';

export const ARRIVAL_CATEGORIES = [
  { key: 'resident', label: 'Resident', definition: 'Lives in Naujan' },
  { key: 'local', label: 'Local', definition: 'Filipino visitor from outside Naujan' },
  { key: 'foreigner', label: 'Foreigner', definition: 'Non-Filipino visitor' }
];
export const ARRIVAL_FIELDS = ARRIVAL_CATEGORIES.flatMap(category => [`${category.key}_male`, `${category.key}_female`]);
export const ARRIVAL_STATUSES = { draft: 'Draft', submitted: 'Submitted', returned: 'Needs correction', approved: 'Approved', not_submitted: 'Not submitted' };
export const reportingMonth = () => philippineToday().slice(0, 7);
export const previousReportingMonth = () => {
  const date = new Date(`${reportingMonth()}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() - 1);
  return date.toISOString().slice(0, 7);
};
export const emptyArrivalForm = (hotelId = '', month = previousReportingMonth()) => ({ hotel_id: String(hotelId), arrival_month: month, ...Object.fromEntries(ARRIVAL_FIELDS.map(field => [field, ''])), notes: '' });
export const arrivalFormFromReport = report => ({ ...report, hotel_id: String(report.hotel_id), ...Object.fromEntries(ARRIVAL_FIELDS.map(field => [field, report[field] ?? ''])), notes: report.notes || '' });
export const arrivalTotals = report => {
  const sum = fields => fields.some(field => report[field] == null || report[field] === '' || !Number.isFinite(Number(report[field]))) ? null : fields.reduce((total, field) => total + Number(report[field]), 0);
  return { ...Object.fromEntries(ARRIVAL_CATEGORIES.map(({ key }) => [key, sum([`${key}_male`, `${key}_female`])])), male: sum(ARRIVAL_FIELDS.filter(field => field.endsWith('_male'))), female: sum(ARRIVAL_FIELDS.filter(field => field.endsWith('_female'))), total: sum(ARRIVAL_FIELDS) };
};
export const validateArrivalForm = (form, submit = false) => {
  const errors = {};
  if (!form.hotel_id) errors.hotel_id = 'Select your property.';
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(form.arrival_month || '') || form.arrival_month > reportingMonth()) errors.arrival_month = 'Select a valid month, not a future month.';
  for (const field of ARRIVAL_FIELDS) {
    if (form[field] === '' || form[field] == null) { if (submit) errors[field] = 'Enter a count, including 0 when there were no arrivals.'; }
    else if (!['string', 'number'].includes(typeof form[field]) || String(form[field]).trim() === '' || !Number.isInteger(Number(form[field])) || Number(form[field]) < 0 || Number(form[field]) > 2147483647) errors[field] = 'Use a non-negative whole number.';
  }
  if ((form.notes || '').length > 4000) errors.notes = 'Use at most 4,000 characters.';
  return errors;
};
export const arrivalExport = (reports, month) => {
  const rows = reports.map(report => {
    const totals = arrivalTotals(report);
    return { property_name: report.property_name, arrival_month: report.arrival_month, ...Object.fromEntries(ARRIVAL_FIELDS.map(field => [field, Number(report[field])])), ...totals, scope: 'Approved owner submissions only; historical/manual totals are excluded.' };
  });
  return {
    title: 'Approved tourism arrivals', filename: `approved-tourism-arrivals-${month}`, documentType: 'TOURISM ARRIVAL REPORT', pdfLandscape: true,
    subtitle: `${month}. Establishment guest arrivals, not unique visitors across Naujan. Historical/manual totals are separate. ${ARRIVAL_CATEGORIES.map(category => `${category.label}: ${category.definition}`).join('; ')}.`,
    summary: [['Reporting month', month], ['Approved property reports', rows.length], ['Reported arrivals', rows.length ? rows.reduce((sum, row) => sum + row.total, 0) : 'No approved reports']],
    columns: [['property_name', 'Property'], ['arrival_month', 'Month'], ...ARRIVAL_FIELDS.map(field => [field, field.replace(/_/g, ' ')]), ['total', 'Total'], ['scope', 'Scope']].map(([key, label]) => ({ key, label })),
    rows,
    pdfSections: [{ title: 'Approved property breakdown', columns: [['property_name', 'Property'], ['resident_text', 'Resident (M / F)'], ['local_text', 'Local (M / F)'], ['foreigner_text', 'Foreigner (M / F)'], ['male', 'Male'], ['female', 'Female'], ['total', 'Total']].map(([key, label]) => ({ key, label })), rows: rows.map(row => ({ ...row, ...Object.fromEntries(ARRIVAL_CATEGORIES.map(({ key }) => [`${key}_text`, `${row[`${key}_male`]} / ${row[`${key}_female`]}`])) })) }]
  };
};
