// Shared formatting for the "Booked On" (issued) date on booking records.
//
// The booking endpoints alias the row timestamp as `booking_date`
// (`hotel_bookings.created_at`) alongside the raw `created_at`, so surfaces
// accept either. `null` means the value was missing or unparseable - callers
// render their own em-dash placeholder rather than an "Invalid Date".

export const getBookingIssuedAt = (booking) => {
  if (!booking) return null;
  const raw = booking.booking_date || booking.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Two-line cell content: calendar day on top, time of day beneath.
export const getBookingIssuedParts = (booking) => {
  const date = getBookingIssuedAt(booking);
  if (!date) return null;
  return {
    date: date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    time: date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};
