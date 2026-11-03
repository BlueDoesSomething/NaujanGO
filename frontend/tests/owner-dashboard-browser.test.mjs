import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';
import { philippineToday } from '../src/utils/stayBooking.js';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and installed Chromium', timeout: 20000 };
const originalHotel = { hotel_id: 46, name: 'Owner Fixture Inn', location: 'Naujan', description: 'Owner description', currency: 'PHP', price_per_night: '0.00',
  rating: null, image_urls: [], is_active: 1, booking_enabled: true, rooms_total: 5, rooms_available: 5, contact_email: 'stay@example.test',
  check_in_time: '13:00', check_out_time: '12:00', cancellation_type: 'non_refundable', free_cancellation_days: 1,
  balance_due_days: 1, allowed_payment_methods: ['pay_at_property'], allowed_payment_options: ['full'], reservation_fee: null };
const originalRoom = { room_id: 7, hotel_id: 46, room_type_name: 'Standard Queen', capacity: 2, price_per_night: 450, currency: 'PHP',
  quantity_available: 5, is_active: 1, amenities: [], image_urls: [], room_features: [], check_in_time: '13:00', check_out_time: '12:00' };
let hotels = [{ ...originalHotel }], rooms = [{ ...originalRoom }], failLoad = false, failCancel = false, failCalendar = false;
const booking = { booking_id: 85, hotel_id: 46, hotel_name: originalHotel.name, customer_name: 'Fixture Guest', customer_email: 'guest@example.test', customer_phone: '09123456789',
  room_type_name: 'Standard Queen', rooms: 1, guests: 2, check_in: philippineToday(), check_out: '2099-12-21', status: 'confirmed',
  payment_status: 'partial', total_amount: 450, amount_paid: 100, balance_due: 350, currency: 'EUR', special_requests: 'Quiet room please',
  policy_snapshot: { custom_policy_text: 'Frozen original terms', cancellation_type: 'non_refundable' } };
let browser;
const fields = request => {
  if ((request.headers['Content-Type'] || request.headers['content-type'] || '').includes('application/json')) return JSON.parse(request.postData || '{}');
  return Object.fromEntries([...String(request.postData || '').matchAll(/name="([^"]+)"\r\n\r\n([^]*?)(?=\r\n--)/g)].map(match => [match[1], match[2]]));
};
before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('owner-dashboard', async (request, url) => {
    if (url.pathname.endsWith('/auth/profile')) return { body: { user: { user_id: 7, username: 'fixture_owner', role: 'owner', email_verified: true } } };
    if (url.pathname === '/api/owner/profile') return { body: { authorization: 'full', businessProfile: { verification_status: 'verified' } } };
    if (url.pathname === '/api/owner/hotels' && request.method === 'GET') return failLoad ? { status: 500, body: { error: 'Fixture load failure' } } : { body: hotels };
    if (url.pathname === '/api/owner/rooms' || url.pathname === '/api/owner/hotels/46/rooms' && request.method === 'GET') return { body: rooms };
    if (url.pathname === '/api/owner/hotels/46' && request.method === 'PUT') { Object.assign(hotels[0], fields(request)); return { body: { success: true } }; }
    if (url.pathname === '/api/owner/hotels/46/rooms/7' && request.method === 'PUT') { Object.assign(rooms[0], fields(request)); return { body: { success: true } }; }
    if (url.pathname === '/api/owner/hotels/upload') return { body: { url: '/uploads/hotels/staged-fixture.png' } };
    if (url.pathname === '/api/owner/hotels/46/availability' && failCalendar) return { status: 500, body: { error: 'Fixture calendar load failed' } };
    if (url.pathname === '/api/owner/hotels' && request.method === 'POST') { hotels = [{ ...originalHotel, ...fields(request) }]; return { body: { hotel_id: 46 } }; }
    if (url.pathname === '/api/owner/dashboard/stats') return { body: { hotelCount: hotels.length, bookingStats: { total_bookings: 1, confirmed: 1 }, recentBookings: [booking] } };
    if (url.pathname === '/api/owner/bookings') return { body: [booking] };
    if (url.pathname === '/api/owner/bookings/85/status') {
      if (failCancel) return { status: 500, body: { error: 'Fixture action failed; record retained.' } };
      booking.status = fields(request).status; return { body: { success: true } };
    }
    if (url.pathname.endsWith('/payments/stats')) return { body: { currency: 'EUR', currency_count: 1, historical: { currency: 'EUR', currency_count: 1 } } };
    return { body: [] };
  });
  await browser.viewport(1280);
  await browser.navigate('/owner/property');
  await browser.waitFor(`document.querySelector('#owner-nav')`);
}, { timeout: 30000 });
after(async () => { await browser?.close(); });

