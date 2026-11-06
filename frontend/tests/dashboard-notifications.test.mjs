import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationIsRead, notificationDestination } from '../src/utils/dashboardNotifications.js';

test('notification read flags normalize MySQL booleans without treating string zero as read', () => {
  for (const value of [true, 1, '1']) assert.equal(notificationIsRead(value), true);
  for (const value of [false, 0, '0', null, undefined, '', 'false']) assert.equal(notificationIsRead(value), false);
});

test('notification destinations use known dashboard modules, not stored URLs or guessed record access', () => {
  assert.deepEqual(notificationDestination({ type: 'booking_message', related_id: 15 }, 'owner'), { module: 'bookings', label: 'Open Reservations' });
  assert.deepEqual(notificationDestination({ type: 'booking' }, 'admin'), { module: 'bookings', label: 'Open Bookings' });
  assert.equal(notificationDestination({ type: 'payment' }, 'owner').module, 'payments');
  assert.equal(notificationDestination({ type: 'message' }, 'owner').module, 'messages');
  assert.equal(notificationDestination({ type: 'message' }, 'admin'), null);
  assert.equal(notificationDestination({ type: 'unknown', url: 'javascript:alert(1)' }, 'owner'), null);
});
