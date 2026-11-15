import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAdminStops, itineraryDateDays } from '../utils/adminItineraryStops.js';

const existing = [{ id: 12 }, { id: 13 }];
const stops = [
  { id: 13, day_number: 2, start_time: '09:30', latitude: 13.33, longitude: 121.3 },
  { id: 12, day_number: 1, start_time: '', latitude: '', longitude: '' }
];

test('admin may reorder and move only existing stops', () => {
  assert.deepEqual(validateAdminStops(stops, existing, 2), [
    { id: 13, day: 2, time: '09:30', lat: 13.33, lng: 121.3 },
    { id: 12, day: 1, time: null, lat: null, lng: null }
  ]);
  assert.throws(() => validateAdminStops([stops[0]], existing, 2));
  assert.throws(() => validateAdminStops([stops[0], stops[0]], existing, 2));
  assert.throws(() => validateAdminStops([{ ...stops[0], id: 99 }, stops[1]], existing, 2));
  assert.throws(() => validateAdminStops([{ ...stops[0], day_number: 3 }, stops[1]], existing, 2));
  assert.equal(validateAdminStops([{ ...stops[0], day_number: 365 }, stops[1]], existing, 365)[0].day, 365);
  assert.throws(() => validateAdminStops([{ ...stops[0], day_number: 366 }, stops[1]], existing, 365));
});

test('rejects invalid times and partial or out-of-range coordinates', () => {
  assert.throws(() => validateAdminStops([{ ...stops[0], start_time: '25:90' }, stops[1]], existing, 2));
  assert.throws(() => validateAdminStops([{ ...stops[0], longitude: '' }, stops[1]], existing, 2));
  assert.throws(() => validateAdminStops([{ ...stops[0], latitude: 100 }, stops[1]], existing, 2));
  assert.deepEqual(validateAdminStops([{ ...stops[0], latitude: 0, longitude: 0 }, stops[1]], existing, 2)[0], { id: 13, day: 2, time: '09:30', lat: 0, lng: 0 });
});

test('date range uses inclusive days and rejects reversed or excessive dates', () => {
  assert.equal(itineraryDateDays('2026-11-15', '2026-11-16'), 2);
  assert.equal(itineraryDateDays('', ''), null);
  assert.throws(() => itineraryDateDays('2026-11-15', ''));
  assert.throws(() => itineraryDateDays('2026-02-30', '2026-03-01'));
  assert.throws(() => itineraryDateDays('2026-11-16', '2026-11-15'));
  assert.throws(() => itineraryDateDays('2026-01-01', '2028-01-01'));
});