test('property uses room-based starting prices and dedicated routes survive Back and reload', options, async () => {
  assert.match(await browser.evaluate(`document.querySelector('.owner-starting-price').textContent`), /From ₱450\/night/);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.gov-main').textContent`), /₱0\.00\/night|5\.0/);
  assert.equal(await browser.evaluate(`document.querySelector('a[href="/hotels/46"]').target`), '_blank');
  await browser.click('Rooms & Rates');
  await browser.waitFor(`location.pathname === '/owner/rooms' && document.querySelector('.owner-room-table')`);
  await browser.click('Payments');
  await browser.waitFor(`location.pathname === '/owner/payments'`);
  await browser.evaluate('history.back()');
  await browser.waitFor(`location.pathname === '/owner/rooms' && document.querySelector('.owner-room-table')`);
  await browser.reload();
  await browser.waitFor(`document.querySelector('.owner-room-table')`);
  assert.equal(await browser.evaluate('location.pathname'), '/owner/rooms');
});

test('zero configured room inventory persists and room edits have a discard guard', options, async () => {
  await browser.click('Edit room');
  await browser.input('Rooms of this type offered', '0');
  await browser.click('My Property');
  await browser.waitFor(`document.querySelector('[role="dialog"]')`);
  assert.equal(await browser.evaluate('location.pathname'), '/owner/rooms');
  await browser.click('Keep editing');
  await browser.click('Save Changes');
  await browser.waitFor(`!document.querySelector('.rm-form') && document.querySelector('.owner-room-table')`);
  assert.equal(rooms[0].quantity_available, '0');
  await browser.click('Edit room');
  await browser.input('Room Type Name', 'Unsaved room');
  await browser.evaluate(`(() => { const input = document.querySelector('.rm-form input[type="file"]'); const transfer = new DataTransfer(); transfer.items.add(new File(['fixture'], 'room.png', { type: 'image/png' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  const photoPreview = await browser.evaluate(`document.querySelector('img[alt="New 1"]').src`);
  await browser.evaluate('history.back()');
  await browser.waitFor(`document.querySelector('[role="dialog"] button:not([disabled])')`);
  assert.equal(await browser.evaluate('location.pathname'), '/owner/rooms');
  await browser.click('Keep editing');
  await browser.waitFor(`document.querySelector('.rm-form input') && !document.querySelector('[role="dialog"]')`);
  assert.equal(await browser.evaluate(`document.querySelector('.rm-form input').value`), 'Unsaved room');
  assert.equal(await browser.evaluate(`document.querySelector('img[alt="New 1"]').src`), photoPreview);
  await browser.evaluate('history.forward()');
  await browser.waitFor(`document.querySelector('[role="dialog"] button:not([disabled])')`);
  await browser.click('Keep editing');
  await browser.waitFor(`document.querySelector('.rm-form input') && !document.querySelector('[role="dialog"]')`);
  assert.equal(await browser.evaluate('location.pathname'), '/owner/rooms');
  assert.equal(await browser.evaluate(`document.querySelector('.rm-form input').value`), 'Unsaved room');
  assert.equal(await browser.evaluate(`document.querySelector('img[alt="New 1"]').src`), photoPreview);
  await browser.click('Back to room list');
  await browser.click('Discard changes');
  await browser.waitFor(`!document.querySelector('.rm-form') && !document.querySelector('[role="dialog"]')`);
  await browser.click('Edit room');
  assert.equal(await browser.evaluate(`document.querySelector('.rm-form input').value`), originalRoom.room_type_name);
  assert.equal(await browser.evaluate(`document.querySelector('img[alt="New 1"]')`), null);
  await browser.click('Back to room list');
  await browser.click('Edit room'); await browser.input('Room Type Name', 'Discard on Back');
  await browser.evaluate('history.back()');
  await browser.waitFor(`document.querySelector('[role="dialog"] button:not([disabled])') && location.pathname === '/owner/rooms'`);
  await browser.click('Discard changes');
  await browser.waitFor(`location.pathname === '/owner/property' && document.querySelector('.owner-starting-price')`);
  await browser.evaluate('history.forward()');
  await browser.waitFor(`location.pathname === '/owner/rooms' && document.querySelector('.owner-room-table')`);
  assert.equal(await browser.evaluate(`document.querySelector('.rm-form')`), null);
});

test('property validation retains drafts, hides redundant price/rating, and sections keep edits', options, async () => {
  await browser.click('My Property'); await browser.waitFor(`document.querySelector('.owner-starting-price')`);
  await browser.click('Edit details');
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.owner-property-editor').textContent`), /Rating \(0|Fallback starting price/);
  const before = browser.writes.length;
  await browser.input('Hotel Name', ''); await browser.click('Save Changes');
  await browser.waitFor(`document.querySelector('.owner-field-error')`);
  assert.equal(browser.writes.length, before);
  await browser.input('Hotel Name', 'Updated property name');
  await browser.click('Policies & House Rules'); await browser.click('Details & Contact');
  assert.equal(await browser.evaluate(`document.querySelector('.owner-property-editor input').value`), 'Updated property name');
  await browser.click('Cancel'); await browser.click('Discard changes');
  await browser.waitFor(`!document.querySelector('.owner-property-editor')`);
  assert.equal(hotels[0].name, originalHotel.name);
});

