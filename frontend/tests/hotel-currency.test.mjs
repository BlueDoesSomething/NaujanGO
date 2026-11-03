import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatHotelCurrency } from '../src/utils/hotelCurrency.js';

test('listing currency controls the display without converting amounts', () => {
  assert.equal(formatHotelCurrency(260, 'PHP'), '₱260');
  assert.equal(formatHotelCurrency('260.50', 'EUR'), '€260.5');
  assert.equal(formatHotelCurrency(260, 'USD'), '$260');
  assert.equal(formatHotelCurrency(260, ' eur '), '€260');
  assert.equal(formatHotelCurrency(260), '₱260');
  assert.equal(formatHotelCurrency(260, null), '₱260');
  assert.equal(formatHotelCurrency(260, 'PHP', { minimumFractionDigits: 2 }), '₱260.00');
});

test('invalid amounts are not advertised as a zero-dollar price', () => {
  for (const value of [undefined, null, '', 'invalid', Infinity]) {
    assert.equal(formatHotelCurrency(value, 'EUR'), '—');
  }
  assert.equal(formatHotelCurrency(0, 'EUR'), '€0');
  assert.equal(formatHotelCurrency(260, 'pesos'), 'PESOS 260');
});
