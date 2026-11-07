import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';
import { profileCredentials, serializeCredentialProfile } from '../../backend/utils/businessCredentials.js';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 25000 };
const original = { id: 10, owner_id: 5, business_name: 'Credential Fixture Inn', verification_status: 'verified', business_email: 'fixture@example.test', registration_authority: 'DTI',
  registration_no: 'REG-PRIVATE', registration_expiry: '2099-12-31', registration_file: '/uploads/permits/registration.pdf', business_permit_no: 'LGU-LEGACY', business_permit_expiry: '2020-12-31', business_permit_file: '/uploads/permits/lgu.pdf',
  sanitary_permit_no: 'SAN-OLD', sanitary_permit_expiry: '2099-12-31', sanitary_permit_file: '/uploads/permits/sanitary.pdf', dot_no: 'DOT-PRIVATE', dot_expiry: '2099-12-31', dot_file: '/uploads/permits/dot.pdf', philgeps_no: 'PHIL-OPTIONAL' };
let ownerProfile = { ...original }, adminProfiles = [{ ...original }, { ...original, id: 11, owner_id: 6, business_name: 'Sanitary Expired Inn', business_permit_expiry: '2099-12-31', sanitary_permit_expiry: '2020-12-31' }];
let browser, role = 'owner', failFlag = false, failLoad = false, flagWrites = 0, sidebarBefore, sidebarThemeBefore, includePublicCredentials = true;
const hotel = { id: 8, hotel_id: 8, name: original.business_name, location: 'Naujan', pricePerNight: 500, price_per_night: 500, currency: 'PHP', amenities: [], images: [], image_urls: [], rooms_total: 2, rooms_available: 2, is_active: 1, booking_enabled: true, allowed_payment_methods: [], check_in_time: '14:00', check_out_time: '12:00' };
const input = (selector, value) => browser.evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`);
const selectFilter = (label, value) => browser.evaluate(`(() => { const node = [...document.querySelectorAll('.credential-filters label')].find(node => node.textContent.startsWith(${JSON.stringify(label)})).querySelector('select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
const sidebarStyles = () => browser.evaluate(`(() => { const sidebar = getComputedStyle(document.querySelector('.gov-sidebar')), nav = getComputedStyle(document.querySelector('#admin-nav')); return { width: sidebar.width, position: sidebar.position, padding: sidebar.padding, background: sidebar.backgroundColor, border: sidebar.border, navDisplay: nav.display, navDirection: nav.flexDirection, navGap: nav.gap, labels: [...document.querySelectorAll('#admin-nav .gov-nav-btn__label')].map(node => node.textContent) }; })()`);
const captureLayout = async name => {
  if (!process.env.CREDENTIAL_LAYOUT_SCREENSHOTS) return;
  const result = await browser.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const directory = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();
  await writeFile(path.join(directory, `credential-layout-${name}.png`), Buffer.from(result.data, 'base64'));
};
before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('business-credentials', async (request, url) => {
    const path = url.pathname, body = request.postData?.startsWith('{') ? JSON.parse(request.postData) : {};
    if (path.endsWith('/auth/profile')) return { body: { user: { user_id: role === 'admin' ? 1 : 5, role, username: 'credential_fixture', email: 'fixture@example.test', email_verified: true } } };
    if (path === '/api/bookings/policy') return { body: { online_payments_enabled: false, storage_ready: true } };
    if (path === '/api/owner/profile' && request.method === 'GET') return { body: { authorization: ownerProfile.verification_status === 'verified' ? 'full' : 'limited', businessProfile: serializeCredentialProfile(ownerProfile) } };
    if (path === '/api/owner/profile' && request.method === 'PUT') { ownerProfile = { ...ownerProfile, ...body, verification_status: 'pending' }; return { body: { success: true } }; }
    if (path === '/api/owner/profile/upload') {
      const field = request.postData.match(/name="field"\r\n\r\n([^\r]+)/)?.[1];
      if (!field) throw new Error('Missing upload field');
      const url = `/uploads/permits/uploaded-${field}.jpg`; ownerProfile[field] = url; ownerProfile.verification_status = 'pending'; return { body: { url } };
    }
    if (path === '/api/admin/business-profiles') return failLoad ? { status: 503, body: { error: 'Fixture credential storage unavailable.' } } : { body: { success: true, data: adminProfiles.map(serializeCredentialProfile) } };
    const flag = path.match(/^\/api\/admin\/business-profiles\/(\d+)\/credentials\/([^/]+)\/flag$/);
    if (flag) {
      flagWrites += 1;
      if (failFlag) return { status: 503, body: { error: 'Fixture flag save failed; reason retained.' } };
      const profile = adminProfiles.find(profile => profile.id === Number(flag[1]));
      profile.credential_flags = { ...(profile.credential_flags || {}), [flag[2]]: { flagged: body.flagged, version: body.expected_version + 1, reason: body.reason, updated_at: '2026-11-07' } };
      return { body: { success: true, credentials: profileCredentials(profile) } };
    }
    if (path === '/api/owner/hotels') return { body: [hotel] };
    if (path === '/api/hotels') return { body: { data: [{ ...hotel, ...(includePublicCredentials ? { credentials: profileCredentials(adminProfiles[1], { publicView: true }) } : {}) }] } };
    if (path.endsWith('/average-rating')) return { body: { average_rating: null, total_reviews: 0 } };
    if (path.endsWith('/calendar')) return { body: { days: [] } };
    if (path.endsWith('/dashboard/stats')) return { body: { hotelCount: 1, bookingStats: {}, userStats: {}, recentBookings: [] } };
    if (path.endsWith('/analytics')) return { body: { monthlyTrends: [], dailyTrends: [] } };
    return { body: [] };
  });
  await browser.viewport(1280); await browser.navigate('/owner/profile'); await browser.waitFor(`document.querySelector('.owner-credentials [data-credential-type="registration"]')`);
}, { timeout: 30000 });
after(async () => { await browser?.close(); });

test('owner sees four distinct credential groups, preserved LGU records and expired badges despite a verified profile', options, async () => {
  assert.equal(await browser.evaluate(`document.querySelectorAll('.owner-credentials [data-credential-type]').length`), 4);
  assert.equal(await browser.evaluate(`document.querySelector('[data-credential-type="business_permit"] input').value`), 'LGU-LEGACY');
  assert.equal(await browser.evaluate(`document.querySelector('[data-credential="business_permit"]').dataset.status`), 'expired');
  assert.equal(await browser.evaluate(`document.querySelector('.owner-credentials button').matches(':disabled')`), false, 'private viewers remain usable outside edit mode');
  assert.match(await browser.evaluate(`document.querySelector('.owner-credentials').textContent`), /does not replace DOT|does not replace|not a substitute|does not automatically/);
});

test('new registration and sanitary fields save without touching payment or reservation records', options, async () => {
  await browser.click('Edit Profile');
  await input('[data-credential-type="registration"] select', 'SEC');
  await input('[data-credential-type="registration"] input', 'SEC-NEW');
  await input('[data-credential-type="registration"] input[type="date"]', '');
  await input('[data-credential-type="sanitary_permit"] input', 'SAN-NEW');
  await input('[data-credential-type="sanitary_permit"] input[type="date"]', '2098-12-31');
  await browser.click('Save Changes'); await browser.waitFor(`document.querySelector('.owner-credentials input')?.matches(':disabled') && document.body.textContent.includes('Business details saved')`);
  assert.equal(ownerProfile.registration_no, 'SEC-NEW'); assert.equal(ownerProfile.registration_expiry, ''); assert.equal(ownerProfile.sanitary_permit_no, 'SAN-NEW');
  assert.equal(ownerProfile.business_permit_no, 'LGU-LEGACY'); assert.equal(ownerProfile.philgeps_no, 'PHIL-OPTIONAL');
  assert.ok(!browser.writes.some(request => /payments|bookings/.test(new URL(request.url).pathname)));
});

test('uploads persist immediately; discarding another draft does not resurrect the replaced document', options, async () => {
  await browser.click('Edit Profile'); await input('[data-credential-type="sanitary_permit"] input', 'UNSAVED-NUMBER');
  await browser.evaluate(`(() => { const node = document.querySelector('[data-credential-type="sanitary_permit"] input[type="file"]'); const files = new DataTransfer(); files.items.add(new File(['fixture'], 'sanitary.jpg', { type: 'image/jpeg' })); node.files = files.files; node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await browser.waitFor(`!document.querySelector('.owner-credentials [role="status"]') && !document.querySelector('[data-credential-type="sanitary_permit"] input').matches(':disabled')`);
  assert.equal(ownerProfile.sanitary_permit_file, '/uploads/permits/uploaded-sanitary_permit_file.jpg');
  await browser.click('Cancel'); await browser.waitFor(`document.querySelector('[role="dialog"]')`); await browser.click('Discard changes');
  await browser.waitFor(`document.querySelector('[data-credential-type="sanitary_permit"] input').matches(':disabled')`);
  assert.equal(await browser.evaluate(`document.querySelector('[data-credential-type="sanitary_permit"] input').value`), 'SAN-NEW');
  assert.equal(ownerProfile.sanitary_permit_file, '/uploads/permits/uploaded-sanitary_permit_file.jpg');
});

test('admin filters pair credential type with condition and do not match an unrelated expired permit', options, async () => {
  role = 'admin'; await browser.navigate('/admin'); await browser.waitFor(`document.querySelector('#admin-nav')`); sidebarThemeBefore = await browser.evaluate(`document.documentElement.dataset.theme || 'light'`); sidebarBefore = await sidebarStyles(); await browser.click('Business Verification');
  await browser.waitFor(`document.querySelectorAll('.credential-profile-card').length === 2`);
  assert.deepEqual(await sidebarStyles(), sidebarBefore, 'Business Verification content styles must not change the sidebar');
  await selectFilter('Credential type', 'sanitary_permit'); await selectFilter('Credential condition', 'expired');
  assert.equal(await browser.evaluate(`document.querySelectorAll('.credential-profile-card').length`), 1);
  assert.match(await browser.evaluate(`document.querySelector('.credential-profile-list').textContent`), /Sanitary Expired Inn/);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.credential-profile-list').textContent`), /Credential Fixture Inn/);
});

