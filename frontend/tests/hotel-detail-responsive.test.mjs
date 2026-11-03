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

// Real Chromium layout checks for the hotel detail page with mocked APIs. No
// production hotel, booking, payment, map tile or weather service is contacted.
const browserPath = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
].find(candidate => candidate && existsSync(candidate));
const canRun = browserPath && typeof WebSocket !== 'undefined';
const options = { skip: canRun ? false : 'Requires Node 22+ and an installed Chromium browser (CHROME_PATH)', timeout: 45000 };
const root = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();

const hotel = {
  id: 46, hotel_id: 46,
  name: 'Naujan Travellers Inn & Resto Bar',
  location: 'Bacungan, Naujan, Oriental Mindoro',
  description: 'A riverside stay with restaurant, free parking and airy rooms near the town plaza.',
  image: '',
  price_per_night: 260,
  phone: '+63 912 345 6789',
  email: 'stay@naujantravellers.example',
  amenities: ['Free Wi-Fi', 'Air Conditioning', 'Parking', 'Restaurant'],
  legitimacy: { business_permit: 'BP-2026-001', dot: null, philgeps: 'PGS-2026-014' },
  rooms_total: 22,
  booking_enabled: true,
  rating: 4.4
};

const rooms = [
  { room_id: 1, room_type_name: 'Standard Queen', price_per_night: 260, quantity: 12, quantity_available: 12,
    max_guests: 2, amenities: ['Air Conditioning', 'Wi-Fi'], image_urls: [], primary_image_url: '' },
  { room_id: 2, room_type_name: 'Family Suite', price_per_night: 780, quantity: 10, quantity_available: 10,
    max_guests: 4, amenities: ['Air Conditioning', 'Wi-Fi'], image_urls: [], primary_image_url: '' }
];

let vite, browser, profile, client, origin, initScript;
const errors = [];
const connect = async (url) => {
  const socket = new WebSocket(url);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const events = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const entry = pending.get(message.id);
      if (!entry) return;
      clearTimeout(entry.timer);
      pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message));
      else entry.resolve(message.result);
    } else {
      events.get(message.method)?.(message.params);
    }
  });
  return {
    on: (method, handler) => events.set(method, handler),
    send: (method, params = {}) => new Promise((resolve, reject) => {
      const commandId = ++id;
      const timer = setTimeout(() => {
        pending.delete(commandId);
        reject(new Error(`Browser command timed out: ${method}`));
      }, 30000);
      pending.set(commandId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: commandId, method, params }));
    }),
    close: () => socket.close()
  };
};

const evaluate = async (expression) => {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};

const waitFor = expression => evaluate(`new Promise((resolve, reject) => {
  let observer; const timer = setTimeout(() => { observer?.disconnect(); reject(new Error('Not ready')); }, 15000);
  const ready = () => { if (${expression}) { clearTimeout(timer); observer?.disconnect(); resolve(true); return true; } return false; };
  if (ready()) return; observer = new MutationObserver(ready);
  observer.observe(document, { childList: true, subtree: true, attributes: true });
})`);

const frame = () => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

const fulfill = (requestId, body, responseCode = 200) => client.send('Fetch.fulfillRequest', {
  requestId, responseCode,
  responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
  body: Buffer.from(JSON.stringify(body)).toString('base64')
});

