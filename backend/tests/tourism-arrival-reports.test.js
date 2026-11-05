import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'tourism-arrival-tests-not-a-production-secret';
process.env.SESSION_SECRET = 'tourism-arrival-tests-not-a-production-session';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { default: adminRouter } = await import('../controllers/adminController.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { ARRIVAL_FIELDS, parseArrivalDraft } = await import('../services/tourismArrivalReports.js');
const counts = value => Object.fromEntries(ARRIVAL_FIELDS.map(field => [field, value]));
const draft = { hotel_id: 8, arrival_month: '2026-01', ...counts(0), notes: 'Actual arrivals' };

// Real dashboard routers and JWT/role middleware; all SQL is offline. The fake
// serializes transactions like row locks and checks every prepared binding.
async function setup(t, options = {}) {
  clearUserColumnCache();
  let state = { reports: [], revisions: [] }, nextId = 1, tail = Promise.resolve();
  const calls = [], transactions = [];
  const hotels = [{ hotel_id: 8, name: 'Fixture Inn', owners: [5], is_active: 1, created_at: '2025-01-01' },
    { hotel_id: 9, name: 'Other Inn', owners: [6], is_active: 1, created_at: '2025-01-01' },
    { hotel_id: 10, name: 'Future Inn', owners: [5], is_active: 1, created_at: '2099-01-01' }];
  const select = (sql, params) => {
    let rows = state.reports.filter(row => {
      let i = 0;
      if (sql.includes('r.report_id = ?') && row.report_id !== Number(params[i++])) return false;
      if (sql.includes('ho.user_id = ?') && !hotels.find(hotel => hotel.hotel_id === row.hotel_id)?.owners.includes(Number(params[i++]))) return false;
      if (/r?\.?arrival_month = \?/.test(sql) && row.arrival_month !== params[i++]) return false;
      if (sql.includes('r.hotel_id = ?') && row.hotel_id !== Number(params[i++])) return false;
      if (sql.includes('r.status = ?') && row.status !== params[i++]) return false;
      if (sql.includes("status = 'approved'") && row.status !== 'approved') return false;
      if (sql.includes("status <> 'draft'") && row.status === 'draft') return false;
      return true;
    });
    if (sql.includes('arrival_month >= ?')) rows = rows.filter(row => row.arrival_month.startsWith(params[0].slice(0, 4)));
    if (sql.includes('COUNT(*) AS total')) return [[{ total: rows.length }]];
    const aggregate = list => ({ approved_reports: list.length, ...Object.fromEntries(ARRIVAL_FIELDS.map(field => [field, list.reduce((sum, row) => sum + Number(row[field]), 0)])) });
    if (sql.includes('GROUP BY arrival_month')) return [[...new Set(rows.map(row => row.arrival_month))].sort().map(month => ({ arrival_month: month.slice(0, 7), ...aggregate(rows.filter(row => row.arrival_month === month)) }))];
    if (sql.includes('AS approved_reports')) return [[aggregate(rows)]];
    rows = rows.sort((a, b) => b.arrival_month.localeCompare(a.arrival_month) || b.report_id - a.report_id);
    if (sql.includes('LIMIT 20')) rows = rows.slice(Number(params.at(-1)), Number(params.at(-1)) + 20);
    return [rows.map(row => ({ ...row, month: row.arrival_month.slice(0, 7), ...(sql.includes('submitted_notes') ? Object.fromEntries([...ARRIVAL_FIELDS, 'notes'].map(field => [`submitted_${field}`, state.revisions.find(item => item.report_id === row.report_id && item.revision === row.revision)?.[field] ?? null])) : {}) }))];
  };
  const execute = async (sql, params = [], transaction = false) => {
    calls.push({ sql, params, transaction });
    assert.equal((sql.match(/\?/g) || []).length, params.length, `SQL bindings: ${sql}`);
    if (sql.includes('OFFSET ?')) assert.match(params.at(-1), /^\d+$/);
    assert.ok(params.every(value => value !== undefined && (value === null || ['string', 'number'].includes(typeof value))));
    assert.doesNotMatch(sql, /\b(?:DELETE|ALTER|DROP)\b|\b(?:hotel_bookings|hotel_payments|tourist_arrivals)\b/i);
    if (options.sqlError) throw Object.assign(new Error('Fixture SQL failure'), { code: options.sqlError });
    if (options.failHeaderUpdate && sql.startsWith('UPDATE tourism_arrival_reports ')) throw Object.assign(new Error('Fixture header failure'), { code: 'ER_LOCK_DEADLOCK' });
    if (sql.startsWith('SELECT h.hotel_id, h.name AS property_name')) {
      const [month, , userId] = params;
      return [hotels.filter(hotel => (!userId || hotel.owners.includes(userId)) && (hotel.created_at <= month || state.reports.some(row => row.hotel_id === hotel.hotel_id && row.arrival_month === month))).map(hotel => {
        const report = state.reports.find(row => row.hotel_id === hotel.hotel_id && row.arrival_month === month);
        return { hotel_id: hotel.hotel_id, property_name: hotel.name, report_id: report?.report_id ?? null, status: report?.status || 'not_submitted', review_note: report?.review_note };
      })];
    }
    if (sql.includes('FROM tourism_arrival_reports')) return select(sql, params);
    if (sql.startsWith('SELECT * FROM tourism_arrival_report_revisions')) return [state.revisions.filter(row => row.report_id === Number(params[0])).sort((a, b) => b.revision - a.revision).map(row => ({ ...row }))];
    if (sql.includes('FROM hotels')) return [hotels.filter(hotel => hotel.hotel_id === Number(params[0]) && (!sql.includes('ho.user_id') || hotel.owners.includes(params[1])))];
    assert.ok(transaction, 'Writes must be transactional');
    if (sql.startsWith('INSERT INTO tourism_arrival_reports ')) {
      if (state.reports.some(row => row.hotel_id === params[0] && row.arrival_month === params[2])) throw Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' });
      const fields = sql.match(/\(([^)]+)\) VALUES/)[1].split(', ');
      const report_id = nextId++;
      state.reports.push({ report_id, status: 'draft', revision: 0, lock_version: 1, review_note: null, ...Object.fromEntries(fields.map((field, i) => [field, params[i]])) });
      return [{ insertId: report_id }];
    }
    if (sql.startsWith('INSERT INTO tourism_arrival_report_revisions')) {
      const fields = sql.match(/\(([^)]+)\) VALUES/)[1].split(', ');
      assert.ok(!state.revisions.some(row => row.report_id === params[0] && row.revision === params[1]));
      state.revisions.push({ decision: 'submitted', ...Object.fromEntries(fields.map((field, i) => [field, field === 'submitted_at' ? '2026-02-01 10:00:00' : params[i]])) });
      return [{ insertId: state.revisions.length }];
    }
    if (sql.startsWith('UPDATE ')) {
      const updates = sql.match(/ SET (.+) WHERE /)[1].split(', ');
      const bindings = updates.filter(update => update.endsWith('= ?')).length;
      const reportId = Number(params[bindings]);
      const row = sql.startsWith('UPDATE tourism_arrival_report_revisions')
        ? state.revisions.find(item => item.report_id === reportId && item.revision === params[bindings + 1] && item.decision === 'submitted')
        : state.reports.find(item => item.report_id === reportId);
      if (!row || options.missingRevision && sql.startsWith('UPDATE tourism_arrival_report_revisions')) return [{ affectedRows: 0 }];
      let i = 0;
      for (const update of updates) {
        const [field, value] = update.split(' = ');
        row[field] = value === '?' ? params[i++] : value === 'lock_version + 1' ? row.lock_version + 1 : value === 'NULL' ? null : value === 'NOW()' ? '2026-02-01 10:00:00' : value.slice(1, -1);
      }
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  t.mock.method(db, 'promise', () => ({
    query: async (sql, params) => {
      if (sql.includes('information_schema.columns')) return [[]];
      if (sql.includes('FROM users')) return [[{ user_id: params[0], role: ({ 5: 'owner', 6: 'owner', 7: 'admin', 8: 'tourist' })[params[0]], archived: 0, email_verified: 1 }]];
      throw new Error(`Unexpected auth query: ${sql}`);
    },
    execute,
    getConnection: async () => {
      let unlock, previous, locked = false;
      return {
        beginTransaction: async () => { const waiting = tail; tail = new Promise(resolve => { unlock = resolve; }); await waiting; previous = structuredClone(state); transactions.push('begin'); },
        execute: (sql, params) => {
          if (sql.endsWith('FOR UPDATE')) locked = true;
          if (/^(?:UPDATE|INSERT)/.test(sql)) assert.ok(locked, 'A write must follow a locking report/property read');
          return execute(sql, params, true);
        },
        commit: async () => { transactions.push('commit'); },
        rollback: async () => { state = previous; transactions.push('rollback'); },
        release: () => { transactions.push('release'); unlock(); }
      };
    }
  }));
  const app = express(); app.use(express.json()); app.use('/api/owner', ownerRouter); app.use('/api/admin', adminRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = async (userId, path = '', method = 'GET', body, admin = false) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/${admin ? 'admin' : 'owner'}/tourism-arrival-reports${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId, role: 'admin' }, JWT_SECRET, { expiresIn: '1m' })}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
  };
  return { request, calls, transactions, state: () => state, options };
}

