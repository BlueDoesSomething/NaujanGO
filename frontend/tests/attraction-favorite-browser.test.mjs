import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineBrowser, browserAvailable } from './helpers/offline-browser.mjs';

const options = { skip: browserAvailable ? false : 'Requires Node 22+ and Chromium', timeout: 30000 };
let browser;

before(async () => {
  if (!browserAvailable) return;
  browser = await offlineBrowser('attraction-favorite', async (request, url) => {
    if (url.pathname.endsWith('/auth/profile')) return { body: { user: { user_id: 101, username: 'Fixture guest', role: 'user', email_verified: true } } };
    if (url.pathname === '/api/attractions') return { body: { data: [{
      id: 1, name: '333 Steps (Melgar A)', location: 'Naujan', category: 'nature',
      image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect width="400" height="500" fill="white"/%3E%3C/svg%3E'
    }] } };
    return { body: [] };
  });
});

after(async () => { await browser?.close(); });

test('favorite button is visible and easy to tap over bright photos on narrow screens in both themes', options, async () => {
  for (const width of [320, 375, 393, 430]) {
    await browser.viewport(width, 740);
    await browser.navigate('/attractions');
    await browser.waitFor(`document.querySelector('.attr-card .attr-heart')`);
    for (const theme of ['light', 'dark']) {
      await browser.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(theme)}`);
      const view = await browser.evaluate(`(() => {
        const card = document.querySelector('.attr-card').getBoundingClientRect();
        const button = document.querySelector('.attr-heart');
        const rect = button.getBoundingClientRect(), style = getComputedStyle(button);
        const icon = button.querySelector('svg').getBoundingClientRect();
        return {
          width: rect.width, height: rect.height, right: card.right - rect.right, top: rect.top - card.top,
          iconWidth: icon.width, background: style.backgroundColor, color: style.color,
          padding: style.padding, label: button.getAttribute('aria-label')
        };
      })()`);
      assert.ok(view.width >= 44 && view.height >= 44, `${width}px ${theme}: touch target too small: ${JSON.stringify(view)}`);
      assert.ok(view.top >= 0 && view.right >= 0, `${width}px ${theme}: favorite button outside card`);
      assert.ok(view.iconWidth >= 20, `${width}px ${theme}: heart icon too small`);
      assert.equal(view.background, 'rgb(18, 42, 34)', `${width}px ${theme}: background must be opaque over bright photos`);
      assert.equal(view.color, 'rgb(255, 255, 255)', `${width}px ${theme}: heart should contrast against its background`);
      assert.equal(view.padding, '0px');
      assert.ok(view.label);
    }
    await browser.evaluate(`document.querySelector('.attr-heart').click()`);
    assert.equal(await browser.evaluate(`document.querySelector('.attr-heart').getAttribute('aria-pressed')`), 'true');
    assert.equal(await browser.evaluate(`getComputedStyle(document.querySelector('.attr-heart')).color`), 'rgb(251, 113, 133)');
    assert.equal(await browser.evaluate(`location.pathname`), '/attractions', 'tapping favorite should not open the card');
    await browser.evaluate(`document.querySelector('.attr-heart').click()`);
    assert.equal(await browser.evaluate(`document.querySelector('.attr-heart').getAttribute('aria-pressed')`), 'false');
  }
  assert.deepEqual(browser.writes, []);
});
