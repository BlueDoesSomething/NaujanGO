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

// Real layout checks using an installed Chromium browser and its native DevTools
// protocol (Node 22+). No browser package/download is required. All API calls are mocked;
// no email is sent and no account or production data is created.
const browserPath = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
].find(candidate => candidate && existsSync(candidate));
const canRun = browserPath && typeof WebSocket !== 'undefined';
const options = { skip: canRun ? false : 'Requires Node 22+ and an installed Chromium browser (CHROME_PATH)', timeout: 45000 };
const frontendRoot = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = process.platform === 'win32'
  ? path.join(homedir(), 'AppData/Local/Temp/opencode') : tmpdir();
let vite, browser, profile, client, origin, themeScript;
const posts = [];

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

const waitFor = selector => evaluate(`new Promise(resolve => {
  if (document.querySelector(${JSON.stringify(selector)})) return resolve(true);
  const observer = new MutationObserver(() => {
    if (document.querySelector(${JSON.stringify(selector)})) { observer.disconnect(); resolve(true); }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})`);

before(async () => {
  if (!canRun) return;
  vite = await createServer({ root: frontendRoot,
    server: { host: '127.0.0.1', port: 0, open: false, https: false, strictPort: true },
    logLevel: 'error'
  });
  await vite.listen();
  origin = `http://127.0.0.1:${vite.httpServer.address().port}`;
  await mkdir(tempRoot, { recursive: true });
  profile = await mkdtemp(path.join(tempRoot, 'register-responsive-'));
  browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run',
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
        let status = 200;
        if (request.method === 'POST') posts.push({ path: url.pathname, data: request.postData });
        if (url.pathname.endsWith('/auth/profile')) status = 401;
        if (url.pathname.endsWith('/admin/auth-pages')) {
          body = { registerBgType: 'solid', registerSolidColor: '#f3f4f6' };
        }
        if (url.pathname.endsWith('/auth/register-send-code')) body = { message: 'Verification code sent to your email.' };
        if (/\/(hotels|attractions)$/.test(url.pathname)) body = [];
        await client.send('Fetch.fulfillRequest', { requestId, responseCode: status,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
            { name: 'Access-Control-Allow-Origin', value: origin },
            { name: 'Access-Control-Allow-Credentials', value: 'true' },
            { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
            { name: 'Access-Control-Allow-Headers', value: request.headers['Access-Control-Request-Headers'] || 'Content-Type, Authorization' }],
          body: Buffer.from(JSON.stringify(body)).toString('base64') });
      } else if (url.origin === origin) {
        await client.send('Fetch.continueRequest', { requestId });
      } else {
        await client.send('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' });
      }
    } catch {
      // The page can close while an image/font request is being cancelled.
    }
  });
  await client.send('Page.enable');
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

const openRegister = async (width, height, theme = 'light') => {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, mobile: width <= 640, deviceScaleFactor: 1 });
  if (themeScript) await client.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: themeScript });
  const script = await client.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `localStorage.setItem('naujan:dark-mode', ${JSON.stringify(String(theme === 'dark'))});`
  });
  themeScript = script.identifier;
  await client.send('Page.navigate', { url: `${origin}/register` });
  await waitFor('#register-first-name');
  await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
};