test('month and counts validation distinguishes incomplete drafts from explicit zeros', () => {
  assert.deepEqual(parseArrivalDraft(draft).counts, [0, 0, 0, 0, 0, 0]);
  assert.equal(parseArrivalDraft({ ...draft, resident_male: '' }).counts[0], null);
  for (const value of [-1, 0.5, ' ', true, [], {}, 2147483648, 'NaN']) assert.throws(() => parseArrivalDraft({ ...draft, resident_male: value }), /whole number/);
  for (const arrival_month of ['2026-13', '2026-1', '2026-01-01', '9999-01', {}, null]) assert.throws(() => parseArrivalDraft({ ...draft, arrival_month }));
  assert.throws(() => parseArrivalDraft({ ...draft, notes: 'x'.repeat(4001) }), /4,000/);
});

test('owners submit, receive feedback, correct, resubmit and obtain approval without losing snapshots', async t => {
  const { request, state, calls } = await setup(t);
  let response = await request(5, '', 'POST', draft); assert.equal(response.status, 200);
  const reportId = response.body.report.report_id;
  assert.equal(response.body.report.arrival_month, '2026-01');
  assert.equal((await request(7, '', 'GET', undefined, true)).body.total, 0, 'drafts hidden from admin');
  assert.equal((await request(7, `/${reportId}`, 'GET', undefined, true)).status, 404);
  assert.equal((await request(5, `/${reportId}/submit`, 'POST', { lock_version: 1 })).status, 200);
  assert.equal(state().revisions.length, 1);
  assert.equal((await request(5, `/${reportId}`, 'PUT', { ...draft, lock_version: 2 })).status, 409);
  assert.equal((await request(7, `/${reportId}/review`, 'POST', { decision: 'returned', lock_version: 2 }, true)).status, 400);
  assert.equal((await request(7, `/${reportId}/review`, 'POST', { decision: 'returned', review_note: 'Please check walk-ins.', lock_version: 2 }, true)).status, 200);
  response = await request(5, `/${reportId}`, 'PUT', { ...draft, resident_male: 7, notes: 'Corrected walk-ins', lock_version: 3 });
  assert.equal(response.status, 200); assert.equal(response.body.report.lock_version, 4);
  const adminRead = (await request(7, `/${reportId}`, 'GET', undefined, true)).body;
  assert.equal(adminRead.report.resident_male, 0); assert.equal(adminRead.report.notes, 'Actual arrivals');
  assert.equal((await request(7, '', 'GET', undefined, true)).body.reports[0].resident_male, 0);
  assert.equal((await request(7, '/summary?arrival_month=2026-01', 'GET', undefined, true)).body.totals.approved_reports, 0);
  assert.equal((await request(5, `/${reportId}/submit`, 'POST', { lock_version: 3 })).status, 409);
  assert.equal((await request(5, `/${reportId}/submit`, 'POST', { lock_version: 4 })).status, 200);
  assert.equal((await request(7, `/${reportId}/review`, 'POST', { decision: 'approved', lock_version: 5 }, true)).status, 200);
  const details = (await request(5, `/${reportId}`)).body;
  assert.equal(details.report.status, 'approved'); assert.equal(details.report.resident_male, 7);
  assert.deepEqual(details.history.map(row => [row.revision, row.resident_male, row.decision]), [[2, 7, 'approved'], [1, 0, 'returned']]);
  assert.equal(details.history[1].review_note, 'Please check walk-ins.');
  assert.equal((await request(5, `/${reportId}`, 'PUT', { ...draft, lock_version: 6 })).status, 409);
  const summary = (await request(7, '/summary?arrival_month=2026-01', 'GET', undefined, true)).body;
  assert.equal(summary.totals.resident_male, 7); assert.equal(summary.totals.approved_reports, 1); assert.equal(summary.by_month.length, 1);
  assert.ok(calls.filter(call => /UPDATE|INSERT/.test(call.sql)).every(call => call.transaction));
  assert.ok(calls.filter(call => call.sql.includes('r.report_id = ?') && call.transaction).some(call => call.sql.endsWith('FOR UPDATE')));
});

