import db from '../db.js';

export const ARRIVAL_FIELDS = ['resident_male', 'resident_female', 'local_male', 'local_female', 'foreigner_male', 'foreigner_female'];
const states = ['draft', 'submitted', 'returned', 'approved'];
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const id = value => {
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw fail('Invalid record ID.');
  return Number(value);
};
export const arrivalMonth = value => {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)) throw fail('Select a valid reporting month.');
  return `${value}-01`;
};
const currentMonth = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 7);
export const parseArrivalDraft = body => {
  const month = arrivalMonth(body.arrival_month);
  if (body.arrival_month > currentMonth()) throw fail('Future arrivals cannot be reported.');
  const counts = ARRIVAL_FIELDS.map(field => {
    const value = body[field];
    if (value === '' || value == null) return null;
    if (!['string', 'number'].includes(typeof value) || String(value).trim() === '' || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 2147483647) throw fail(`${field.replace(/_/g, ' ')} must be a non-negative whole number.`);
    return Number(value);
  });
  if (body.notes != null && (typeof body.notes !== 'string' || body.notes.length > 4000)) throw fail('Notes must be text of at most 4,000 characters.');
  return { month, counts, notes: body.notes?.trim() || null };
};
const owned = user => ({ sql: 'EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = r.hotel_id AND ho.user_id = ?)', params: [user.user_id] });
const formatted = row => ({ ...row, arrival_month: row.month || String(row.arrival_month || '').slice(0, 7) });
const reportSelect = "SELECT r.*, DATE_FORMAT(r.arrival_month, '%Y-%m') AS month FROM tourism_arrival_reports r";
// Returned reports may have new, unsubmitted owner edits. Admins see the last
// submitted snapshot, never those in-progress corrections.
const adminSelect = `SELECT r.*, DATE_FORMAT(r.arrival_month, '%Y-%m') AS month, ${[...ARRIVAL_FIELDS, 'notes'].map(field => `v.${field} AS submitted_${field}`).join(', ')} FROM tourism_arrival_reports r LEFT JOIN tourism_arrival_report_revisions v ON v.report_id = r.report_id AND v.revision = r.revision`;
const adminView = row => {
  const result = { ...row };
  for (const field of [...ARRIVAL_FIELDS, 'notes']) {
    if (row.status === 'returned') result[field] = row[`submitted_${field}`];
    delete result[`submitted_${field}`];
  }
  return result;
};
const versionMatches = (row, value) => {
  if (id(value) !== Number(row.lock_version)) throw fail('This report has changed. Reload it before saving or reviewing.', 409);
};
const transaction = async run => {
  const connection = await db.promise().getConnection();
  try { await connection.beginTransaction(); const result = await run(connection); await connection.commit(); return result; }
  catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};
