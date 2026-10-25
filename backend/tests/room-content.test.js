import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoomContentColumn, serializeRoomContentInput } from '../utils/roomContent.js';

test('room guest content accepts JSON and native arrays and trims values without splitting commas', () => {
  for (const [field, entry] of [
    ['perfect_for', { label: ' Family stays ', detail: ' Parents, children, and grandparents ' }],
    ['common_questions', { question: ' Breakfast? ', answer: ' Not included.\nAsk about our menu. ' }]
  ]) {
    const expected = Object.fromEntries(Object.entries(entry).map(([key, value]) => [key, value.trim()]));
    for (const value of [[entry], JSON.stringify([entry])]) {
      assert.equal(serializeRoomContentInput(value, field), JSON.stringify([expected]));
      assert.deepEqual(parseRoomContentColumn(value, field), [expected]);
    }
  }
});

test('guest content distinguishes omitted fields from explicit clearing', () => {
  for (const field of ['perfect_for', 'common_questions']) {
    for (const value of [undefined, null]) assert.equal(serializeRoomContentInput(value, field), null);
    for (const value of ['', [], '[]']) assert.equal(serializeRoomContentInput(value, field), '[]');
    for (const value of [undefined, null, '', '[]', '[broken', {}, '[null]']) {
      assert.deepEqual(parseRoomContentColumn(value, field), []);
    }
  }
});

test('a guest category needs a label, but its description is optional', () => {
  assert.equal(serializeRoomContentInput([{ label: 'Couples' }], 'perfect_for'), '[{"label":"Couples","detail":""}]');
  for (const value of [[{}], [{ label: '  ' }], [{ label: 6 }], [{ label: 'Family', detail: {} }]]) {
    assert.throws(() => serializeRoomContentInput(value, 'perfect_for'), { status: 400 });
  }
});

test('a FAQ always needs a nonempty question and answer', () => {
  for (const entry of [{}, { question: 'Breakfast?' }, { answer: 'Yes' }, { question: ' ', answer: 'Yes' }, { question: 'Breakfast?', answer: true }]) {
    assert.throws(() => serializeRoomContentInput([entry], 'common_questions'), { status: 400 });
  }
});

test('content lists reject non-JSON arrays and unexpected item types', () => {
  for (const field of ['perfect_for', 'common_questions']) {
    for (const value of ['[broken', 'ordinary CSV, text', {}, '[1]', '[["nested"]]', '[null]']) {
      assert.throws(() => serializeRoomContentInput(value, field), { status: 400 });
    }
  }
});

test('guest content enforces entry counts and text limits', () => {
  const category = { label: 'x'.repeat(80), detail: 'x'.repeat(160) };
  const faq = { question: 'x'.repeat(200), answer: 'x'.repeat(1000) };
  assert.doesNotThrow(() => serializeRoomContentInput(Array(4).fill(category), 'perfect_for'));
  assert.doesNotThrow(() => serializeRoomContentInput(Array(10).fill(faq), 'common_questions'));
  for (const [field, value] of [
    ['perfect_for', Array(5).fill(category)],
    ['common_questions', Array(11).fill(faq)],
    ['perfect_for', [{ ...category, label: 'x'.repeat(81) }]],
    ['perfect_for', [{ ...category, detail: 'x'.repeat(161) }]],
    ['common_questions', [{ ...faq, question: 'x'.repeat(201) }]],
    ['common_questions', [{ ...faq, answer: 'x'.repeat(1001) }]]
  ]) assert.throws(() => serializeRoomContentInput(value, field), { status: 400 });
});

test('reads preserve valid entries while discarding incomplete entries and unknown properties', () => {
  assert.deepEqual(parseRoomContentColumn([
    null, { label: 'Family stays', detail: 'Six guests', private_note: 'do not publish' }, { label: '' }
  ], 'perfect_for'), [{ label: 'Family stays', detail: 'Six guests' }]);
  assert.deepEqual(parseRoomContentColumn([
    { question: 'Missing answer?' }, { question: 'Breakfast?', answer: 'Not included', extra: 'ignored' }
  ], 'common_questions'), [{ question: 'Breakfast?', answer: 'Not included' }]);
});

test('JSON escaping cannot overflow the TEXT column even within individual text limits', () => {
  const escaped = { question: '\u0001'.repeat(200), answer: '\u0001'.repeat(1000) };
  assert.throws(() => serializeRoomContentInput(Array(10).fill(escaped), 'common_questions'), { status: 400 });
});
