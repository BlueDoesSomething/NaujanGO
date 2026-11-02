import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { generateReportPdf } from '../src/utils/pdfReports.js';
import { itineraryPrintReport, itineraryBudgetReport, receiptExportReport } from '../src/utils/itineraryExports.js';
import { analyticsReport, ownerRecordReport } from '../src/utils/reportExports.js';

const fontBytes = Object.fromEntries(await Promise.all([['regular', 'NotoSans-Regular.ttf'], ['bold', 'NotoSans-Bold.ttf'], ['cjk', 'NotoSansCJKkr-Regular.otf']]
  .map(async ([key, name]) => [key, new Uint8Array(await readFile(new URL(`../public/fonts/${name}`, import.meta.url)))])));
const options = { fontBytes, generatedAt: new Date('2026-11-02T00:00:00Z') };
const parsePdf = async bytes => {
  const task = getDocument({ data: bytes.slice(), useSystemFonts: false, isEvalSupported: false });
  const pdf = await task.promise, pages = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number), content = await page.getTextContent();
    pages.push({ text: content.items.map(item => item.str).join(' '), items: content.items, width: page.view[2], height: page.view[3] });
  }
  await task.destroy();
  return pages;
};
const trip = { name: 'Naujan ₱ café itinerary', description: 'Custom trip summary', status: 'in_progress', duration_days: 2,
  start_date: '2026-11-02', end_date: '2026-11-03', total_budget: 1500, total_distance: 5, total_time: 60 };
const items = [{ custom_name: 'Unlocated stop', day_number: 1, estimated_cost: 0, completed: 1, duration_minutes: 30 },
  { custom_name: 'Second destination', day_number: 2, estimated_cost: 50, notes: 'Bring water', duration_minutes: 30 }];

