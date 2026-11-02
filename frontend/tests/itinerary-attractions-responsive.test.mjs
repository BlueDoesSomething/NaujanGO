import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Real Chromium layout/input checks with mocked APIs. No production API,
// account, saved itinerary, payment, email, map tiles or weather is contacted.
const browserPath = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
].find(candidate => candidate && existsSync(candidate));
const canRun = browserPath && typeof WebSocket !== 'undefined';
const options = { skip: canRun ? false : 'Requires Node 22+ and an installed Chromium browser (CHROME_PATH)', timeout: 45000 };
const frontendRoot = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();
const attractions = Array.from({ length: 13 }, (_, index) => ({
  id: index + 1, name: index ? `Fixture Attraction ${index + 1}` : 'Naujan Lake',
  description: 'Offline layout fixture', location: 'Naujan', category: 'nature',
  avg_rating: 4.5, review_count: 100 - index, entrance_fee: 0,
  image_url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Cpath fill="%23166534" d="M0 0h400v300H0z"/%3E%3C/svg%3E'
}));
let vite, browser, profile, client, origin, initScript;
const writes = [];

const connect = async url => {
  const socket = new WebSocket(url);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map(), events = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const entry = pending.get(message.id);
      if (!entry) return;
      clearTimeout(entry.timer); pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result);
    } else events.get(message.method)?.(message.params);
  });
  socket.addEventListener('close', () => {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer); entry.reject(new Error('Browser connection closed'));
    }
    pending.clear();
  });
  return {
    on: (method, handler) => events.set(method, handler),
    send: (method, params = {}) => new Promise((resolve, reject) => {
      const commandId = ++id;
      const timer = setTimeout(() => { pending.delete(commandId); reject(new Error(`Browser command timed out: ${method}`)); }, 30000);
      pending.set(commandId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: commandId, method, params }));
    }),
    close: () => socket.close()
  };
};
const evaluate = async expression => {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    .catch(error => { throw new Error(`${error.message}: ${expression.slice(0, 160)}`); });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = expression => evaluate(`new Promise(resolve => {
  const ready = () => { if (${expression}) { observer?.disconnect(); resolve(true); return true; } return false; };
  let observer;
  if (ready()) return;
  observer = new MutationObserver(ready);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
})`);
const frame = () => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

before(async () => {
  if (!canRun) return;
  vite = await createServer({ root: frontendRoot,
    server: { host: '127.0.0.1', port: 0, open: false, https: false, strictPort: true }, logLevel: 'error' });
  await vite.listen();
  origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  await mkdir(tempRoot, { recursive: true });
  profile = await mkdtemp(path.join(tempRoot, 'itinerary-responsive-'));
  browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  const debugUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Could not start Chromium')), 20000);
    browser.on('error', error => { clearTimeout(timer); reject(error); });
    browser.stderr.on('data', chunk => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(new URL(match[1])); }
    });
  });
  const pages = await (await fetch(`http://${debugUrl.host}/json/list`)).json();
  client = await connect(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  client.on('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (/^\/(api|auth)(\/|$)/.test(url.pathname)) {
        let body = {};
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) writes.push(url.pathname);
        if (url.pathname.endsWith('/auth/profile')) body = { user: { user_id: 101, username: 'layout_fixture', role: 'user', email_verified: true } };
        if (url.pathname.endsWith('/attractions')) body = { data: attractions };
        if (url.pathname.endsWith('/itinerary')) body = { data: [] };
        if (url.pathname.endsWith('/itinerary/templates/list')) body = [];
        if (url.pathname.endsWith('/hotels')) body = [];
        await client.send('Fetch.fulfillRequest', { requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
            { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Credentials', value: 'true' },
            { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
            { name: 'Access-Control-Allow-Headers', value: request.headers['Access-Control-Request-Headers'] || 'Content-Type, Authorization' }],
          body: Buffer.from(JSON.stringify(body)).toString('base64') });
      } else if (url.origin === origin) await client.send('Fetch.continueRequest', { requestId });
      else await client.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    } catch { /* A cancelled page may close before an image/font request resumes. */ }
  });
  await client.send('Page.enable');
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
}, { timeout: 45000 });

