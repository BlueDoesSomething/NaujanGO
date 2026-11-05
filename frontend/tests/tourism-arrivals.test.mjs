import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ARRIVAL_FIELDS, ARRIVAL_CATEGORIES, emptyArrivalForm, arrivalFormFromReport, arrivalTotals, validateArrivalForm, reportingMonth, previousReportingMonth, arrivalExport } from '../src/utils/tourismArrivals.js';
import { reportCsv } from '../src/utils/exportFiles.js';
import { generateReportPdf } from '../src/utils/pdfReports.js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const counts = values => Object.fromEntries(ARRIVAL_FIELDS.map((field, index) => [field, values[index] ?? 0]));
test('monthly reporting uses the Philippine date, including year boundaries', t => {
  t.mock.method(Date, 'now', () => Date.parse('2025-12-31T16:01:00Z'));
  assert.equal(reportingMonth(), '2026-01'); assert.equal(previousReportingMonth(), '2025-12');
  assert.equal(emptyArrivalForm(8).arrival_month, '2025-12');
});
test('six explicit counts are required for submission but blank drafts remain incomplete', () => {
  const form = emptyArrivalForm(8, '2026-01');
  assert.deepEqual(validateArrivalForm(form), {});
  assert.equal(Object.keys(validateArrivalForm(form, true)).length, 6);
  assert.equal(arrivalTotals(form).total, null);
  assert.deepEqual(validateArrivalForm({ ...form, ...counts([]) }, true), {});
  assert.equal(arrivalTotals(counts([])).total, 0);
  for (const value of [-1, 0.5, ' ', true, [], {}, 2147483648, 'invalid']) assert.ok(validateArrivalForm({ ...form, resident_male: value }).resident_male);
  assert.ok(validateArrivalForm({ ...form, arrival_month: '9999-01' }).arrival_month);
  assert.ok(validateArrivalForm({ ...form, arrival_month: '2026-13' }).arrival_month);
  assert.ok(validateArrivalForm({ ...form, notes: 'x'.repeat(4001) }).notes);
});
test('derived category/sex/overall totals do not guess missing values or double-count', () => {
  assert.deepEqual(arrivalTotals(counts([1, 2, 3, 4, 5, 6])), { resident: 3, local: 7, foreigner: 11, male: 9, female: 12, total: 21 });
  assert.deepEqual(arrivalTotals({ ...counts([1, 2, 3, 4, 5, 6]), resident_male: null }), { resident: null, local: 7, foreigner: 11, male: null, female: 12, total: null });
  const form = arrivalFormFromReport({ hotel_id: 8, ...counts([]), resident_male: null });
  assert.equal(form.hotel_id, '8'); assert.equal(form.resident_male, ''); assert.equal(form.local_male, 0);
  assert.deepEqual(ARRIVAL_CATEGORIES.map(category => category.definition), ['Lives in Naujan', 'Filipino visitor from outside Naujan', 'Non-Filipino visitor']);
});
test('CSV exports use explicit safe columns, all rows, truthful scope and no guest/payment data', () => {
  const records = Array.from({ length: 25 }, (_, index) => ({ property_name: index ? `Property ${index}` : '=malicious()', arrival_month: '2026-01', ...counts([]), notes: 'PRIVATE-NOTES', user_id: 1, customer_name: 'PRIVATE-GUEST', provider_payload: 'PRIVATE-PAYMENT' }));
  const report = arrivalExport(records, '2026-01'), csv = reportCsv(report);
  assert.equal(report.rows.length, 25); assert.equal(report.rows[0].total, 0);
  assert.match(csv, /'=malicious\(\)/); assert.match(csv, /Property 24/); assert.match(csv, /historical\/manual totals are excluded/);
  assert.doesNotMatch(csv, /PRIVATE|user_id|customer_name|provider_payload/);
  assert.equal(arrivalExport([], '2026-01').summary.at(-1)[1], 'No approved reports');
});
test('tourism PDF is a genuine landscape download with six counts and category definitions', async () => {
  const fontBytes = Object.fromEntries(await Promise.all([['regular', 'NotoSans-Regular.ttf'], ['bold', 'NotoSans-Bold.ttf'], ['cjk', 'NotoSansCJKkr-Regular.otf']].map(async ([key, name]) => [key, new Uint8Array(await readFile(new URL(`../public/fonts/${name}`, import.meta.url)))])));
  const bytes = await generateReportPdf(arrivalExport([{ property_name: 'Fixture Inn', arrival_month: '2026-01', ...counts([1, 2, 3, 4, 5, 6]) }], '2026-01'), { fontBytes, generatedAt: new Date('2026-02-01T00:00:00Z') });
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
  const task = getDocument({ data: bytes, useSystemFonts: false, isEvalSupported: false });
  const pdf = await task.promise, page = await pdf.getPage(1), content = await page.getTextContent();
  const text = content.items.map(item => item.str).join(' ');
  assert.ok(page.view[2] > page.view[3]);
  for (const expected of ['Fixture Inn', '1 / 2', '3 / 4', '5 / 6', '21', 'Lives in Naujan', 'Filipino visitor from outside Naujan', 'Historical/manual totals are separate']) assert.ok(text.includes(expected), expected);
  await task.destroy();
});