test('itinerary PDF is a genuine downloadable document with selectable summary, day plan and budget text', async () => {
  const report = itineraryPrintReport({ itinerary: trip, items, budget: [{ day: 1, attractionCost: 0, fareCost: 100, foodCost: 300, otherCost: 0, estimatedNeed: 400 }], draft: true });
  const before = JSON.stringify(report), bytes = await generateReportPdf(report, options);
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
  const doc = await PDFDocument.load(bytes); assert.equal(doc.getTitle(), trip.name);
  const pages = await parsePdf(bytes), text = pages.map(page => page.text).join(' ');
  for (const expected of [trip.name, 'ITINERARY SUMMARY', 'builder draft', 'Day 1', 'Day 2', 'Unlocated stop', 'Second destination', 'Bring water', 'PHP 400.00', 'Page 1 of']) assert.ok(text.includes(expected), expected);
  assert.ok(!text.includes('Save assumptions')); assert.ok(!text.includes('Quick Actions'));
  assert.equal(JSON.stringify(report), before, 'generating the PDF must not mutate saved/draft data');
});
test('budget PDF retains zero values, negative balances and the displayed estimates in a custom landscape table', async () => {
  const bytes = await generateReportPdf(itineraryBudgetReport([{ day: 1, fareCost: 0, attractionCost: 50, estimatedNeed: 450, balance: -25 }], 'Trip'), options);
  const pages = await parsePdf(bytes), text = pages.map(page => page.text).join(' ');
  assert.ok(pages[0].width > pages[0].height); assert.match(text, /BUDGET BREAKDOWN/); assert.match(text, /-25/); assert.match(text, /450/);
});
test('receipt PDF has distinct guest/stay/payment/policy sections, frozen terms and recorded balances only', async () => {
  const receipt = { booking_id: 8, receipt_number: 'R-8', customer_name: 'Fixture Guest', currency: 'PHP', total_amount: 1000, amount_paid: 250, balance_due: 750,
    status: 'confirmed', payment_status: 'partial', stay_duration_hours: 6, check_in: '2026-11-02', check_out: '2026-11-02',
    policy_snapshot: { check_in_at: '2026-11-02 09:00:00', check_out_at: '2026-11-02 12:00:00', house_rules: 'Frozen house rules',
      stay_extensions: [{ hours: 3, amount: 250, to: '2026-11-02 15:00:00' }] }, provider_payload: 'PRIVATE-PAYLOAD' };
  const bytes = await generateReportPdf(receiptExportReport(receipt, key => key), options);
  const text = (await parsePdf(bytes)).map(page => page.text).join(' ');
  for (const expected of ['Guest', 'Stay details', 'Payment record', 'Policies agreed at booking', 'Frozen house rules', 'Approved extension 1', 'PHP 250.00', 'PHP 750.00', '3:00']) assert.ok(text.includes(expected), expected);
  assert.ok(!text.includes('PRIVATE-PAYLOAD'));
});
test('record PDFs retain partial/filter scope and distinguish loaded attempts from successful payments', async () => {
  const report = ownerRecordReport('payments', [{ payment_id: 1, status: 'pending', amount: 0, currency: 'PHP', customer_name: 'Fixture', method: 'gcash', provider_payload: 'PRIVATE' }], 'Loaded 1 of 501 matches. Not a complete ledger.');
  const text = (await parsePdf(await generateReportPdf(report, options))).map(page => page.text).join(' ');
  assert.match(text, /Loaded 1 of 501/); assert.match(text, /Not a complete ledger/); assert.match(text, /pending/); assert.match(text, /PHP 0.00/); assert.ok(!text.includes('PRIVATE'));
});
test('analytics PDFs use the selected daily data and preserve role boundaries', async () => {
  const data = { dailyTrends: [{ day: '2026-11-02', bookings: 0, revenue: 250 }], monthlyTrends: [{ month: 'MONTHLY-SENTINEL', bookings: 999 }] };
  const visitor = { gender_distribution: [{ gender: 'GENDER-SENTINEL', count: 5 }] };
  for (const userRole of ['admin', 'owner']) {
    const report = analyticsReport('all', { data, visitor, period: '7d', userRole });
    const text = (await parsePdf(await generateReportPdf(report, options))).map(page => page.text).join(' ');
    assert.match(text, /2026-11-02/); assert.ok(!text.includes('MONTHLY-SENTINEL'));
    assert.equal(text.includes('GENDER-SENTINEL'), userRole === 'admin');
  }
});
test('oversized notes and long tables paginate without losing the last text or overflowing the page', async () => {
  const report = ownerRecordReport('reviews', Array.from({ length: 40 }, (_, index) => ({ review_id: index + 1, rating: 5,
    username: `Reviewer-${index}`, comment: index === 0 ? 'LongUnbrokenWord'.repeat(500) + ' NOTE-END' : `Review-${index}-end`, owner_reply: 'Reply' })), 'All loaded reviews.');
  const pages = await parsePdf(await generateReportPdf(report, options));
  assert.ok(pages.length > 2);
  const text = pages.map(page => page.text).join(' '); assert.match(text, /NOTE-END/); assert.match(text, /Review-39-end/);
  pages.forEach((page, index) => {
    assert.ok(page.text.includes(`Page ${index + 1} of ${pages.length}`));
    page.items.filter(item => item.str.trim()).forEach(item => {
      assert.ok(item.transform[4] >= 35 && item.transform[4] + item.width <= page.width - 30, `Horizontal overflow: ${item.str}`);
      assert.ok(item.transform[5] >= 12 && item.transform[5] <= page.height - 12, `Vertical overflow: ${item.str}`);
    });
  });
});
test('PDFs embed Unicode fonts for peso, accents, Chinese/Japanese/Korean, with explicit unsupported-symbol fallback', async () => {
  const name = '₱ café 中文 日本語 한국어';
  const report = itineraryPrintReport({ itinerary: { ...trip, name }, items: [{ custom_name: name, notes: '🧳' }], budget: [] });
  const text = (await parsePdf(await generateReportPdf(report, options))).map(page => page.text).join(' ');
  assert.ok(text.replace(/\s+/g, ' ').includes(name), text); assert.match(text, /\[U\+1F9F3\]/);
});
test('empty selections generate an honest custom document rather than a website capture or invented records', async () => {
  const report = ownerRecordReport('bookings', [], 'Confirmed reservations; current loaded selection is empty.');
  const text = (await parsePdf(await generateReportPdf(report, options))).map(page => page.text).join(' ');
  assert.match(text, /RESERVATION REPORT/); assert.match(text, /No records in this selection/); assert.match(text, /current loaded selection is empty/);
  assert.ok(!text.includes('PHP 0.00'));
});
