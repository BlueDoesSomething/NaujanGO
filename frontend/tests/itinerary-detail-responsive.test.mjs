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

// Full application + global styles, not an isolated component: reproduce the
// itinerary/sidebar/nav/chat overlap with mocked APIs and no production writes.
const browserPath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome']
  .find(candidate => candidate && existsSync(candidate));
const canRun = browserPath && typeof WebSocket !== 'undefined';
const options = { skip: canRun ? false : 'Requires Node 22+ and Chromium (CHROME_PATH)', timeout: 45000 };
const root = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();
const itinerary = { itinerary_id: 46, name: 'Naujan day trip', description: 'A saved trip for offline layout tests.',
  creator_name: 'Fixture Guest', start_date: '2026-11-02', end_date: '2026-11-02', duration_days: 1,
  status: 'in-progress', total_distance: 12, total_time: 180, total_budget: 1234.56,
  items: Array.from({ length: 5 }, (_, index) => ({ id: index + 1, day_number: 1, order_in_day: index,
    custom_name: index === 4 ? 'LongDestinationName'.repeat(12) : `Fixture destination ${index + 1}`,
    custom_location: 'Naujan, Oriental Mindoro', duration_minutes: 60, estimated_cost: 10, completed: false,
    notes: index === 4 ? 'LongNoteWithoutSpaces'.repeat(12) : '' })) };
let vite, browser, profile, client, origin, initScript;
let failArchive = false, holdArchive = false, heldArchive, heldReady;
const writes = [], nativeDialogs = [], errors = [];
const connect = async url => {
  const socket = new WebSocket(url); await once(socket, 'open');
  let id = 0;
  const pending = new Map(), events = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const item = pending.get(message.id); if (!item) return;
      clearTimeout(item.timer); pending.delete(message.id);
      if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
    } else events.get(message.method)?.(message.params);
  });
  return { on: (method, handler) => events.set(method, handler), close: () => socket.close(),
    send: (method, params = {}) => new Promise((resolve, reject) => {
      const commandId = ++id;
      const timer = setTimeout(() => { pending.delete(commandId); reject(new Error(`Timed out: ${method}`)); }, 30000);
      pending.set(commandId, { resolve, reject, timer }); socket.send(JSON.stringify({ id: commandId, method, params }));
    }) };
};
const evaluate = async expression => {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const waitFor = expression => evaluate(`new Promise((resolve, reject) => {
  let observer; const timer = setTimeout(() => { observer?.disconnect(); reject(new Error('Not ready: ' + ${JSON.stringify(expression)})); }, 15000);
  const ready = () => { if (${expression}) { clearTimeout(timer); observer?.disconnect(); resolve(true); return true; } return false; };
  if (ready()) return; observer = new MutationObserver(ready);
  observer.observe(document, { childList: true, subtree: true, attributes: true });
})`);
const frame = () => evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
const key = async (key, code = key, modifiers = 0) => {
  await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode: key === 'Tab' ? 9 : key === 'Escape' ? 27 : 13 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers });
};
const fulfill = (requestId, body, responseCode = 200) => client.send('Fetch.fulfillRequest', { requestId, responseCode,
  responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });

before(async () => {
  if (!canRun) return;
  await mkdir(tempRoot, { recursive: true }); profile = await mkdtemp(path.join(tempRoot, 'itinerary-detail-layout-'));
  vite = await createServer({ root, cacheDir: path.join(profile, 'vite-cache'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, open: false, https: false } });
  await vite.listen(); origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run',
    '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const debugUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Could not start Chromium')), 20000);
    browser.on('error', error => { clearTimeout(timer); reject(error); });
    browser.stderr.on('data', chunk => { const match = chunk.toString().match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timer); resolve(new URL(match[1])); } });
  });
  const pages = await (await fetch(`http://${debugUrl.host}/json/list`)).json();
  client = await connect(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  client.on('Page.javascriptDialogOpening', async event => { nativeDialogs.push(event.message); await client.send('Page.handleJavaScriptDialog', { accept: false }); });
  client.on('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (/^\/(api|auth)(\/|$)/.test(url.pathname)) {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !url.pathname.startsWith('/api/languages/preference/')) writes.push({ path: url.pathname, method: request.method, headers: request.headers });
        let body = {};
        if (url.pathname.endsWith('/auth/profile')) body = { user: { user_id: 101, username: 'layout_fixture', role: 'user', email_verified: true, gender: 'male', user_type: 'local' } };
        if (url.pathname.endsWith('/languages')) body = [];
        if (url.pathname.includes('/languages/preference/')) body = { language_code: 'en' };
        if (url.pathname.endsWith('/attractions')) body = { data: [] };
        if (url.pathname === '/api/itinerary/46') {
          if (request.method === 'DELETE') {
            if (holdArchive) { heldArchive = requestId; heldReady?.(); return; }
            return await fulfill(requestId, failArchive ? { error: 'Offline fixture error' } : { success: true }, failArchive ? 500 : 200);
          }
          body = itinerary;
        }
        if (url.pathname.endsWith('/statistics')) body = {};
        if (url.pathname === '/api/itinerary') body = { data: [] };
        if (url.pathname.endsWith('/templates/list') || url.pathname.endsWith('/hotels') || url.pathname.includes('/conversations')) body = [];
        await fulfill(requestId, body);
      } else if (url.origin === origin && !url.pathname.startsWith('/socket.io')) await client.send('Fetch.continueRequest', { requestId });
      else await client.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    } catch { /* Navigations may cancel pending decorative asset requests. */ }
  });
  await client.send('Page.enable'); await client.send('Runtime.enable');
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
}, { timeout: 45000 });
after(async () => {
  if (client) { const exited = once(browser, 'exit'); await client.send('Browser.close').catch(() => {}); await exited; client.close(); }
  else if (browser) browser.kill();
  if (vite) await vite.close();
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});
const open = async (width = 393, height = 780, dark = false) => {
  failArchive = false; holdArchive = false;
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, mobile: width <= 768, deviceScaleFactor: 1 });
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: width <= 768, maxTouchPoints: 1 });
  if (initScript) await client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: initScript });
  const script = await client.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.clear(); sessionStorage.clear();
    localStorage.setItem('naujan:dark-mode', ${JSON.stringify(String(dark))});
    document.cookie = 'csrf_token=offline-layout-fixture; path=/';
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      watchPosition: (success, error) => { error({ code: 1, message: 'Offline layout fixture' }); return 1; }, clearWatch: () => {} } });` });
  initScript = script.identifier;
  await client.send('Page.navigate', { url: `${origin}/itinerary/46` });
  await client.send('Page.bringToFront');
  await waitFor(`document.querySelector('.itin-actions-panel') && document.querySelector('.chatbot-widget')`);
  await frame();
};
const metrics = () => evaluate(`(() => {
  const rect = node => { const r = node.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; };
  const actions = document.querySelector('.itin-actions-panel'), summary = document.querySelector('.itin-summary-panel');
  return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
    bubble: rect(document.querySelector('.chatbot-widget-wrapper')), nav: rect(document.querySelector('.eco-mobile-nav')),
    center: rect(document.querySelector('.nav-center')), header: rect(document.querySelector('.navbar')),
    actions: rect(actions), summary: rect(summary), lastAction: rect(actions.querySelector('.itin-quick-actions > button:last-child')),
    padding: parseFloat(getComputedStyle(actions).paddingBottom), mainPadding: getComputedStyle(document.querySelector('.website-main--itinerary-detail')).paddingBottom,
    mainMargin: getComputedStyle(document.querySelector('.website-main--itinerary-detail')).marginTop,
    buttons: [...actions.querySelectorAll('.itin-quick-actions button')].map(rect) };
})()`);
const openDialog = async () => {
  await evaluate(`(() => { const button = document.querySelector('.itin-quick-actions > button:last-child'); button.scrollIntoView({ block: 'center', behavior: 'instant' }); button.focus(); button.click(); })()`);
  await waitFor(`document.querySelector('.itin-archive-dialog')?.open`); await frame();
};

for (const [width, height] of [[320, 568], [360, 640], [393, 780], [480, 900], [640, 900], [768, 1024], [640, 360]]) {
  test(`mobile itinerary has compact cards, no overflow and no chat/nav overlap at ${width}×${height}`, options, async () => {
    await open(width, height);
    await evaluate(`document.querySelector('.itin-actions-panel').scrollIntoView({ block: 'center', behavior: 'instant' })`); await frame();
    const view = await metrics();
    assert.ok(view.scrollWidth <= width + 1, `Horizontal page overflow: ${view.scrollWidth}`);
    assert.ok(view.bubble.bottom + 8 <= Math.min(view.nav.top, view.center.top), `Chat/nav overlap: ${JSON.stringify(view)}`);
    assert.equal(view.mainPadding, '0px'); assert.equal(view.mainMargin, '0px');
    assert.equal(view.padding, 16);
    assert.ok(view.actions.bottom - view.lastAction.bottom <= 18, 'no unused bottom margin inside Quick Actions');
    assert.ok(view.summary.top - view.actions.bottom >= 15 && view.summary.top - view.actions.bottom <= 17, 'sidebar cards have a single 16px gap');
    view.buttons.forEach(button => { assert.ok(button.height >= 44); assert.ok(button.left >= view.actions.left && button.right <= view.actions.right + 1); });
    if (width === 393) {
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
      await writeFile(path.join(tempRoot, 'itinerary-detail-mobile-spacing.png'), Buffer.from(screenshot.data, 'base64'));
    }
  });
}
for (const [width, height] of [[320, 568], [393, 780], [640, 360]]) {
  test(`archive confirmation is compact, focus-contained and cancellable at ${width}×${height}`, options, async () => {
    await open(width, height); const before = writes.length;
    await openDialog();
    const view = await evaluate(`(() => { const dialog = document.querySelector('.itin-archive-dialog'), r=dialog.getBoundingClientRect();
      const buttons=[...dialog.querySelectorAll('button')]; return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,
        focused:document.activeElement.textContent, scroll:dialog.scrollHeight,client:dialog.clientHeight,
        bodyOverflow:document.body.style.overflow, buttonHeights:buttons.map(button=>button.getBoundingClientRect().height)}; })()`);
    assert.ok(view.left >= 15 && view.right <= width - 15); assert.ok(view.top >= 15 && view.bottom <= height - 15);
    assert.ok(view.height < 310, 'native browser prompt whitespace must not be reproduced');
    assert.equal(view.focused, 'Cancel'); assert.equal(view.bodyOverflow, 'hidden'); view.buttonHeights.forEach(value => assert.ok(value >= 44));
    await key('Tab', 'Tab', 8); assert.equal(await evaluate(`document.activeElement.classList.contains('itin-archive-confirm')`), true);
    await key('Tab'); assert.equal(await evaluate(`document.activeElement.textContent`), 'Cancel');
    if (width === 393) {
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
      await writeFile(path.join(tempRoot, 'itinerary-detail-mobile-archive-dialog.png'), Buffer.from(screenshot.data, 'base64'));
    }
    await key('Escape'); await waitFor(`!document.querySelector('.itin-archive-dialog')`);
    assert.equal(await evaluate('document.body.style.overflow'), '');
    assert.equal(await evaluate(`document.activeElement === document.querySelector('.itin-quick-actions > button:last-child')`), true);
    await openDialog(); await evaluate(`document.querySelector('.itin-archive-buttons button').click()`);
    await waitFor(`!document.querySelector('.itin-archive-dialog')`);
    assert.equal(writes.length, before, 'opening/cancelling a confirmation must not modify any business data');
    assert.deepEqual(nativeDialogs, []);
  });
}
test('dragging/resizing cannot put the mobile chat launcher over navigation, outside the viewport or over the header', options, async () => {
  await open();
  await evaluate(`(() => { const button=document.querySelector('.chatbot-widget'), r=button.getBoundingClientRect();
    button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,clientX:r.x+20,clientY:r.y+20}));
    button.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:1,clientX:10000,clientY:10000}));
    button.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1})); })()`); await frame();
  let view = await metrics();
  assert.ok(view.bubble.right <= view.width - 11); assert.ok(view.bubble.bottom + 11 <= Math.min(view.nav.top, view.center.top));
  await client.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 568, mobile: true, deviceScaleFactor: 1 }); await frame();
  view = await metrics(); assert.ok(view.bubble.right <= 309); assert.ok(view.bubble.bottom + 11 <= Math.min(view.nav.top, view.center.top));
  await evaluate(`(() => { const button=document.querySelector('.chatbot-widget'), r=button.getBoundingClientRect();
    button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:2,clientX:r.x+20,clientY:r.y+20}));
    button.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,pointerId:2,clientX:-10000,clientY:-10000}));
    button.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:2})); })()`); await frame();
  view = await metrics(); assert.ok(view.bubble.left >= 11); assert.ok(view.bubble.top >= view.header.bottom + 11);
});
test('dark mode and desktop keep readable confirmation content and the original desktop chat position', options, async () => {
  await open(393, 780, true); await openDialog();
  const colors = await evaluate(`(() => { const s=getComputedStyle(document.querySelector('.itin-archive-dialog')); return {background:s.backgroundColor,color:s.color}; })()`);
  const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const levels = [luminance(colors.background), luminance(colors.color)].sort((a, b) => a - b);
  assert.ok((levels[1] + 0.05) / (levels[0] + 0.05) >= 4.5, `Unreadable dialog contrast: ${JSON.stringify(colors)}`);
  await key('Escape');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, mobile: false, deviceScaleFactor: 1 }); await frame();
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.chatbot-widget-wrapper')).bottom`), '24px');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.chatbot-widget-wrapper')).right`), '24px');
});
test('archive errors remain in the dialog, and explicit confirmation sends exactly one CSRF-protected request', options, async () => {
  await open(); await openDialog(); const before = writes.length;
  failArchive = true;
  await evaluate(`document.querySelector('.itin-archive-confirm').click()`);
  await waitFor(`document.querySelector('.itin-archive-error') && !document.querySelector('.itin-archive-confirm').disabled`);
  assert.equal(await evaluate('location.pathname'), '/itinerary/46');
  failArchive = false; holdArchive = true;
  const received = new Promise(resolve => { heldReady = resolve; });
  await evaluate(`(() => { const button=document.querySelector('.itin-archive-confirm'); button.click(); button.click(); })()`);
  await received; await key('Escape');
  assert.equal(await evaluate(`document.querySelector('.itin-archive-dialog')?.open`), true);
  assert.equal(await evaluate(`document.querySelector('.itin-archive-buttons button').disabled`), true);
  const requests = writes.slice(before);
  assert.equal(requests.length, 2); assert.ok(requests.every(request => request.path === '/api/itinerary/46' && request.method === 'DELETE'));
  assert.ok(requests.every(request => Object.entries(request.headers).some(([name, value]) => name.toLowerCase() === 'x-csrf-token' && value === 'offline-layout-fixture')));
  holdArchive = false; await fulfill(heldArchive, { success: true });
  await waitFor(`location.pathname === '/itinerary' && !document.querySelector('.itin-archive-dialog')`);
  assert.equal(await evaluate('document.body.style.overflow'), ''); assert.deepEqual(nativeDialogs, []); assert.deepEqual(errors, []);
});
