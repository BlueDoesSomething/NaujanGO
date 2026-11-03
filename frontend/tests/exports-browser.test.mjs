import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { itineraryPrintReport } from '../src/utils/itineraryExports.js';

// Offline component integration, actual CSV downloads and Chromium PDF layout.
// All APIs are mocked and external assets are blocked; no real records change.
const browserPath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome']
  .find(candidate => candidate && existsSync(candidate));
const canRun = browserPath && typeof WebSocket !== 'undefined';
const options = { skip: canRun ? false : 'Requires Node 22+ and Chromium (CHROME_PATH)', timeout: 45000 };
const root = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();
const trip = { itinerary_id: 42, name: 'Lake, "Naujan" ₱ trip', description: '<img src=x onerror=alert(1)>', status: 'in_progress',
  start_date: '2026-11-02', end_date: '2026-11-03', duration_days: 2, total_budget: 1000, total_distance: 5, total_time: 60,
  items: [{ item_id: 1, day_number: 1, order_in_day: 0, custom_name: 'Unlocated stop', estimated_cost: 0, duration_minutes: 30, completed: 1 },
    { item_id: 2, day_number: 2, order_in_day: 0, custom_name: '=DANGEROUS()', estimated_cost: 10, duration_minutes: 30, completed: 0 }] };
const receipt = { booking_id: 8, receipt_number: 'R-8', hotel_name: 'Lake Inn', customer_name: 'Fixture Guest', currency: 'PHP',
  check_in: '2026-11-02', check_out: '2026-11-03', nights: 1, rooms: 1, guests: 1, status: 'confirmed', payment_status: 'partial',
  payment_method: 'gcash', total_amount: 1000, amount_paid: 250, balance_due: 750, issued_at: '2026-11-01T00:00:00Z',
  policy_snapshot: { agreed_at: '2026-11-01', house_rules: 'Frozen fixture policy', cancellation_type: 'non_refundable' },
  provider_payload: 'DO-NOT-EXPORT', verification_code: 'DO-NOT-EXPORT' };
const analytics = { monthlyTrends: [{ month: '2026-10', bookings: 25, revenue: 5000, occupancy: 50 }],
  dailyTrends: [{ day: '2026-11-02', bookings: 0, revenue: 250, occupancy: 0 }], hotelPerformance: [] };
const visitor = { totals: { total_visitors: 5 }, gender_distribution: [{ gender: 'Female', count: 5, percentage: 100 }],
  user_type_distribution: [{ user_type: 'Local', count: 5, percentage: 100 }], combined_breakdown: [{ gender: 'Female', user_type: 'Local', count: 5 }] };