test('reservation details retain historical policies and cancellation is explicit and retryable', options, async () => {
  await browser.click('Reservations'); await browser.waitFor(`document.querySelector('.gov-table tbody tr')`);
  assert.match(await browser.evaluate(`document.querySelector('.gov-main table').textContent`), /€450/);
  await browser.click('View details');
  assert.match(await browser.evaluate(`document.querySelector('[role="dialog"]').textContent`), /Frozen original terms/);
  assert.match(await browser.evaluate(`document.querySelector('[role="dialog"]').textContent`), /Quiet room please/);
  await browser.click('Cancel reservation…');
  const before = browser.writes.filter(request => new URL(request.url).pathname.endsWith('/85/status')).length;
  await browser.click('Keep current status');
  assert.equal(browser.writes.filter(request => new URL(request.url).pathname.endsWith('/85/status')).length, before);
  await browser.click('Cancel reservation…');
  failCancel = true;
  await browser.click('Yes, cancel reservation');
  await browser.waitFor(`document.querySelector('[role="dialog"] [role="alert"]')`);
  assert.equal(booking.status, 'confirmed');
  failCancel = false;
  await browser.click('Yes, cancel reservation');
  await browser.waitFor(`!document.querySelector('[role="dialog"]')`);
  assert.equal(booking.status, 'cancelled');
  assert.equal(booking.amount_paid, 100); assert.equal(booking.policy_snapshot.custom_policy_text, 'Frozen original terms');
});

test('failed initial loads show Retry rather than a fabricated empty property list', options, async () => {
  failLoad = true;
  await browser.navigate('/owner/property');
  await browser.waitFor(`document.querySelector('.owner-load-failure')`);
  assert.doesNotMatch(await browser.evaluate('document.body.textContent'), /No hotels yet|No reservations yet/);
  failLoad = false; await browser.click('Retry dashboard');
  await browser.waitFor(`document.querySelector('.owner-starting-price')`);
});