test('failed flag saves retain reasons, double clicks make one request, and resolving a flag does not renew an expired document', options, async () => {
  await browser.evaluate(`document.querySelectorAll('.credential-admin .credential-document')[2].querySelector('.credential-flag-button').click()`);
  await browser.waitFor(`document.querySelector('[role="dialog"] textarea')`); await browser.click('Save decision');
  assert.equal(flagWrites, 0);
  await browser.input('Follow-up / resolution reason', 'PRIVATE-RENEWAL-REASON'); failFlag = true; await browser.click('Save decision');
  await browser.waitFor(`document.querySelector('[role="dialog"] [role="alert"]')?.textContent.includes('Fixture flag save failed')`);
  assert.equal(await browser.evaluate(`document.querySelector('[role="dialog"] textarea').value`), 'PRIVATE-RENEWAL-REASON');
  failFlag = false; const before = flagWrites;
  await browser.evaluate(`(() => { const node = [...document.querySelectorAll('[role="dialog"] button')].find(node => node.textContent === 'Save decision'); node.click(); node.click(); })()`);
  await browser.waitFor(`!document.querySelector('[role="dialog"]') && document.querySelector('.credential-followup')`);
  assert.equal(flagWrites - before, 1);
  assert.equal(await browser.evaluate(`document.querySelector('.credential-admin [data-credential="sanitary_permit"]').dataset.status`), 'expired');
  await browser.click('Resolve flag'); await browser.input('Follow-up / resolution reason', 'Resolved follow-up, certificate still expired'); await browser.click('Save decision');
  await browser.waitFor(`!document.querySelector('[role="dialog"]') && !document.querySelector('.credential-followup')`);
  assert.equal(await browser.evaluate(`document.querySelector('.credential-admin [data-credential="sanitary_permit"]').dataset.status`), 'expired');
  failLoad = true; await browser.click('Refresh credentials'); await browser.waitFor(`document.querySelector('.credential-admin [role="alert"]')`);
  assert.ok(await browser.evaluate(`[...document.querySelectorAll('.credential-profile-card button.credential-button')].every(node => node.disabled)`));
  failLoad = false; await browser.click('Refresh credentials'); await browser.waitFor(`!document.querySelector('.credential-admin [role="alert"]')`);
});

