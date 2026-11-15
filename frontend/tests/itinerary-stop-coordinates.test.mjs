import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stopCoordinates } from '../src/utils/itineraryStopCoordinates.js';

test('saved coordinates override attraction coordinates for map and directions', () => {
  assert.deepEqual(stopCoordinates({ latitude: '13.4', longitude: '121.4', attraction_latitude: 13.3, attraction_longitude: 121.3 }), { lat: 13.4, lng: 121.4 });
});

test('legacy stops use attraction coordinates when no saved pair exists', () => {
  assert.deepEqual(stopCoordinates({ latitude: null, longitude: null, attraction_latitude: 13.3, attraction_longitude: 121.3 }), { lat: 13.3, lng: 121.3 });
  assert.deepEqual(stopCoordinates({ latitude: '', longitude: '121.4', attraction_latitude: 0, attraction_longitude: 0 }), { lat: 0, lng: 0 });
});

test('missing or invalid coordinates never produce a pin', () => {
  assert.equal(stopCoordinates({ latitude: null, longitude: null }), null);
  assert.equal(stopCoordinates({ latitude: 91, longitude: 121.4 }), null);
  assert.equal(stopCoordinates({ latitude: '', longitude: '' }), null);
});

test('itinerary labels do not contain misdecoded currency or separators', () => {
  const page = readFileSync(new URL('../src/pages/ItineraryDetail.jsx', import.meta.url), 'utf8');
  assert.match(page, /₱/);
  assert.match(page, /·/);
  assert.doesNotMatch(page, /Â|â‚|â†|âœ|ðŸ|Ã|â€|â€“|â€¦/);
});