test('payment setup is separate from the ledger and warns before discarding plan changes', options, async () => {
  await browser.click('Payment Setup');
  await browser.waitFor(`document.querySelector('[aria-label="Payment plan settings"]')`);
  await browser.evaluate(`(() => { const label = [...document.querySelectorAll('[aria-label="Payment plan settings"] label')].find(node => node.textContent.includes('Half payment')); label.querySelector('input').click(); })()`);
  await browser.click('Payments');
  await browser.waitFor(`document.querySelector('[role="dialog"]')`);
  assert.equal(await browser.evaluate('location.pathname'), '/owner/payment-setup');
  await browser.click('Keep editing');
  await browser.evaluate('history.back()');
  await browser.waitFor(`document.querySelector('[role="dialog"] button:not([disabled])')`);
  await browser.click('Keep editing');
  assert.equal(await browser.evaluate(`[...document.querySelectorAll('[aria-label="Payment plan settings"] label')].find(node => node.textContent.includes('Half payment')).querySelector('input').checked`), true);
  await browser.click('Save Payment Plans');
  await browser.waitFor(`document.querySelector('[aria-label="Payment plan settings"] [role="status"]')`);
  assert.deepEqual(hotels[0].allowed_payment_options.sort(), ['full', 'half']);
  await browser.click('Payments'); await browser.waitFor(`location.pathname === '/owner/payments'`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Payment plan settings"]') === null`), true);
  assert.equal(hotels[0].price_per_night, '0.00', 'payment configuration must not change room or fallback rates');
});

test('new properties stage photo uploads before creation and do not require a duplicate nightly price', options, async () => {
  hotels = []; rooms = [];
  await browser.navigate('/owner/property'); await browser.waitFor(`document.querySelector('#owner-nav')`);
  await browser.evaluate(`[...document.querySelectorAll('.gov-main button')].find(button => /Add.*Hotel|Add.*Property/i.test(button.textContent)).click()`);
  await browser.input('Hotel Name', 'New property'); await browser.input('Location', 'Naujan');
  await browser.click('Photos');
  await browser.evaluate(`(() => { const input = document.querySelector('.owner-property-editor input[type="file"]'); const transfer = new DataTransfer(); transfer.items.add(new File(['fixture'], 'fixture.png', { type: 'image/png' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await browser.waitFor(`document.querySelector('.owner-property-editor img[alt="Gallery"]')`);
  assert.equal(hotels.length, 0, 'upload must not attach to a property before Create');
  assert.ok(browser.writes.some(request => new URL(request.url).pathname.endsWith('/owner/hotels/upload')));
  assert.ok(!browser.writes.some(request => /\/gallery$/.test(request.url)));
  await browser.click('Create Hotel');
  await browser.waitFor(`!document.querySelector('.owner-property-editor') && document.querySelector('.owner-starting-price')`);
  assert.equal(hotels[0].name, 'New property'); assert.equal(hotels[0].price_per_night, 0);
  assert.deepEqual(hotels[0].image_urls, ['/uploads/hotels/staged-fixture.png']);
});

test('mobile property editing and confirmation stay inside the viewport', options, async () => {
  for (const width of [320, 393, 768]) {
    await browser.viewport(width);
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `property overflows at ${width}`);
    await browser.click('Edit details');
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `editor overflows at ${width}`);
    await browser.input('Hotel Name', 'Unsaved mobile name');
    await browser.click('Cancel'); await browser.waitFor(`document.querySelector('[role="dialog"]')`);
    assert.ok(await browser.evaluate(`(() => { const rect = document.querySelector('[role="dialog"]').getBoundingClientRect(); return rect.left >= 0 && rect.right <= innerWidth; })()`));
    await browser.click('Discard changes'); await browser.waitFor(`!document.querySelector('.owner-property-editor')`);
  }
  assert.deepEqual(browser.errors, []);
});

test('mobile room inventory and date limits fit, with single-property selection automatic', options, async () => {
  rooms = [{ ...originalRoom }];
  await browser.navigate('/owner/availability');
  await browser.waitFor(`document.querySelector('.owner-availability-grid')`);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.gov-main').textContent`), /Select a Hotel to Manage|Back to Hotel Selection/);
  for (const width of [320, 393, 768]) {
    await browser.viewport(width);
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `calendar overflows at ${width}`);
  }
  await browser.navigate('/owner/rooms'); await browser.waitFor(`document.querySelector('.owner-room-table')`);
  await browser.viewport(320);
  assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'));
  await browser.click('Edit room');
  assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'));
  await browser.click('Back to room list');
  assert.deepEqual(browser.errors, []);
});