test('verification cards align at desktop/tablet/mobile sizes, preserve sidebar styles and use distinct status colors', options, async () => {
  const saved = structuredClone(adminProfiles), writes = browser.writes.length;
  adminProfiles[0] = { ...adminProfiles[0], business_name: 'Credential Fixture Inn — Accommodation and Hospitality Services', email: 'a-very-long-owner-address-for-layout-checks@example.test', business_address: 'A long establishment address in Naujan, Oriental Mindoro, retained in full without stretching the credential cards.', business_permit_no: 'LGU-' + '1234567890'.repeat(12), registration_no: null, registration_file: null, registration_expiry: null, dot_no: null };
  await browser.click('Clear filters'); await browser.click('Refresh credentials');
  await browser.waitFor(`document.querySelector('.credential-profile-card h2')?.textContent.includes('Accommodation and Hospitality')`);
  for (const theme of ['light', 'dark']) {
    await browser.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
    for (const width of [1920, 1440, 1280, 1024, 768, 393, 320]) {
      await browser.viewport(width);
      const result = await browser.evaluate(`(() => {
        const root = document.querySelector('.credential-admin'), bounds = root.getBoundingClientRect(), card = document.querySelector('.credential-profile-card');
        const columns = getComputedStyle(card.querySelector('.credential-record-grid')).gridTemplateColumns.split(' ').length;
        const controls = [...root.querySelectorAll('.credential-filters input, .credential-filters select')];
        const cards = [...card.querySelectorAll('.credential-document')];
        const inside = node => { const rect = node.getBoundingClientRect(); return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1; };
        const heights = controls.map(node => node.getBoundingClientRect().height);
        const rows = new Map();
        for (const item of cards) { const top = Math.round(item.getBoundingClientRect().top), bottom = item.querySelector('.credential-flag-button').getBoundingClientRect().bottom; rows.set(top, [...(rows.get(top) || []), bottom]); }
        return { width: bounds.width, columns, fits: document.documentElement.scrollWidth <= innerWidth + 1 && [...controls, ...cards].every(inside), controlHeights: heights, leftAligned: [...root.querySelectorAll('.credential-filters label')].every(node => getComputedStyle(node).alignItems === 'stretch'), distinctColors: new Set([...root.querySelectorAll('.credential-badge')].map(node => getComputedStyle(node).backgroundColor)).size, controlColors: controls.map(node => getComputedStyle(node).backgroundColor), matchingControls: new Set(controls.map(node => getComputedStyle(node).backgroundColor)).size === 1, alignedActions: [...rows.values()].every(bottoms => Math.max(...bottoms) - Math.min(...bottoms) < 1), headingColor: getComputedStyle(card.querySelector('h2')).color, textColor: getComputedStyle(root).color };
      })()`);
      assert.ok(result.fits, `${theme} layout overflows at ${width}`);
      assert.equal(result.columns, result.width >= 1100 ? 4 : result.width >= 560 ? 2 : 1, `${theme} credential columns at ${width}`);
      assert.ok(result.controlHeights.every(height => Math.abs(height - 44) <= 1), 'filter controls must have equal heights');
      assert.ok(result.leftAligned, 'labels must stay aligned with their controls');
      assert.ok(result.matchingControls, `${theme} at ${width}: search and selects must use the same surface color: ${result.controlColors.join(', ')}`);
      assert.ok(result.alignedActions, 'document actions should line up within each card row');
      assert.equal(result.headingColor, result.textColor, 'headings must not inherit unrelated page accent colors');
      assert.ok(result.distinctColors >= 3, `${theme} missing/current/expired statuses must not all appear green`);
      if (theme === 'light' && width === 1440) { await browser.viewport(width, 1200); await captureLayout('desktop'); await browser.viewport(width); }
      if (theme === 'dark' && width === 393) { await browser.evaluate(`document.querySelector('.credential-profile-card').scrollIntoView({ block: 'start' })`); await captureLayout('mobile-dark'); await browser.evaluate('window.scrollTo(0, 0)'); }
    }
  }
  await browser.viewport(1280); await browser.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(sidebarThemeBefore)}`);
  assert.deepEqual(await sidebarStyles(), sidebarBefore, 'sidebar geometry and navigation remain unchanged');
  await browser.input('Search establishments or owners', 'no-such-establishment');
  await browser.waitFor(`document.querySelector('.credential-empty-state')`); assert.equal(await browser.evaluate(`document.querySelectorAll('.credential-profile-card').length`), 0);
  await browser.click('Clear filters'); await browser.waitFor(`document.querySelectorAll('.credential-profile-card').length === 2`);
  assert.equal(browser.writes.length, writes, 'layout, filters and refresh must not write business data');
  adminProfiles = saved; await browser.click('Refresh credentials'); await browser.waitFor(`document.querySelector('.credential-profile-card h2')?.textContent === 'Credential Fixture Inn'`);
});

test('admin/owner credential views still fit mobile and dark mode', options, async () => {
  for (const width of [320, 393, 768]) { await browser.viewport(width); await browser.evaluate(`document.documentElement.dataset.theme = 'dark'`); assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `admin overflow at ${width}`); }
  role = 'owner'; await browser.navigate('/owner/profile'); await browser.waitFor(`document.querySelector('.owner-credentials')`);
  for (const width of [320, 393, 768]) { await browser.viewport(width); assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `owner overflow at ${width}`); }
});

test('public hotel detail/grid/list omit credential badges and notices with or without credential data', options, async () => {
  role = 'user';
  const assertNoCredentials = async () => {
    assert.equal(await browser.evaluate(`document.querySelectorAll('.credential-badges, .credential-badge, .credential-unavailable, .hd-legit-wrap, [aria-label="Establishment credential statuses"]').length`), 0);
    assert.doesNotMatch(await browser.evaluate('document.body.textContent'), /PRIVATE-RENEWAL|REG-PRIVATE|DOT-PRIVATE|Credential information unavailable|government compliance guarantee|LGU Permit|Sanitary Permit|DOT Accreditation/i);
  };
  for (const withCredentials of [true, false]) {
    includePublicCredentials = withCredentials;
    await browser.navigate('/hotels/8'); await browser.waitFor(`document.querySelector('.hd-layout')`); await assertNoCredentials();
    await browser.navigate('/hotels'); await browser.waitFor(`document.querySelector('.hotel-result-card')`); await assertNoCredentials();
    await browser.click('List'); await browser.waitFor(`document.querySelector('.hotel-result-card--list')`); await assertNoCredentials();
  }
  assert.deepEqual(browser.errors, []);
});
