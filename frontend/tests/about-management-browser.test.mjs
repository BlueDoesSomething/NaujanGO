import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 25000 };
let browser, role = 'user', failSave = false, failSettings = false, failMilestones = false, uploadCount = 0;
let settings = { overview_text: 'Saved fixture overview for Naujan.', vision_text: 'Saved fixture vision.', mission_text: { points: ['Saved fixture mission.'] }, population: 12345, land_area_sq_km: 23.5, density_per_sq_km: 525.32, num_barangays: 12, municipal_rank: 'Saved fixture rank', current_mayor_name: 'Fallback Mayor', current_mayor_term: '2025–2028', current_vice_mayor_name: 'Fallback Vice Mayor', current_vice_mayor_term: '2025–2028', visitor_arrivals_2022: 10, visitor_arrivals_2023: 20, visitor_arrivals_2024: 0, visitor_arrivals_2025: 5, tourism_total_employment: 10, tourism_attractions_count: 2, tourism_accommodation_count: 3, tourism_female_employed: 6, tourism_male_employed: 4 };
let leaders = [{ id: 'm1', role: 'mayor', name: 'Saved Mayor', term: '2025–2028', current: true }, { id: 'v', role: 'vice-mayor', name: 'Saved Vice Mayor', term: '2025–2028', current: true }, { id: 'm2', role: 'mayor', name: 'Earlier Mayor', term: '2022–2025', current: false }];
let milestones = [{ id: 'milestone', date: '2026', category: 'COMMUNITY', title: 'Saved milestone', description: 'A verified fixture activity.', imageUrl: '' }];
let queens = [{ id: 'q', name: 'Saved Miss Naujan', year: 2026, photo: null }];
const clickLink = href => browser.evaluate(`document.querySelector(${JSON.stringify(`a[href="${href}"]`)}).click()`);
before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('about-management', async (request, url) => {
    const path = url.pathname;
    const body = /^[\[{]/.test(request.postData || '') ? JSON.parse(request.postData) : {};
    if (path.endsWith('/auth/profile')) return { body: { user: { user_id: role === 'admin' ? 7 : 1, role, username: 'about_fixture', email_verified: true } } };
    if (path === '/api/about-settings') return failSettings ? { status: 503, body: { error: 'Fixture About settings unavailable.' } } : { body: settings };
    if (path === '/api/about-leadership-roster') return { body: leaders };
    if (path === '/api/about-leadership-photos') return { body: {} };
    if (path === '/api/about-accomplishments') return failMilestones ? { status: 503, body: { error: 'Fixture milestones unavailable.' } } : { body: milestones };
    if (path === '/api/about-pageant-queens') return { body: queens };
    if (path === '/api/admin/about-settings') { if (failSave) return { status: 503, body: { error: 'Fixture save failed; draft retained.' } }; settings = body; return { body: { success: true, data: settings } }; }
    if (path === '/api/admin/about-leadership-roster') { leaders = body; return { body: { success: true, roster: leaders } }; }
    if (path === '/api/admin/about-accomplishments') { milestones = body; return { body: { success: true, entries: milestones } }; }
    if (path === '/api/admin/about-pageant-queens') { queens = body; return { body: { success: true, queens } }; }
    if (path === '/api/admin/leader-photo') { uploadCount += 1; return { body: { success: true, photoUrl: '/uploads/about/fixture-portrait.jpg' } }; }
    if (path.endsWith('/dashboard/stats')) return { body: { hotelCount: 0, bookingStats: {}, userStats: {}, recentBookings: [] } };
    if (path === '/api/admin/analytics') return { body: { monthlyTrends: [], dailyTrends: [] } };
    return { body: [] };
  });
  await browser.viewport(1280); await browser.navigate('/about'); await browser.waitFor(`document.querySelector('.about-section-overview')?.textContent.includes('Saved fixture overview')`);
}, { timeout: 30000 });
after(async () => { await browser?.close(); });

