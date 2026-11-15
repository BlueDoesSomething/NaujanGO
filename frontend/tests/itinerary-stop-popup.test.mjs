import test from 'node:test';
import assert from 'node:assert/strict';
import { itineraryStopPopup } from '../src/utils/itineraryStopPopup.js';

test('pin popup shows the matching stop details', () => {
  const html = itineraryStopPopup({
    attraction_name: 'Arangin Falls', start_time: '09:30:00', duration_minutes: 120,
    attraction_location: 'Naujan', estimated_cost: 50
  }, 2);
  assert.match(html, /Stop 2/);
  assert.match(html, /Arangin Falls/);
  assert.match(html, /09:30 · 120 min/);
  assert.match(html, /Naujan/);
  assert.match(html, /₱50\.00/);
});

test('pin popup escapes user-controlled stop text', () => {
  const html = itineraryStopPopup({ custom_name: '<img src=x onerror=alert(1)>', custom_location: 'A & B "Park"' }, 1);
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  assert.match(html, /A &amp; B &quot;Park&quot;/);
});