test('ownership and DB-backed roles protect every owner and admin reporting action, including limited owners', async t => {
  const { request, calls } = await setup(t);
  assert.equal((await request(null)).status, 401);
  assert.equal((await request(8)).status, 403);
  assert.equal((await request(5, '', 'GET', undefined, true)).status, 403, 'JWT cannot forge an admin role');
  assert.equal((await request(5, '', 'POST', { ...draft, hotel_id: 9 })).status, 404);
  assert.equal((await request(5, '', 'POST', draft)).status, 200, 'no full business verification gate');
  assert.equal((await request(6)).body.total, 0);
  for (const [path, method, body] of [['/1', 'GET'], ['/1', 'PUT', { ...draft, lock_version: 1 }], ['/1/submit', 'POST', { lock_version: 1 }]]) assert.equal((await request(6, path, method, body)).status, 404);
  for (const path of ['', '/coverage?arrival_month=2026-01', '/summary?arrival_month=2026-01', '/export?arrival_month=2026-01', '/1']) assert.equal((await request(5, path, 'GET', undefined, true)).status, 403);
  assert.equal((await request(5, '/1/review', 'POST', { decision: 'approved', lock_version: 1 }, true)).status, 403);
  const coverage = (await request(5, '/coverage?arrival_month=2026-01')).body.properties;
  assert.deepEqual(coverage.map(row => row.hotel_id), [8]);
  assert.ok(calls.find(call => call.sql.includes('h.created_at < DATE_ADD(?, INTERVAL 1 MONTH)')));
});

