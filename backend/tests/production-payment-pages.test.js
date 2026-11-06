import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import axios from 'axios';
process.env.JWT_SECRET = 'production-pages-test-only-not-a-real-secret';
process.env.SESSION_SECRET = 'production-pages-session-test-only-not-real';
const { default: router } = await import('../controllers/paymentsController.js');
const { default: db } = await import('../db.js');
const serve = async t => {
  const app = express(); app.use(express.json()); app.use('/payments', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return (path, method = 'POST') => fetch(`http://127.0.0.1:${server.address().port}/payments${path}`, { method, signal: AbortSignal.timeout(5000) });
};
test('deployed and unconfigured environments do not expose sandbox pages or diagnostic payment calls', async t => {
  const original = process.env.NODE_ENV;
  t.after(() => { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; });
  t.mock.method(axios, 'post', async () => { throw new Error('No provider call is permitted'); });
  const request = await serve(t);
  for (const environment of ['production', 'staging', '']) {
    process.env.NODE_ENV = environment;
    for (const [path, method] of [['/xendit/sandbox', 'GET'], ['/xendit/test', 'POST'], ['/debug/test-qrph', 'POST'], ['/debug/test-gcash', 'POST'], ['/XENDIT/SANDBOX/', 'GET']]) {
      const response = await request(path, method);
      assert.equal(response.status, 404, `${environment}: ${path}`);
      assert.deepEqual(await response.json(), { error: 'Not found' });
    }
  }
});
test('a genuine development sandbox stays labelled as a test rather than pretending to charge money', async t => {
  const original = process.env.NODE_ENV;
  t.after(() => { if (original === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = original; });
  process.env.NODE_ENV = 'development';
  t.mock.method(db, 'promise', () => ({ execute: async () => [[{ online_payments_enabled: 1, lock_version: 1 }]] }));
  const request = await serve(t);
  const response = await request('/xendit/sandbox', 'GET');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /TEST TRANSACTION|No actual charges/);
});
