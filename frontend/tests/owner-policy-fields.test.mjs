import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Owner control of the booking-policy wording: the three standard policy lines
// are stored per hotel, prefilled in the owner's Edit Hotel form and sent back
// on save, then shown on the public page. Everything is mocked — no backend,
// hotel or account is contacted.
const browserPath = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
].find(candidate => candidate && existsSync(candidate));
const canRun = browserPath && typeof WebSocket !== 'undefined';
const options = { skip: canRun ? false : 'Requires Node 22+ and an installed Chromium browser (CHROME_PATH)', timeout: 60000 };
const root = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();

const ownerTexts = {
  payment_terms_text: 'Pay at the front desk on arrival.',
  modification_policy_text: 'One free date change per booking.',
  noshow_policy_text: 'Late arrivals must call the hotel.'
};

const hotel = {
  hotel_id: 46, id: 46,
  name: 'Naujan Travellers Inn & Resto Bar',
  location: 'Bacungan, Naujan, Oriental Mindoro',
  description: 'Riverside stay with restaurant and parking.',
  price_per_night: 260, currency: 'PHP', rating: 4.4,
  amenities: 'Free Wi-Fi, Parking, Restaurant',
  image_url: '', image_urls: [],
  allowed_payment_methods: ['card', 'gcash', 'pay_at_property'],
  reservation_fee: null, map_url: '',
  contact_phone: '+63 912 345 6789', email: '', contact_email: 'stay@example.test',
  latitude: '', longitude: '',
  rooms_total: 22, rooms_available: 18, is_active: 1, booking_enabled: true,
  cancellation_type: 'free_until', free_cancellation_days: 1, balance_due_days: 1,
  check_in_time: '13:00', check_out_time: '12:00',
  house_rules: 'Pets allowed', custom_policy_text: 'Refunds are not allowed',
  ...ownerTexts
};

const rooms = [
  { room_id: 1, room_type_name: 'Standard Queen', price_per_night: 260, capacity: 2,
    quantity: 12, quantity_available: 12, is_active: 1, amenities: [], room_features: [],
    image_urls: [], primary_image_url: '' },
  { room_id: 2, room_type_name: 'Family Suite', price_per_night: 780, capacity: 4,
    quantity: 10, quantity_available: 10, is_active: 1, amenities: [],
    room_features: ['Owner-provided garden terrace'], image_urls: [], primary_image_url: '' }
];

let vite, browser, profile, client, origin, initScript;
const errors = [];
const writes = [];

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
  let observer; const timer = setTimeout(() => { observer?.disconnect(); reject(new Error('Not ready')); }, 20000);
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
  profile = await mkdtemp(path.join(tempRoot, 'owner-policy-fields-'));
  vite = await createServer({
    // No project config: skip @vitejs/plugin-react's Babel pass (esbuild does
    // the JSX transform) and reuse a warm dependency-prebundle cache across runs.
    root, configFile: false,
    cacheDir: path.join(root, 'node_modules/.vite-owner-policy-tests'),
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
        const method = request.method || 'GET';
        let body = {};
        if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
          // The owner form's save: record exactly what would reach the API.
          let payload = {};
          try { payload = request.postData ? JSON.parse(request.postData) : {}; } catch { payload = {}; }
          writes.push({ method, pathname: url.pathname, payload });
          if (method === 'PUT' && url.pathname === '/api/owner/hotels/46') Object.assign(hotel, payload);
          body = { success: true };
        } else if (url.pathname.endsWith('/auth/profile')) {
          body = { user: { user_id: 7, username: 'owner_fixture', first_name: 'Ora', role: 'owner', email: 'ora@example.test', email_verified: true } };
        } else if (url.pathname === '/api/owner/hotels') {
          body = [hotel];
        } else if (url.pathname === '/api/owner/profile') {
          body = { authorization: 'full', businessProfile: { verification_status: 'verified' } };
        } else if (url.pathname === '/api/hotels') {
          body = { data: [{ ...hotel, phone: hotel.contact_phone, email: hotel.contact_email,
            amenities: [], pricePerNight: hotel.price_per_night }] };
        } else if (url.pathname === '/api/hotels/46/rooms') {
          body = rooms;
        } else if (url.pathname.endsWith('/average-rating')) {
          body = { average: 4.4, total: 3 };
        } else if (url.pathname.endsWith('/statistics') || url.pathname.endsWith('/stats')) {
          body = {};
        } else if (url.pathname === '/api/languages') {
          body = [];
        } else if (url.pathname.includes('/languages/preference/')) {
          body = { language_code: 'en' };
        } else {
          body = [];
        }
        await fulfill(requestId, body);
      } else if (url.origin === origin) {
        await client.send('Fetch.continueRequest', { requestId });
      } else {
        await client.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      }
    } catch { /* navigations cancel pending requests */ }
  });
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
}, { timeout: 60000 });

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

