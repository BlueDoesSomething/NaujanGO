import { PAYMENT_OPTIONS } from './paymentAmounts.js';

export const STAY_HOURS = [3, 12, 24];
export const PAYMENT_PLANS = PAYMENT_OPTIONS;
export const HOUR_MS = 3600000;
export const DAY_MS = 24 * HOUR_MS;
export const MANILA_OFFSET_MS = 8 * HOUR_MS;
export const stayError = (message, status = 400) => Object.assign(new Error(message), { status });

export const readJson = value => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

export const parseHourlyRates = (value, strict = false) => {
  const raw = readJson(value);
  if (raw == null && !strict) return {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    if (strict) throw stayError('Hourly rates must be an object containing 3, 12, or 24-hour prices.');
    return {};
  }
  if (strict && Object.keys(raw).some(key => !STAY_HOURS.map(String).includes(key))) {
    throw stayError('Only 3, 12, and 24-hour packages are supported.');
  }
  const rates = {};
  for (const hours of STAY_HOURS) {
    const value = raw[hours];
    if (value === '' || value == null) continue;
    const price = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
    if (!Number.isFinite(price) || price <= 0 || price > 99999999.99 || Math.abs(price * 100 - Math.round(price * 100)) > 0.00001) {
      if (strict) throw stayError(`The ${hours}-hour rate must be a positive price with at most two decimal places.`);
      continue;
    }
    rates[hours] = price;
  }
  return rates;
};

// NULL means legacy/default behavior. An explicit invalid/empty setting must
// never silently re-enable a plan that an owner has disabled.
export const parsePaymentPlans = (value, strict = false) => {
  if (value == null && !strict) return [...PAYMENT_PLANS];
  const raw = readJson(value);
  if (!Array.isArray(raw) || !raw.length || raw.some(plan => !PAYMENT_PLANS.includes(plan))) {
    if (strict) throw stayError('Enable at least one valid payment plan.');
    return [];
  }
  return PAYMENT_PLANS.filter(plan => raw.includes(plan));
};

export const dateKey = value => {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  return typeof value === 'string' ? value.slice(0, 10) : '';
};

export const sqlDateTime = value => {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return `${dateKey(value)} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`;
  }
  return typeof value === 'string' ? value.replace('T', ' ').slice(0, 19) : null;
};

export const localTimeMs = value => {
  const text = sqlDateTime(value);
  if (!text || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(?::\d{2})?$/.test(text)) return NaN;
  const ms = Date.parse(`${text.replace(' ', 'T').padEnd(19, ':00')}Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 16) === text.replace(' ', 'T').slice(0, 16) ? ms : NaN;
};

const dayMs = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : NaN;
};
const formatMs = ms => new Date(ms).toISOString().slice(0, 19).replace('T', ' ');

export const makeStay = (input, policy = {}, now = Date.now()) => {
  const startDay = dayMs(input.check_in);
  if (!Number.isFinite(startDay)) throw stayError('A valid check-in date is required (YYYY-MM-DD).');
  const today = new Date(now + MANILA_OFFSET_MS).toISOString().slice(0, 10);
  if (input.check_in < today) throw stayError('Check-in date cannot be in the past.');
  const hourly = input.stay_duration_hours !== undefined && input.stay_duration_hours !== null && input.stay_duration_hours !== '';
  let start, end, nights, hours = null;
  if (hourly) {
    hours = Number(input.stay_duration_hours);
    if (!['number', 'string'].includes(typeof input.stay_duration_hours) || !STAY_HOURS.includes(hours)) throw stayError('Choose a 3, 12, or 24-hour stay.');
    if (typeof input.check_in_time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.check_in_time)) {
      throw stayError('A valid check-in time is required for an hourly stay.');
    }
    start = localTimeMs(`${input.check_in} ${input.check_in_time}:00`);
    if (start < now + MANILA_OFFSET_MS) throw stayError('Check-in time cannot be in the past (Philippine time).');
    end = start + hours * HOUR_MS;
    nights = Math.floor((end - startDay) / DAY_MS);
  } else {
    const endDay = dayMs(input.check_out);
    nights = (endDay - startDay) / DAY_MS;
    if (!Number.isFinite(nights) || nights < 1 || nights > 90) throw stayError('Nightly stays require checkout after check-in, up to 90 nights.');
    start = localTimeMs(`${input.check_in} ${String(policy.check_in_time || '14:00').slice(0, 5)}:00`);
    end = localTimeMs(`${input.check_out} ${String(policy.check_out_time || '12:00').slice(0, 5)}:00`);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw stayError('Invalid stay times.');
  return {
    start, end, hours, nights, units: hourly ? 1 : nights,
    checkIn: formatMs(start).slice(0, 10), checkOut: formatMs(end).slice(0, 10),
    checkInAt: formatMs(start), checkOutAt: formatMs(end),
    lastOccupiedDate: formatMs(end - 1).slice(0, 10)
  };
};

export const bookingInterval = booking => {
  const policy = readJson(booking.policy_snapshot) || {};
  const start = localTimeMs(booking.check_in_at || `${dateKey(booking.check_in)} ${String(policy.check_in_time || '14:00').slice(0, 5)}:00`);
  const end = localTimeMs(booking.check_out_at || `${dateKey(booking.check_out)} ${String(policy.check_out_time || '12:00').slice(0, 5)}:00`);
  return { start, end };
};

export const peakBookedRooms = (bookings, start, end) => {
  const events = [];
  for (const booking of bookings) {
    const interval = bookingInterval(booking);
    if (!Number.isFinite(interval.start) || !Number.isFinite(interval.end)) throw stayError('Cannot verify an existing booking interval.', 503);
    const from = Math.max(start, interval.start), to = Math.min(end, interval.end);
    if (from < to) events.push([from, Number(booking.rooms) || 0], [to, -(Number(booking.rooms) || 0)]);
  }
  // Checkout frees inventory before another check-in at exactly the same time.
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let occupied = 0, peak = 0;
  for (const [, change] of events) { occupied += change; peak = Math.max(peak, occupied); }
  return peak;
};

export const serializeStay = booking => ({
  ...booking,
  check_in: dateKey(booking.check_in),
  check_out: dateKey(booking.check_out),
  check_in_at: sqlDateTime(booking.check_in_at),
  check_out_at: sqlDateTime(booking.check_out_at)
});