const writes = [], errors = [];
const heldPaymentRequests = [];
let holdPayments = false;
let failFonts = false;
let paymentRequestsHeld;
let vite, browser, profile, client, origin, downloadPath;
let downloadCount = 0;
const pendingDownloads = [];
const connect = async url => {
  const socket = new WebSocket(url); await once(socket, 'open');
  let id = 0;
  const pending = new Map(), events = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const entry = pending.get(message.id); if (!entry) return;
      clearTimeout(entry.timer); pending.delete(message.id);
      if (message.error) entry.reject(new Error(message.error.message)); else entry.resolve(message.result);
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
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    .catch(error => { throw new Error(`${error.message}: ${expression.slice(0, 180)}; browser errors: ${JSON.stringify(errors)}`); });
  if (result.exceptionDetails) throw new Error(`${result.exceptionDetails.exception?.description || result.exceptionDetails.text}; browser errors: ${JSON.stringify(errors)}`);
  return result.result.value;
};
const waitFor = expression => evaluate(`new Promise((resolve, reject) => {
  const timer = setTimeout(() => { observer?.disconnect(); reject(new Error('Not ready: ' + ${JSON.stringify(expression)} + '; page: ' + document.body.innerText.slice(0, 1200))); }, 15000);
  let observer; const ready = () => { if (${expression}) { clearTimeout(timer); observer?.disconnect(); resolve(true); return true; } return false; };
  if (ready()) return; observer = new MutationObserver(ready);
  // During initial navigation documentElement may not exist yet; Document is
  // already a Node and also observes the root element being attached.
  observer.observe(document, { childList: true, subtree: true, attributes: true });
})`);
const click = label => evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === ${JSON.stringify(label)}).click()`);
const download = async action => {
  const finished = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Download timed out')), 15000);
    pendingDownloads.push({ resolve: result => { clearTimeout(timer); resolve(result); } });
  });
  await action(); const result = await finished;
  assert.equal(result.state, 'completed');
  const bytes = new Uint8Array(await readFile(path.join(downloadPath, result.filename)));
  return { filename: result.filename, bytes, text: new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes) };
};
const pdfDownload = async action => {
  const file = await download(action);
  assert.match(file.filename, /\.pdf$/); assert.equal(file.text.slice(0, 5), '%PDF-');
  const task = getDocument({ data: file.bytes.slice(), isEvalSupported: false, useSystemFonts: false });
  const pdf = await task.promise, pages = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number), content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(' '));
  }
  await task.destroy();
  return { ...file, pages, text: pages.join('\n').replace(/ +/g, ' ') };
};

before(async () => {
  if (!canRun) return;
  await mkdir(tempRoot, { recursive: true }); profile = await mkdtemp(path.join(tempRoot, 'exports-browser-'));
  const entry = `import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { MemoryRouter, Routes, Route } from 'react-router-dom';
    import { AuthProvider, useAuth } from '/src/context/AuthContext.jsx';
    import { LanguageProvider } from '/src/context/LanguageContext.jsx';
    import Builder from '/src/pages/ItineraryBuilder.jsx';
    import Detail from '/src/pages/ItineraryDetail.jsx';
    import History from '/src/pages/BookingHistory.jsx';
    import Reports from '/src/components/ReportsAndAnalyticsDashboard.jsx';
    import Owner from '/src/pages/OwnerDashboard.jsx';
    const h = React.createElement, root = createRoot(document.getElementById('root'));
    const Gate = ({ children }) => { const auth = useAuth(); return auth.loading || !auth.isLoggedIn ? h('p', null, 'Loading fixture') : children; };
    window.mountFixture = (name, props = {}) => {
      const component = { Builder, Detail, History, Reports, Owner }[name];
      const page = name === 'Detail' ? h(Routes, null, h(Route, { path: '/itinerary/:id', element: h(component, props) })) : h(component, props);
      root.render(h(AuthProvider, null, h(LanguageProvider, null, h(MemoryRouter, { initialEntries: ['/itinerary/42'] }, h(Gate, null, page)))));
    }; document.documentElement.dataset.fixtureReady = 'true';`;
  vite = await createServer({ root, cacheDir: path.join(profile, 'vite-cache'), logLevel: 'error', plugins: [{ name: 'offline-export-fixture',
    resolveId: id => id === '/__exports-entry.js' ? id : null, load: id => id === '/__exports-entry.js' ? entry : null,
    configureServer(server) { server.middlewares.use(async (req, res, next) => {
      if (req.url !== '/__exports-fixture') return next();
      res.setHeader('Content-Type', 'text/html');
      res.end(await server.transformIndexHtml(req.url, '<!doctype html><div id="root"></div><script type="module" src="/__exports-entry.js"></script>'));
    }); } }], server: { host: '127.0.0.1', port: 0, open: false, https: false } });
  await vite.listen(); origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  downloadPath = path.join(profile, 'downloads'); await mkdir(downloadPath);
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
  client.on('Browser.downloadWillBegin', event => { downloadCount++; const item = pendingDownloads[0]; if (item) { item.guid = event.guid; item.filename = event.suggestedFilename; } });
  client.on('Browser.downloadProgress', event => {
    if (event.state === 'inProgress') return;
    const index = pendingDownloads.findIndex(item => item.guid === event.guid);
    if (index >= 0) { const [item] = pendingDownloads.splice(index, 1); item.resolve({ ...event, filename: item.filename }); }
  });
  client.on('Fetch.requestPaused', async ({ requestId, request }) => {
    try {
      const url = new URL(request.url);
      if (/^\/(api|auth)(\/|$)/.test(url.pathname)) {
        // LanguageProvider syncs the preference during authenticated startup;
        // it is unrelated to exporting. All business-data writes are forbidden.
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !url.pathname.startsWith('/api/languages/preference/')) writes.push(`${request.method} ${url.pathname}`);
        let body = [];
        if (url.pathname.endsWith('/auth/profile')) body = { user: { user_id: 101, username: 'fixture', role: 'owner', email_verified: true } };
        if (url.pathname.endsWith('/attractions')) body = { data: [{ id: 1, name: 'Unlocated fixture attraction', location: 'Naujan', entrance_fee: 0, category: 'nature' }] };
        if (url.pathname === '/api/itinerary/42') body = trip;
        if (url.pathname.endsWith('/statistics')) body = {};
        if (url.pathname === '/api/bookings/hotels') body = [receipt];
        if (url.pathname.endsWith('/receipt')) body = receipt;
        if (url.pathname.endsWith('/visitor-analytics')) body = visitor;
        if (url.pathname === '/api/owner/profile') body = { authorization: 'full', businessProfile: { verification_status: 'verified' } };
        if (url.pathname === '/api/owner/dashboard/stats') body = { hotelCount: 1, bookingStats: { total_bookings: 28 }, recentBookings: [] };
        if (url.pathname === '/api/owner/hotels') body = [{ hotel_id: 1, name: 'Lake Inn' }];
        if (url.pathname === '/api/owner/bookings') body = Array.from({ length: 28 }, (_, index) => ({ ...receipt, hotel_id: 1,
          booking_id: index + 1, customer_name: `Guest ${index + 1}`, status: index < 20 ? 'confirmed' : 'pending' }));
        if (url.pathname === '/api/owner/payments') body = [1, 2].map(payment_id => ({ payment_id, booking_id: 8,
          amount: 250, currency: 'PHP', status: url.searchParams.get('status') || 'succeeded', customer_name: 'Guest', method: 'gcash' }));
        if (url.pathname === '/api/owner/payments/stats') body = { total_transactions: 501 };
        if (holdPayments && /^\/api\/owner\/payments(?:\/stats)?$/.test(url.pathname)) {
          heldPaymentRequests.push({ requestId, body });
          if (heldPaymentRequests.length === 2) paymentRequestsHeld?.();
          return;
        }
        await client.send('Fetch.fulfillRequest', { requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
      } else if (url.origin === origin && failFonts && url.pathname.startsWith('/fonts/')) await client.send('Fetch.fulfillRequest', { requestId, responseCode: 503, body: '' });
      else if (url.origin === origin) await client.send('Fetch.continueRequest', { requestId });
      else await client.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
    } catch { /* A navigation may cancel an in-flight decorative asset request. */ }
  });
  await client.send('Page.enable'); await client.send('Runtime.enable');
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
  await client.send('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.clear(); sessionStorage.clear(); } catch {} window.fixtureAlerts = [];
    window.alert = text => window.fixtureAlerts.push(text);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    // PDF export must not invoke either application or iframe printing.
    window.print = () => { window.printCount = (window.printCount || 0) + 1; };
    document.addEventListener('load', event => { if (event.target.tagName === 'IFRAME') {
      event.target.contentWindow.print = () => { window.lastPrintedHtml = event.target.srcdoc; window.printCount = (window.printCount || 0) + 1; document.documentElement.dataset.printCount = window.printCount; };
    } }, true);` });
}, { timeout: 45000 });
after(async () => {
  if (client) { const exited = once(browser, 'exit'); await client.send('Browser.close').catch(() => {}); await exited; client.close(); }
  else if (browser) browser.kill();
  if (vite) await vite.close();
  if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});