before(async () => {
  if (!canRun) return;
  await mkdir(tempRoot, { recursive: true });
  profile = await mkdtemp(path.join(tempRoot, 'hotel-detail-layout-'));
  vite = await createServer({
    // No project config: the tests intercept every /api call themselves, and
    // skipping @vitejs/plugin-react's Babel pass (the source of the
    // "AdminDashboard.jsx exceeds 500KB" deopt on each run) lets esbuild do the
    // JSX transform. Reused cacheDir keeps dependency pre-bundling warm.
    root, configFile: false,
    cacheDir: path.join(root, 'node_modules/.vite-hotel-detail-tests'),
    esbuild: { jsx: 'automatic' },
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, open: false, https: false }
  });
  await vite.listen();
  origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = spawn(browserPath, [
    '--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const debugUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Could not start Chromium')), 20000);
    browser.on('error', error => { clearTimeout(timer); reject(error); });
    browser.stderr.on('data', chunk => {
      const match = chunk.toString().match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(new URL(match[1])); }
    });
  });
  const pages = await (await fetch(`http://${debugUrl.host}/json/list`)).json();
  client = await connect(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  client.on('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (/^\/(api|auth)(\/|$)/.test(url.pathname)) {
        let body = {};
        if (url.pathname.endsWith('/auth/profile')) body = { user: { user_id: 101, username: 'layout_fixture', role: 'user', email_verified: true } };
        else if (url.pathname === '/api/hotels') body = { data: [hotel] };
        else if (url.pathname.endsWith('/reviews')) body = [];
        else if (url.pathname.endsWith('/rooms')) body = rooms;
        else if (url.pathname.endsWith('/average-rating')) body = { average: 4.4, total: 3 };
        else if (url.pathname === '/api/languages') body = [];
        else if (url.pathname.includes('/languages/preference/')) body = { language_code: 'en' };
        else if (url.pathname.endsWith('/statistics')) body = {};
        else body = [];
        await fulfill(requestId, body);
      } else if (url.origin === origin && !url.pathname.startsWith('/socket.io')) {
        await client.send('Fetch.continueRequest', { requestId });
      } else {
        await client.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      }
    } catch { /* navigations cancel pending requests */ }
  });
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
}, { timeout: 45000 });

after(async () => {
  if (client) {
    const exited = once(browser, 'exit');
    await client.send('Browser.close').catch(() => {});
    await exited;
    client.close();
  } else if (browser) browser.kill();
  if (vite) await vite.close();
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});

// Waits until the page has applied its measured navbar clearance for the
// current viewport (the hero reserves it through --hd-hero-nav-gap).
const settleGap = () => evaluate(`new Promise(resolve => {
  const start = performance.now();
  const wanted = () => {
    const nav = document.querySelector('.navbar'), hero = document.querySelector('.hd-hero');
    if (!nav || !hero) return null;
    return Math.max(0, Math.round(nav.offsetHeight - (hero.getBoundingClientRect().top + scrollY))) + 'px';
  };
  const poll = () => {
    const want = wanted();
    if (want && document.documentElement.style.getPropertyValue('--hd-hero-nav-gap') === want) return resolve(true);
    if (performance.now() - start > 3000) return resolve(false);
    requestAnimationFrame(poll);
  };
  poll();
})`);

const setViewport = async (width, height) => {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, mobile: width <= 768, deviceScaleFactor: 1 });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: width <= 768, maxTouchPoints: 1 });
};