test('calendar failures do not show false availability, and saving one draft keeps the other dirty', options, async () => {
  failCalendar = true;
  await browser.navigate('/owner/availability');
  await browser.waitFor(`document.querySelector('.owner-error')`);
  assert.equal(await browser.evaluate(`document.querySelector('.owner-availability-grid')`), null);
  failCalendar = false; await browser.click('Retry calendar');
  await browser.waitFor(`document.querySelector('.owner-availability-grid')`);
  await browser.evaluate(`document.querySelector('.gov-main details').open = true`);
  await browser.input('Property-wide capacity cap', '4');
  await browser.evaluate(`document.querySelector('.owner-availability-grid [role="button"][aria-disabled="false"]').click()`);
  await browser.input('Capacity limit for these dates', '2');
  await browser.click('Save Changes');
  await browser.waitFor(`document.querySelector('.owner-notice')?.textContent.includes('Date limits saved')`);
  await browser.click('Rooms & Rates'); await browser.waitFor(`document.querySelector('[role="dialog"]')`);
  await browser.click('Keep editing');
  assert.equal(await browser.evaluate(`[...document.querySelectorAll('label')].find(node => node.textContent.trim().startsWith('Property-wide capacity cap')).querySelector('input').value`), '4');
  await browser.input('Capacity limit for these dates', '3');
  await browser.click('Save Capacity Limits');
  await browser.waitFor(`document.querySelector('.owner-notice')?.textContent.includes('Property capacity limits saved')`);
  await browser.click('Rooms & Rates'); await browser.waitFor(`document.querySelector('[role="dialog"]')`);
  await browser.click('Keep editing');
  assert.equal(await browser.evaluate(`[...document.querySelectorAll('label')].find(node => node.textContent.trim().startsWith('Capacity limit for these dates')).querySelector('input').value`), '3');
  await browser.click('Rooms & Rates'); await browser.click('Discard changes');
  await browser.waitFor(`document.querySelector('.owner-room-table')`);
});

test('dark-mode help, room actions and property guidance keep readable contrast', options, async () => {
  await browser.viewport(1280);
  await browser.evaluate(`document.documentElement.dataset.theme = 'dark'; Promise.all(document.getAnimations().filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})))`);
  const contrast = async (selector, surface) => {
    const colors = await browser.evaluate(`({ foreground: getComputedStyle(document.querySelector(${JSON.stringify(selector)})).color, background: getComputedStyle(document.querySelector(${JSON.stringify(surface)})).backgroundColor })`);
    const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255)
      .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const values = [luminance(colors.foreground), luminance(colors.background)].sort((a, b) => b - a);
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${selector}: ${JSON.stringify(colors)}`);
  };
  await contrast('.owner-help', '.gov-table-wrap');
  await contrast('.owner-room-table .rm-btn-ghost', '.owner-room-table .rm-btn-ghost');
  await contrast('.owner-room-toolbar .rm-btn-primary', '.owner-room-toolbar .rm-btn-primary');
  await browser.click('My Property'); await browser.waitFor(`document.querySelector('.owner-property-guidance')`);
  await contrast('.owner-property-guidance', '.owner-property-guidance');
  await browser.click('Edit details');
  await contrast('.owner-editor-section-title', '.owner-editor-surface');
  await contrast('.owner-editor-body label > span', '.owner-editor-surface');
  await browser.click('Cancel');
  assert.deepEqual(browser.errors, []);
});