test('About opens as a readable introduction with a topic directory, real links and saved public figures', options, async () => {
  assert.equal(await browser.evaluate('document.querySelectorAll(".about-section").length'), 1);
  assert.equal(await browser.evaluate('document.querySelectorAll(".about-topic-directory a").length'), 11);
  assert.equal(await browser.evaluate(`document.querySelector('a[href="/admin/about"]')`), null);
  await clickLink('/about/quick-facts'); await browser.waitFor(`document.querySelector('.about-section-facts')?.textContent.includes('12,345')`);
  assert.match(await browser.evaluate(`document.querySelector('.about-section-facts').textContent`), /Saved fixture rank|23.5/);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.about-section-facts').textContent`), /109,122|Population \(2024\)/);
  assert.equal(await browser.evaluate(`document.querySelector('.about-nav [aria-current="page"]').getAttribute('href')`), '/about/quick-facts');
  await clickLink('/about/vision-mission'); await browser.waitFor(`document.querySelector('.about-section-vision')?.textContent.includes('Saved fixture vision')`);
  assert.match(await browser.evaluate(`document.querySelector('.about-section-vision').textContent`), /Saved fixture mission/);
  await clickLink('/about/tourism'); await browser.waitFor(`document.querySelector('.about-section-tourism')`);
  assert.match(await browser.evaluate(`document.querySelector('.about-section-tourism').textContent`), /separate from approved monthly|\+100.00%|-100.00%|0 visitors/);
});

test('public saved leadership is role-correct, saved lists load and municipal failures have a retry instead of fake figures', options, async () => {
  await clickLink('/about/leadership'); await browser.waitFor(`document.querySelector('.about-leadership-grid')?.textContent.includes('Saved Vice Mayor')`);
  assert.match(await browser.evaluate(`document.querySelector('.about-leadership-grid').textContent`), /Saved Mayor/);
  await clickLink('/about/accomplishments'); await browser.waitFor(`document.querySelector('.about-section-accomplishments')?.textContent.includes('Saved milestone')`);
  failSettings = true; await browser.navigate('/about/quick-facts'); await browser.waitFor(`document.querySelector('.about-data-status[role="alert"]')`);
  assert.match(await browser.evaluate(`document.querySelector('.about-section-facts').textContent`), /Not available/);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.about-section-facts').textContent`), /109,122/);
  failSettings = false; await browser.click('Retry content'); await browser.waitFor(`document.querySelector('.about-section-facts')?.textContent.includes('12,345')`);
});

test('dedicated admin editor loads saved content, previews drafts, validates blanks and retains failed saves', options, async () => {
  role = 'admin'; await browser.navigate('/admin/about'); await browser.waitFor(`document.querySelector('.about-manager textarea')?.value === 'Saved fixture overview for Naujan.'`);
  assert.equal(await browser.evaluate(`document.querySelector('#admin-nav [aria-current="page"]').textContent`), 'About Us');
  await browser.input('Overview text', 'Updated fixture overview.');
  assert.match(await browser.evaluate(`document.querySelector('[aria-label="Unsaved content preview"]').textContent`), /Updated fixture overview/);
  await browser.click('Facts & tourism'); await browser.input('Population', '');
  const before = browser.writes.length; await browser.click('Save page content'); await browser.waitFor(`document.querySelector('.about-manager [role="alert"]')`);
  assert.equal(browser.writes.length, before);
  await browser.input('Population', '54321'); await browser.click('Overview & purpose');
  assert.equal(await browser.evaluate(`document.querySelector('.about-manager textarea').value`), 'Updated fixture overview.');
  failSave = true; await browser.click('Save page content'); await browser.waitFor(`document.querySelector('.about-manager [role="alert"]')?.textContent.includes('Fixture save failed')`);
  assert.equal(await browser.evaluate(`document.querySelector('.about-manager textarea').value`), 'Updated fixture overview.');
  failSave = false; const saves = browser.writes.length;
  await browser.evaluate(`(() => { const button = [...document.querySelectorAll('.about-manager button')].find(node => node.textContent === 'Save page content'); button.click(); button.click(); })()`);
  await browser.waitFor(`document.querySelector('.about-manager-feedback')?.textContent.includes('Saved.')`);
  assert.equal(browser.writes.length - saves, 1); assert.equal(settings.population, 54321);
});

