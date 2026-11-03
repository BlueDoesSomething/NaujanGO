import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));
const compile = async (entry, define = {}, externalReact = false) => {
  const compiled = await build({ entryPoints: [entry], absWorkingDir: root, bundle: true, write: false, platform: 'node', format: 'esm', define,
    plugins: externalReact ? [{ name: 'test-react', setup(builder) {
      builder.onResolve({ filter: /^react$/ }, () => ({ path: import.meta.resolve('react'), external: true }));
    } }] : [] });
  return import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
};
const { default: LeadershipCard } = await compile('src/components/LeadershipCard.jsx', {}, true);
const noKey = (await compile('src/services/weatherService.js', { 'import.meta.env.VITE_WEATHER_API_KEY': '""' })).weatherService;
const live = (await compile('src/services/weatherService.js', { 'import.meta.env.VITE_WEATHER_API_KEY': '"weather-fixture-key"' })).weatherService;

test('missing weather configuration returns unavailable, never generated weather or forecasts', async t => {
  t.mock.method(console, 'warn', () => {});
  const calls = [];
  t.mock.method(globalThis, 'fetch', async url => { calls.push(url); throw new Error('No network is allowed'); });
  await assert.rejects(noKey.getCurrentWeather(13, 121), /currently unavailable/);
  await assert.rejects(noKey.getWeatherForecast(13, 121), /currently unavailable/);
  assert.equal(calls.length, 0);
  assert.equal(noKey.cache.size, 0);
});

test('configured weather uses actual provider values, caches success and does not cache failures', async t => {
  t.mock.method(console, 'warn', () => {});
  live.clearCache();
  let fail = false, calls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    calls += 1;
    return { ok: !fail, status: fail ? 503 : 200, json: async () => ({
      main: { temp: 36, feels_like: 37, humidity: 60, pressure: 1005 }, wind: { speed: 2, deg: 90 },
      weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }], name: 'Fixture town', sys: { country: 'PH', sunrise: 1, sunset: 2 }
    }) };
  });
  const weather = await live.getCurrentWeather(13, 121);
  assert.equal(weather.temperature, 36);
  assert.equal(weather.location.name, 'Fixture town');
  assert.equal(live.getTravelSafetyScore(weather), 70);
  assert.equal(await live.getCurrentWeather(13, 121), weather);
  assert.equal(calls, 1);
  fail = true; live.clearCache();
  await assert.rejects(live.getCurrentWeather(13, 121), /currently unavailable/);
  await assert.rejects(live.getWeatherForecast(13, 121), /currently unavailable/);
  assert.equal(live.cache.size, 0);
});

test('missing leadership photos do not advertise placeholders to the public', () => {
  const props = { name: 'Saved official', title: 'Saved title', index: 0 };
  const publicCard = renderToStaticMarkup(React.createElement(LeadershipCard, props));
  assert.doesNotMatch(publicCard, /Placeholder|Add photo/);
  assert.match(publicCard, /Saved official/);
  assert.match(renderToStaticMarkup(React.createElement(LeadershipCard, { ...props, isAdmin: true })), /Add photo/);
});

test('production UI gates developer routes and links and no longer contains invented testimonials', () => {
  const source = file => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
  assert.match(source('App.jsx'), /import\.meta\.env\.DEV && <Route path="\/debug-auth"/);
  assert.match(source('pages/ForgotPassword.jsx'), /import\.meta\.env\.DEV && devResetUrl/);
  assert.match(source('pages/Login.jsx'), /import\.meta\.env\.DEV \? response\.data\?\.devVerificationUrl : null/);
  assert.doesNotMatch(source('context/LanguageContext.jsx'), /testimonial_[123]_(quote|name|loc)/);
  assert.doesNotMatch(source('components/EcoHomeLayout.jsx'), /testimonialData|toNumericRating\(a\.avg_rating\) \|\| 4\.5/);
});