const open = async (name, props = {}, width = 393) => {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height: 900, mobile: width < 769, deviceScaleFactor: 1 });
  await client.send('Page.navigate', { url: `${origin}/__exports-fixture` });
  await waitFor('window.mountFixture');
  await evaluate(`window.mountFixture(${JSON.stringify(name)}, ${JSON.stringify(props)})`);
};

test('Builder downloads real CSV including unlocated draft stops and Share never saves or prints', options, async () => {
  await open('Builder'); await waitFor(`document.querySelector('.atc-day-primary')`);
  await evaluate(`document.querySelector('.atc-day-primary').click()`);
  await waitFor(`document.querySelector('.ib-day-content').textContent.includes('Unlocated fixture attraction')`);
  const csv = await download(() => click('Export CSV'));
  assert.equal(csv.filename, 'itinerary-stops.csv'); assert.ok(csv.text.startsWith('\uFEFF'));
  assert.match(csv.text, /Unlocated fixture attraction/); assert.match(csv.text, /builder draft/);
  await click('Share'); assert.match(await evaluate('window.fixtureAlerts.at(-1)'), /Save this itinerary first/);
  assert.equal(await evaluate('window.printCount || 0'), 0);
  const previousDownloads = downloadCount;
  const pdf = await pdfDownload(() => evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Export PDF'); button.click(); button.click(); })()`));
  assert.equal(downloadCount, previousDownloads + 1, 'rapid duplicate clicks must only create one PDF');
  assert.equal(pdf.filename, 'itinerary-summary.pdf');
  assert.match(pdf.text, /Unlocated fixture attraction/); assert.match(pdf.text, /ITINERARY SUMMARY/); assert.match(pdf.text, /builder draft/);
  assert.equal(await evaluate('window.printCount || 0'), 0);
  assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0);
});
test('saved Details stop/budget exports and PDF use displayed values without write requests', options, async () => {
  await open('Detail'); await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.includes('Export stops CSV'))`);
  const csv = await download(() => click('Export stops CSV'));
  assert.match(csv.filename, /-stops\.csv$/); assert.match(csv.text, /Unlocated stop/); assert.match(csv.text, /'=DANGEROUS/);
  const pdf = await pdfDownload(() => click('Export PDF'));
  assert.match(pdf.filename, /-itinerary-summary\.pdf$/); assert.match(pdf.text, /Day 1/); assert.match(pdf.text, /Day 2/); assert.match(pdf.text, /Budget estimate/);
  assert.ok(pdf.text.includes('<img src=x onerror=alert(1)>'), 'markup is literal document text, not executable HTML');
  assert.equal(await evaluate('window.printCount || 0'), 0); assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0);
  await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Budget').click()`);
  await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Export CSV')`);
  const budget = await download(() => click('Export CSV'));
  assert.match(budget.filename, /-budget-breakdown\.csv$/); assert.match(budget.text, /Attractions \(PHP\)/); assert.match(budget.text, /"0"/);
  const budgetPdf = await pdfDownload(() => click('Export PDF'));
  assert.match(budgetPdf.filename, /-budget-breakdown\.pdf$/); assert.match(budgetPdf.text, /BUDGET BREAKDOWN/);
});
test('receipt CSV and custom PDF retain the recorded balance and frozen policies, excluding private payloads', options, async () => {
  await open('History'); await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Receipt')`);
  await click('Receipt'); await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Export receipt CSV')`);
  const csv = await download(() => click('Export receipt CSV'));
  assert.equal(csv.filename, 'receipt-R-8.csv'); assert.match(csv.text, /Frozen fixture policy/); assert.match(csv.text, /PHP 750.00/);
  assert.ok(!csv.text.includes('DO-NOT-EXPORT'));
  const pdf = await pdfDownload(() => click('Export PDF'));
  assert.equal(pdf.filename, 'receipt-R-8.pdf'); assert.match(pdf.text, /PHP 250.00/); assert.match(pdf.text, /Frozen fixture policy/);
  assert.match(pdf.text, /Payment record/); assert.ok(!pdf.text.includes('DO-NOT-EXPORT'));
});
test('chart-specific analytics downloads select demographics and daily data, not another report', options, async () => {
  await open('Reports', { data: analytics, stats: { totals: { bookings: 25 }, roleDistribution: [] } });
  await waitFor(`document.querySelector('[aria-label="Export gender data"]')`);
  const gender = await download(() => evaluate(`document.querySelector('[aria-label="Export gender data"]').click()`));
  assert.match(gender.text, /Female/); assert.ok(!gender.text.includes('2026-10'));
  const type = await download(() => evaluate(`document.querySelector('[aria-label="Export user type data"]').click()`));
  assert.match(type.text, /Local/);
  await evaluate(`(() => { const select = document.querySelector('select'); select.value = '7d'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  const daily = await download(() => evaluate(`document.querySelector('[aria-label="Export booking data"]').click()`));
  assert.match(daily.text, /2026-11-02/); assert.ok(!daily.text.includes('2026-10'));
  const pdf = await pdfDownload(() => click('Export PDF'));
  assert.equal(pdf.filename, 'analytics-7d.pdf'); assert.match(pdf.text, /Female/); assert.match(pdf.text, /2026-11-02/); assert.ok(!pdf.text.includes('2026-10'));
});
test('owner exports all loaded filtered records, labels capped payments and blocks stale filter results', options, async () => {
  await open('Owner', {}, 1280);
  await waitFor(`document.querySelector('.gov-nav-btn__label')`);
  await click('Reservations');
  await waitFor(`document.querySelector('.gov-main table tbody tr')`);
  assert.ok(await evaluate(`document.querySelectorAll('.gov-main table tbody tr').length < 28`), 'fixture must span display pages');
  const all = await download(() => click('Export CSV'));
  assert.match(all.text, /Guest 28/);
  await click('Confirmed');
  const filtered = await download(() => click('Export CSV'));
  assert.match(filtered.text, /Guest 20/); assert.ok(!filtered.text.includes('Guest 21'));
  assert.match(filtered.text, /booking filter: confirmed/);
  const filteredPdf = await pdfDownload(() => click('Export PDF'));
  assert.ok(!filteredPdf.text.includes('Guest 21')); assert.match(filteredPdf.text, /Guest 20/); assert.match(filteredPdf.text, /RESERVATION REPORT/);
  await click('Payments');
  await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Export CSV' && !button.disabled)`);
  const loaded = await download(() => click('Export CSV'));
  assert.match(loaded.filename, /loaded-payments/); assert.match(loaded.text, /Loaded matching payment attempts: 2/);
  assert.match(loaded.text, /Matching summary count: 501/); assert.match(loaded.text, /Not a complete ledger/);
  const paymentsPdf = await pdfDownload(() => click('Export PDF'));
  assert.match(paymentsPdf.text, /PAYMENT ATTEMPTS/); assert.match(paymentsPdf.text, /Matching summary count: 501/);
  holdPayments = true;
  const arrivals = new Promise(resolve => { paymentRequestsHeld = resolve; });
  await click('Pending');
  await waitFor(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Export CSV')?.disabled`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'Export PDF').disabled`), true);
  // Releasing both mocked responses represents the new filter finishing.
  await arrivals;
  holdPayments = false;
  assert.equal(heldPaymentRequests.length, 2);
  for (const { requestId, body } of heldPaymentRequests.splice(0)) await client.send('Fetch.fulfillRequest', { requestId, responseCode: 200,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
  await waitFor(`[...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Export CSV' && !button.disabled)`);
  const pending = await download(() => click('Export CSV'));
  assert.match(pending.text, /Status: pending/); assert.ok(!pending.text.includes('succeeded'));
});
test('failed PDF font loads are retryable, never fall back to printing and never save the draft', options, async () => {
  await open('Builder'); await waitFor(`document.querySelector('.atc-day-primary')`);
  failFonts = true;
  await click('Export PDF');
  await waitFor(`window.fixtureAlerts.length > 0 && [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Export PDF' && !button.disabled)`);
  assert.match(await evaluate('window.fixtureAlerts.at(-1)'), /PDF could not be created/);
  assert.equal(await evaluate('window.printCount || 0'), 0); assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0);
  failFonts = false;
  const pdf = await pdfDownload(() => click('Export PDF'));
  assert.match(pdf.text, /ITINERARY SUMMARY/);
});
test('multipage PDF downloads directly, wraps long text and includes only the custom document', options, async () => {
  const items = Array.from({ length: 85 }, (_, index) => ({ day_number: 1, order_in_day: index, custom_name: `Stop ${index + 1}`, notes: 'Long-note-'.repeat(30), estimated_cost: 0 }));
  const report = itineraryPrintReport({ itinerary: trip, items, budget: [{ day: 1, attractionCost: 0, estimatedNeed: 100 }] });
  const pdf = await pdfDownload(() => evaluate(`(async () => { const { downloadReportPdf } = await import('/src/utils/exportFiles.js'); await downloadReportPdf(${JSON.stringify(report)}); })()`));
  assert.ok(pdf.pages.length > 1); assert.match(pdf.text, /Stop 85/); assert.match(pdf.text, /Page 1 of/);
  assert.ok(!pdf.text.includes('Pick your spots')); assert.ok(!pdf.text.includes('Save assumptions'));
  assert.equal(await evaluate('window.printCount || 0'), 0); assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0);
  await writeFile(path.join(tempRoot, 'exports-custom-itinerary-fixture.pdf'), pdf.bytes);
  assert.deepEqual(writes, []); assert.deepEqual(errors, []);
});