test('concurrent property/month creation, submissions and reviews yield one winner and preserve revisions', async t => {
  const { request, state, transactions } = await setup(t);
  assert.deepEqual((await Promise.all([request(5, '', 'POST', draft), request(5, '', 'POST', draft)])).map(res => res.status).sort(), [200, 409]);
  assert.deepEqual((await Promise.all([request(5, '/1/submit', 'POST', { lock_version: 1 }), request(5, '/1/submit', 'POST', { lock_version: 1 })])).map(res => res.status).sort(), [200, 409]);
  assert.deepEqual((await Promise.all([request(7, '/1/review', 'POST', { decision: 'approved', lock_version: 2 }, true), request(7, '/1/review', 'POST', { decision: 'returned', review_note: 'Check', lock_version: 2 }, true)])).map(res => res.status).sort(), [200, 409]);
  assert.equal(state().reports.length, 1); assert.equal(state().revisions.length, 1);
  assert.equal(transactions.filter(item => item === 'begin').length, transactions.filter(item => item === 'release').length);
  assert.equal(transactions.filter(item => item === 'rollback').length, 3);
});

test('blank counts block submission, zeros submit and stale edits cannot overwrite newer data', async t => {
  const { request } = await setup(t);
  assert.equal((await request(5, '', 'POST', { ...draft, resident_male: '' })).status, 200);
  assert.equal((await request(5, '/1/submit', 'POST', { lock_version: 1 })).status, 400);
  assert.equal((await request(5, '/1', 'PUT', { ...draft, lock_version: 1, arrival_month: '2026-02' })).status, 400);
  assert.equal((await request(5, '/1', 'PUT', { ...draft, lock_version: 1 })).status, 200);
  assert.equal((await request(5, '/1', 'PUT', { ...draft, lock_version: 1, resident_male: 99 })).status, 409);
  assert.equal((await request(5, '/1/submit', 'POST', { lock_version: 2 })).status, 200);
  assert.equal((await request(5, '/1')).body.report.resident_male, 0);
});

