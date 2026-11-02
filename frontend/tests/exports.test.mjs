import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, exportFilename, printableReportHtml, reportCsv, shareSavedTrip } from '../src/utils/exportFiles.js';
import { itineraryBudgetReport, itineraryPrintReport, itineraryStopReport, receiptExportReport } from '../src/utils/itineraryExports.js';
import { analyticsReport, ownerRecordReport } from '../src/utils/reportExports.js';

const simple = { title: 'Fixture', columns: [{ key: 'value', label: 'Value' }], rows: [] };
const parseCsv = csv => {
  const records = []; let record = [], cell = '', quoted = false;
  const text = csv.replace(/^\uFEFF/, '');
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"' && text[index + 1] === '"' && quoted) { cell += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { record.push(cell); cell = ''; }
    else if (char === '\r' && text[index + 1] === '\n' && !quoted) { record.push(cell); records.push(record); record = []; cell = ''; index++; }
    else cell += char;
  }
  return records;
};
test('CSV has BOM, CRLF, escaped quotes, multiline Unicode, zero, false and blank cells', () => {
  const csv = reportCsv({ ...simple, rows: [0, false, null, 'Lake, "Naujan"\n₱ café'].map(value => ({ value })) });
  assert.equal(csv, '\uFEFF"Value"\r\n"0"\r\n"false"\r\n""\r\n"Lake, ""Naujan""\n₱ café"\r\n');
  assert.equal(reportCsv(simple), '\uFEFF"Value"\r\n');
  assert.throws(() => reportCsv({ columns: [], rows: [] }), /Invalid/);
});
test('CSV neutralizes text formulas, but keeps actual negative numbers numeric', () => {
  for (const value of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\tlink', '\rvalue', '\n=1']) {
    assert.ok(csvCell(value).startsWith('"\''), value);
  }
  assert.equal(csvCell(-25), '"-25"');
  assert.equal(csvCell('safe\u0000text'), '"safetext"');
});
test('download filenames are safe, bounded and keep their real extension', () => {
  assert.equal(exportFilename('trip:/\\<>?*', 'csv'), 'trip-------.csv');
  assert.equal(exportFilename('CON', 'csv'), 'export-CON.csv');
  assert.equal(exportFilename('', 'csv'), 'export.csv');
  assert.ok(exportFilename('a'.repeat(300), 'csv').length <= 104);
});
test('stop exports retain unlocated places, order by day and distinguish visited from trip status', () => {
  const items = [{ day_number: 2, name: 'No coordinates', estimated_cost: 0, completed: false },
    { day_number: 1, order_in_day: 1, custom_name: 'Second', notes: 'Bring water', duration_minutes: 30 },
    { day_number: 1, order_in_day: 0, attraction_name: 'First', completed: 1 }];
  const original = structuredClone(items);
  const report = itineraryStopReport({ itinerary: { name: 'Trip', status: 'in_progress' }, items, draft: true });
  assert.deepEqual(report.rows.map(row => row.place), ['First', 'Second', 'No coordinates']);
  assert.deepEqual(report.rows.map(row => row.order), [1, 2, 1]);
  assert.equal(report.rows[0].completed, 'Yes'); assert.equal(report.rows[0].status, 'in_progress');
  assert.equal(report.rows[2].cost, 0); assert.match(report.notes, /unsaved/);
  assert.match(report.rows[1].details, /30 min\nBring water/); assert.deepEqual(items, original);
});
test('budget exports preserve displayed numbers, zero, deficits and unavailable values', () => {
  const rows = [{ day: 1, attractionCost: '25.50', fareCost: 0, balance: -50, estimatedNeed: 100, fits: false }];
  const budget = itineraryBudgetReport(rows, 'Trip');
  assert.equal(budget.rows[0].attractionCost, 25.5); assert.equal(budget.rows[0].fareCost, 0);
  assert.equal(budget.rows[0].balance, -50); assert.equal(budget.rows[0].foodCost, '');
  assert.equal(budget.rows[0].fits, 'No');
  assert.equal(itineraryPrintReport({ itinerary: {}, items: [], budget: rows }).sections[1].rows[0].estimatedNeed, 100);
});
const analytics = { monthlyTrends: [{ month: '2026-10', bookings: 10, revenue: '500.25', occupancy: 0 }],
  dailyTrends: [{ day: '2026-11-02', bookings: 0, count: 99, revenue: 0, occupancy: 20 }],
  hotelPerformance: [{ name: 'Lake Inn', bookings: 2, revenue: 250, avg_rating: '4.5' }] };
