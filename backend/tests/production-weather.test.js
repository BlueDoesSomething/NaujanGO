import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import axios from 'axios';
import db from '../db.js';

// All database and weather-provider calls are replaced; no real records or keys.
const originalKey = process.env.OPENWEATHER_API_KEY;
process.env.OPENWEATHER_API_KEY = '';
const unconfigured = await import('../controllers/weatherController.js?weather-unconfigured');
process.env.OPENWEATHER_API_KEY = 'weather-fixture-only';
const configured = await import('../controllers/weatherController.js?weather-configured');
if (originalKey === undefined) delete process.env.OPENWEATHER_API_KEY;
else process.env.OPENWEATHER_API_KEY = originalKey;

const serve = async (t, router) => {
  const app = express(); app.use('/weather', router);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return path => fetch(`http://127.0.0.1:${server.address().port}/weather/${path}`, { signal: AbortSignal.timeout(5000) });
};
const setup = t => {
  t.mock.method(console, 'error', () => {}); t.mock.method(console, 'warn', () => {});
  const queries = [];
  t.mock.method(db, 'promise', () => ({ query: async (sql, params) => {
    queries.push({ sql, params });
    if (sql.startsWith('SELECT latitude')) return [[{ latitude: 13, longitude: 121, name: 'Saved attraction' }]];
    throw new Error('An unavailable provider must not write generated weather to the database');
  } }));
  return queries;
};

test('missing configuration returns 503 without provider calls or generated database records', async t => {
  const queries = setup(t);
  t.mock.method(axios, 'get', async () => { throw new Error('Provider must not be called without configuration'); });
  const request = await serve(t, unconfigured.default);
  for (const path of ['current/8?force_refresh=true', 'forecast/8?force_refresh=true']) {
    const response = await request(path);
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /unavailable/);
  }
  assert.equal(await unconfigured.getNaujanLiveWeather({ forceRefresh: true }), null);
  assert.ok(queries.every(call => call.sql.startsWith('SELECT latitude')));
});

test('provider outages return unavailable rather than fabricated live weather', async t => {
  const queries = setup(t);
  t.mock.method(axios, 'get', async () => { throw Object.assign(new Error('Fixture upstream failure'), { code: 'ECONNRESET' }); });
  const request = await serve(t, configured.default);
  const response = await request('current/8?force_refresh=true');
  assert.equal(response.status, 503);
  assert.equal(await configured.getNaujanLiveWeather({ forceRefresh: true }), null);
  assert.equal(queries.length, 1);
});

test('chatbot weather uses actual provider values and identifies only successful observations as live', async t => {
  setup(t);
  t.mock.method(axios, 'get', async url => ({ data: url.includes('/forecast?') ? { city: { name: 'Saved town' }, list: [] } : {
    main: { temp: 32, feels_like: 34, humidity: 60, pressure: 1005 }, wind: { speed: 2 },
    weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }]
  } }));
  const result = await configured.getNaujanLiveWeather({ forceRefresh: true });
  assert.equal(result.source, 'live');
  assert.equal(result.current.temperature, 32);
  assert.equal(result.current.description, 'clear sky');
});
