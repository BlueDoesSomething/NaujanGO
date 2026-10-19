import React from 'react';
import { getBookingIssuedParts } from '../utils/bookingIssuedAt';

/**
 * Table cell showing when a booking was issued ("Booked On").
 *
 * Surfaces that group the two date columns together - the Owner and Admin
 * Reservations tables - render the calendar day on top with the time of day
 * muted beneath it, matching the secondary-line styling used by the Amount
 * column next to it.
 */
const BookingIssuedCell = ({ booking }) => {
  const issued = getBookingIssuedParts(booking);

  if (!issued) {
    return <span style={{ color: '#9ca3af' }}>-</span>;
  }

  return (
    <div>
      <div style={{ whiteSpace: 'nowrap' }}>{issued.date}</div>
      <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>{issued.time}</div>
    </div>
  );
};

export default BookingIssuedCell;
