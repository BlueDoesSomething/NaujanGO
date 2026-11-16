import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';

const options = { skip: browserAvailable ? false : 'Requires Chromium and Node 22+', timeout: 15000 };
let browser, mode = 'empty';
before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('production-home', async (request, url) => {
    if (url.pathname.endsWith('/auth/profile')) return { body: { user: { user_id: 7, username: 'Saved guest', role: 'user', email_verified: true, gender: 'other', user_type: 'local' } } };
    if (url.pathname === '/api/attractions') return { body: { data: [{ id: 1, name: 'Saved attraction', latitude: 13, longitude: 121, review_count: 1, avg_rating: 3 }] } };
    if (url.pathname === '/api/hotels') return { body: [{ id: 8, name: 'Saved inn', currency: 'PHP', pricePerNight: 450, rating: 3, amenities: ['Saved amenity'] }] };
    if (url.pathname === '/api/attractions/1/reviews') return mode === 'failure' ? { status: 500, body: { error: 'Fixture review failure' } }
      : { body: mode === 'reviews' ? [{ username: 'Saved traveler', rating: 3, comment: 'A genuine saved review.' }] : [] };
    if (url.pathname === '/api/hotels/8/reviews') return { body: [] };
    return { body: [] };
  });
  await browser.viewport(393);
}, { timeout: 30000 });
after(async () => { await browser?.close(); });
const openHome = async () => {
  await browser.navigate('/');
  await browser.waitFor(`document.querySelector('.eco-split-body h3')?.textContent === 'Saved inn' && document.querySelector('.eco-safety .safety-ring-value')?.textContent === '—'`);
};

test('empty database reviews never become sample testimonials or fabricated property claims', options, async () => {
  await openHome();
  assert.equal(await browser.evaluate(`document.querySelector('.eco-testimonials')`), null);
  assert.equal(await browser.evaluate(`document.querySelector('.eco-split-stars').textContent.includes('★★★☆☆')`), true);
  assert.equal(await browser.evaluate(`document.querySelector('.eco-amenities').textContent.trim()`), 'Saved amenity');
  assert.equal(await browser.evaluate(`document.querySelector('.split-badge')`), null);
  assert.doesNotMatch(await browser.evaluate('document.body.textContent'), /Maria Santos|James Wilson|Akiko Tanaka/);
  assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'));
});

test('phone swipes over the homepage hero move the page instead of an inner scroll container', options, async () => {
  for (const width of [320, 393]) {
    await browser.viewport(width, 850);
    await openHome();
    const layout = await browser.evaluate(`(() => ({
      heroOverflow: getComputedStyle(document.querySelector('.hero-section')).overflowY,
      stageOverflow: getComputedStyle(document.querySelector('.featured-stage')).overflowY,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      scrollHeight: document.documentElement.scrollHeight
    }))()`);
    assert.equal(layout.heroOverflow, 'clip');
    assert.equal(layout.stageOverflow, 'clip');
    assert.equal(layout.horizontalOverflow, false);
    assert.ok(layout.scrollHeight > 850);
    await browser.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    try {
      await browser.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width / 2, y: 520 }] });
      for (const y of [490, 460, 430, 400, 370, 340, 310, 280, 250]) {
        await browser.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: width / 2, y }] });
      }
      await browser.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const scrolled = await browser.evaluate('new Promise(resolve => setTimeout(() => resolve(scrollY), 150))');
      assert.ok(scrolled > 80, `${width}px hero swipe did not scroll the page: ${scrolled}`);
      const card = await browser.evaluate(`(() => {
        const node = document.querySelector('.info-body');
        window.scrollTo({ top: node.getBoundingClientRect().top + scrollY - 240, behavior: 'instant' });
        const rect = node.getBoundingClientRect();
        const x = Math.round(rect.left + rect.width / 2), y = Math.round(Math.max(150, Math.min(570, rect.top + 80)));
        return { x, y, inside: node.contains(document.elementFromPoint(x, y)), before: scrollY, overflow: getComputedStyle(node).overflowY };
      })()`);
      assert.ok(card.inside, `${width}px info card is not reachable for touch: ${JSON.stringify(card)}`);
      assert.notEqual(card.overflow, 'auto', 'phone info card must not trap vertical swipes');
      await browser.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: card.x, y: card.y }] });
      for (const delta of [25, 50, 75, 100, 125, 150]) {
        await browser.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: card.x, y: card.y - delta }] });
      }
      await browser.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const afterCard = await browser.evaluate('new Promise(resolve => setTimeout(() => resolve(scrollY), 150))');
      assert.ok(afterCard > card.before + 40, `${width}px info card swipe did not scroll the page: ${card.before} -> ${afterCard}`);
    } finally {
      await browser.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  }
});

test('real saved traveler reviews display without being padded with invented five-star stories', options, async () => {
  mode = 'reviews'; await openHome();
  await browser.waitFor(`document.querySelector('.eco-testimonial-card blockquote')?.textContent.includes('A genuine saved review.')`);
  assert.equal(await browser.evaluate(`document.querySelectorAll('.eco-testimonial-card').length`), 1);
  assert.equal(await browser.evaluate(`document.querySelector('.ts-stars').textContent`), '★★★☆☆');
  assert.match(await browser.evaluate(`document.querySelector('.ts-author').textContent`), /Saved traveler/);
});

test('failed review and weather loads do not turn into sample stories or an all-clear hazard rating', options, async () => {
  mode = 'failure'; await openHome();
  await browser.waitFor(`document.querySelector('.eco-hazard')?.textContent.includes('Unable to fetch hazard data')`);
  assert.equal(await browser.evaluate(`document.querySelector('.eco-testimonials')`), null);
  assert.match(await browser.evaluate(`document.querySelector('.eco-safety').textContent`), /Weather data unavailable/);
  assert.doesNotMatch(await browser.evaluate(`document.querySelector('.eco-hazard').textContent`), /No current hazards|total hazards monitored/);
  assert.deepEqual(browser.errors, []);
  assert.equal(browser.writes.length, 0);
});
