import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'about-management-tests-only';
process.env.SESSION_SECRET = 'about-management-session-tests-only';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { default: router } = await import('../controllers/aboutController.js');
const valid = { overview_text: 'Saved municipal overview.', vision_text: 'Saved municipal vision.', mission_text: { points: ['Serve the community.'] }, population: 100, land_area_sq_km: 10.5, density_per_sq_km: 9.52, num_barangays: 2, municipal_rank: 'Municipal rank', current_mayor_name: 'Mayor Fixture', current_mayor_term: '2025–2028', current_vice_mayor_name: 'Vice Mayor Fixture', current_vice_mayor_term: '2025–2028', visitor_arrivals_2022: 10, visitor_arrivals_2023: 20, visitor_arrivals_2024: 0, visitor_arrivals_2025: 30, tourism_total_employment: 10, tourism_attractions_count: 2, tourism_accommodation_count: 3, tourism_female_employed: 6, tourism_male_employed: 4 };
const setup = async t => {
  clearUserColumnCache();
  let settings = structuredClone(valid), fail = false, missing = false;
  const stored = new Map(), calls = [];
  const query = async (sql, params = []) => {
    calls.push({ sql, params });
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: params[0], role: params[0] === 7 ? 'admin' : 'owner', archived: 0, email_verified: 1 }]];
    if (fail) throw Object.assign(new Error('Fixture SQL details must not leak'), { code: 'ER_NO_SUCH_TABLE' });
    if (sql.includes('FROM about_settings')) return [missing ? [] : [{ ...settings }]];
    if (sql.includes('FROM site_settings')) return [stored.has(params[0]) ? [{ setting_value: stored.get(params[0]) }] : []];
    if (sql.includes('UPDATE about_settings')) {
      const fields = sql.match(/SET ([\s\S]+),\s*updated_at/)[1].split(',').map(value => value.trim().split(' ')[0]);
      fields.forEach((key, index) => { settings[key] = key === 'mission_text' ? JSON.parse(params[index]) : params[index]; });
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('INSERT INTO site_settings')) { stored.set(params[0], params[1]); return [{ affectedRows: 1 }]; }
    throw new Error(`Unexpected About test SQL: ${sql}`);
  };
  t.mock.method(db, 'promise', () => ({ query, execute: query }));
  const app = express(); app.use(express.json()); app.use('/api', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = async (path, method = 'GET', body, account = 7) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(account ? { Authorization: `Bearer ${jwt.sign({ user_id: account, role: 'admin' }, JWT_SECRET)}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  return { request, calls, stored, settings: () => settings, fail: () => { fail = true; }, emptyStorage: () => { missing = true; } };
};
test('public About content uses saved settings; admin writes round-trip without touching tourism reports or financial records', async t => {
  const { request, calls } = await setup(t);
  const payload = { ...valid, overview_text: "Naujan's updated overview; ?", population: 12345 };
  assert.equal((await request('/admin/about-settings', 'PUT', payload)).status, 200);
  const read = await request('/about-settings', 'GET', undefined, null);
  assert.equal(read.body.population, 12345); assert.equal(read.body.overview_text, payload.overview_text); assert.deepEqual(read.body.mission_text, payload.mission_text);
  assert.ok(calls.every(call => !/hotel_bookings|hotel_payments|tourism_arrival|DELETE|DROP/.test(call.sql)));
});
test('About editing requires database-backed admin authorization, not a forged token role', async t => {
  const { request } = await setup(t);
  for (const path of ['/admin/about-settings', '/admin/about-leadership-roster', '/admin/about-accomplishments', '/admin/about-pageant-queens']) {
    assert.equal((await request(path, 'PUT', valid, null)).status, 401);
    assert.equal((await request(path, 'PUT', valid, 8)).status, 403);
  }
});
test('invalid settings are rejected before any write, including blank, fractional, negative and malformed mission values', async t => {
  const { request, calls } = await setup(t);
  for (const patch of [{ population: '' }, { population: -1 }, { num_barangays: 1.5 }, { visitor_arrivals_2023: null }, { vision_text: '' }, { mission_text: 'bad json' }, { mission_text: { points: [''] } }, { current_mayor_term: 'x'.repeat(51) }]) assert.equal((await request('/admin/about-settings', 'PUT', { ...valid, ...patch })).status, 400);
  assert.ok(calls.every(call => !/UPDATE about_settings/.test(call.sql)));
});
test('leadership current flags are per role; incomplete or duplicate current entries cannot silently disappear', async t => {
  const { request, stored } = await setup(t);
  const roster = [{ id: 'm', role: 'mayor', name: 'Mayor', term: '2025', current: true }, { id: 'v', role: 'vice-mayor', name: 'Vice Mayor', term: '2025', current: true }];
  assert.equal((await request('/admin/about-leadership-roster', 'PUT', roster)).status, 200);
  const snapshot = stored.get('about-leadership-roster');
  assert.equal((await request('/admin/about-leadership-roster', 'PUT', [...roster, { ...roster[0], id: 'm2' }])).status, 400);
  assert.equal((await request('/admin/about-leadership-roster', 'PUT', [{ ...roster[0], name: '' }])).status, 400);
  assert.equal(stored.get('about-leadership-roster'), snapshot);
});
test('milestones and culture lists retain explicit empty arrays and reject incomplete saves without removing old records', async t => {
  const { request, stored } = await setup(t);
  for (const [path, value] of [['about-accomplishments', { id: 'a', date: '2026', title: 'Verified milestone', description: 'Saved content.' }], ['about-pageant-queens', { id: 'q', name: 'Fixture Queen', year: 2026 }]]) {
    assert.equal((await request(`/admin/${path}`, 'PUT', [value])).status, 200);
    const snapshot = stored.get(path);
    assert.equal((await request(`/admin/${path}`, 'PUT', [{}])).status, 400); assert.equal(stored.get(path), snapshot);
    assert.equal((await request(`/admin/${path}`, 'PUT', [])).status, 200); assert.deepEqual((await request(`/${path}`)).body, []);
  }
});
test('database failures produce a truthful failure instead of a success message or leaked SQL', async t => {
  const { request, fail } = await setup(t); fail();
  const response = await request('/admin/about-settings', 'PUT', valid);
  assert.equal(response.status, 500); assert.doesNotMatch(JSON.stringify(response.body), /Fixture SQL|details/);
});
test('an absent settings record cannot report a successful update or create replacement content silently', async t => {
  const { request, calls, emptyStorage } = await setup(t); emptyStorage();
  const response = await request('/admin/about-settings', 'PUT', valid);
  assert.equal(response.status, 503); assert.match(response.body.error, /no editable record/);
  assert.ok(calls.every(call => !/^(INSERT|UPDATE)/.test(call.sql.trim())));
});
