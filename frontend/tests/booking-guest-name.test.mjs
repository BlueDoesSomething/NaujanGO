import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getBookingGuestName } from '../src/utils/bookingGuestName.js';

test('shows the full name entered in the booking form instead of the account username', () => {
  assert.equal(getBookingGuestName({ customer_name: 'Maria Santos', username: 'maria123' }), 'Maria Santos');
});

test('trims surrounding whitespace but preserves the full name and its characters', () => {
  assert.equal(getBookingGuestName({ customer_name: '  José Dela Cruz  ', username: 'jose' }), 'José Dela Cruz');
  assert.equal(getBookingGuestName({ customer_name: '李小明', username: 'traveler' }), '李小明');
});

test('older bookings without a guest name fall back to the account username', () => {
  for (const customer_name of [undefined, null, '', ' \t\n ']) {
    assert.equal(getBookingGuestName({ customer_name, username: '  legacy_guest  ' }), 'legacy_guest');
  }
});

test('missing or invalid names render a placeholder without throwing', () => {
  for (const booking of [undefined, null, {}, { customer_name: '', username: ' ' }, { customer_name: 123, username: {} }]) {
    assert.equal(getBookingGuestName(booking), '—');
  }
});

test('imported reservations display distinct guest names even when linked to the same owner', () => {
  const bookings = [
    { user_id: 5, username: 'Bert', customer_name: 'Hannah Fernandez' },
    { user_id: 5, username: 'Bert', customer_name: 'Vincent Mercado' }
  ];
  assert.deepEqual(bookings.map(getBookingGuestName), ['Hannah Fernandez', 'Vincent Mercado']);
});

test('display formatting does not change the stored guest or account data', () => {
  const booking = Object.freeze({ customer_name: '  Guest Full Name  ', username: 'account_name', user_id: 5 });
  assert.equal(getBookingGuestName(booking), 'Guest Full Name');
  assert.equal(booking.customer_name, '  Guest Full Name  ');
  assert.equal(booking.username, 'account_name');
  assert.equal(booking.user_id, 5);
});

test('both dashboards use the guest-name formatter in recent, active, and archived booking cells', () => {
  for (const page of ['AdminDashboard', 'OwnerDashboard']) {
    const source = readFileSync(new URL(`../src/pages/${page}.jsx`, import.meta.url), 'utf8');
    assert.equal((source.match(/<td[^\n]*>\{getBookingGuestName\(booking\)\}<\/td>/g) || []).length, 3);
    assert.doesNotMatch(source, /<td[^\n]*>\{booking\.username(?:\s*\|\|[^}]*)?\}<\/td>/);
  }
});

test('admin booking search includes the displayed guest name and keeps account username search', () => {
  const source = readFileSync(new URL('../src/pages/AdminDashboard.jsx', import.meta.url), 'utf8');
  assert.match(source, /\$\{getBookingGuestName\(booking\)\} \$\{booking\.username \|\| ''\}/);
});
