import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';
import { ARRIVAL_FIELDS, previousReportingMonth } from '../src/utils/tourismArrivals.js';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 25000 };
const hotel = { hotel_id: 46, name: 'Arrival Fixture Inn', location: 'Naujan', currency: 'PHP', image_urls: [], is_active: 1, booking_enabled: true, allowed_payment_methods: ['pay_at_property'], allowed_payment_options: ['full'] };
const month = previousReportingMonth();
let browser, role = 'owner', limited = false, report = null, history = [], failSave = false, failList = false, holdDetails = false, releaseRead;
const requests = [];
const fields = request => JSON.parse(request.postData || '{}');
const countValues = value => Object.fromEntries(ARRIVAL_FIELDS.map(field => [field, value]));
const readyOwner = () => browser.waitFor(`document.querySelector('[aria-label="Owner tourism arrivals"]') && !document.body.textContent.includes('Loading reports…')`);
const setCount = (field, value) => browser.evaluate(`(() => { const input = document.querySelector('[aria-label="${(field[0].toUpperCase() + field.slice(1)).replace('_', ' ')} arrivals"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const select = (label, value) => browser.evaluate(`(() => { const node = [...document.querySelectorAll('label')].find(node => node.textContent.trim().startsWith(${JSON.stringify(label)}))?.querySelector('select'); if (!node) throw new Error('Select not found'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const adminPage = async () => { role = 'admin'; await browser.navigate('/admin/tourist-arrivals'); await browser.waitFor(`document.querySelector('[aria-label="Admin owner tourism submissions"] .tourism-summary')`); };
const ownerPage = async () => { role = 'owner'; await browser.navigate('/owner/tourism-arrivals'); await readyOwner(); };

before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('tourism-arrivals', async (request, url) => {
    const path = url.pathname; requests.push({ path, method: request.method });
    if (path.endsWith('/auth/profile')) return { body: { user: { user_id: role === 'admin' ? 1 : 7, username: `fixture_${role}`, role, email_verified: true } } };
    if (path === '/api/owner/profile') return { body: { authorization: limited ? 'limited' : 'full', businessProfile: { verification_status: limited ? 'pending' : 'verified' } } };
    if (path === '/api/owner/hotels') return { body: [hotel] };
    if (path === '/api/owner/dashboard/stats') return { body: { hotelCount: 1, bookingStats: {}, recentBookings: [] } };
    if (path === '/api/admin/dashboard/stats') return { body: { bookingStats: {}, userStats: {} } };
    if (path.includes('/tourism-arrival-reports')) {
      const admin = path.includes('/admin/');
      const display = report && admin && report.status === 'returned' ? { ...report, ...history[0], status: 'returned', lock_version: report.lock_version } : report;
      if (path.endsWith('/coverage')) return { body: { properties: [{ hotel_id: 46, property_name: hotel.name, report_id: report?.report_id, status: report?.status || 'not_submitted' }] } };
      if (path.endsWith('/summary')) return { body: { totals: { ...countValues(0), ...(report?.status === 'approved' ? report : {}), approved_reports: report?.status === 'approved' ? 1 : 0 }, by_month: report?.status === 'approved' ? [report] : [] } };
      if (path.endsWith('/export')) return { body: { reports: report?.status === 'approved' ? [report] : [] } };
      if (/\/1\/review$/.test(path)) {
        const body = fields(request);
        if (body.decision === 'returned' && !body.review_note.trim()) return { status: 400, body: { error: 'Feedback required' } };
        Object.assign(report, { status: body.decision, review_note: body.review_note, lock_version: report.lock_version + 1 });
        Object.assign(history[0], { decision: body.decision, review_note: body.review_note });
        return { body: { status: body.decision } };
      }
      if (/\/1\/submit$/.test(path)) {
        Object.assign(report, { status: 'submitted', revision: report.revision + 1, lock_version: report.lock_version + 1, review_note: null });
        history.unshift({ ...report, decision: 'submitted', submitted_at: '2026-11-01T00:00:00Z' }); return { body: { report_id: 1 } };
      }
      if (['POST', 'PUT'].includes(request.method)) {
        if (failSave) return { status: 500, body: { error: 'Fixture save failed; your edits are retained.' } };
        const body = fields(request);
        report = { ...body, ...Object.fromEntries(ARRIVAL_FIELDS.map(field => [field, body[field] === '' ? null : Number(body[field])])), report_id: 1, hotel_id: 46, property_name: hotel.name, status: report?.status || 'draft', revision: report?.revision || 0, lock_version: (report?.lock_version || 0) + 1 };
        return { body: { report } };
      }
      if (/\/1$/.test(path)) {
        if (holdDetails) await new Promise(resolve => { releaseRead = resolve; });
        return { body: { report: display, history } };
      }
      if (failList) return { status: 503, body: { error: 'Fixture reporting temporarily unavailable.' } };
      const status = url.searchParams.get('status'), visible = display && (!admin || display.status !== 'draft') && (!status || status === 'all' || display.status === status);
      return { body: { reports: visible ? [display] : [], total: visible ? 1 : 0, page: 1, page_size: 20 } };
    }
    if (path === '/api/admin/tourist-arrivals/summary') return { body: { totals: {} } };
    return { body: [] };
  });
  await browser.viewport(1280); await browser.navigate('/owner/property');
  await browser.waitFor(`document.querySelector('#owner-nav')`); await browser.click('Tourism Arrivals'); await readyOwner();
  await browser.click('Payments'); await browser.waitFor(`location.pathname === '/owner/payments'`);
  await browser.evaluate('history.back()'); await readyOwner();
}, { timeout: 30000 });
after(async () => { releaseRead?.(); await browser?.close(); });

test('six-count drafts survive menu, Back and Forward discard guards, including mobile/dark mode', options, async () => {
  await browser.click('New monthly report'); await setCount('resident_male', '7');
  await browser.click('My Property'); await browser.waitFor(`document.querySelector('[role="dialog"]')`);
  await browser.click('Keep editing'); assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Resident male arrivals"]').value`), '7');
  await browser.evaluate('history.back()'); await browser.waitFor(`document.querySelector('[role="dialog"] button:not([disabled])')`);
  await browser.click('Keep editing');
  await browser.evaluate('history.forward()'); await browser.waitFor(`document.querySelector('[role="dialog"] button:not([disabled])')`);
  await browser.click('Keep editing');
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Resident male arrivals"]').value`), '7');
  for (const width of [320, 393, 768]) {
    await browser.viewport(width); await browser.evaluate(`document.documentElement.setAttribute('data-theme', 'dark')`);
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `owner overflow at ${width}`);
    assert.ok(await browser.evaluate(`(() => { const r = document.querySelector('.tourism-counts input').getBoundingClientRect(); return r.width >= 30 && r.right <= innerWidth; })()`));
  }
  await browser.viewport(1280);
  const writes = browser.writes.length;
  await browser.click('Preview & Submit'); await browser.waitFor(`document.querySelector('[aria-invalid="true"]')`);
  assert.equal(browser.writes.length, writes, 'blank counts are not silently saved/submitted as zero');
  failSave = true; await browser.click('Save Draft'); await browser.waitFor(`document.querySelector('.tourism-error')`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Resident male arrivals"]').value`), '7');
  failSave = false; await browser.click('Save Draft'); await browser.waitFor(`document.querySelector('.tourism-status[data-status="draft"]')`);
  assert.equal(report.resident_male, 7); assert.equal(report.local_male, null);
  await setCount('resident_male', '8'); await browser.click('My Property'); await browser.waitFor(`document.querySelector('[role="dialog"]')`);
  await browser.click('Discard changes'); await browser.waitFor(`location.pathname === '/owner/property'`);
  await browser.evaluate('history.back()'); await readyOwner();
  assert.equal(await browser.evaluate(`document.querySelector('.tourism-editor')`), null);
  await browser.click('Edit report'); await browser.waitFor(`document.querySelector('.tourism-editor')`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Resident male arrivals"]').value`), '7');
});

test('opening saved reports is single-flight, missing values stay blank and explicit zeros submit', options, async () => {
  await browser.click('Close editor'); holdDetails = true;
  const reads = requests.filter(req => req.path.endsWith('/tourism-arrival-reports/1')).length;
  await browser.click('Edit report'); await browser.waitFor(`document.querySelector('.tourism-reports button[disabled]')`);
  await browser.click('Edit report'); await browser.click('My Property');
  assert.equal(await browser.evaluate('location.pathname'), '/owner/tourism-arrivals');
  holdDetails = false; releaseRead(); await browser.waitFor(`document.querySelector('.tourism-editor')`);
  assert.equal(requests.filter(req => req.path.endsWith('/tourism-arrival-reports/1')).length, reads + 1);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Local male arrivals"]').value`), '');
  for (const field of ARRIVAL_FIELDS) await setCount(field, '0');
  await browser.click('Preview & Submit'); await browser.waitFor(`document.querySelector('[role="dialog"] .tourism-confirm')`);
  assert.match(await browser.evaluate(`document.querySelector('[role="dialog"]').textContent`), /zero-arrival report/);
  for (const width of [320, 393]) {
    await browser.viewport(width);
    assert.ok(await browser.evaluate(`(() => { const r = document.querySelector('[role="dialog"]').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })()`));
  }
  assert.equal(await browser.evaluate(`[...document.querySelectorAll('button')].find(node => node.textContent === 'Submit to Admin').disabled`), true);
  await browser.evaluate(`document.querySelector('.tourism-confirm input').click()`); await browser.click('Submit to Admin');
  await browser.waitFor(`document.querySelector('.tourism-status[data-status="submitted"]') && !document.querySelector('[role="dialog"]')`);
  assert.equal(report.status, 'submitted'); assert.equal(history.length, 1);
});

test('admins return reports with feedback and limited owners can correct and resubmit', options, async () => {
  await browser.viewport(1280); await adminPage();
  assert.match(await browser.evaluate(`document.querySelector('.tourism-reports').textContent`), /No approved owner reports/);
  await browser.click('Review report'); await browser.waitFor(`document.querySelector('.tourism-review-fields')`);
  await select('Review decision', 'returned'); await browser.click('Return for correction');
  await browser.waitFor(`document.querySelector('[role="dialog"] [role="alert"]')`); assert.equal(report.status, 'submitted');
  await browser.input('Feedback', 'Check the walk-ins.'); await browser.click('Return for correction');
  await browser.waitFor(`!document.querySelector('[role="dialog"]')`); assert.equal(report.status, 'returned');
  limited = true; await ownerPage();
  await browser.click('View history'); await browser.waitFor(`document.querySelector('.tourism-history-entry')`);
  assert.match(await browser.evaluate(`document.querySelector('.tourism-history-entry').textContent`), /Revision 1/);
  await browser.click('Close');
  await browser.click('Edit report'); await browser.waitFor(`document.querySelector('.tourism-editor')`);
  assert.match(await browser.evaluate(`document.querySelector('.tourism-feedback').textContent`), /Check the walk-ins/);
  await setCount('local_female', '4'); await browser.click('Preview & Submit');
  await browser.waitFor(`document.querySelector('.tourism-confirm input')`); await browser.evaluate(`document.querySelector('.tourism-confirm input').click()`);
  await browser.click('Submit to Admin'); await browser.waitFor(`document.querySelector('.tourism-status[data-status="submitted"]') && !document.querySelector('[role="dialog"]')`);
  assert.equal(report.revision, 2); assert.equal(history[1].local_female, 0); assert.equal(history[0].local_female, 4);
});

test('approval updates official totals and custom CSV/PDF exports never call browser print', options, async () => {
  await adminPage(); await browser.click('Review report'); await browser.waitFor(`document.querySelector('.tourism-review-fields')`);
  await browser.click('Approve report'); await browser.waitFor(`!document.querySelector('[role="dialog"]') && document.querySelector('.tourism-summary')?.textContent.includes('Total arrivals4')`);
  await browser.evaluate(`window.__downloads=[]; window.__prints=0; window.print=()=>window.__prints++; const original=URL.createObjectURL, blobs=new Map(); URL.createObjectURL=blob=>{const url=original(blob); blobs.set(url,blob); return url;}; HTMLAnchorElement.prototype.click=function(){ const blob=blobs.get(this.href); if(blob) { const filename=this.download; blob.arrayBuffer().then(bytes=>{window.__downloads.push({filename,text:new TextDecoder().decode(bytes),type:blob.type});document.body.setAttribute('data-downloads',window.__downloads.length);}); } };`);
  await browser.click('Approved CSV'); await browser.waitFor(`document.body.getAttribute('data-downloads') === '1'`);
  await browser.click('Approved PDF'); await browser.waitFor(`document.body.getAttribute('data-downloads') === '2'`);
  const downloads = await browser.evaluate('window.__downloads');
  assert.match(downloads[0].filename, /\.csv$/); assert.match(downloads[0].text, /Arrival Fixture Inn/);
  assert.match(downloads[1].filename, /\.pdf$/); assert.equal(downloads[1].text.slice(0, 5), '%PDF-');
  assert.equal(await browser.evaluate('window.__prints'), 0);
  for (const width of [320, 393, 768]) {
    await browser.viewport(width); await browser.evaluate(`document.documentElement.setAttribute('data-theme', 'dark')`);
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `admin overflow at ${width}`);
  }
});

test('clearing month stops loading, failures are retryable and historical/manual view stays separate', options, async () => {
  await browser.input('Reporting month', '');
  await browser.waitFor(`document.body.textContent.includes('Select a reporting month') && !document.body.textContent.includes('Loading tourism reports…')`);
  await browser.input('Reporting month', month); await browser.waitFor(`document.querySelector('.tourism-summary')`);
  failList = true; await browser.click('Refresh reports'); await browser.waitFor(`document.querySelector('.tourism-error')`);
  failList = false; await browser.click('Retry reports'); await browser.waitFor(`document.querySelector('.tourism-summary')`);
  await browser.click('Historical / manual log'); await browser.waitFor(`document.querySelector('#tourism-arrivals-legacy')`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Admin owner tourism submissions"]')`), null);
  assert.ok(!browser.writes.some(request => /hotel_bookings|hotel_payments|tourist-arrivals\//.test(new URL(request.url).pathname)));
  assert.deepEqual(browser.errors, []);
});
