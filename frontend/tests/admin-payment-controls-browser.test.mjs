import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 25000 };
const hotel = { id: 46, hotel_id: 46, name: 'Booking Fixture Inn', location: 'Naujan', pricePerNight: 500, price_per_night: 500, currency: 'PHP', amenities: [], images: [], image_urls: [], rooms_total: 2, rooms_available: 2, is_active: 1, booking_enabled: true, allowed_payment_methods: ['card', 'qrph'], allowed_payment_options: ['reservation'], reservation_fee: 100, check_in_time: '14:00', check_out_time: '12:00', payment_terms_text: 'OLD ADVANCE DEPOSIT LINE' };
const room = { room_id: 9, hotel_id: 46, room_type_name: 'Standard Queen', price_per_night: 500, currency: 'PHP', capacity: 2, quantity_available: 2, is_active: 1, image_urls: [], amenities: [], room_features: [] };
let browser, role = 'user', policy = { online_payments_enabled: false, storage_ready: true, lock_version: 1 }, messages = [], bookings = [], failSend = false;
const setInput = (selector, value) => browser.evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); if (!node) throw new Error('Input not found: ' + ${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('input', { bubbles: true })); })()`);
const setSelect = (selector, value) => browser.evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('admin-payment-controls', async (incoming, url) => {
    const path = url.pathname, body = JSON.parse(incoming.postData || '{}');
    if (path.endsWith('/auth/profile')) return { body: { user: { user_id: role === 'user' ? 1 : 7, role, username: 'Fixture Guest', email: 'guest@example.test', phone: '+639123456789', email_verified: true } } };
    if (path === '/api/bookings/policy' || path === '/api/admin/booking-policy' && incoming.method === 'GET') return { body: policy };
    if (path === '/api/admin/booking-policy' && incoming.method === 'PUT') { policy = { ...policy, online_payments_enabled: body.online_payments_enabled, lock_version: policy.lock_version + 1 }; return { body: policy }; }
    if (path === '/api/hotels') return { body: { data: [hotel] } };
    if (path === '/api/hotels/46/rooms' || path === '/api/owner/rooms') return { body: [room] };
    if (path === '/api/hotels/46/average-rating') return { body: { average_rating: null, total_reviews: 0 } };
    if (path.endsWith('/calendar')) return { body: { days: [] } };
    if (path === '/api/bookings/hotels' && incoming.method === 'POST') {
      const booking = { ...body, booking_id: 88, hotel_id: 46, hotel_name: hotel.name, room_type_name: room.room_type_name, status: 'pending', total_amount: body.quoted_total, currency: 'PHP', check_in_at: `${body.check_in} 14:00:00`, check_out_at: `${body.check_out} 12:00:00`, payment_status: 'unpaid', amount_paid: null, balance_due: null, expires_at: null, created_at: '2026-11-06T00:00:00Z', policy_snapshot: { payment_handling: 'external', payment_arrangement: 'pay_at_property' } };
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
    if (path === '/api/bookings/hotels' || path === '/api/owner/bookings') return { body: bookings };
    if (path === '/api/owner/hotels') return { body: [hotel] };
    if (path === '/api/owner/profile') return { body: { authorization: 'full', businessProfile: { verification_status: 'verified' } } };
    if (path.endsWith('/dashboard/stats')) return { body: { hotelCount: 1, bookingStats: {}, userStats: {}, recentBookings: [] } };
    if (path.endsWith('/payments/stats')) return { body: {} };
    return { body: [] };
  });
  await browser.viewport(1280); await browser.navigate('/hotels/46'); await browser.waitFor(`document.querySelector('.hd-cta')`);
}, { timeout: 30000 });
after(async () => { await browser?.close(); });

test('normal booking form remains: saving goes directly to My Bookings with no checkout or separate request module', options, async () => {
  await browser.evaluate(`document.querySelector('.hd-cta').click()`); await browser.waitFor(`document.querySelector('.hd-bm-policies')`);
  assert.equal(await browser.evaluate(`document.querySelector('#hd-bm-pay-method')`), null);
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
  assert.match(await browser.evaluate('document.body.textContent'), /Bookings remain available in the existing Reservations module/);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Payment plan settings"]')`), null);
  role = 'admin'; await browser.navigate('/admin/payments'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"] fieldset:not([disabled])')`);
  await setSelect('[aria-label="Platform payment policy"] select', 'on'); await browser.click('Save platform policy'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"] [role="alert"]')`);
  await setInput('[aria-label="Platform payment policy"] textarea', 'Client authorized gateway processing.'); await browser.click('Save platform policy'); assert.equal(policy.online_payments_enabled, false);
  await browser.evaluate(`document.querySelector('.booking-policy-checkbox input').click()`); await browser.click('Save platform policy'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"] [role="status"]')`); assert.equal(policy.online_payments_enabled, true);
  await setSelect('[aria-label="Platform payment policy"] select', 'off'); await setInput('[aria-label="Platform payment policy"] textarea', 'Keep payments outside the platform.'); await browser.click('Save platform policy'); await browser.waitFor(`document.querySelector('[aria-label="Platform payment policy"]').textContent.includes('Online payments OFF')`);
  assert.equal(bookings.length, 1); assert.equal(bookings[0].status, 'confirmed'); assert.deepEqual(browser.errors, []);
});
