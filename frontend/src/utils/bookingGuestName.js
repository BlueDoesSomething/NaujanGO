// The guest named on a reservation can differ from the account that created it.
// Prefer the booking form's full name; retain a fallback for legacy bookings.
export const getBookingGuestName = (booking) => {
  const fullName = typeof booking?.customer_name === 'string'
    ? booking.customer_name.trim()
    : '';
  const username = typeof booking?.username === 'string'
    ? booking.username.trim()
    : '';
  return fullName || username || '—';
};