const contrast = (foreground, background) => {
  const luminance = rgb => rgb.match(/[\d.]+/g).slice(0, 3).map(value => {
    const channel = Number(value) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

for (const [width, height] of [[320, 568], [393, 852], [640, 900], [641, 900], [768, 1024], [1024, 768], [1440, 900], [852, 393]]) {
  test(`registration fits ${width}×${height} without stretched fields or horizontal overflow`, options, async () => {
    await openRegister(width, height);
    const layout = await evaluate(`(() => {
      const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right }; };
      const card = document.querySelector('.register-card');
      const first = document.querySelector('#register-first-name');
      const last = document.querySelector('#register-last-name');
      return { viewport: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
        card: rect(card), first: rect(first), last: rect(last),
        rowFields: [...document.querySelectorAll('.register-row .register-field')].map(rect),
        controls: [...document.querySelectorAll('.register-input')].map(node => ({ ...rect(node), font: getComputedStyle(node).fontSize })),
        titleHeight: document.querySelector('.register-header h1').getBoundingClientRect().height,
        cardColor: getComputedStyle(card).backgroundColor,
        titleColor: getComputedStyle(document.querySelector('.register-header h1')).color,
        subtitleColor: getComputedStyle(document.querySelector('.register-header p')).color,
        checkbox: getComputedStyle(document.querySelector('.register-terms-checkbox')).visibility };
    })()`);
    assert.equal(layout.overflow, false);
    assert.ok(layout.card.width <= width);
    for (const field of layout.rowFields) assert.ok(field.height < 110, `Field stretched to ${field.height}px`);
    for (const control of layout.controls) {
      assert.ok(control.x >= layout.card.x && control.right <= layout.card.right + 1);
      assert.equal(control.font, '16px');
      assert.ok(control.height >= 44);
    }
    if (width <= 640) {
      assert.ok(layout.last.y > layout.first.y);
      assert.ok(layout.last.y - layout.first.y < 140);
      assert.ok(layout.titleHeight < 65);
    } else assert.ok(Math.abs(layout.last.y - layout.first.y) < 1);
    assert.equal(layout.checkbox, 'visible');
    assert.ok(contrast(layout.titleColor, layout.cardColor) >= 4.5);
    assert.ok(contrast(layout.subtitleColor, layout.cardColor) >= 4.5);
    if (width === 393) {
      const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
      await writeFile(path.join(tempRoot, 'register-mobile-light.png'), Buffer.from(screenshot.data, 'base64'));
      await evaluate(`document.querySelector('#register-form .register-submit').scrollIntoView({ block: 'end', behavior: 'instant' })`);
      const bounds = await evaluate(`({ submit: document.querySelector('#register-form .register-submit').getBoundingClientRect().bottom,
        nav: document.querySelector('.eco-mobile-nav').getBoundingClientRect().top })`);
      assert.ok(bounds.submit <= bounds.nav, 'Submit button is obscured by mobile navigation');
    }
  });
}

test('mobile dark mode keeps the heading, fields, and links readable', options, async () => {
  await openRegister(393, 852, 'dark');
  const colors = await evaluate(`({
    theme: document.documentElement.dataset.theme,
    heading: getComputedStyle(document.querySelector('.register-header h1')).color,
    card: getComputedStyle(document.querySelector('.register-card')).backgroundColor,
    field: getComputedStyle(document.querySelector('.register-input')).color,
    link: getComputedStyle(document.querySelector('.register-link')).color
  })`);
  assert.equal(colors.theme, 'dark');
  assert.ok(contrast(colors.heading, colors.card) >= 4.5);
  assert.ok(contrast(colors.field, colors.card) >= 4.5);
  assert.ok(contrast(colors.link, colors.card) >= 4.5);
});

test('mobile form supports keyboard terms, password reveal, and the verification layout', options, async () => {
  await openRegister(393, 852);
  await evaluate(`(() => {
    const checkbox = document.querySelector('.register-terms-checkbox'); checkbox.focus();
  })()`);
  await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await client.send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  assert.equal(await evaluate(`document.querySelector('.register-terms-checkbox').checked`), true);
  await evaluate(`document.querySelector('.register-reveal').click()`);
  assert.equal(await evaluate(`document.querySelector('#register-password').type`), 'text');
  await evaluate(`(() => {
    const values = { firstName: 'Test', lastName: 'Visitor', username: 'responsive_test', email: 'layout@example.test', password: 'TestPassword123!', confirmPassword: 'TestPassword123!' };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const [name, value] of Object.entries(values)) {
      const input = document.querySelector('[name="' + name + '"]');
      setter.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await evaluate(`document.querySelector('#register-form').requestSubmit()`);
  await waitFor('#register-verification-form');
  const verification = await evaluate(`(() => {
    const form = document.querySelector('#register-verification-form');
    const code = document.querySelector('#register-verification-code');
    const card = document.querySelector('.register-card').getBoundingClientRect();
    return { height: form.getBoundingClientRect().height, codeWidth: code.getBoundingClientRect().width,
      cardWidth: card.width, inputMode: code.inputMode, font: getComputedStyle(code).fontSize, alignment: getComputedStyle(code).textAlign,
      buttons: [...form.querySelectorAll('button')].map(button => button.getBoundingClientRect().width) };
  })()`);
  assert.ok(verification.height < 450);
  assert.ok(verification.codeWidth <= verification.cardWidth);
  assert.equal(verification.inputMode, 'numeric');
  assert.equal(verification.font, '16px');
  assert.equal(verification.alignment, 'center');
  assert.ok(verification.buttons.every(width => width <= verification.cardWidth));
  assert.ok(posts.some(request => request.path.endsWith('/auth/register-send-code')));
});
