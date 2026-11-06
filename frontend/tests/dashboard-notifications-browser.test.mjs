import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 25000 };
const hotel = { hotel_id: 46, name: 'Notification Fixture Inn', location: 'Naujan', description: 'Fixture property', is_active: 1, rooms_total: 2, currency: 'PHP', image_urls: [], allowed_payment_methods: ['pay_at_property'], check_in_time: '14:00', check_out_time: '12:00' };
const seed = userId => [
  { notification_id: userId * 100 + 1, user_id: userId, title: `${userId === 7 ? 'Owner' : 'Admin'} booking alert`, message: 'A saved booking needs review.', type: 'booking', related_id: 88, is_read: '0', created_at: '2026-11-06T00:00:00Z' },
  { notification_id: userId * 100 + 2, user_id: userId, title: 'Earlier payment update', message: '<img src=x onerror=alert(1)> is plain text, not HTML.', type: 'payment', is_read: 0, created_at: '2026-11-05T00:00:00Z' },
  { notification_id: userId * 100 + 3, user_id: userId, title: 'Earlier read alert', message: 'Retained activity history.', type: 'other', is_read: '1', created_at: null }
];
let browser, role = 'owner', authorization = 'full', failLoad = false, invalidLoad = false, failRead = false, heldRead = null;
const records = { 7: seed(7), 8: seed(8) };
const userId = () => role === 'admin' ? 8 : 7;
const notificationsButton = () => browser.evaluate(`document.querySelector('nav button[aria-label="Notifications"]').click()`);
const setFilter = value => browser.evaluate(`(() => { const node = document.querySelector('.dashboard-notifications select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('dashboard-notifications', async (request, url) => {
    const path = url.pathname, account = userId();
    if (path.endsWith('/auth/profile')) return { body: { user: { user_id: account, role, username: `${role}_fixture`, email_verified: true } } };
    if (path === '/api/messages/notifications') return failLoad ? { status: 503, body: { error: 'Fixture notifications unavailable.' } } : { body: invalidLoad ? { unexpected: true } : records[account] };
    if (path === '/api/messages/notifications/read-all' || /^\/api\/messages\/notifications\/\d+\/read$/.test(path)) {
      if (heldRead) await heldRead;
      if (failRead) return { status: 503, body: { error: 'Fixture read update failed.' } };
      const id = Number(path.split('/').at(-2));
      records[account].forEach(item => { if (path.endsWith('/read-all') || item.notification_id === id) item.is_read = 1; });
      return { body: { success: true } };
    }
    if (path === '/api/messages/messages') return { body: [{ message_id: 99, receiver_id: 7, sender_id: 3, sender_name: 'Fixture Guest', subject: 'Owner inquiry', message: 'Existing messaging is separate.', is_read: 1, created_at: '2026-11-05T00:00:00Z' }] };
    if (path === '/api/owner/profile') return { body: { authorization, businessProfile: { verification_status: authorization === 'full' ? 'verified' : 'pending' } } };
    if (path === '/api/owner/hotels') return { body: [hotel] };
    if (path === '/api/owner/rooms') return { body: [] };
    if (path.endsWith('/dashboard/stats')) return { body: { hotelCount: 1, bookingStats: {}, userStats: {}, recentBookings: [] } };
    if (path === '/api/bookings/policy') return { body: { online_payments_enabled: false, storage_ready: true } };
    if (path.endsWith('/analytics')) return { body: { monthlyTrends: [], dailyTrends: [] } };
    return { body: [] };
  });
  await browser.viewport(1280); await browser.navigate('/owner/property');
  await browser.waitFor(`document.querySelector('#owner-nav .dashboard-notification-badge')?.textContent === '2'`);
}, { timeout: 30000 });
after(async () => { await browser?.close(); });

test('owner sidebar has an unread badge before opening a dedicated notification URL, with filters and safe text', options, async () => {
  await notificationsButton(); await browser.waitFor(`location.pathname === '/owner/notifications' && document.querySelectorAll('.dashboard-notification').length === 3`);
  assert.equal(await browser.evaluate(`document.querySelector('#owner-nav [aria-current="page"]').getAttribute('aria-label')`), 'Notifications');
  assert.match(await browser.evaluate(`document.querySelector('.dashboard-notifications').textContent`), /latest 50|PHT|Date unavailable|<img src=x/);
  assert.equal(await browser.evaluate(`document.querySelector('.dashboard-notifications img')`), null);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.dashboard-notifications').textContent`), /Admin booking alert|Existing messaging is separate/);
  await setFilter('unread'); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 2`);
  await browser.input('Search notifications', 'Earlier payment'); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 1`);
  await browser.click('Mark as read'); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 0 && document.querySelector('#owner-nav .dashboard-notification-badge')?.textContent === '1'`);
  await browser.input('Search notifications', ''); await setFilter('all');
  assert.equal(records[7].length, 3); assert.equal(records[8].filter(item => !Number(item.is_read)).length, 2);
});

test('failed reads retain unread alerts; mark-all is retryable and single-flight without deleting records', options, async () => {
  failRead = true; await browser.click('Mark as read'); await browser.waitFor(`document.querySelector('.dashboard-notifications [role="alert"]')`);
  assert.equal(await browser.evaluate(`document.querySelectorAll('.dashboard-notification.is-unread').length`), 1);
  assert.equal(records[7][0].is_read, '0');
  failRead = false;
  let release;
  heldRead = new Promise(resolve => { release = resolve; });
  const before = browser.writes.filter(item => new URL(item.url).pathname.endsWith('/notifications/read-all')).length;
  try {
    await browser.evaluate(`(() => { const button = [...document.querySelectorAll('.dashboard-notifications button')].find(node => node.textContent === 'Mark all read'); button.click(); button.click(); })()`);
    await browser.waitFor(`document.querySelector('.dashboard-notifications').textContent.includes('Marking all read')`);
    assert.ok(await browser.evaluate(`[...document.querySelectorAll('.dashboard-notifications-tools button')].every(node => node.disabled)`));
  } finally { heldRead = null; release(); }
  await browser.waitFor(`!document.querySelector('#owner-nav .dashboard-notification-badge') && document.querySelectorAll('.dashboard-notification.is-unread').length === 0`);
  assert.ok(await browser.evaluate(`[...document.querySelectorAll('.dashboard-notifications-tools button')].some(node => node.textContent === 'Mark all read' && !node.disabled)`), 'older unread notifications may exist beyond the latest 50');
  assert.equal(browser.writes.filter(item => new URL(item.url).pathname.endsWith('/notifications/read-all')).length - before, 1);
  assert.equal(records[7].length, 3); assert.equal(records[8].filter(item => !Number(item.is_read)).length, 2);
});

test('owner notification links preserve Messages and reservation navigation, including Back/reload and draft guards', options, async () => {
  await browser.click('Open Reservations'); await browser.waitFor(`location.pathname === '/owner/bookings'`);
  await browser.evaluate('history.back()'); await browser.waitFor(`document.querySelector('[aria-label="Account notifications"]')`);
  await browser.reload(); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 3`);
  await browser.click('Messages'); await browser.waitFor(`document.querySelector('.gov-main').textContent.includes('Existing messaging is separate')`);
  assert.equal(await browser.evaluate(`document.querySelector('[aria-label="Account notifications"]')`), null);
  await browser.click('My Property'); await browser.waitFor(`document.querySelector('.owner-starting-price')`); await browser.click('Edit details'); await browser.input('Hotel Name', 'Unsaved property');
  await notificationsButton(); await browser.waitFor(`document.querySelector('[role="dialog"]')`); await browser.click('Keep editing');
  assert.equal(await browser.evaluate('location.pathname'), '/owner/property');
  await notificationsButton(); await browser.click('Discard changes'); await browser.waitFor(`location.pathname === '/owner/notifications'`);
});

