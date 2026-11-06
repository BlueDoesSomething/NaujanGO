import test from 'node:test';
import assert from 'node:assert/strict';
import { OWNER_PATHS, ownerTabFromPath, ownerStartingPrice, validateOwnerHotel, validateOwnerRoom, ownerTodayTasks } from '../src/utils/ownerDashboard.js';

const hotel = { hotel_id: 1, currency: 'PHP', price_per_night: '0.00' };
const room = { room_id: 2, hotel_id: 1, price_per_night: 450, is_active: 1, quantity_available: 2 };

test('owner routes have stable URLs, notifications have their own page and old hotel links still resolve', () => {
  for (const [tab, path] of Object.entries(OWNER_PATHS)) assert.equal(ownerTabFromPath(path), tab);
  assert.equal(ownerTabFromPath('/owner/hotels'), 'hotels');
  assert.equal(ownerTabFromPath('/owner/notifications'), 'notifications');
  assert.equal(ownerTabFromPath('/owner/rooms/'), 'rooms');
});

test('owner starting prices use active room rates, never a competing zero hotel price', () => {
  assert.equal(ownerStartingPrice(hotel, [room, { ...room, room_id: 3, price_per_night: 100, is_active: 0 }]), 'From ₱450/night');
  assert.equal(ownerStartingPrice(hotel, []), 'Add room types and rates');
  assert.equal(ownerStartingPrice({ ...hotel, price_per_night: 300 }, []), 'Starting price ₱300/night · no room types yet');
  assert.equal(ownerStartingPrice(hotel, [{ ...room, hotel_id: 9 }]), 'Add room types and rates');
  assert.equal(ownerStartingPrice(hotel, [{ ...room, is_active: 0 }]), 'No active room rates');
  assert.match(ownerStartingPrice(hotel, [room, { ...room, currency: 'USD' }]), /Multiple room currencies/);
});

const hotelForm = { name: 'Inn', location: 'Naujan', contact_email: '', currency: 'PHP', price_per_night: '', latitude: '', longitude: '', check_in_time: '14:00', check_out_time: '12:00', free_cancellation_days: 1, balance_due_days: 1 };
test('hotel creation needs public identity, not a redundant hotel nightly price', () => {
  assert.deepEqual(validateOwnerHotel(hotelForm), {});
  assert.match(validateOwnerHotel({ ...hotelForm, name: '  ' }).name, /property name/);
  assert.match(validateOwnerHotel({ ...hotelForm, contact_email: 'invalid' }).contact_email, /email/);
  assert.match(validateOwnerHotel({ ...hotelForm, latitude: 91 }).latitude, /-90 and 90/);
  assert.match(validateOwnerHotel({ ...hotelForm, currency: 'pesos' }).currency, /currency code/);
  assert.equal(validateOwnerHotel({ ...hotelForm, price_per_night: -1 }, true).price_per_night, undefined, 'hidden fallback rate must not block room-based properties');
});

test('zero room inventory is valid, but blank, negative and fractional quantities are not', () => {
  const form = { room_type_name: 'Queen', price_per_night: 450, capacity: 2, quantity_available: '0', currency: 'PHP', check_in_time: '14:00', check_out_time: '12:00' };
  assert.deepEqual(validateOwnerRoom(form), {});
  for (const quantity_available of ['', -1, 1.5]) assert.ok(validateOwnerRoom({ ...form, quantity_available }).quantity_available);
  assert.ok(validateOwnerRoom({ ...form, capacity: 0 }).capacity);
  assert.ok(validateOwnerRoom({ ...form, price_per_night: 0 }).price_per_night);
});

test('daily work uses Philippine dates, live statuses and latest approved checkout', () => {
  const bookings = [
    { booking_id: 1, status: 'confirmed', check_in: '2099-12-20', check_out: '2099-12-21', balance_due: 10, expires_at: '2000-01-01' },
    { booking_id: 2, status: 'pending', check_in: '2099-12-20', check_out: '2099-12-21' },
    { booking_id: 3, status: 'cancelled', check_in: '2099-12-20' },
    { booking_id: 4, status: 'confirmed', archived: 1, check_in: '2099-12-20' },
    { booking_id: 5, status: 'pending', expires_at: '2000-01-01' },
    { booking_id: 6, status: 'confirmed', check_in: '2099-12-19', check_out: '2099-12-20', policy_snapshot: JSON.stringify({ stay_extensions: [{ to: '2099-12-21 02:00:00' }] }) }
  ];
  const tasks = ownerTodayTasks(bookings, '2099-12-20');
  assert.deepEqual(tasks.arrivals.map(row => row.booking_id), [1]);
  assert.deepEqual(tasks.departures, []);
  assert.deepEqual(tasks.pending.map(row => row.booking_id), [2]);
  assert.deepEqual(tasks.unpaid.map(row => row.booking_id), [1]);
});
