import { formatHotelCurrency } from './hotelCurrency.js';
import { philippineToday } from './stayBooking.js';

export const OWNER_PATHS = {
  overview: '/owner', hotels: '/owner/property', rooms: '/owner/rooms',
  calendar: '/owner/availability', 'payment-setup': '/owner/payment-setup',
  bookings: '/owner/bookings', payments: '/owner/payments', reviews: '/owner/reviews',
  analytics: '/owner/analytics', 'tourism-arrivals': '/owner/tourism-arrivals', profile: '/owner/profile', messages: '/owner/messages', archive: '/owner/archive'
};
export const ownerTabFromPath = pathname => {
  const path = pathname.replace(/\/$/, '');
  if (path === '/owner/hotels') return 'hotels';
  if (path === '/owner/notifications') return 'messages';
  return Object.keys(OWNER_PATHS).find(key => OWNER_PATHS[key] === path) || 'overview';
};

export const roomsForHotel = (rooms, hotel) => rooms.filter(room => Number(room.hotel_id) === Number(hotel.hotel_id));
export const ownerStartingPrice = (hotel, rooms) => {
  const propertyRooms = roomsForHotel(rooms, hotel);
  if (!propertyRooms.length) {
    return Number(hotel.price_per_night) > 0
      ? `Starting price ${formatHotelCurrency(hotel.price_per_night, hotel.currency)}/night · no room types yet`
      : 'Add room types and rates';
  }
  const active = propertyRooms.filter(room => Number(room.is_active) === 1 && Number(room.price_per_night) > 0);
  if (!active.length) return 'No active room rates';
  const currencies = [...new Set(active.map(room => room.currency || hotel.currency || 'PHP'))];
  if (currencies.length > 1) return 'Multiple room currencies · see Rooms & Rates';
  return `From ${formatHotelCurrency(Math.min(...active.map(room => Number(room.price_per_night))), currencies[0])}/night`;
};

export const validateOwnerHotel = (form, hasRooms = false) => {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter the property name.';
  if (!form.location.trim()) errors.location = 'Enter the location guests will see.';
  if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) errors.contact_email = 'Enter a valid contact email.';
  if (!/^[A-Z]{3}$/.test(form.currency || '')) errors.currency = 'Use a three-letter currency code, for example PHP.';
  if (!hasRooms && form.price_per_night !== '' && (!Number.isFinite(Number(form.price_per_night)) || Number(form.price_per_night) < 0)) errors.price_per_night = 'Enter a non-negative fallback price or leave it blank.';
  for (const [key, min, max] of [['latitude', -90, 90], ['longitude', -180, 180]]) {
    if (form[key] !== '' && (!Number.isFinite(Number(form[key])) || Number(form[key]) < min || Number(form[key]) > max)) errors[key] = `Enter a number between ${min} and ${max}.`;
  }
  for (const key of ['check_in_time', 'check_out_time']) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form[key] || '')) errors[key] = 'Enter a valid time.';
  }
  for (const [key, max] of [['free_cancellation_days', 60], ['balance_due_days', 30]]) {
    if (form[key] !== '' && (!Number.isInteger(Number(form[key])) || Number(form[key]) < 0 || Number(form[key]) > max)) errors[key] = `Enter a whole number from 0 to ${max}.`;
  }
  return errors;
};

export const validateOwnerRoom = form => {
  const errors = {};
  if (!form.room_type_name.trim()) errors.room_type_name = 'Enter a room type name.';
  if (!(Number(form.price_per_night) > 0) || !Number.isFinite(Number(form.price_per_night))) errors.price_per_night = 'Enter a nightly rate greater than zero.';
  if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) < 1) errors.capacity = 'Enter the maximum guests per room (at least 1).';
  if (form.quantity_available === '' || !Number.isInteger(Number(form.quantity_available)) || Number(form.quantity_available) < 0) errors.quantity_available = 'Enter a whole number of rooms, including 0 when none are offered.';
  if (!/^[A-Z]{3}$/.test(form.currency || '')) errors.currency = 'Use a three-letter currency code.';
  for (const key of ['check_in_time', 'check_out_time']) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form[key] || '')) errors[key] = 'Enter a valid time.';
  return errors;
};

// Only live reservations contribute to today's operational tasks. Dates are
// Philippine dates, including the latest approved hourly extension.
export const ownerTodayTasks = (bookings, today = philippineToday(), now = Date.now()) => {
  const live = bookings.filter(booking => !Number(booking.archived) && ['pending', 'confirmed'].includes(booking.status)
    && (booking.status === 'confirmed' || !booking.expires_at || new Date(booking.expires_at).getTime() > now));
  const boundary = (booking, side) => {
    let snapshot = booking.policy_snapshot;
    if (typeof snapshot === 'string') { try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; } }
    const extensions = Array.isArray(snapshot?.stay_extensions) ? snapshot.stay_extensions.filter(item => item?.to) : [];
    return String((side === 'out' ? extensions.at(-1)?.to : null) || snapshot?.[`check_${side}_at`] || booking[`check_${side}_at`] || booking[`check_${side}`] || '').slice(0, 10);
  };
  return {
    arrivals: live.filter(booking => booking.status === 'confirmed' && boundary(booking, 'in') === today),
    departures: live.filter(booking => booking.status === 'confirmed' && boundary(booking, 'out') === today),
    pending: live.filter(booking => booking.status === 'pending'),
    unpaid: live.filter(booking => Number(booking.balance_due) > 0)
  };
};
