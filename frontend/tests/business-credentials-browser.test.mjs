import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';
import { profileCredentials, serializeCredentialProfile } from '../../backend/utils/businessCredentials.js';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 25000 };
const original = { id: 10, owner_id: 5, business_name: 'Credential Fixture Inn', verification_status: 'verified', business_email: 'fixture@example.test', registration_authority: 'DTI',
  registration_no: 'REG-PRIVATE', registration_expiry: '2099-12-31', registration_file: '/uploads/permits/registration.pdf', business_permit_no: 'LGU-LEGACY', business_permit_expiry: '2020-12-31', business_permit_file: '/uploads/permits/lgu.pdf',
  sanitary_permit_no: 'SAN-OLD', sanitary_permit_expiry: '2099-12-31', sanitary_permit_file: '/uploads/permits/sanitary.pdf', dot_no: 'DOT-PRIVATE', dot_expiry: '2099-12-31', dot_file: '/uploads/permits/dot.pdf', philgeps_no: 'PHIL-OPTIONAL' };
let ownerProfile = { ...original }, adminProfiles = [{ ...original }, { ...original, id: 11, owner_id: 6, business_name: 'Sanitary Expired Inn', business_permit_expiry: '2099-12-31', sanitary_permit_expiry: '2020-12-31' }];
let browser, role = 'owner', failFlag = false, failLoad = false, flagWrites = 0;
const hotel = { id: 8, hotel_id: 8, name: original.business_name, location: 'Naujan', pricePerNight: 500, price_per_night: 500, currency: 'PHP', amenities: [], images: [], image_urls: [], rooms_total: 2, rooms_available: 2, is_active: 1, booking_enabled: true, allowed_payment_methods: [], check_in_time: '14:00', check_out_time: '12:00' };
const input = (selector, value) => browser.evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : node.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`);
const selectFilter = (label, value) => browser.evaluate(`(() => { const node = [...document.querySelectorAll('.credential-filters label')].find(node => node.textContent.startsWith(${JSON.stringify(label)})).querySelector('select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('change', { bubbles: true })); })()`);
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
    if (path === '/api/hotels') return { body: { data: [{ ...hotel, credentials: profileCredentials(adminProfiles[1], { publicView: true }) }] } };
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
  role = 'admin'; await browser.navigate('/admin'); await browser.waitFor(`document.querySelector('#admin-nav')`); await browser.click('Business Verification');
  await browser.waitFor(`document.querySelectorAll('.credential-admin tbody tr').length === 2`);
  await selectFilter('Credential type', 'sanitary_permit'); await selectFilter('Credential condition', 'expired');
  assert.equal(await browser.evaluate(`document.querySelectorAll('.credential-admin tbody tr').length`), 1);
  assert.match(await browser.evaluate(`document.querySelector('.credential-admin tbody').textContent`), /Sanitary Expired Inn/);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.credential-admin tbody').textContent`), /Credential Fixture Inn/);
});

test('failed flag saves retain reasons, double clicks make one request, and resolving a flag does not renew an expired document', options, async () => {
  await browser.evaluate(`document.querySelectorAll('.credential-admin tbody .credential-cell')[2].querySelector('button.gov-btn-ghost').click()`);
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
  assert.ok(await browser.evaluate(`[...document.querySelectorAll('.credential-admin tbody button.gov-btn-ghost')].every(node => node.disabled)`));
  failLoad = false; await browser.click('Refresh credentials'); await browser.waitFor(`!document.querySelector('.credential-admin [role="alert"]')`);
});

test('public profiles/listings show safe expiry badges and admin/owner views fit mobile and dark mode', options, async () => {
  for (const width of [320, 393, 768]) { await browser.viewport(width); await browser.evaluate(`document.documentElement.dataset.theme = 'dark'`); assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `admin overflow at ${width}`); }
  role = 'owner'; await browser.navigate('/owner/profile'); await browser.waitFor(`document.querySelector('.owner-credentials')`);
  for (const width of [320, 393, 768]) { await browser.viewport(width); assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `owner overflow at ${width}`); }
  role = 'user'; await browser.navigate('/hotels/8'); await browser.waitFor(`document.querySelector('.hd-legit-wrap [data-credential="sanitary_permit"]')`);
  assert.equal(await browser.evaluate(`document.querySelector('.hd-legit-wrap [data-credential="sanitary_permit"]').dataset.status`), 'expired');
  assert.equal(await browser.evaluate(`document.querySelectorAll('.hd-legit-wrap [data-credential]').length`), 4);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.hd-legit-wrap').textContent`), /PRIVATE-RENEWAL|REG-PRIVATE|DOT-PRIVATE|uploads/);
  await browser.navigate('/hotels'); await browser.waitFor(`document.querySelector('.credential-badges--compact')`);
  assert.equal(await browser.evaluate(`document.querySelectorAll('.credential-badges--compact [data-credential]').length`), 4);
  assert.deepEqual(browser.errors, []);
});
