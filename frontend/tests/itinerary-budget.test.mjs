import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateDailyCosts } from '../src/utils/itineraryBudget.js';
import { itineraryBudgetReport } from '../src/utils/itineraryExports.js';

const base = {
  days: [1, 2],
  itemsByDay: { 1: [{ estimated_cost: '700' }, { estimated_cost: 300 }], 2: [{ estimated_cost: 200 }] },
  fareForDay: day => day === 1 ? 50 : 100,
  foodForDay: () => 300,
  otherForDay: () => 100
};

test('daily and trip estimates include stops, fare, food and other costs', () => {
  const rows = estimateDailyCosts(base);
  assert.deepEqual(rows.map(row => row.estimatedNeed), [1450, 700]);
  assert.equal(rows.reduce((sum, row) => sum + row.estimatedNeed, 0), 2150);
  assert.equal(rows[0].attractionCost, 1000);
  assert.equal(rows[0].dayBudget, null);
  assert.equal(rows[0].balance, null);
  assert.equal(rows[0].fits, null);
});

test('only an explicit spending limit enables within-limit comparisons', () => {
  const rows = estimateDailyCosts({ ...base, spendingLimit: '2000' });
  assert.deepEqual(rows.map(row => row.dayBudget), [1000, 1000]);
  assert.deepEqual(rows.map(row => row.balance), [-450, 300]);
  assert.deepEqual(rows.map(row => row.fits), [false, true]);
  const zero = estimateDailyCosts({ ...base, spendingLimit: 0 });
  assert.equal(zero[0].dayBudget, 0);
});

test('saved per-day builder estimates survive a day without stops', () => {
  const savedPerDay = { 1: { fareCost: 50, foodCost: 300, otherCost: 100 }, 2: { fareCost: 100, foodCost: 250, otherCost: 0 } };
  const rows = estimateDailyCosts({ days: [1, 2, 3], itemsByDay: base.itemsByDay,
    fareForDay: day => savedPerDay[day]?.fareCost ?? 0,
    foodForDay: day => savedPerDay[day]?.foodCost ?? 0,
    otherForDay: day => savedPerDay[day]?.otherCost ?? 0 });
  assert.deepEqual(rows.map(row => row.estimatedNeed), [1450, 550, 0]);
});

test('CSV/PDF budget data leaves unset limits and balances blank', () => {
  const report = itineraryBudgetReport(estimateDailyCosts(base), 'Test trip');
  assert.equal(report.rows[0].estimatedNeed, 1450);
  assert.equal(report.rows[0].dayBudget, '');
  assert.equal(report.rows[0].balance, '');
  assert.equal(report.rows[0].fits, '');
});
