import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 30000 };
const hotels = [
  { id: 8, name: 'Naujan Travellers Inn & Resto Bar — Riverside Accommodation and Hospitality Services', location: 'Bacungan, Naujan, Oriental Mindoro', description: 'A riverside retreat near the town plaza.', amenities: ['Wi-Fi', 'Parking', 'Restaurant', 'Air Conditioning', 'Breakfast'], pricePerNight: 1234.5, rooms_available: 5, rating: 4.7, reviewCount: 20, map: 'https://example.test/map/8',
    credentials: [{ key: 'business_permit', label: 'LGU Permit', status: 'expired' }, { key: 'dot', label: 'DOT Accreditation', status: 'pending' }] },
  { id: 9, name: 'Bayview Resort', location: 'Naujan', amenities: ['Pool'], pricePerNight: 750, rooms_available: 0, rating: 3.5, reviewCount: 4, credentials: [] },
  { id: 10, name: 'Lakeside ' + 'Accommodation'.repeat(7), location: 'LongAddress'.repeat(12), amenities: [], pricePerNight: 900, rooms_available: null, rating: 0, reviewCount: 0 }
].map(hotel => ({ ...hotel, hotel_id: hotel.id, image: '/placeholder-hotel.svg', price_per_night: hotel.pricePerNight, currency: 'PHP', rooms_total: 8, booking_enabled: true, allowed_payment_methods: [] }));
let browser;
const setControl = (selector, value) => browser.evaluate(`(() => {
  const node = document.querySelector(${JSON.stringify(selector)}), select = node.tagName === 'SELECT';
  Object.getOwnPropertyDescriptor(select ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(node, ${JSON.stringify(value)});
  node.dispatchEvent(new Event(select ? 'change' : 'input', { bubbles: true }));
})()`);
const ids = () => browser.evaluate(`[...document.querySelectorAll('.hotel-result-title')].map(node => Number(node.id.replace('hotel-result-', '')))`);
const open = async () => { await browser.navigate('/hotels'); await browser.waitFor(`document.querySelectorAll('.hotel-result-card').length === 3`); };
const screenshot = async name => {
  if (!process.env.HOTEL_LAYOUT_SCREENSHOTS) return;
  await browser.evaluate(`window.scrollTo(0, document.querySelector('.hotel-result-card').getBoundingClientRect().top + scrollY - document.querySelector('.navbar').offsetHeight - 16)`);
  const capture = await browser.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const directory = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();
  await writeFile(path.join(directory, `hotel-listing-${name}.png`), Buffer.from(capture.data, 'base64'));
};

before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('hotel-listing', async (request, url) => {
    const pathname = url.pathname;
    if (pathname.endsWith('/auth/profile')) return { body: { user: { user_id: 101, role: 'user', username: 'hotel_layout_fixture', email_verified: true } } };
    if (pathname === '/api/bookings/policy') return { body: { online_payments_enabled: false, storage_ready: true } };
    if (pathname === '/api/hotels') return { body: { data: hotels } };
    if (pathname.endsWith('/average-rating')) return { body: { average: 4.7, total: 20 } };
    if (pathname.endsWith('/calendar')) return { body: { days: [] } };
    return { body: [] };
  });
  await browser.viewport(1440); await open();
}, { timeout: 30000 });
after(async () => { await browser?.close(); });

test('hotel results show essential information and real detail/calendar/map links without badges or amenity chips', options, async () => {
  for (const view of ['Grid', 'List']) {
    await browser.click(view);
    assert.equal(await browser.evaluate(`document.querySelectorAll('.hotels-page .credential-badges, .hotels-page .credential-unavailable, .hotels-page [class*="badge"], .hotels-page .hotel-card-amenity').length`), 0);
    assert.doesNotMatch(await browser.evaluate(`document.querySelector('.hotels-page').textContent`), /LGU Permit|DOT Accreditation|government compliance guarantee/);
    assert.match(await browser.evaluate(`document.querySelector('#hotel-result-8').closest('article').textContent`), /4\.7.*20 reviews.*1,234\.50.*5 rooms available.*View Details/s);
    assert.match(await browser.evaluate(`document.querySelector('#hotel-result-9').closest('article').querySelector('.hotel-result-availability').textContent`), /Sold out/);
    assert.match(await browser.evaluate(`document.querySelector('#hotel-result-10').closest('article').querySelector('.hotel-result-availability').textContent`), /Check availability/i);
    assert.equal(await browser.evaluate(`document.querySelector('.hotel-result-details').getAttribute('href')`), '/hotels/8');
    assert.equal(await browser.evaluate(`document.querySelector('.hotel-result-availability').getAttribute('href')`), '/hotels/8?calendar=1');
    assert.equal(await browser.evaluate(`document.querySelector('.hotel-result-map').getAttribute('href')`), hotels[0].map);
    // Cancel only external navigation, so a bubbled parent click would still be detected.
    await browser.evaluate(`(() => { const node = document.querySelector('.hotel-result-map'); node.addEventListener('click', event => event.preventDefault(), { once: true }); node.click(); })()`);
    assert.equal(await browser.evaluate('location.pathname'), '/hotels');
  }
});