after(async () => {
  if (client) {
    const exited = once(browser, 'exit');
    await client.send('Browser.close').catch(() => {}); await exited; client.close();
  } else if (browser) browser.kill();
  if (vite) await vite.close();
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

const openBuilder = async (width, height = 900, theme = 'light') => {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, mobile: width <= 768, deviceScaleFactor: 1 });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: width <= 768, maxTouchPoints: 1 });
  if (initScript) await client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: initScript });
  const script = await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.clear(); sessionStorage.clear(); localStorage.setItem('naujan:dark-mode', ${JSON.stringify(String(theme === 'dark'))});`
  });
  initScript = script.identifier;
  await client.send('Page.navigate', { url: `${origin}/itinerary` });
  await waitFor(`document.querySelector('.itinerary-attraction-card')`);
  // Suppress decorative entry animations only, so assertions inspect settled
  // card geometry instead of an animation's opacity/vertical translation.
  await evaluate(`(() => { const style = document.createElement('style');
    style.textContent = '.itinerary-attraction-card { animation: none !important; opacity: 1 !important; }';
    document.head.appendChild(style); })()`);
  await frame();
};
const layout = () => evaluate(`(() => {
  const grid = document.querySelector('.itinerary-attraction-grid');
  const cards = [...grid.querySelectorAll('.itinerary-attraction-card')];
  const rect = node => { const r = node.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
  return { viewport: innerWidth, pageWidth: document.documentElement.scrollWidth,
    grid: rect(grid), first: rect(cards[0]), last: rect(cards.at(-1)), firstTitle: rect(cards[0].querySelector('h4')),
    names: cards.map(card => card.querySelector('h4').textContent), display: getComputedStyle(grid).display,
    scrollLeft: grid.scrollLeft, maxScroll: grid.scrollWidth - grid.clientWidth };
})()`);

for (const width of [320, 375, 393, 480, 640, 768]) {
  test(`all mobile attractions are reachable at ${width}px, with Naujan Lake fully visible first`, options, async () => {
    await openBuilder(width);
    const start = await layout();
    assert.equal(start.names.length, attractions.length, 'hidden desktop pagination must not limit mobile to eight attractions');
    assert.equal(start.names[0], 'Naujan Lake');
    assert.equal(start.display, 'flex'); assert.ok(start.maxScroll > 0);
    assert.ok(start.first.left >= start.grid.left - 1 && start.first.right <= start.grid.right + 1,
      `First card clipped: ${JSON.stringify(start.first)} inside ${JSON.stringify(start.grid)}`);
    assert.ok(start.firstTitle.top >= start.first.top - 1, 'the attraction title must not be vertically clipped');
    assert.ok(start.pageWidth <= start.viewport + 1, 'the document must not scroll sideways with the attraction rail');
    await evaluate(`document.querySelector('.itinerary-attraction-grid').scrollTo({ left: 100000, behavior: 'instant' })`);
    await frame();
    const end = await layout();
    assert.equal(end.names.at(-1), 'Fixture Attraction 13');
    assert.ok(end.last.left >= end.grid.left - 1 && end.last.right <= end.grid.right + 1, 'last card must scroll fully into view');
    await evaluate(`document.querySelector('.itinerary-attraction-grid').scrollTo({ left: 0, behavior: 'instant' })`);
    await frame();
    assert.ok(Math.abs((await layout()).scrollLeft) <= 1, 'the start must remain reachable after scrolling back');
    if (width === 393) {
      await evaluate(`document.querySelector('.itinerary-attraction-grid').scrollIntoView({ block: 'center', behavior: 'instant' })`);
      await frame();
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
      await writeFile(path.join(tempRoot, 'itinerary-attractions-mobile-light.png'), Buffer.from(screenshot.data, 'base64'));
    }
  });
}

for (const width of [769, 1024]) {
  test(`desktop attraction pagination stays visible at ${width}px`, options, async () => {
    await openBuilder(width);
    assert.equal((await layout()).display, 'grid'); assert.equal((await layout()).names.length, 8);
    assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.sidebarPaginationWrap')).display`), 'none');
  });
}

