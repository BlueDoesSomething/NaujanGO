import test from 'node:test';
import assert from 'node:assert/strict';
import { createSystemLogsLoader, initialSystemLogsState, readSystemLogPage, systemLogErrorMessage } from '../src/utils/systemLogs.js';

test('initial and failed log loads have an unknown matching total, not a fabricated zero', async () => {
  assert.equal(initialSystemLogsState().total, null);
  const states = [];
  const loader = createSystemLogsLoader({ fetchPage: async () => { throw { response: { status: 500 } }; }, onChange: state => states.push(state) });
  await loader.load({ page: 1 });
  assert.equal(states[0].loading, true); assert.equal(states[0].total, null);
  const failed = states.at(-1);
  assert.equal(failed.loading, false); assert.equal(failed.total, null);
  assert.match(failed.error, /could not be loaded/); assert.match(failed.error, /does not mean there are no logs/);
});

test('successful lists and genuine empty results are distinguished from load errors', async () => {
  let state;
  let data = { rows: [{ id: 120, message: 'Fixture log' }], total: '120' };
  const loader = createSystemLogsLoader({ fetchPage: async () => data, onChange: value => { state = value; } });
  await loader.load({ page: 1 });
  assert.deepEqual(state.rows, data.rows); assert.equal(state.total, 120); assert.equal(state.error, '');
  data = { rows: [], total: 0 };
  await loader.load({ page: 1, search: 'no-match' });
  assert.deepEqual(state, { rows: [], total: 0, loading: false, error: '' });
  data = { rows: [], total: 120 };
  await loader.load({ page: 99 });
  assert.equal(state.total, 120, 'an out-of-range page is not an empty log store');
});

test('malformed successful responses do not silently become empty log tables', async () => {
  for (const data of [undefined, {}, '<html>upstream failure</html>', { rows: [], total: null }, { rows: {}, total: 4 },
    { rows: [], total: '' }, { rows: [], total: -1 }, { rows: [], total: Infinity }, { rows: [], total: 'private-value' }]) {
    assert.throws(() => readSystemLogPage(data), /Invalid system log response/);
  }
  let state;
  const loader = createSystemLogsLoader({ fetchPage: async () => ({}), onChange: value => { state = value; } });
  await loader.load({});
  assert.equal(state.total, null); assert.ok(state.error);
});

test('retry can recover from a 500 without reloading or losing server data', async () => {
  let fail = true, state;
  const loader = createSystemLogsLoader({ fetchPage: async () => {
    if (fail) throw { response: { status: 500 } };
    return { rows: [{ id: 1 }], total: 1 };
  }, onChange: value => { state = value; } });
  await loader.load({}); assert.ok(state.error);
  fail = false; await loader.load({});
  assert.equal(state.error, ''); assert.equal(state.total, 1); assert.equal(state.rows.length, 1);
});

test('an older filter response cannot overwrite a newer request', async () => {
  let release, state;
  const firstResponse = new Promise(resolve => { release = resolve; });
  const filtersSeen = [];
  const loader = createSystemLogsLoader({ fetchPage: async filters => {
    filtersSeen.push(filters);
    return filters.level === 'all' ? firstResponse : { rows: [{ id: 2, level: 'error' }], total: 1 };
  }, onChange: value => { state = value; } });
  const first = loader.load({ level: 'all', page: 3 });
  await loader.load({ level: 'error', page: 1 });
  release({ rows: [{ id: 9, level: 'info' }], total: 120 }); await first;
  assert.equal(state.rows[0].id, 2); assert.equal(state.total, 1);
  assert.deepEqual(filtersSeen, [{ level: 'all', page: 3 }, { level: 'error', page: 1 }]);
});

test('stale failures and cancelled requests cannot replace a successful result', async () => {
  let reject, resolve, state;
  const stale = new Promise((res, rej) => { reject = rej; });
  const cancelled = new Promise(res => { resolve = res; });
  let request = 0;
  const loader = createSystemLogsLoader({ fetchPage: async () => ++request === 1 ? stale : request === 2 ? { rows: [{ id: 2 }], total: 1 } : cancelled,
    onChange: value => { state = value; } });
  const first = loader.load({}); await loader.load({});
  reject({ response: { status: 500 } }); await first;
  assert.equal(state.rows[0].id, 2); assert.equal(state.error, '');
  const third = loader.load({}); loader.cancel();
  const cancelledState = state;
  resolve({ rows: [{ id: 3 }], total: 1 }); await third;
  assert.equal(state, cancelledState, 'no update is published after the dashboard module closes');
});

test('authorization failures provide actionable guidance without raw backend details', () => {
  assert.match(systemLogErrorMessage({ response: { status: 401 } }), /Sign in again/);
  assert.match(systemLogErrorMessage({ response: { status: 403 } }), /Administrator access/);
  assert.doesNotMatch(systemLogErrorMessage({ response: { status: 500, data: { error: 'private SQL details' } } }), /private SQL/);
});