const clickText = (selector, text) => evaluate(`(() => {
  const node = [...document.querySelectorAll(${JSON.stringify(selector)})]
    .find(el => el.textContent.trim().includes(${JSON.stringify(text)}));
  if (!node) return false;
  node.click();
  return true;
})()`);

const readInput = label => evaluate(`(() => {
  const labelNode = [...document.querySelectorAll('label')]
    .find(el => el.textContent.trim().startsWith(${JSON.stringify(label)}));
  return labelNode ? ((labelNode.querySelector('input') || {}).value ?? null) : null;
})()`);

const typeInto = (label, value) => evaluate(`(() => {
  const labelNode = [...document.querySelectorAll('label')]
    .find(el => el.textContent.trim().startsWith(${JSON.stringify(label)}));
  const input = labelNode && labelNode.querySelector('input');
  if (!input) return false;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, ${JSON.stringify(value)});
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
})()`);

test('owner policy edits persist in the save and are shown to guests without invented content', options, async () => {
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, mobile: false, deviceScaleFactor: 1 });
  if (initScript) await client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: initScript });
  const script = await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.clear(); sessionStorage.clear();
      localStorage.setItem('naujan:dark-mode', 'false');
      document.cookie = 'csrf_token=offline-owner-fixture; path=/';`
  });
  initScript = script.identifier;
  await client.send('Page.navigate', { url: `${origin}/owner` });
  await waitFor(`document.querySelector('#owner-nav')`);

  // Hotels tab → open the editor for the fixture hotel.
  assert.ok(await clickText('#owner-nav .gov-nav-btn', 'Hotels'), 'hotels nav button not found');
  await waitFor(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Edit')`);
  assert.ok(await clickText('button', 'Edit'));
  await waitFor(`[...document.querySelectorAll('label')].some(l => l.textContent.trim().startsWith('Payment terms line'))`);

  // The stored owner wording is prefilled, not the platform defaults.
  assert.equal(await readInput('Payment terms line'), ownerTexts.payment_terms_text);
  assert.equal(await readInput('Modification policy line'), ownerTexts.modification_policy_text);
  assert.equal(await readInput('No-show policy line'), ownerTexts.noshow_policy_text);
  const preview = await evaluate(`document.querySelector('label input[placeholder="Payment terms"]').closest('label').parentElement.querySelector('ul').textContent`);
  for (const text of Object.values(ownerTexts)) assert.ok(preview.includes(text), preview);

  // Rewrite one line, clear another, and save. The modal closes on success.
  const nextNoShow = 'No-shows forfeit the whole night.';
  assert.ok(await typeInto('No-show policy line', nextNoShow));
  assert.ok(await typeInto('Payment terms line', ''));
  assert.ok(await typeInto('Currency', 'EUR'));
  assert.ok(await evaluate(`(() => {
    const label = [...document.querySelectorAll('label')].find(el => el.textContent.trim().startsWith('Cancellation policy'));
    const select = label.querySelector('select');
    select.value = 'non_refundable';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`));
  assert.ok(await clickText('button', 'Save Changes'));

  const isHotelSave = write => /\/owner\/hotels\/\d+$/.test(write.pathname);
  const deadline = Date.now() + 15000;
  while (!writes.some(isHotelSave) && Date.now() < deadline) await frame();

  const save = writes.find(isHotelSave);
  assert.ok(save, `hotel save never reached the API; writes: ${JSON.stringify(writes.map(w => `${w.method} ${w.pathname}`))}`);
  assert.equal(save.method, 'PUT');
  // Cleared line is sent as null: the API stores NULL and the booking card
  // falls back to the platform default wording.
  assert.equal(save.payload.payment_terms_text, null, JSON.stringify(save.payload, null, 2));
  // Untouched lines keep the owner's stored wording all the way through.
  assert.equal(save.payload.modification_policy_text, ownerTexts.modification_policy_text);
  assert.equal(save.payload.noshow_policy_text, nextNoShow);
  assert.equal(save.payload.custom_policy_text, 'Refunds are not allowed');
  assert.equal(save.payload.house_rules, 'Pets allowed');
  assert.equal(save.payload.check_in_time, '13:00');
  assert.equal(save.payload.currency, 'EUR');
  assert.equal(save.payload.cancellation_type, 'non_refundable');

  // The editor closed and no page errors were thrown.
  await waitFor(`![...document.querySelectorAll('label')].some(l => l.textContent.trim().startsWith('Payment terms line'))`);

  // Read the saved listing as a guest using the same browser and warm app cache.
  await client.send('Page.navigate', { url: `${origin}/hotels/46` });
  await waitFor(`document.querySelectorAll('.hd-room').length === 2`);
  assert.match(await evaluate(`document.querySelector('.hd-hero-pills').textContent`), /€260/);
  assert.match(await evaluate(`document.querySelector('.hd-trust').textContent`), /non-refundable/);
  assert.doesNotMatch(await evaluate(`document.querySelector('.hd-page').textContent`), /Free cancellation|No hidden fees|Instant confirmation/i);

  // Blank room highlights must not be replaced with sample selling points.
  await evaluate(`document.querySelectorAll('.hd-room')[0].click()`);
  await waitFor(`document.querySelector('.hd-rm-panel')`);
  const emptyRoom = await evaluate(`document.querySelector('.hd-rm-panel').textContent`);
  assert.doesNotMatch(emptyRoom, /Why guests love|Modern Design|Great Views|Premium Beds|Luxury Bath|BEST RATES|Guaranteed best price|WELCOME OFFER|Instant Confirmation|Best value/i);
  assert.match(emptyRoom, /non-refundable/);
  assert.match(emptyRoom, /€260/);
  assert.match(emptyRoom, /Check-in: 1:00 PM · Check-out: 12:00 PM/);
  await evaluate(`document.querySelector('.hd-rm-close').click()`);
  await waitFor(`!document.querySelector('.hd-rm-panel')`);

  // Actual owner-provided room content remains visible.
  await evaluate(`document.querySelectorAll('.hd-room')[1].click()`);
  await waitFor(`document.querySelector('.hd-rm-panel')`);
  assert.match(await evaluate(`document.querySelector('.hd-rm-panel').textContent`), /Owner-provided garden terrace/);
  await evaluate(`document.querySelector('.hd-rm-close').click()`);
  await waitFor(`!document.querySelector('.hd-rm-panel')`);

  await evaluate(`document.querySelector('.hd-cta').click()`);
  await waitFor(`document.querySelector('.hd-bm-policies')`);
  const policies = await evaluate(`document.querySelector('.hd-bm-policies').textContent`);
  assert.ok(policies.includes(ownerTexts.modification_policy_text), policies);
  assert.ok(policies.includes(nextNoShow), policies);
  assert.ok(policies.includes('Payment terms'), 'cleared field falls back to default');
  assert.ok(policies.includes('Refunds are not allowed'));
  assert.match(policies, /Check-in from 13:00/);
  assert.doesNotMatch(policies, /Free cancellation/);
  assert.match(await evaluate(`document.querySelector('.hd-bm-side').textContent`), /€0\.00/);
  assert.equal(writes.filter(write => write.pathname === '/api/bookings/hotels').length, 0, 'viewing the policy must never book');
  assert.deepEqual(errors, [], errors.join('\n'));
});