test('initial and malformed load failures are retryable, and transient failures retain real earlier data', options, async () => {
  failLoad = true; await browser.navigate('/owner/notifications'); await browser.waitFor(`document.querySelector('.dashboard-notifications [role="alert"]')`);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.dashboard-notifications').textContent`), /No notifications yet/);
  invalidLoad = true; failLoad = false; await browser.click('Retry notifications');
  await browser.waitFor(`document.querySelector('.dashboard-notifications [role="alert"]')?.textContent.includes('Could not load notifications')`);
  invalidLoad = false; await browser.click('Retry notifications'); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 3`);
  failLoad = true; await browser.click('Refresh notifications'); await browser.waitFor(`document.querySelector('.dashboard-notifications [role="alert"]')`);
  assert.equal(await browser.evaluate(`document.querySelectorAll('.dashboard-notification').length`), 3);
  assert.match(await browser.evaluate(`document.querySelector('.dashboard-notifications [role="alert"]').textContent`), /may be out of date/);
  failLoad = false; await browser.click('Retry notifications'); await browser.waitFor(`!document.querySelector('.dashboard-notifications [role="alert"]')`);
});

test('limited owners can read their account notifications without restricted module links, and focus refreshes badges', options, async () => {
  authorization = 'limited'; await browser.navigate('/owner/notifications'); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 3`);
  assert.ok(!await browser.evaluate(`[...document.querySelectorAll('.dashboard-notification-actions button')].some(node => node.textContent.startsWith('Open '))`));
  records[7].unshift({ notification_id: 799, user_id: 7, title: 'Fresh owner alert', message: 'Real fixture activity after refresh.', type: 'booking_message', is_read: 0 });
  await browser.evaluate(`window.dispatchEvent(new Event('focus'))`);
  await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 4 && document.querySelector('#owner-nav .dashboard-notification-badge')?.textContent === '1'`);
  authorization = 'full';
});

test('admin has account-scoped notifications and a grouped sidebar guide with every existing module retained', options, async () => {
  role = 'admin'; await browser.navigate('/admin/notifications'); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 3 && document.querySelector('#admin-nav .dashboard-notification-badge')?.textContent === '2' && document.querySelectorAll('.admin-nav-group').length === 4`);
  assert.deepEqual(await browser.evaluate(`[...document.querySelectorAll('.admin-nav-group strong')].map(node => node.textContent)`), ['Daily work', 'People & verification', 'Tourism content', 'Insights & system']);
  const labels = await browser.evaluate(`[...document.querySelectorAll('#admin-nav .gov-nav-btn__label')].map(node => node.textContent)`);
  assert.deepEqual(labels, ['Overview', 'Bookings', 'Payments', 'Notifications', 'Users', 'Business Verification', 'Hotels', 'Attractions', 'Itineraries', 'Maps', 'Reviews', 'Reports', 'Customization', 'Chatbot', 'Moderation', 'Archive', 'System Logs']);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.dashboard-notifications').textContent`), /Owner booking alert|Fresh owner alert/);
  await browser.click('Mark as read'); await browser.waitFor(`document.querySelector('#admin-nav .dashboard-notification-badge')?.textContent === '1'`);
  await browser.click('Open Bookings'); await browser.waitFor(`!document.querySelector('[aria-label="Account notifications"]') && document.querySelector('#admin-nav [aria-current="page"]')?.textContent === 'Bookings'`);
  await browser.evaluate('history.back()'); await browser.waitFor(`location.pathname === '/admin/notifications' && document.querySelector('[aria-label="Account notifications"]')`);
  await browser.reload(); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 3`);
  assert.equal(records[7][0].is_read, 0, 'admin reads cannot mark owner alerts');
});

test('notifications and sidebar guides fit mobile/dark mode and the admin drawer closes on Escape and navigation', options, async () => {
  for (const width of [320, 393, 768]) {
    await browser.viewport(width); await browser.evaluate(`document.documentElement.dataset.theme = 'dark'`);
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `admin notifications overflow at ${width}`);
    await browser.evaluate(`document.querySelector('.gov-menu-btn').click()`); await browser.waitFor(`document.querySelector('.gov-sidebar.is-open')`);
    await browser.evaluate(`new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))).then(() => Promise.all(document.querySelector('.gov-sidebar').getAnimations().map(animation => animation.finished.catch(() => {}))))`);
    assert.ok(await browser.evaluate(`(() => { const r = document.querySelector('.gov-sidebar').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })()`));
    await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    await browser.waitFor(`!document.querySelector('.gov-sidebar.is-open') && document.activeElement === document.querySelector('.gov-menu-btn')`);
    await browser.evaluate(`document.querySelector('.gov-menu-btn').click()`); await notificationsButton();
    await browser.waitFor(`!document.querySelector('.gov-sidebar.is-open')`);
  }
  role = 'owner'; await browser.navigate('/owner/notifications'); await browser.waitFor(`document.querySelectorAll('.dashboard-notification').length === 4`);
  for (const width of [320, 393, 768]) { await browser.viewport(width); assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `owner notifications overflow at ${width}`); }
  assert.ok(browser.writes.every(item => /^\/api\/messages\/notifications\/(?:\d+\/read|read-all)$/.test(new URL(item.url).pathname)));
  assert.deepEqual(browser.errors, []);
});