const load = async (connection, user, reportId, lock = false, admin = false) => {
  const scope = admin ? { sql: '1 = 1', params: [] } : owned(user);
  const [rows] = await connection.execute(`${admin ? adminSelect : reportSelect} WHERE r.report_id = ? AND ${scope.sql}${lock ? ' FOR UPDATE' : ''}`, [id(reportId), ...scope.params]);
  if (!rows.length) throw fail('Report not found or not available to this account.', 404);
  return admin ? adminView(rows[0]) : rows[0];
};
export const listArrivalReports = async (user, filters = {}, admin = false) => {
  const conditions = [], params = [];
  if (!admin) { const scope = owned(user); conditions.push(scope.sql); params.push(...scope.params); }
  else conditions.push("r.status <> 'draft'");
  if (filters.arrival_month) { conditions.push('r.arrival_month = ?'); params.push(arrivalMonth(filters.arrival_month)); }
  if (filters.hotel_id) { conditions.push('r.hotel_id = ?'); params.push(id(filters.hotel_id)); }
  if (filters.status && filters.status !== 'all') {
    if (!states.includes(filters.status)) throw fail('Invalid report status.');
    conditions.push('r.status = ?'); params.push(filters.status);
  }
  const page = filters.page === undefined ? 1 : id(filters.page);
  const offset = (page - 1) * 20;
  if (!Number.isSafeInteger(offset)) throw fail('Invalid report page.');
  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  const [[total]] = await db.promise().execute(`SELECT COUNT(*) AS total FROM tourism_arrival_reports r${where}`, params);
  // mysql2 binds JS numbers as DOUBLE, rejected for OFFSET by some MySQL
  // versions. Bind the validated integer as text, as the system logs do.
  const [rows] = await db.promise().execute(`${admin ? adminSelect : reportSelect}${where} ORDER BY r.arrival_month DESC, r.report_id DESC LIMIT 20 OFFSET ?`, [...params, String(offset)]);
  return { reports: rows.map(row => formatted(admin ? adminView(row) : row)), total: Number(total.total), page, page_size: 20 };
};
export const arrivalReportDetails = async (user, reportId, admin = false) => {
  const report = await load(db.promise(), user, reportId, false, admin);
  if (admin && report.status === 'draft') throw fail('This report has not been submitted.', 404);
  const [history] = await db.promise().execute('SELECT * FROM tourism_arrival_report_revisions WHERE report_id = ? ORDER BY revision DESC', [report.report_id]);
  return { report: formatted(report), history };
};
export const saveArrivalDraft = async (user, reportId, body) => {
  const draft = parseArrivalDraft(body);
  return transaction(async connection => {
    if (reportId) {
      const report = await load(connection, user, reportId, true);
      versionMatches(report, body.lock_version);
      if (!['draft', 'returned'].includes(report.status)) throw fail('Only drafts and returned reports can be edited.', 409);
      if (draft.month.slice(0, 7) !== formatted(report).arrival_month || id(body.hotel_id) !== Number(report.hotel_id)) throw fail('The report property and month cannot be changed.');
      await connection.execute(`UPDATE tourism_arrival_reports SET ${ARRIVAL_FIELDS.map(field => `${field} = ?`).join(', ')}, notes = ?, lock_version = lock_version + 1 WHERE report_id = ?`, [...draft.counts, draft.notes, report.report_id]);
      return { report: formatted(await load(connection, user, report.report_id)) };
    }
    const hotelId = id(body.hotel_id);
    const [hotels] = await connection.execute('SELECT h.hotel_id, h.name FROM hotels h WHERE h.hotel_id = ? AND EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = h.hotel_id AND ho.user_id = ?) FOR UPDATE', [hotelId, user.user_id]);
    if (!hotels.length) throw fail('Property not found or not owned by this account.', 404);
    const [result] = await connection.execute(`INSERT INTO tourism_arrival_reports (hotel_id, property_name, arrival_month, ${ARRIVAL_FIELDS.join(', ')}, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [hotelId, hotels[0].name, draft.month, ...draft.counts, draft.notes, user.user_id]);
    return { report: formatted(await load(connection, user, result.insertId)) };
  });
};
export const submitArrivalReport = async (user, reportId, body) => transaction(async connection => {
  const report = await load(connection, user, reportId, true);
  versionMatches(report, body.lock_version);
  if (!['draft', 'returned'].includes(report.status)) throw fail('This report is already submitted or approved. It was not submitted twice.', 409);
  if (ARRIVAL_FIELDS.some(field => report[field] == null)) throw fail('Complete all six counts. Enter 0 when there were no arrivals.');
  const [hotels] = await connection.execute('SELECT name FROM hotels WHERE hotel_id = ?', [report.hotel_id]);
  if (!hotels.length) throw fail('The property is no longer available.', 409);
  const revision = Number(report.revision) + 1;
  await connection.execute(`INSERT INTO tourism_arrival_report_revisions (report_id, revision, property_name, ${ARRIVAL_FIELDS.join(', ')}, notes, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [report.report_id, revision, hotels[0].name, ...ARRIVAL_FIELDS.map(field => Number(report[field])), report.notes, user.user_id]);
  await connection.execute("UPDATE tourism_arrival_reports SET status = 'submitted', property_name = ?, revision = ?, submitted_by = ?, submitted_at = NOW(), reviewed_by = NULL, reviewed_at = NULL, review_note = NULL, lock_version = lock_version + 1 WHERE report_id = ?", [hotels[0].name, revision, user.user_id, report.report_id]);
  return { report_id: report.report_id, revision };
});
export const reviewArrivalReport = async (user, reportId, body) => transaction(async connection => {
  if (!['approved', 'returned'].includes(body.decision)) throw fail('Choose Approve or Return for correction.');
  const note = typeof body.review_note === 'string' ? body.review_note.trim() : '';
  if (note.length > 4000 || (body.decision === 'returned' && !note)) throw fail('Returning a report requires feedback of at most 4,000 characters.');
  const report = await load(connection, user, reportId, true, true);
  versionMatches(report, body.lock_version);
  if (report.status !== 'submitted') throw fail('Only a submitted report can be reviewed. Reload for its current status.', 409);
  const [revisionUpdate] = await connection.execute("UPDATE tourism_arrival_report_revisions SET decision = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE report_id = ? AND revision = ? AND decision = 'submitted'", [body.decision, user.user_id, note || null, report.report_id, report.revision]);
  if (revisionUpdate.affectedRows !== 1) throw fail('The submitted revision is unavailable or already reviewed. Reload the report before reviewing.', 409);
  await connection.execute('UPDATE tourism_arrival_reports SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_note = ?, lock_version = lock_version + 1 WHERE report_id = ?', [body.decision, user.user_id, note || null, report.report_id]);
  return { report_id: report.report_id, status: body.decision };
});
export const arrivalCoverage = async (user, filters, admin = false) => {
  const month = arrivalMonth(filters.arrival_month);
  const ownerScope = admin ? '' : ' AND EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = h.hotel_id AND ho.user_id = ?)';
  const [rows] = await db.promise().execute(`SELECT h.hotel_id, h.name AS property_name, r.report_id, COALESCE(r.status, 'not_submitted') AS status, r.review_note FROM hotels h LEFT JOIN tourism_arrival_reports r ON r.hotel_id = h.hotel_id AND r.arrival_month = ? WHERE ((h.is_active = 1 AND h.created_at < DATE_ADD(?, INTERVAL 1 MONTH) AND EXISTS (SELECT 1 FROM hotel_owners ho WHERE ho.hotel_id = h.hotel_id)) OR r.report_id IS NOT NULL)${ownerScope} ORDER BY h.name, h.hotel_id`, [month, month, ...(admin ? [] : [user.user_id])]);
  return { arrival_month: filters.arrival_month, properties: rows };
};
export const arrivalSummary = async filters => {
  const month = arrivalMonth(filters.arrival_month);
  const [[totals]] = await db.promise().execute(`SELECT COUNT(*) AS approved_reports, ${ARRIVAL_FIELDS.map(field => `COALESCE(SUM(${field}), 0) AS ${field}`).join(', ')} FROM tourism_arrival_reports WHERE arrival_month = ? AND status = 'approved'`, [month]);
  const year = month.slice(0, 4);
  const [byMonth] = await db.promise().execute(`SELECT DATE_FORMAT(arrival_month, '%Y-%m') AS arrival_month, COUNT(*) AS approved_reports, ${ARRIVAL_FIELDS.map(field => `COALESCE(SUM(${field}), 0) AS ${field}`).join(', ')} FROM tourism_arrival_reports WHERE arrival_month >= ? AND arrival_month < DATE_ADD(?, INTERVAL 1 YEAR) AND status = 'approved' GROUP BY arrival_month ORDER BY arrival_month`, [`${year}-01-01`, `${year}-01-01`]);
  return { arrival_month: filters.arrival_month, totals, by_month: byMonth };
};
export const exportArrivalReports = async filters => {
  const [rows] = await db.promise().execute(`${reportSelect} WHERE r.arrival_month = ? AND r.status = 'approved'${filters.hotel_id ? ' AND r.hotel_id = ?' : ''} ORDER BY r.property_name, r.report_id`, [arrivalMonth(filters.arrival_month), ...(filters.hotel_id ? [id(filters.hotel_id)] : [])]);
  return { reports: rows.map(formatted), arrival_month: filters.arrival_month };
};
export const respondArrivalError = (res, error) => {
  if (['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code)) return res.status(503).json({ error: 'Tourism reporting needs migrations/054_owner_tourism_arrival_reports.sql. Ask the administrator to apply it.' });
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'A report already exists for this property and month. Open it from your report history.' });
  if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) return res.status(409).json({ error: 'The report is being updated. Reload and try again.' });
  return res.status(error.status || 500).json({ error: error.status ? error.message : 'Tourism reporting is unavailable. Your saved reports have not been deleted; please retry.' });
};