const visitor = { gender_distribution: [{ gender: 'Female', count: 7 }], user_type_distribution: [{ user_type: 'Local', count: 8 }] };
test('analytics CSV selects each dataset and respects daily zero values without monthly fallback', () => {
  const options = { data: analytics, visitor, period: '7d' };
  assert.equal(analyticsReport('bookings', options).rows[0].bookings, 0);
  assert.equal(analyticsReport('revenue', options).rows[0].revenue, 0);
  assert.equal(analyticsReport('gender', options).rows[0].category, 'Female');
  assert.equal(analyticsReport('usertype', options).rows[0].count, 8);
  assert.equal(analyticsReport('hotels', options).rows[0].rating, 4.5);
  assert.deepEqual(analyticsReport('bookings', { data: { monthlyTrends: analytics.monthlyTrends }, period: '7d' }).rows, []);
});
test('combined analytics CSV stays rectangular and marks unavailable datasets instead of implying zero', () => {
  const report = analyticsReport('all', { data: analytics });
  assert.ok(report.rows.find(row => row.section === 'Visitor gender distribution').scope.includes('not available'));
  assert.equal(report.columns.length, 12);
  assert.ok(parseCsv(reportCsv(report)).every(row => row.length === report.columns.length));
  assert.match(reportCsv(report), /2026-10/);
  const owner = analyticsReport('all', { data: analytics, visitor, userRole: 'owner' });
  assert.ok(!reportCsv(owner).includes('Female')); assert.ok(!owner.sections.some(section => /Visitor|User role/.test(section.title)));
  assert.throws(() => analyticsReport('gender', { userRole: 'owner' }), /Unsupported/);
});
test('owner reports use an explicit allowlist, keep zero and include loaded/filter scope in CSV', () => {
  const secret = 'never-export-this';
  const payments = ownerRecordReport('payments', [{ payment_id: 1, amount: 0, method: 'gcash', status: 'pending', archived: false,
    transaction_reference: 'TX-1', provider_payload: secret, verification_code: secret }], 'Loaded 1 of 500 matching attempts; not a complete ledger.');
  const csv = reportCsv(payments);
  assert.ok(!csv.includes(secret)); assert.match(csv, /Loaded 1 of 500/); assert.match(csv, /GCash/);
  assert.equal(payments.rows[0].amount, 0); assert.equal(payments.rows[0].archived, 'No');
  assert.match(payments.title, /Loaded/); assert.equal(payments.rows[0].references, 'Transaction: TX-1');
  const bookings = ownerRecordReport('bookings', [{ customer_name: 'Reserved Guest', username: 'account', total_amount: 0 }], 'Confirmed bookings');
  assert.equal(bookings.rows[0].guest, 'Reserved Guest'); assert.equal(bookings.rows[0].total, 0);
  assert.throws(() => ownerRecordReport('unknown', []), /Unsupported/);
});
test('receipt uses frozen policy and approved extensions without inventing a payment', () => {
  const receipt = { booking_id: 1, customer_name: 'Guest', currency: 'PHP', total_amount: 500, amount_paid: 0, balance_due: 500,
    payment_status: 'pending', stay_duration_hours: 6, check_in: '2026-11-02', check_out: '2026-11-02',
    policy_snapshot: JSON.stringify({ check_in_at: '2026-11-02 09:00:00', check_out_at: '2026-11-02 12:00:00',
      agreed_at: '2026-11-01', house_rules: 'Frozen house rules', stay_extensions: [{ hours: 3, amount: 250, to: '2026-11-02 15:00:00' }] }),
    provider_payload: 'SECRET' };
  const before = JSON.stringify(receipt), report = receiptExportReport(receipt, key => key);
  const field = name => report.rows.find(row => row.field === name)?.value;
  assert.match(field('Check-out'), /3:00.*PHT/); assert.match(field('Recorded paid'), /0.00/);
  assert.match(field('Approved extension 1'), /250.00/); assert.equal(field('Payment status'), 'pending');
  assert.match(reportCsv(report), /Frozen house rules/); assert.ok(!reportCsv(report).includes('SECRET'));
  assert.equal(field('Policy agreed at'), '2026-11-01'); assert.equal(JSON.stringify(receipt), before);
});
test('print documents escape all values, repeat headers, wrap text and omit application assets', () => {
  const report = { ...simple, title: '<script>bad()</script>', notes: '<img src=x>', summary: [['Guest', '<iframe>']],
    rows: [{ value: '<svg onload=bad()>"&' }] };
  const html = printableReportHtml(report, new Date('2026-11-02T00:00Z'));
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<svg')); assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;svg/); assert.match(html, /table-header-group/); assert.match(html, /overflow-wrap: anywhere/);
  assert.match(html, /A4 portrait/); assert.match(html, /default-src 'none'/); assert.match(html, /PHT/);
  assert.match(printableReportHtml(simple), /No records in this selection/);
});
test('unsaved sharing has no side effects; cancellation does not copy; saved links keep existing access', async () => {
  let calls = 0, copied = '';
  const base = { origin: 'https://example.test', name: 'Trip' };
  const nav = { share: async () => { calls++; throw Object.assign(new Error('Cancel'), { name: 'AbortError' }); },
    clipboard: { writeText: async text => { copied = text; } } };
  assert.equal(await shareSavedTrip({ ...base, nav }), 'unsaved'); assert.equal(calls, 0);
  assert.equal(await shareSavedTrip({ ...base, id: 42, nav }), 'cancelled'); assert.equal(copied, '');
  assert.equal(await shareSavedTrip({ ...base, id: 42, nav: { clipboard: nav.clipboard } }), 'copied');
  assert.equal(copied, 'https://example.test/itinerary/42');
  assert.equal(await shareSavedTrip({ ...base, id: 42, nav: {} }), 'unavailable');
  assert.equal(await shareSavedTrip({ ...base, id: 42, nav: { share: async data => assert.match(data.text, /permissions/) } }), 'shared');
});
