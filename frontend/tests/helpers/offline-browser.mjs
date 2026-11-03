import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const browserPath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/chromium', '/usr/bin/google-chrome']
  .find(candidate => candidate && existsSync(candidate));
export const browserAvailable = Boolean(browserPath && typeof WebSocket !== 'undefined');

export async function offlineBrowser(name, respond) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const temp = process.platform === 'win32' ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();
  let vite, browser, profile, socket;
  const pending = new Map(), events = new Map(), errors = [], writes = [];
  let sequence = 0;
  const loadPage = async (method, params = {}) => {
    const loaded = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Page navigation did not finish')), 10000);
      events.set('Page.loadEventFired', () => { clearTimeout(timer); resolve(); });
    });
    await send(method, params); await loaded;
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Browser command timed out: ${method}`)); }, 20000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = expression => evaluate(`new Promise((resolve, reject) => {
    let observer; const timer = setTimeout(() => { observer?.disconnect(); reject(new Error('Not ready: ' + ${JSON.stringify(expression)} + '; page: ' + document.body.innerText.slice(0, 1500))); }, 7000);
    const ready = () => { if (${expression}) { clearTimeout(timer); observer?.disconnect(); resolve(true); return true; } return false; };
    if (ready()) return; observer = new MutationObserver(ready); observer.observe(document, { childList:true, subtree:true, attributes:true });
  })`);
  const close = async () => {
    if (socket && browser && browser.exitCode == null) { const exited = once(browser, 'exit'); await send('Browser.close').catch(() => {}); await exited; socket.close(); }
    else if (browser && browser.exitCode == null) browser.kill();
    for (const item of pending.values()) clearTimeout(item.timer);
    if (vite) await vite.close();
    if (profile) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  };
  try {
    await mkdir(temp, { recursive: true }); profile = await mkdtemp(path.join(temp, `${name}-`));
    vite = await createServer({ root, configFile: false, esbuild: { jsx: 'automatic' }, cacheDir: path.join(root, `node_modules/.vite-${name}-tests`), logLevel: 'error', server: { host: '127.0.0.1', port: 0, open: false } });
    await vite.listen();
    const origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
    browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--disable-background-networking', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const debug = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Could not start Chromium')), 15000);
      browser.on('error', error => { clearTimeout(timer); reject(error); });
      browser.stderr.on('data', chunk => { const match = String(chunk).match(/DevTools listening on (ws:\/\/\S+)/); if (match) { clearTimeout(timer); resolve(new URL(match[1])); } });
    });
    const pages = await (await fetch(`http://${debug.host}/json/list`)).json();
    socket = new WebSocket(pages.find(page => page.type === 'page').webSocketDebuggerUrl);
    await once(socket, 'open');
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const item = pending.get(message.id); if (!item) return;
        clearTimeout(item.timer); pending.delete(message.id);
        if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
      } else events.get(message.method)?.(message.params);
    });
    events.set('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
    events.set('Fetch.requestPaused', async ({ requestId, request }) => {
      try {
        const url = new URL(request.url);
        if (/^\/(api|auth)(\/|$)/.test(url.pathname)) {
          if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && !url.pathname.includes('/languages/preference/')) writes.push(request);
          const response = await respond(request, url) || { body: [] };
          await send('Fetch.fulfillRequest', { requestId, responseCode: response.status || 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(response.body ?? [])).toString('base64') });
        } else if (url.origin === origin && !url.pathname.startsWith('/socket.io')) await send('Fetch.continueRequest', { requestId });
        else await send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      } catch { /* Navigation cancels decorative and superseded requests. */ }
    });
    events.set('Page.javascriptDialogOpening', event => { errors.push(`Unexpected native dialog: ${event.message}`); send('Page.handleJavaScriptDialog', { accept: false }).catch(() => {}); });
    await send('Page.enable'); await send('Runtime.enable'); await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.clear(); sessionStorage.clear(); document.cookie='csrf_token=offline-owner-navigation; path=/';` });
    return { send, evaluate, waitFor, writes, errors, close,
      navigate: pathname => loadPage('Page.navigate', { url: `${origin}${pathname}` }),
      reload: () => loadPage('Page.reload'),
      viewport: async (width, height = 850) => { await send('Emulation.setDeviceMetricsOverride', { width, height, mobile: width <= 768, deviceScaleFactor: 1 }); await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))'); },
      click: text => evaluate(`(() => { const node = [...document.querySelectorAll('button')].find(node => node.textContent.trim() === ${JSON.stringify(text)} && node.getClientRects().length); if (!node) throw new Error('Button not found: ' + ${JSON.stringify(text)}); node.click(); })()`),
      input: (label, value) => evaluate(`(() => { const node = [...document.querySelectorAll('label')].find(node => node.textContent.trim().startsWith(${JSON.stringify(label)}) && node.getClientRects().length)?.querySelector('input, textarea'); if (!node) throw new Error('Input not found: ' + ${JSON.stringify(label)}); const prototype = node.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, ${JSON.stringify(value)}); node.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    };
  } catch (error) { await close(); throw error; }
}
