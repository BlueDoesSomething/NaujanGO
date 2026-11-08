import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 25000 };
const hotel = { id: 46, hotel_id: 46, name: 'Booking Fixture Inn', location: 'Naujan', pricePerNight: 500, price_per_night: 500, currency: 'PHP', amenities: [], images: [], image_urls: [], rooms_total: 2, rooms_available: 2, is_active: 1, booking_enabled: true, allowed_payment_methods: ['card', 'qrph'], allowed_payment_options: ['reservation'], reservation_fee: 100, check_in_time: '14:00', check_out_time: '12:00', payment_terms_text: 'OLD ADVANCE DEPOSIT LINE' };
const room = { room_id: 9, hotel_id: 46, room_type_name: 'Standard Queen', price_per_night: 500, currency: 'PHP', capacity: 2, quantity_available: 2, is_active: 1, image_urls: [], amenities: [], room_features: [] };
let browser, role = 'user', policy = { online_payments_enabled: false, storage_ready: true, lock_version: 1 }, messages = [], bookings = [], failSend = false;
let failPolicy = false, heldPolicyResponse = null, authorization = 'full';
const historicalPayments = [
  { payment_id: 601, booking_id: 81, booking_reference: 'HB000081', hotel_name: hotel.name, room_type_name: room.room_type_name, customer_name: 'Historical Paid Guest', amount: 750, currency: 'PHP', method: 'card', provider: 'paymongo', status: 'succeeded', archived: 0, customer_reference_number: 'HISTORY-PAID-601', transaction_reference: 'TX-601', created_at: '2026-10-01T00:00:00Z', paid_at: '2026-10-01T00:01:00Z' },
  { payment_id: 602, booking_id: 82, booking_reference: 'HB000082', hotel_name: hotel.name, room_type_name: room.room_type_name, customer_name: 'Historical Pending Guest', amount: 250, currency: 'PHP', method: 'gcash', provider: 'paymongo', status: 'pending', archived: 0, customer_reference_number: 'HISTORY-PENDING-602', created_at: '2026-10-02T00:00:00Z' },
  { payment_id: 603, booking_id: 83, booking_reference: 'HB000083', hotel_name: hotel.name, customer_name: 'Historical Archived Guest', amount: 100, currency: 'PHP', method: 'card', status: 'succeeded', archived: 1, created_at: '2026-09-01T00:00:00Z' }
];
const originalPaymentHistory = JSON.stringify(historicalPayments);
const matchingPayments = url => historicalPayments.filter(payment => {
  const query = url.searchParams;
  return (query.get('archived') === 'all' || Number(payment.archived) === 0)
    && (!query.has('status') || payment.status === query.get('status'))
    && (!query.has('method') || payment.method === query.get('method'))
    && (!query.has('search') || JSON.stringify(payment).toLowerCase().includes(query.get('search').toLowerCase()));
});
const financialWrites = () => browser.writes.filter(request => /^\/api\/(?:owner\/payments|payments)(?:\/|$)/.test(new URL(request.url).pathname));
const assertHistoryOnly = async () => {
  assert.equal(await browser.evaluate(`document.querySelector('.gov-page-title').textContent`), 'Payment History');
  assert.match(await browser.evaluate(`document.querySelector('#owner-nav').textContent`), /Payment History/);
  // Owners may still access Payment Setup to configure direct-to-property display options,
  // but no online/gateway payment actions are available while payments are disabled or unavailable.
  assert.ok(!await browser.evaluate(`[...document.querySelectorAll('.gov-main button')].some(node => /^(Payment setup ↗|Confirm|Cancel|Refund|Process Refund)$/.test(node.textContent.trim()))`));
  assert.ok(await browser.evaluate(`[...document.querySelectorAll('.gov-table tbody button')].every(node => node.textContent.trim() === 'View')`));
};
const setInput = (selector, value) => browser.evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); if (!node) throw new Error('Input not found: ' + ${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const setSelect = (selector, value) => browser.evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('admin-payment-controls', async (incoming, url) => {
    const path = url.pathname, body = JSON.parse(incoming.postData || '{}');
    if (path.endsWith('/auth/profile')) return { body: { user: { user_id: role === 'user' ? 1 : 7, role, username: 'Fixture Guest', email: 'guest@example.test', phone: '+639123456789', email_verified: true } } };
    if (path === '/api/bookings/policy' || path === '/api/admin/booking-policy' && incoming.method === 'GET') {
      if (heldPolicyResponse) await heldPolicyResponse;
      return failPolicy ? { status: 503, body: { error: 'Fixture policy check unavailable.' } } : { body: policy };
    }
    if (path === '/api/admin/booking-policy' && incoming.method === 'PUT') { policy = { ...policy, online_payments_enabled: body.online_payments_enabled, lock_version: policy.lock_version + 1 }; return { body: policy }; }
    if (path === '/api/hotels') return { body: { data: [hotel] } };
    if (path === '/api/hotels/46/rooms' || path === '/api/owner/rooms') return { body: [room] };
    if (path === '/api/hotels/46/average-rating') return { body: { average_rating: null, total_reviews: 0 } };
    if (path.endsWith('/calendar')) return { body: { days: [] } };
    if (path === '/api/bookings/hotels' && incoming.method === 'POST') {
      const booking = { ...body, booking_id: 88, hotel_id: 46, hotel_name: hotel.name, room_type_name: room.room_type_name, status: 'pending', total_amount: body.quoted_total, currency: 'PHP', check_in_at: `${body.check_in} 14:00:00`, check_out_at: `${body.check_out} 12:00:00`, payment_status: 'unpaid', amount_paid: null, balance_due: null, expires_at: null, created_at: '2026-11-06T00:00:00Z', policy_snapshot: { payment_handling: 'external', payment_arrangement: body.payment_method } };
      bookings = [booking]; return { body: { booking, payment_handling: 'external' } };
    }
    if (path === '/api/owner/bookings/88/status') { bookings[0].status = body.status; return { body: { success: true } }; }
    if (/\/(?:bookings\/hotels|owner\/bookings)\/88\/messages$/.test(path)) {
      if (incoming.method === 'POST') {
        if (failSend) return { status: 503, body: { error: 'Fixture send failed; message retained.' } };
        if (!messages.some(item => item.client_key === body.client_key)) messages.push({ message_id: messages.length + 1, sender_role: role === 'owner' ? 'owner' : 'guest', message: body.message, client_key: body.client_key });
        return { body: { message_id: messages.length } };
      }
      return { body: { booking: bookings[0], messages, has_more: false, oldest_id: messages[0]?.message_id || null } };
    }
    if (path === '/api/bookings/hotels' || path === '/api/owner/bookings' || path === '/api/admin/bookings') return { body: bookings };
    if (path === '/api/owner/hotels') return { body: [hotel] };
    if (path === '/api/owner/profile') return { body: { authorization, businessProfile: { verification_status: authorization === 'full' ? 'verified' : 'pending' } } };
    if (path.endsWith('/dashboard/stats')) return { body: { hotelCount: 1, bookingStats: {}, userStats: {}, recentBookings: [] } };
    if (path === '/api/owner/payments') return { body: matchingPayments(url) };
    if (path === '/api/owner/payments/stats') {
      const rows = matchingPayments(url);
      return { body: { total_transactions: rows.length, successful_transactions: rows.filter(row => row.status === 'succeeded').length,
        total_revenue: 850, pending_amount: rows.filter(row => row.status === 'pending').reduce((total, row) => total + row.amount, 0), currency: 'PHP', currency_count: 1,
        historical: { currency: 'PHP', currency_count: 1 }, archive_scope: url.searchParams.get('archived') === 'all' ? 'including_archived' : 'excluding_archived' } };
    }
    if (path.endsWith('/payments/stats')) return { body: {} };
    return { body: [] };
  });
  await browser.viewport(1280); await browser.navigate('/hotels/46'); await browser.waitFor(`document.querySelector('.hd-cta')`);
}, { timeout: 30000 });
after(async () => { await browser?.close(); });

