import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoomListColumn, serializeRoomListInput } from '../utils/roomFields.js';

const oldSerialize = value => JSON.stringify(value.split(',').map(item => item.trim()));

test('room fields accept multipart JSON, native JSON arrays, and legacy CSV', () => {
  const expected = ['Wi-Fi', 'Air conditioning'];
  for (const value of [expected, JSON.stringify(expected), 'Wi-Fi, Air conditioning']) {
    assert.deepEqual(parseRoomListColumn(value), expected);
    assert.equal(serializeRoomListInput(value, 'amenities'), JSON.stringify(expected));
  }
});

test('a JSON item containing a comma is not split as CSV', () => {
  const values = ['Mountain, lake view', 'Breakfast'];
  assert.deepEqual(parseRoomListColumn(JSON.stringify(values)), values);
});

test('explicitly empty fields clear lists; omitted fields do not change them', () => {
  for (const value of ['', [], '[]']) {
    assert.equal(serializeRoomListInput(value, 'image_urls'), '[]');
  }
  assert.equal(serializeRoomListInput(undefined, 'image_urls'), null);
  assert.equal(serializeRoomListInput(null, 'image_urls'), null);
});

test('recovers the repeatedly encoded empty gallery that can overflow the cover', () => {
  let legacy = '[]';
  for (let i = 0; i < 10; i++) legacy = oldSerialize(legacy);
  // The former update handler promoted this value to a VARCHAR(500) cover.
  assert.ok(JSON.parse(oldSerialize(legacy))[0].length > 500);
  assert.deepEqual(parseRoomListColumn(legacy), []);
  assert.equal(serializeRoomListInput(legacy, 'image_urls'), '[]');
});

test('recovers legacy JSON fragments without losing real image URLs', () => {
  const urls = ['https://example.test/room.jpg', '/uploads/hotels/second.jpg'];
  let legacy = JSON.stringify(urls);
  for (let i = 0; i < 6; i++) legacy = oldSerialize(legacy);
  assert.deepEqual(parseRoomListColumn(legacy), urls);
  assert.equal(serializeRoomListInput(legacy, 'image_urls'), JSON.stringify(urls));
  assert.deepEqual(parseRoomListColumn([JSON.stringify(['Wi-Fi']), 'Breakfast']), ['Wi-Fi', 'Breakfast']);
});

test('repeated read/save cycles do not add encoding or grow fields', () => {
  const values = ['Wi-Fi', 'Mountain, lake view'];
  let stored = JSON.stringify(values);
  for (let i = 0; i < 20; i++) {
    stored = serializeRoomListInput(JSON.stringify(parseRoomListColumn(stored)), 'amenities');
    assert.equal(stored, JSON.stringify(values));
  }
});

test('bad input is rejected before SQL; corrupt stored values do not crash reads', () => {
  for (const value of ['[broken', { invalid: true }, '[123]']) {
    assert.throws(() => serializeRoomListInput(value, 'amenities'), { status: 400 });
  }
  for (const value of ['[broken', { invalid: true }, null]) {
    assert.deepEqual(parseRoomListColumn(value), []);
  }
  assert.throws(() => serializeRoomListInput(['x'.repeat(501)], 'image_urls'), { status: 400 });
  assert.throws(() => serializeRoomListInput(['javascript:alert(1)'], 'image_urls'), { status: 400 });
});
