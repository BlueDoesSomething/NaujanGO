import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingInstant, bookingLocalTime, extensionPreview, formatBookingBoundary, getHourlyRates, getPaymentPlans, getStayExtensions, hourlyCheckout, stayProgress } from '../src/utils/stayBooking.js';

test('hourly checkout previews support same-day stays, midnight rollover, and 24-hour packages', () => {
  assert.deepEqual(hourlyCheckout('2026-11-02', '09:00', 3), { date: '2026-11-02', time: '12:00', value: '2026-11-02 12:00' });
  assert.equal(hourlyCheckout('2026-11-02', '18:00', 12).value, '2026-11-03 06:00');
  assert.equal(hourlyCheckout('2026-11-02', '09:00', 24).value, '2026-11-03 09:00');
  assert.equal(hourlyCheckout('2026-02-30', '09:00', 3), null);
  assert.equal(hourlyCheckout('2026-11-02', '24:00', 3), null);
});
test('only configured packages and enabled payment plans are offered', () => {
  assert.deepEqual(getHourlyRates('{"3":"300.00","12":"","24":1500}'), { 3: 300, 24: 1500 });
  assert.deepEqual(getPaymentPlans('["half"]'), ['half']);
  assert.deepEqual(getPaymentPlans('[]'), []);
  assert.deepEqual(getPaymentPlans(null), ['reservation', 'half', 'full']);
});
test('bookings use Philippine local times consistently for summaries and calendar downloads', () => {
  const booking = { check_in: '2026-11-02', check_out: '2026-11-02', stay_duration_hours: 3,
    policy_snapshot: '{"check_in_at":"2026-11-02 09:00:00","check_out_at":"2026-11-02 12:00:00"}' };
  assert.equal(bookingInstant(booking).toISOString(), '2026-11-02T01:00:00.000Z');
  assert.equal(bookingInstant(booking, 'out').toISOString(), '2026-11-02T04:00:00.000Z');
  assert.match(formatBookingBoundary(booking), /9:00.*PHT/);
  assert.match(formatBookingBoundary(booking, 'out'), /12:00.*PHT/);
});

test('extension previews start at existing checkout and price each reserved room', () => {
  assert.deepEqual(extensionPreview('2026-11-02 12:00:00', 3, 250, 1), { checkout: '2026-11-02 15:00:00', amount: 250 });
  assert.deepEqual(extensionPreview('2026-11-02 18:00:00', '12', '750', '2'), { checkout: '2026-11-03 06:00:00', amount: 1500 });
  assert.deepEqual(extensionPreview('2026-11-02 12:00:00', 24, 349.99, 3), { checkout: '2026-11-03 12:00:00', amount: 1049.97 });
});

test('invalid extension dates, packages, rates, and room counts have no preview', () => {
  for (const [checkout, hours, rate, rooms] of [
    ['2026-02-30 12:00:00', 3, 250, 1], ['2026-11-02 24:00:00', 3, 250, 1],
    ['2026-11-02 12:00', 3, 250, 1], [null, 3, 250, 1],
    ['2026-11-02 12:00:00', 6, 250, 1], ['2026-11-02 12:00:00', 3, 0, 1],
    ['2026-11-02 12:00:00', 3, Infinity, 1], ['2026-11-02 12:00:00', 3, 250, 1.5],
    ['2026-11-02 12:00:00', 3, 250, 0]
  ]) assert.equal(extensionPreview(checkout, hours, rate, rooms), null);
});

const extendedBooking = () => ({
  status: 'confirmed', payment_status: 'partial', stay_duration_hours: 18,
  check_in: '2026-11-02', check_out: '2026-11-03',
  check_in_at: '2026-11-02 09:00:00', check_out_at: '2026-11-03 03:00:00',
  policy_snapshot: {
    check_in_at: '2026-11-02 09:00:00', check_out_at: '2026-11-02 12:00:00', stay_duration_hours: 3,
    stay_extensions: [
      { hours: 3, amount: 250, to: '2026-11-02 15:00:00' },
      { hours: 12, amount: 750, to: '2026-11-03 03:00:00' }
    ]
  }
});

test('summaries and calendar downloads use the latest extension without rewriting original policy', () => {
  for (const encoded of [false, true]) {
    const booking = extendedBooking();
    if (encoded) booking.policy_snapshot = JSON.stringify(booking.policy_snapshot);
    assert.equal(bookingLocalTime(booking), '2026-11-02 09:00');
    assert.equal(bookingLocalTime(booking, 'out'), '2026-11-03 03:00');
    assert.equal(bookingInstant(booking, 'out').toISOString(), '2026-11-02T19:00:00.000Z');
    assert.match(formatBookingBoundary(booking, 'out'), /Nov 3, 2026.*3:00.*PHT/);
    assert.equal(getStayExtensions(booking).length, 2);
  }
  assert.equal(extendedBooking().policy_snapshot.check_out_at, '2026-11-02 12:00:00');
});

test('missing or malformed extension history does not create fake extensions', () => {
  for (const policy_snapshot of [null, 'corrupt', '{}', { stay_extensions: {} }]) {
    assert.deepEqual(getStayExtensions({ policy_snapshot }), []);
  }
  const booking = extendedBooking();
  booking.policy_snapshot.stay_extensions.push(null, {}, { hours: 3, amount: Infinity, to: '2026-11-03 06:00:00' });
  assert.equal(getStayExtensions(booking).length, 2);
  assert.equal(bookingLocalTime(booking, 'out'), '2026-11-03 03:00');
});

test('staff checkout warnings distinguish upcoming, active, approaching, and overdue stays in PHT', () => {
  const booking = extendedBooking();
  const progressAt = value => stayProgress(booking, Date.parse(value));
  assert.deepEqual(progressAt('2026-11-02T08:59:00+08:00'), { state: 'upcoming', canExtend: false, label: 'Starts later' });
  assert.equal(progressAt('2026-11-02T09:00:00+08:00').state, 'active');
  assert.equal(progressAt('2026-11-02T13:00:00+08:00').state, 'active', 'the original checkout no longer makes an extended stay overdue');
  assert.equal(progressAt('2026-11-03T02:29:00+08:00').state, 'active');
  assert.deepEqual(progressAt('2026-11-03T02:30:00+08:00'), { state: 'soon', canExtend: true, label: 'Checkout in 30 min' });
  assert.equal(progressAt('2026-11-03T02:59:30+08:00').label, 'Checkout in 1 min');
  assert.deepEqual(progressAt('2026-11-03T03:00:00+08:00'), { state: 'overdue', canExtend: true, label: 'Checkout due — staff follow-up needed' });
});

test('nightly, inactive, archived, refunded, and invalid stays have no extension controls', () => {
  for (const change of [
    { stay_duration_hours: null }, { status: 'pending' }, { status: 'cancelled' }, { status: 'completed' },
    { archived: 1 }, { payment_status: 'refunded' }, { payment_status: 'disputed' },
    { check_in: '', check_in_at: '', policy_snapshot: {} }
  ]) assert.equal(stayProgress({ ...extendedBooking(), ...change }), null);
});