test('normal booking form remains: saving goes directly to My Bookings with no checkout or separate request module', options, async () => {
  await browser.evaluate(`document.querySelector('.hd-cta').click()`); await browser.waitFor(`document.querySelector('.hd-bm-policies')`);
  assert.deepEqual(await browser.evaluate(`[...document.querySelector('#hd-bm-pay-method').options].map(option => option.value)`), ['pay_at_property']);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.hd-bm-main').textContent`), /OLD ADVANCE DEPOSIT LINE|Secure the booking now|Owner-approved booking request/);
  await browser.evaluate(`(() => { const node = [...document.querySelectorAll('.hd-bm-main select')].find(node => [...node.options].some(option => option.value === '9')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(node,'9'); node.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await setInput('.hd-bm-main input[type="date"]', '2099-12-20');
  await browser.evaluate(`(() => { const node = document.querySelectorAll('.hd-bm-main input[type="date"]')[1]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(node,'2099-12-21'); node.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await browser.evaluate(`(() => { const label=[...document.querySelectorAll('.hd-bm-label')].find(node=>/Full Name/i.test(node.textContent)); const input=label.parentElement.querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Fixture Guest'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`);
  await setInput('.hd-bm-main input[type="email"]', 'guest@example.test'); await setInput('.hd-bm-main input[inputmode="numeric"]', '9123456789');
  await browser.evaluate(`document.querySelector('.hd-bm-policies input[type="checkbox"]').click()`); await browser.click('Confirm Booking');
  await browser.waitFor(`location.pathname === '/bookings' && document.body.textContent.includes('Booking #88 saved')`);
  assert.equal(bookings.length, 1); assert.equal(bookings[0].status, 'pending'); assert.equal(bookings[0].expires_at, null);
  assert.ok(!browser.writes.some(item => /\/payments\//.test(new URL(item.url).pathname)));
  assert.doesNotMatch(await browser.evaluate('document.body.textContent'), /My booking requests|Send Booking Request/);
  await browser.click('Message property'); await browser.waitFor(`document.querySelector('[aria-label="Booking conversation"]')`);
  assert.match(await browser.evaluate(`document.querySelector('[role="dialog"]').textContent`), /Booking #88|Messages do not confirm bookings or verify payments/);
  await browser.click('Close');
});

test('direct owner messages preserve failed drafts and browser navigation guards without changing booking status', options, async () => {
  role = 'owner'; await browser.navigate('/owner/property'); await browser.waitFor(`document.querySelector('#owner-nav')`); await browser.click('Reservations'); await browser.waitFor(`document.querySelector('.gov-table tbody tr')`);
  await browser.click('Message guest'); await browser.waitFor(`document.querySelector('[aria-label="Booking conversation"]')`);
  await setInput('[role="dialog"] textarea', 'What time will you arrive?');
  await browser.evaluate('history.back()'); await browser.waitFor(`document.body.textContent.includes('Discard unsaved changes?')`); await browser.click('Keep editing');
  assert.equal(await browser.evaluate(`document.querySelector('[role="dialog"] textarea').value`), 'What time will you arrive?');
  failSend = true; await browser.click('Send message'); await browser.waitFor(`document.querySelector('[role="dialog"] [role="alert"]')`);
  assert.equal(await browser.evaluate(`document.querySelector('[role="dialog"] textarea').value`), 'What time will you arrive?');
  await browser.click('Close'); await browser.waitFor(`document.querySelector('[role="dialog"]').textContent.includes('Discard unsent message?')`); await browser.click('Keep editing message');
  failSend = false; await browser.click('Send message'); await browser.waitFor(`document.querySelector('[role="dialog"] textarea')?.value === '' && document.querySelector('[role="dialog"]').textContent.includes('Message sent')`);
  assert.equal(bookings[0].status, 'pending'); assert.equal(messages.length, 1); await browser.click('Close');
});

test('guest replies, owner confirms using existing controls, and confirmed booking keeps normal modify/calendar actions', options, async () => {
  role = 'user'; await browser.navigate('/bookings'); await browser.waitFor(`document.body.textContent.includes('Booking #88')`); await browser.click('Message property'); await browser.waitFor(`document.querySelector('[aria-label="Booking conversation"]')`);
  await setInput('[role="dialog"] textarea', 'Around 3 PM.'); await browser.click('Send message'); await browser.waitFor(`document.querySelector('[role="dialog"] textarea')?.value === ''`); await browser.click('Close');
  assert.equal(bookings[0].status, 'pending');
  role = 'owner'; await browser.navigate('/owner/bookings'); await browser.waitFor(`document.querySelector('.gov-table tbody tr')`);
  await browser.click('Confirm'); await browser.waitFor(`document.body.textContent.includes('Confirm this reservation?')`); await browser.click('Yes, confirm reservation'); await browser.waitFor(`!document.querySelector('[role="dialog"]') && document.querySelector('.gov-main').textContent.includes('confirmed')`);
  assert.equal(bookings.length, 1); assert.equal(bookings[0].status, 'confirmed');
  role = 'user'; await browser.navigate('/bookings'); await browser.waitFor(`document.body.textContent.includes('Pay at property · not verified by NaujanGO')`);
  assert.ok(await browser.evaluate(`[...document.querySelectorAll('button')].some(node=>node.textContent.trim()==='Modify')`));
  assert.ok(!await browser.evaluate(`[...document.querySelectorAll('button')].some(node=>/^(Complete payment|Resume payment|Pay balance|Receipt)$/.test(node.textContent.trim()))`));
  await browser.click('Message property'); await browser.waitFor(`document.querySelector('[aria-label="Booking conversation"]')`);
  assert.match(await browser.evaluate(`document.querySelector('[role="dialog"]').textContent`), /What time will you arrive\?|Around 3 PM\./);
  for (const width of [320, 393, 768]) { await browser.viewport(width); await browser.evaluate(`document.documentElement.dataset.theme='dark'`); assert.ok(await browser.evaluate(`(() => { const r=document.querySelector('[role="dialog"]').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth; })()`)); }
  await browser.click('Close'); await browser.navigate('/hotels/payment/88'); await browser.waitFor(`document.body.textContent.includes('Online payments are unavailable')`);
  assert.ok(!browser.writes.some(item => /\/payments\//.test(new URL(item.url).pathname)));
});

test('only admin can control payments; disabling does not disable normal bookings', options, async () => {
  await browser.viewport(1280); role = 'owner'; await browser.navigate('/owner/payment-setup'); await browser.waitFor(`document.body.textContent.includes('Owners cannot override the admin switch')`);
  assert.match(await browser.evaluate('document.body.textContent'), /Bookings remain available/);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Payment plan settings"]')`), null);
  assert.ok(await browser.evaluate(`document.body.textContent.includes('GCash') && document.body.textContent.includes('Maya')`), 'owners can configure direct payment display options while online payments are disabled');
  role = 'admin'; await browser.navigate('/admin/payments'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"] fieldset:not([disabled])')`);
  await setSelect('[aria-label="Platform payment policy"] select', 'on'); await browser.click('Save platform policy'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"] [role="alert"]')`);
  await setInput('[aria-label="Platform payment policy"] textarea', 'Client authorized gateway processing.'); await browser.click('Save platform policy'); assert.equal(policy.online_payments_enabled, false);
  await browser.evaluate(`document.querySelector('.booking-policy-checkbox input').click()`); await browser.click('Save platform policy'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"] [role="status"]')`); assert.equal(policy.online_payments_enabled, true);
  await setSelect('[aria-label="Platform payment policy"] select', 'off'); await setInput('[aria-label="Platform payment policy"] textarea', 'Keep payments outside the platform.'); await browser.click('Save platform policy'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"]').textContent.includes('Online payments OFF')`);
  assert.equal(bookings.length, 1); assert.equal(bookings[0].status, 'confirmed'); assert.deepEqual(browser.errors, []);
});

test('disabled owner payments are view-only history with working filters and custom CSV/PDF downloads', options, async () => {
  role = 'owner'; await browser.navigate('/owner/payments');
  await browser.waitFor(`document.querySelector('[aria-label="Online payment availability"]')?.textContent.includes('disabled by the administrator') && document.querySelectorAll('.gov-table tbody tr').length === 2`);
  await assertHistoryOnly();
  assert.match(await browser.evaluate(`document.querySelector('.gov-main').textContent`), /View-only history|Guests pay at the property|Contact the administrator about refunds/);
  assert.match(await browser.evaluate(`document.querySelector('.gov-main').textContent`), /Lifetime revenue.*₱850/s);
  await browser.click('View'); await browser.waitFor(`document.querySelector('.gov-main').textContent.includes('Payment Details #601')`);
  assert.match(await browser.evaluate(`document.querySelector('.gov-main').textContent`), /HISTORY-PAID-601|TX-601/);
  await browser.click('×');
  await browser.click('Pending'); await browser.waitFor(`document.querySelectorAll('.gov-table tbody tr').length === 1 && document.querySelector('.gov-table tbody').textContent.includes('Historical Pending Guest')`);
  await assertHistoryOnly();
  await browser.click('All'); await browser.waitFor(`document.querySelectorAll('.gov-table tbody tr').length === 2`);
  await setSelect('.gov-main select', 'card'); await browser.waitFor(`document.querySelectorAll('.gov-table tbody tr').length === 1 && document.querySelector('.gov-table tbody').textContent.includes('Historical Paid Guest')`);
  await browser.click('Clear Filters'); await browser.waitFor(`document.querySelectorAll('.gov-table tbody tr').length === 2`);
  await browser.click('Show archived'); await browser.waitFor(`document.querySelectorAll('.gov-table tbody tr').length === 3`);
  await setInput('.gov-main input[type="text"]', 'Historical Pending Guest');
  await browser.waitFor(`document.querySelectorAll('.gov-table tbody tr').length === 1 && [...document.querySelectorAll('.gov-main button')].some(node => node.textContent.trim() === 'Export CSV' && !node.disabled)`);
  await browser.evaluate(`(() => {
    window.historyDownloads = []; window.historyBlobs = []; window.historyPrints = 0;
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = blob => { window.historyBlobs.push(blob); return create(blob); };
    HTMLAnchorElement.prototype.click = function () { window.historyDownloads.push(this.download); };
    window.print = () => { window.historyPrints += 1; };
  })()`);
  await browser.click('Export CSV');
  const csv = await browser.evaluate(`window.historyBlobs[0].text()`);
  assert.match(csv, /Historical Pending Guest/); assert.doesNotMatch(csv, /Historical Paid Guest|Historical Archived Guest/);
  await browser.click('Export PDF'); await browser.waitFor(`window.historyDownloads.length === 2 && [...document.querySelectorAll('.gov-main button')].some(node => node.textContent.trim() === 'Export PDF' && !node.disabled)`);
  assert.match(await browser.evaluate(`window.historyBlobs[1].text().then(text => text.slice(0, 5))`), /^%PDF-/);
  assert.deepEqual(await browser.evaluate('window.historyDownloads.map(name => name.slice(-4))'), ['.csv', '.pdf']);
  assert.equal(await browser.evaluate('window.historyPrints'), 0);
  assert.equal(await browser.evaluate('document.querySelectorAll("iframe").length'), 0);
  for (const width of [320, 393, 768]) {
    await browser.viewport(width); await browser.evaluate(`document.documentElement.dataset.theme = 'dark'`);
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `history overflows at ${width}`);
    await assertHistoryOnly();
  }
  await browser.viewport(1280); await browser.click('My Property'); await browser.waitFor(`document.querySelector('.owner-starting-price')`); await browser.click('Edit details');
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.owner-editor-tabs').textContent`), /Payment setup/i);
  await browser.click('Back to property');
  await browser.navigate('/owner/payment-setup'); await browser.waitFor(`document.body.textContent.includes('Guest Payment Options') && document.body.textContent.includes('Owners cannot override the admin switch')`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Payment plan settings"]')`), null);
  assert.equal(JSON.stringify(historicalPayments), originalPaymentHistory);
  assert.deepEqual(financialWrites(), []); assert.deepEqual(browser.errors, []);
});

test('re-enabling restores owner controls; refreshing an open refund fails closed before applying an admin disable', options, async () => {
  await browser.viewport(1280); role = 'owner'; await browser.navigate('/owner/payments');
  await browser.waitFor(`document.querySelector('[aria-label="Online payment availability"]')?.textContent.includes('disabled by the administrator')`);
  policy = { ...policy, online_payments_enabled: true };
  await browser.evaluate(`window.dispatchEvent(new Event('focus'))`);
  await browser.waitFor(`document.querySelector('.gov-page-title')?.textContent === 'Payments' && document.querySelectorAll('.gov-table tbody tr').length === 2`);
  assert.match(await browser.evaluate(`document.querySelector('#owner-nav').textContent`), /Payment Setup/);
  assert.ok(await browser.evaluate(`[...document.querySelectorAll('.gov-main button')].filter(node => /^(Confirm|Cancel|Refund|Archive)$/.test(node.textContent.trim())).length === 4`));
  await browser.click('Payment Setup'); await browser.waitFor(`document.querySelector('[aria-label="Payment plan settings"]')`);
  await browser.click('My Property'); await browser.waitFor(`document.querySelector('.owner-starting-price')`); await browser.click('Edit details');
  assert.match(await browser.evaluate(`document.querySelector('.owner-editor-tabs').textContent`), /Payment setup/i);
  await browser.click('Back to property'); await browser.click('Payments'); await browser.waitFor(`document.querySelectorAll('.gov-table tbody tr').length === 2`);
  await browser.click('Refund'); await browser.waitFor(`document.querySelector('.gov-main').textContent.includes('Process Refund')`);
  let releasePolicy;
  heldPolicyResponse = new Promise(resolve => { releasePolicy = resolve; });
  try {
    await browser.evaluate(`window.dispatchEvent(new Event('focus'))`);
    await browser.waitFor(`document.querySelector('[aria-label="Online payment availability"]')?.textContent.includes('Checking online payment policy')`);
    await assertHistoryOnly();
    assert.doesNotMatch(await browser.evaluate(`document.querySelector('[aria-label="Online payment availability"]').textContent`), /disabled by the administrator/);
    policy = { ...policy, online_payments_enabled: false };
  } finally { heldPolicyResponse = null; releasePolicy(); }
  await browser.waitFor(`document.querySelector('[aria-label="Online payment availability"]')?.textContent.includes('disabled by the administrator')`);
  await assertHistoryOnly(); assert.deepEqual(financialWrites(), []);
  assert.equal(JSON.stringify(historicalPayments), originalPaymentHistory); assert.deepEqual(browser.errors, []);
});

test('policy failures show an honest unavailable notice and retry restores controls without hiding history', options, async () => {
  role = 'owner'; policy = { ...policy, online_payments_enabled: true }; failPolicy = true;
  try {
    await browser.navigate('/owner/payments');
    await browser.waitFor(`document.querySelector('[aria-label="Online payment availability"] [role="alert"]') && document.querySelectorAll('.gov-table tbody tr').length === 2`);
    await assertHistoryOnly();
    const notice = await browser.evaluate(`document.querySelector('[aria-label="Online payment availability"]').textContent`);
    assert.match(notice, /Online payment policy unavailable|Fixture policy check unavailable/); assert.doesNotMatch(notice, /disabled by the administrator/);
    await browser.navigate('/owner/payment-setup'); await browser.waitFor(`document.body.textContent.includes('Fixture policy check unavailable') && document.body.textContent.includes('Owners cannot override the admin switch')`);
    assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Payment plan settings"]')`), null);
    failPolicy = false; await browser.click('Retry booking policy'); await browser.waitFor(`document.querySelector('[aria-label="Payment plan settings"]')`);
    await browser.click('Payments'); await browser.waitFor(`document.querySelector('.gov-page-title')?.textContent === 'Payments' && document.querySelectorAll('.gov-table tbody tr').length === 2`);
    assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Online payment availability"]')`), null);
    assert.deepEqual(financialWrites(), []); assert.deepEqual(browser.errors, []);
  } finally { failPolicy = false; policy = { ...policy, online_payments_enabled: false }; }
});

test('limited owners can configure direct payment options while online payments are disabled, without gaining access to history', options, async () => {
  role = 'owner'; authorization = 'limited'; policy = { ...policy, online_payments_enabled: false };
  try {
    await browser.navigate('/owner/property'); await browser.waitFor(`document.querySelector('#owner-nav')`);
    assert.match(await browser.evaluate(`document.querySelector('#owner-nav').textContent`), /Payment Setup/);
    assert.doesNotMatch(await browser.evaluate(`document.querySelector('#owner-nav').textContent`), /Payment History/);
    await browser.click('Payment Setup'); await browser.waitFor(`document.body.textContent.includes('Owners cannot override the admin switch')`);
    assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Payment plan settings"]')`), null);
    assert.ok(await browser.evaluate(`document.body.textContent.includes('GCash') || document.body.textContent.includes('Pay at the property')`));
    assert.deepEqual(financialWrites(), []); assert.deepEqual(browser.errors, []);
  } finally { authorization = 'full'; policy = { ...policy, online_payments_enabled: false }; }
});

for (const online of [false, true]) test(`GCash is a manual owner conversation with online payments ${online ? 'ON' : 'OFF'}, visible to guest, owner and admin`, options, async () => {
  role = 'user'; authorization = 'full'; messages = [];
  policy = { ...policy, online_payments_enabled: online };
  hotel.allowed_payment_methods = ['card', 'gcash', 'qrph'];
  try {
    await browser.viewport(1280); await browser.navigate('/hotels/46'); await browser.waitFor(`document.querySelector('.hd-cta')`);
    await browser.evaluate(`document.querySelector('.hd-cta').click()`); await browser.waitFor(`document.querySelector('#hd-bm-pay-method option[value="gcash"]')`);
    const methods = await browser.evaluate(`[...document.querySelector('#hd-bm-pay-method').options].map(option => option.value)`);
    const expected = online ? ['card', 'gcash', 'qrph'] : ['gcash', 'pay_at_property'];
    assert.equal(methods.length, expected.length);
    assert.deepEqual([...methods].sort(), [...expected].sort());
    await setSelect('#hd-bm-pay-method', 'gcash');
    assert.equal(await browser.evaluate(`document.querySelector('.hd-bm-payopts')`), null);
    assert.match(await browser.evaluate(`document.querySelector('.hd-bm-main').textContent`), /GCash QR code or number.*does not collect or verify/s);
    await browser.evaluate(`(() => { const node = [...document.querySelectorAll('.hd-bm-main select')].find(node => [...node.options].some(option => option.value === '9')); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, '9'); node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await setInput('.hd-bm-main input[type="date"]', '2099-12-20');
    await browser.evaluate(`(() => { const node = document.querySelectorAll('.hd-bm-main input[type="date"]')[1]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(node, '2099-12-21'); node.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await setInput('.hd-bm-main input[type="email"]', 'guest@example.test'); await setInput('.hd-bm-main input[inputmode="numeric"]', '9123456789');
    await browser.evaluate(`document.querySelector('.hd-bm-policies input[type="checkbox"]').click()`);
    await browser.click('Confirm Booking');
    await browser.waitFor(`location.pathname === '/bookings' && document.body.textContent.includes('GCash · direct to owner')`);
    const body = JSON.parse(browser.writes.filter(item => new URL(item.url).pathname === '/api/bookings/hotels').at(-1).postData);
    assert.equal(body.payment_method, 'gcash'); assert.equal(body.payment_handling, 'external'); assert.equal(body.pay_now, false); assert.equal(body.quoted_total, 500);
    assert.ok(body.booking_key); assert.equal(body.card_last4, null);
    assert.ok(!await browser.evaluate(`[...document.querySelectorAll('button')].some(node => /^(Complete payment|Resume payment|Pay balance|Check payment status|Receipt)$/.test(node.textContent.trim()))`));
    await browser.click('Message property'); await browser.waitFor(`document.querySelector('[aria-label="Booking conversation"]')`);
    const sentBefore = messages.length;
    await browser.click('Ask for GCash QR / number');
    assert.match(await browser.evaluate(`document.querySelector('[role="dialog"] textarea').value`), /booking #88.*GCash QR code or number/);
    assert.equal(messages.length, sentBefore, 'shortcut fills an editable draft, never sends automatically');
    for (const width of [320, 393, 768]) {
      await browser.viewport(width); await browser.evaluate(`document.documentElement.dataset.theme='dark'`);
      assert.ok(await browser.evaluate(`(() => { const dialog=document.querySelector('[role="dialog"]'), r=dialog.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && dialog.scrollWidth<=dialog.clientWidth+1; })()`), `manual GCash dialog overflows at ${width}`);
    }
    await browser.click('Send message'); await browser.waitFor(`document.querySelector('[role="dialog"] textarea')?.value === ''`); await browser.click('Close');
    assert.equal(bookings[0].status, 'pending'); assert.equal(bookings[0].payment_status, 'unpaid');

    await browser.viewport(1280); role = 'owner'; await browser.navigate('/owner/bookings'); await browser.waitFor(`document.querySelector('.gov-table tbody')?.textContent.includes('GCash')`);
    assert.match(await browser.evaluate(`document.querySelector('.gov-table tbody').textContent`), /GCash · direct to owner/);
    await browser.click('View details'); await browser.waitFor(`document.querySelector('[role="dialog"]')?.textContent.includes('Reservation #88')`);
    assert.match(await browser.evaluate(`document.querySelector('[role="dialog"]').textContent`), /GCash.*not processed or verified/s); await browser.click('Close');
    await browser.click('Message guest'); await browser.waitFor(`document.querySelector('[aria-label="Booking conversation"]')`);
    assert.match(await browser.evaluate(`document.querySelector('[role="dialog"]').textContent`), /The guest chose GCash/);
    await setInput('[role="dialog"] textarea', 'Fixture GCash number: 09171234567. Confirm the recipient name and amount with us before sending.');
    await browser.click('Send message'); await browser.waitFor(`document.querySelector('[role="dialog"] textarea')?.value === ''`); await browser.click('Close');
    assert.equal(bookings[0].payment_status, 'unpaid');

    role = 'admin'; await browser.navigate('/admin'); await browser.waitFor(`document.querySelector('.gov-nav')`); await browser.click('Bookings'); await browser.waitFor(`document.querySelector('.gov-table tbody')?.textContent.includes('GCash · direct to owner')`);
    role = 'user'; await browser.navigate('/bookings'); await browser.waitFor(`document.body.textContent.includes('GCash · direct to owner')`);
    await browser.click('Message property'); await browser.waitFor(`document.querySelector('[aria-label="Booking conversation"]')?.textContent.includes('09171234567')`); await browser.click('Close');
    await browser.navigate('/hotels/payment/88'); await browser.waitFor(`document.body.textContent.includes('Online payments are unavailable')`);
    assert.deepEqual(financialWrites(), []); assert.equal(JSON.stringify(historicalPayments), originalPaymentHistory); assert.deepEqual(browser.errors, []);
  } finally { hotel.allowed_payment_methods = ['card', 'qrph']; policy = { ...policy, online_payments_enabled: false }; }
});