test('desktop retains eight-card pagination and switching to mobile exposes the complete list', options, async () => {
  await openBuilder(1280);
  assert.equal((await layout()).display, 'grid'); assert.equal((await layout()).names.length, 8);
  await evaluate(`document.querySelector('.sidebarPaginationWrap button:last-child').click()`);
  await waitFor(`document.querySelector('.itinerary-attraction-card h4')?.textContent === 'Fixture Attraction 9'`);
  assert.equal((await layout()).names.length, 5);
  await client.send('Emulation.setDeviceMetricsOverride', { width: 393, height: 852, mobile: true, deviceScaleFactor: 1 });
  await waitFor(`document.querySelectorAll('.itinerary-attraction-card').length === 13`); await frame();
  const mobile = await layout();
  assert.equal(mobile.names[0], 'Naujan Lake'); assert.ok(Math.abs(mobile.scrollLeft) <= 1);
});

test('search resets the mobile rail and a single match stays fully visible', options, async () => {
  await openBuilder(393);
  await evaluate(`document.querySelector('.itinerary-attraction-grid').scrollTo({ left: 100000, behavior: 'instant' })`);
  await frame();
  await evaluate(`(() => { const input = document.querySelector('.itinerary-search-input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Naujan Lake');
    input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  await waitFor(`document.querySelectorAll('.itinerary-attraction-card').length === 1`); await frame();
  const single = await layout();
  assert.equal(single.names[0], 'Naujan Lake'); assert.ok(Math.abs(single.scrollLeft) <= 1);
  assert.ok(single.first.left >= single.grid.left - 1 && single.first.right <= single.grid.right + 1);
  await evaluate(`document.querySelector('.itinerary-search-clear').click()`);
  await waitFor(`document.querySelectorAll('.itinerary-attraction-card').length === 13`); await frame();
  assert.ok(Math.abs((await layout()).scrollLeft) <= 1);
});

test('dark-mode rail supports keyboard scrolling and adding an attraction without a server write', options, async () => {
  await openBuilder(393, 852, 'dark');
  await evaluate(`document.querySelector('.itinerary-attraction-grid').focus()`);
  assert.equal(await evaluate(`document.activeElement.classList.contains('itinerary-attraction-grid')`), true);
  await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
  await evaluate(`new Promise(resolve => { const grid = document.querySelector('.itinerary-attraction-grid');
    if (grid.scrollLeft > 0) return resolve(true); grid.addEventListener('scroll', () => resolve(true), { once: true }); })`);
  assert.ok((await layout()).scrollLeft > 0);
  await evaluate(`document.querySelectorAll('.atc-day-primary')[1].click()`);
  await waitFor(`document.querySelector('.ib-day-content')?.textContent.includes('Fixture Attraction 2')`);
  assert.ok((await layout()).scrollLeft > 0, 'adding a place must not reset browsing to the first card');
  assert.deepEqual(writes.filter(url => !url.startsWith('/api/languages/preference/')), [],
    'browsing and local day selection must not save an itinerary (the app may update its mocked language preference)');
});

test('returning from templates restores the attraction rail at its first card', options, async () => {
  await openBuilder(393, 852);
  await evaluate(`document.querySelector('.itinerary-attraction-grid').scrollTo({ left: 100000, behavior: 'instant' })`);
  await frame();
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Templates').click()`);
  await waitFor(`!document.querySelector('.itinerary-attraction-grid')`);
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Attractions').click()`);
  await waitFor(`document.querySelectorAll('.itinerary-attraction-card').length === 13`); await frame();
  const restored = await layout();
  assert.equal(restored.names[0], 'Naujan Lake'); assert.ok(Math.abs(restored.scrollLeft) <= 1);
});

test('native touch gestures scroll the attraction rail without trapping vertical page scrolling', options, async () => {
  await openBuilder(393, 852);
  await evaluate(`document.querySelector('.itinerary-attraction-grid').scrollIntoView({ block: 'center', behavior: 'instant' })`);
  await frame();
  const point = await evaluate(`(() => { const r = document.querySelector('.itinerary-attraction-grid').getBoundingClientRect();
    return { x: Math.round(r.right - 40), y: Math.round((r.top + r.bottom) / 2) }; })()`);
  const swipe = async (dx, dy) => {
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    for (let step = 1; step <= 8; step++) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + dx * step / 8, y: point.y + dy * step / 8 }] });
      await frame();
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipe(-200, 0);
  await frame();
  assert.ok((await layout()).scrollLeft > 0, 'a horizontal finger swipe must advance the rail');
  const before = await evaluate('scrollY');
  await swipe(0, -160);
  await frame();
  assert.ok(await evaluate('scrollY') > before, 'a vertical finger swipe over the rail must still scroll the page');
});