test('leadership selection keeps one current person per role and portrait uploads are explicit, guarded and retained', options, async () => {
  await browser.click('Leadership & photos'); await browser.waitFor(`document.querySelectorAll('.about-manager-entry').length === 3`);
  await browser.evaluate(`document.querySelectorAll('.about-manager-checkbox input')[2].click()`);
  const flags = await browser.evaluate(`[...document.querySelectorAll('.about-manager-checkbox input')].map(node => node.checked)`);
  assert.deepEqual(flags, [false, true, true]);
  await browser.click('Save leadership'); await browser.waitFor(`document.querySelector('.about-manager-feedback')?.textContent.includes('Saved.')`);
  await browser.evaluate(`(() => { const input = document.querySelector('.about-manager-entry input[type="file"]'); const transfer = new DataTransfer(); transfer.items.add(new File(['fixture-image'], 'portrait.jpg', { type: 'image/jpeg' })); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await browser.waitFor(`document.querySelector('.about-manager-feedback')?.textContent.includes('Image uploaded')`);
  assert.equal(uploadCount, 1); assert.ok(await browser.evaluate(`Boolean(document.querySelector('.about-manager-entry img[src="/uploads/about/fixture-portrait.jpg"]'))`));
});

test('navigation and browser Back retain unsaved edits until explicit discard', options, async () => {
  await browser.click('Payments'); await browser.waitFor(`!document.querySelector('.about-manager') && document.querySelector('#admin-nav')`);
  await browser.click('About Us'); await browser.waitFor(`document.querySelector('.about-manager textarea')`);
  await browser.click('Overview & purpose'); await browser.input('Overview text', 'Do not lose this draft.');
  await browser.click('Payments'); await browser.waitFor(`document.querySelector('[role="dialog"]')`); await browser.click('Keep editing');
  assert.equal(await browser.evaluate('location.pathname'), '/admin/about');
  assert.equal(await browser.evaluate(`document.querySelector('.about-manager textarea').value`), 'Do not lose this draft.');
  await browser.click('Moderation'); await browser.waitFor(`document.querySelector('[role="dialog"]')`); await browser.click('Keep editing');
  assert.equal(await browser.evaluate('location.pathname'), '/admin/about', 'direct moderation navigation cannot bypass the draft guard');
  await browser.evaluate('history.back()'); await browser.waitFor(`document.querySelector('[role="dialog"] button:not([disabled])')`); await browser.click('Keep editing');
  assert.equal(await browser.evaluate(`document.querySelector('.about-manager textarea').value`), 'Do not lose this draft.');
  await browser.click('Payments'); await browser.click('Discard changes'); await browser.waitFor(`!document.querySelector('.about-manager') && document.querySelector('#admin-nav')`);
  await browser.click('About Us'); await browser.waitFor(`document.querySelector('.about-manager textarea')?.value === 'Updated fixture overview.'`);
});

test('independent list failures cannot overwrite content; an empty published list needs confirmation and stays empty publicly', options, async () => {
  failMilestones = true; await browser.reload(); await browser.waitFor(`document.querySelector('.about-manager textarea')`); await browser.click('Milestones');
  await browser.waitFor(`document.querySelector('.about-manager [role="alert"]')?.textContent.includes('Fixture milestones unavailable')`);
  assert.equal(await browser.evaluate(`document.querySelector('.about-manager-entry')`), null);
  assert.ok(!await browser.evaluate(`[...document.querySelectorAll('.about-manager button')].some(node => node.textContent === 'Save milestones')`));
  failMilestones = false; await browser.click('Retry content'); await browser.waitFor(`document.querySelector('.about-manager-entry')`);
  await browser.click('Remove entry'); await browser.click('Save milestones'); await browser.waitFor(`document.querySelector('[role="dialog"]')?.textContent.includes('Publish an empty list?')`);
  assert.equal(milestones.length, 1); await browser.click('Keep editing'); await browser.click('Save milestones'); await browser.click('Publish empty list');
  await browser.waitFor(`document.querySelector('.about-manager-feedback')?.textContent.includes('Saved.')`); assert.deepEqual(milestones, []);
  await browser.navigate('/about/accomplishments'); await browser.waitFor(`document.querySelector('.about-section-accomplishments')?.textContent.includes('No milestones have been published')`);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.about-section-accomplishments').textContent`), /Solar lights provided|Saved milestone/);
});

test('public topic navigation and management fit mobile/dark mode; read-all remains available', options, async () => {
  await browser.navigate('/about'); await browser.waitFor(`document.querySelector('.about-section-overview')?.textContent.includes('Updated fixture overview')`);
  for (const width of [320, 393, 768]) {
    await browser.viewport(width); await browser.evaluate(`document.documentElement.dataset.theme = 'dark'`);
    assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `About overflows at ${width}`);
    await browser.click('Browse topics'); await browser.waitFor(`document.querySelector('.about-topic-sidebar.mobile-open')`);
    await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' }); await browser.waitFor(`!document.querySelector('.about-topic-sidebar.mobile-open')`);
  }
  await browser.navigate('/admin/about'); await browser.waitFor(`document.querySelector('.about-manager textarea')`);
  for (const width of [320, 393, 768]) { await browser.viewport(width); assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), `manager overflows at ${width}`); }
  await browser.navigate('/about?view=all'); await browser.waitFor(`document.querySelectorAll('.about-section').length === 12`);
  assert.deepEqual(browser.errors, []);
});