test('hotel search, amenity/rating filters and sorting work in either view', options, async () => {
  for (const view of ['Grid', 'List']) {
    await browser.click(view);
    await setControl('.sort-select', 'price'); assert.deepEqual(await ids(), [9, 10, 8]);
    await setControl('.sort-select', 'price_high'); assert.deepEqual(await ids(), [8, 10, 9]);
    await setControl('.sort-select', 'rating'); assert.deepEqual(await ids(), [8, 9, 10]);
    await setControl('.sort-select', 'name'); assert.deepEqual(await ids(), [9, 10, 8]);
    await setControl('.search-bar-input', 'riverside retreat'); assert.deepEqual(await ids(), [8]);
    await setControl('.search-bar-input', 'no matching hotel'); assert.deepEqual(await ids(), []);
    await setControl('.search-bar-input', '');
    await browser.evaluate(`if (!document.querySelector('.filter-panel')) document.querySelector('.filter-toggle-btn').click()`);
    await setControl('.filter-select', 'Pool'); assert.deepEqual(await ids(), [9]);
    await browser.evaluate(`document.querySelectorAll('.rating-star-btn')[4].click()`); assert.deepEqual(await ids(), []);
    await browser.evaluate(`document.querySelector('.clear-all-filters-btn').click()`); assert.equal((await ids()).length, 3);
    await browser.evaluate(`document.querySelectorAll('.rating-star-btn')[4].click()`); assert.deepEqual(await ids(), [8]);
    await browser.evaluate(`document.querySelector('.clear-all-filters-btn').click()`);
  }
  await browser.evaluate(`document.querySelector('.filter-toggle-btn').click()`);
  await setControl('.sort-select', 'popular');
});

test('grid/list cards keep photos separate, text unclipped and actions usable at 320–1920px in both themes', options, async () => {
  for (const theme of ['light', 'dark']) {
    await browser.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
    for (const view of ['Grid', 'List']) {
      await browser.click(view);
      for (const width of [1920, 1440, 1024, 768, 393, 320]) {
        await browser.viewport(width);
        const result = await browser.evaluate(`(() => {
          const cards = [...document.querySelectorAll('.hotel-result-card')];
          const luminance = color => color.match(/[\\d.]+/g).slice(0, 3).map(value => {
            const channel = Number(value) / 255;
            return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
          }).reduce((total, channel, index) => total + channel * [.2126, .7152, .0722][index], 0);
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            cards: cards.map(card => {
              const rect = card.getBoundingClientRect(), photo = card.querySelector('.hotel-result-media').getBoundingClientRect(), content = card.querySelector('.hotel-result-content').getBoundingClientRect();
              const inside = node => { const box = node.getBoundingClientRect(); return box.left >= rect.left && box.right <= rect.right && box.top >= rect.top && box.bottom <= rect.bottom; };
              return {
                separated: content.top >= photo.bottom - 1 || content.left >= photo.right - 1,
                fits: [...card.querySelectorAll('h3, p, a')].every(node => inside(node) && node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1),
                actions: [...card.querySelectorAll('.hotel-result-actions a')].every(node => node.getBoundingClientRect().height >= 44),
                titleSize: parseFloat(getComputedStyle(card.querySelector('h3')).fontSize),
                titleContrast: (() => { const text = luminance(getComputedStyle(card.querySelector('h3')).color), surface = luminance(getComputedStyle(card).backgroundColor); return (Math.max(text, surface) + .05) / (Math.min(text, surface) + .05); })()
              };
            })
          };
        })()`);
        assert.equal(result.overflow, false, `${theme} ${view} overflows at ${width}`);
        for (const [index, card] of result.cards.entries()) {
          const label = `${theme} ${view} at ${width}, card ${index}`;
          assert.ok(card.separated, `${label}: information overlaps the photo`);
          assert.ok(card.fits, `${label}: content clipped or outside the card`);
          assert.ok(card.actions, `${label}: small action targets`);
          assert.ok(card.titleSize >= 16, `${label}: title too small`);
          assert.ok(card.titleContrast >= 4.5, `${label}: title contrast is too low`);
        }
        if (width === 1440 && theme === 'light') { await browser.viewport(width, 1100); await screenshot(view.toLowerCase()); }
        if (width === 393 && theme === 'dark' && view === 'Grid') await screenshot('mobile-dark');
      }
    }
  }
});

test('card and keyboard-accessible detail links navigate normally; availability still opens the booking calendar', options, async () => {
  await browser.viewport(1280); await open();
  await browser.evaluate(`document.querySelector('.hotel-result-details').focus()`);
  await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await browser.waitFor(`document.querySelector('.hd-layout')`);
  assert.equal(await browser.evaluate('location.pathname + location.search'), '/hotels/8');
  for (const view of ['Grid', 'List']) {
    await open(); await browser.click(view);
    await browser.evaluate(`document.querySelector('.hotel-result-card').click()`);
    await browser.waitFor(`document.querySelector('.hd-layout')`);
    assert.equal(await browser.evaluate('location.pathname + location.search'), '/hotels/8');
    await open(); await browser.click(view);
    await browser.evaluate(`document.querySelector('.hotel-result-availability').click()`);
    await browser.waitFor(`document.querySelector('.hd-bm-card')`);
    assert.equal(await browser.evaluate('location.pathname + location.search'), '/hotels/8?calendar=1');
  }
  assert.deepEqual(browser.writes, [], 'browsing and calendar navigation must not change bookings or payments');
  assert.deepEqual(browser.errors, []);
});