// Loads the app once; every further width only re-runs the media queries on the
// already-loaded page instead of paying for another full bundle reload.
let booted = false;
const open = async (width = 393, height = 780) => {
  await setViewport(width, height);
  if (booted) {
    await evaluate('window.scrollTo(0, 0)');
    await settleGap();
    await frame();
    return;
  }
  booted = true;
  if (initScript) await client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: initScript });
  const script = await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.clear(); sessionStorage.clear();
      localStorage.setItem('naujan:dark-mode', 'false');
      document.cookie = 'csrf_token=offline-layout-fixture; path=/';`
  });
  initScript = script.identifier;
  await client.send('Page.navigate', { url: `${origin}/hotels/46` });
  await client.send('Page.bringToFront');
  await waitFor(`document.querySelector('.hd-gallery') && document.querySelector('.hd-hero-title')`);
  await settleGap();
  await frame();
};

const measure = () => evaluate(`(() => {
  const box = selector => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    return { selector, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left),
      right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height),
      scrollHeight: node.scrollHeight, clientHeight: node.clientHeight,
      marginTop: cs.marginTop, marginBottom: cs.marginBottom, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom };
  };
  // The navbar slides in with a transform, so measure its laid-out box
  // (offset*) rather than the animated rect: no waiting on the animation.
  const navEl = document.querySelector('.navbar');
  const navbar = box('.navbar');
  navbar.top = navEl.offsetTop;
  navbar.bottom = navEl.offsetTop + navEl.offsetHeight;
  return {
    viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
    scrollY: window.scrollY,
    navGap: getComputedStyle(document.documentElement).getPropertyValue('--hd-hero-nav-gap'),
    navbarScrolled: document.querySelector('.navbar').classList.contains('scrolled'),
    navbar,
    hero: box('.hd-hero'), inner: box('.hd-hero-inner'), back: box('.hd-back'),
    backText: document.querySelector('.hd-back').textContent.trim(),
    backIcons: document.querySelectorAll('.hd-back svg').length,
    body: box('.hd-hero-body'), title: box('.hd-hero-title'), loc: box('.hd-hero-loc'),
    pills: box('.hd-hero-pills'), lastPill: box('.hd-hero-pills > .hd-pill:last-child'),
    heroImg: box('.hd-hero-img'),
    legitWrap: box('.hd-legit-wrap'), legit: box('.hd-legit'),
    layout: box('.hd-layout'), gallery: box('.hd-gallery')
  };
})()`);

// Mobile widths where the fixed-height hero used to clip and the fixed navbar
// used to leave a second 72px band under the accreditation badges.
for (const [width, height] of [[320, 568], [360, 640], [393, 780], [480, 900], [640, 900], [768, 1024]]) {
  test(`hotel hero fits its content and badges sit against the first card at ${width}×${height}`, options, async () => {
    await open(width, height);
    const view = await measure();

    assert.ok(view.viewport.scrollWidth <= width + 1, `horizontal overflow: ${view.viewport.scrollWidth}`);
    // Nothing is clipped: the hero box is at least as tall as its content and
    // the last pill (the one that used to be cut in half) stays inside it.
    assert.ok(view.hero.scrollHeight <= view.hero.clientHeight, `hero clips content: ${JSON.stringify(view.hero)}`);
    assert.ok(view.lastPill.bottom <= view.hero.bottom - 8, `last pill clipped: ${JSON.stringify(view)}`);
    assert.ok(view.body.bottom <= view.hero.bottom, `hero body overflows: ${JSON.stringify(view)}`);
    assert.ok(view.hero.height >= 240, 'hero keeps its minimum height');

    // The hero starts below the fixed navbar and nothing overlaps it.
    assert.ok(view.back.top >= view.navbar.bottom, `back button under navbar: ${JSON.stringify(view)}`);
    assert.ok(view.back.bottom <= view.body.top, `back button overlaps title block: ${JSON.stringify(view)}`);
    assert.ok(view.title.bottom <= view.loc.top, `title overlaps location: ${JSON.stringify(view)}`);
    assert.ok(view.heroImg.height >= view.hero.height - 1, 'hero image fills the grown hero');

    // No second 72px spacer between the badges and the first card.
    assert.equal(view.layout.marginTop, '0px');
    const badgeGap = view.gallery.top - view.legit.bottom;
    assert.ok(badgeGap >= 8 && badgeGap <= 32, `badge-to-card gap is ${badgeGap}px`);

    // Single arrow: the icon is the arrow, the label must not repeat it.
    assert.equal(view.backIcons, 1);
    assert.ok(!/[←‹<]/.test(view.backText), `label still carries an arrow: ${view.backText}`);
    assert.ok(view.backText.includes('Back to Hotels'), view.backText);
  });
}

test('hotel hero keeps the designed desktop height and full-bleed image', options, async () => {
  await open(1280, 900);
  const view = await measure();
  assert.ok(view.viewport.scrollWidth <= 1281, `horizontal overflow: ${view.viewport.scrollWidth}`);
  assert.ok(view.hero.height >= 320, `desktop hero shrank: ${view.hero.height}`);
  assert.ok(view.hero.scrollHeight <= view.hero.clientHeight, 'desktop hero must not clip');
  assert.ok(view.lastPill.bottom <= view.hero.bottom - 8, 'desktop pills clipped');
  assert.equal(view.layout.marginTop, '0px');
  const badgeGap = view.gallery.top - view.legit.bottom;
  assert.ok(badgeGap >= 8 && badgeGap <= 32, `badge-to-card gap is ${badgeGap}px`);
  assert.equal(view.backIcons, 1);
  assert.ok(!/[←‹<]/.test(view.backText), view.backText);
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(tempRoot, 'hotel-detail-desktop.png'), Buffer.from(screenshot.data, 'base64'));
});

test('short landscape phones keep the hero readable without clipping', options, async () => {
  await open(640, 360);
  const view = await measure();
  assert.ok(view.hero.scrollHeight <= view.hero.clientHeight, `clipped: ${JSON.stringify(view.hero)}`);
  assert.ok(view.lastPill.bottom <= view.hero.bottom - 8, JSON.stringify(view));
  assert.ok(view.back.top >= view.navbar.bottom, JSON.stringify(view.back));
  assert.ok(view.viewport.scrollWidth <= 641, `overflow: ${view.viewport.scrollWidth}`);
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(tempRoot, 'hotel-detail-mobile-spacing.png'), Buffer.from(screenshot.data, 'base64'));
});