test('summary/export include only approved owner reports, with full exports independent of pagination', async t => {
  const { request, state } = await setup(t);
  for (let i = 0; i < 23; i++) {
    state().reports.push({ report_id: i + 1, hotel_id: i % 2 ? 9 : 8, property_name: `Property ${i}`, arrival_month: '2026-01-01', status: i === 22 ? 'submitted' : 'approved', ...counts(1) });
  }
  assert.equal((await request(7, '?arrival_month=2026-01&status=approved', 'GET', undefined, true)).body.reports.length, 20);
  assert.equal((await request(7, '/export?arrival_month=2026-01', 'GET', undefined, true)).body.reports.length, 22);
  assert.equal((await request(7, '/export?arrival_month=2026-01&hotel_id=8', 'GET', undefined, true)).body.reports.length, 11);
  assert.equal((await request(7, '/summary?arrival_month=2026-01', 'GET', undefined, true)).body.totals.resident_male, 22);
  for (const path of ['?page=0', '?page=9007199254740991', '?hotel_id=8%20OR%201=1', '?status=unknown', '/summary?arrival_month=2026-99']) assert.equal((await request(7, path, 'GET', undefined, true)).status, 400);
  assert.equal((await request(5, '', 'POST', [])).status, 400);
});

test('missing schema and transaction failures return actionable errors without partial approvals', async t => {
  const context = await setup(t);
  await context.request(5, '', 'POST', draft); await context.request(5, '/1/submit', 'POST', { lock_version: 1 });
  context.options.missingRevision = true;
  assert.equal((await context.request(7, '/1/review', 'POST', { decision: 'approved', lock_version: 2 }, true)).status, 409);
  assert.equal(context.state().reports[0].status, 'submitted');
  for (const [code, status] of [['ER_NO_SUCH_TABLE', 503], ['ER_BAD_FIELD_ERROR', 503], ['ER_LOCK_DEADLOCK', 409], ['ER_LOCK_WAIT_TIMEOUT', 409], ['unexpected', 500]]) {
    context.options.sqlError = code;
    const response = await context.request(5);
    assert.equal(response.status, status);
    if (status === 503) assert.match(response.body.error, /054_owner_tourism_arrival_reports.sql/);
  }
});

test('header-write failures roll back newly inserted snapshots and revision review decisions', async t => {
  const { request, state, options } = await setup(t);
  await request(5, '', 'POST', draft);
  options.failHeaderUpdate = true;
  assert.equal((await request(5, '/1/submit', 'POST', { lock_version: 1 })).status, 409);
  assert.equal(state().revisions.length, 0); assert.equal(state().reports[0].status, 'draft'); assert.equal(state().reports[0].lock_version, 1);
  options.failHeaderUpdate = false;
  await request(5, '/1/submit', 'POST', { lock_version: 1 });
  options.failHeaderUpdate = true;
  assert.equal((await request(7, '/1/review', 'POST', { decision: 'approved', lock_version: 2 }, true)).status, 409);
  assert.equal(state().revisions[0].decision, 'submitted'); assert.equal(state().reports[0].status, 'submitted');
  assert.equal(state().reports[0].lock_version, 2);
});

test('migration is additive with a unique property/month and immutable revision identity', async () => {
  const sql = await readFile(new URL('../../migrations/054_owner_tourism_arrival_reports.sql', import.meta.url), 'utf8');
  const statements = sql.replace(/--[^\n]*/g, '').split(';').map(part => part.trim()).filter(Boolean);
  assert.equal(statements.length, 2);
  statements.forEach(statement => assert.match(statement, /^CREATE TABLE IF NOT EXISTS tourism_arrival_report/));
  assert.match(sql, /UNIQUE KEY uq_property_month \(hotel_id, arrival_month\)/);
  assert.match(sql, /UNIQUE KEY uq_report_revision \(report_id, revision\)/);
  assert.doesNotMatch(statements.join('\n'), /DELETE|DROP|ALTER|CASCADE|FOREIGN KEY/i);
});
