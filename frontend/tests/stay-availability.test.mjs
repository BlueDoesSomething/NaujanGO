import test from 'node:test';
import assert from 'node:assert/strict';
import { assessStayAvailability } from '../src/utils/stayAvailability.js';

const days = [
  { date: '2026-12-10', available: 2, closed: 0 },
  { date: '2026-12-11', available: 1, closed: 0 },
  { date: '2026-12-12', available: 0, closed: 0 }
];

test('checks every occupied night but not the checkout date', () => {
  assert.equal(assessStayAvailability(days, '2026-12-10', '2026-12-12', 1).status, 'valid');
  assert.equal(assessStayAvailability(days, '2026-12-10', '2026-12-12', 2).status, 'invalid');
  assert.match(assessStayAvailability(days, '2026-12-10', '2026-12-12', 2).message, /2026-12-11/);
});

test('closed nights and missing inventory block confirmation without erasing the stay', () => {
  const closed = days.map(day => day.date === '2026-12-11' ? { ...day, closed: 1 } : day);
  assert.match(assessStayAvailability(closed, '2026-12-10', '2026-12-12', 1).message, /closed/);
  assert.equal(assessStayAvailability(days.slice(0, 1), '2026-12-10', '2026-12-12', 1).status, 'error');
});

test('hourly stays check the arrival date for closures, not nightly room counts', () => {
  assert.equal(assessStayAvailability(days, '2026-12-12', '2026-12-12', 1, true).status, 'valid');
  assert.equal(assessStayAvailability([{ ...days[2], closed: 1 }], '2026-12-12', '2026-12-12', 1, true).status, 'invalid');
});
