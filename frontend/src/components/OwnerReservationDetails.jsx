import React from 'react';
import OwnerDialog from './OwnerDialog';
import { getBookingGuestName } from '../utils/bookingGuestName';
import { formatBookingBoundary } from '../utils/stayBooking';
import { policyLinesFromSnapshot } from '../utils/bookingPolicy';
import { formatHotelCurrency } from '../utils/hotelCurrency';
import { getBookingPaymentMethod, getPaymentMethodLabel } from '../utils/paymentDisplay';

export default function OwnerReservationDetails({ booking, onClose, onCancel, onPayments, t }) {
  let snapshot = booking.policy_snapshot;
  if (typeof snapshot === 'string') { try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; } }
  const policies = policyLinesFromSnapshot(snapshot, { t, checkIn: booking.check_in, showBalance: Number(booking.balance_due) > 0 });
  const money = value => value == null ? 'Not available' : formatHotelCurrency(value, booking.currency, { minimumFractionDigits: 2 });
  const rows = [
    ['Guest', getBookingGuestName(booking)], ['Email', booking.customer_email || booking.email || 'Not provided'], ['Phone', booking.customer_phone || 'Not provided'],
    ['Room type', booking.room_type_name || 'Not specified'], ['Rooms / guests', `${booking.rooms} room(s) · ${booking.guests ?? '—'} guest(s)`],
    ['Check-in', formatBookingBoundary(booking)], ['Check-out', formatBookingBoundary(booking, 'out')],
    ['Reservation status', booking.status], ['Payment status', booking.payment_status || 'Not available'],
    ['Total', money(booking.total_amount)], ['Recorded paid', money(booking.amount_paid)], ['Balance due', money(booking.balance_due)],
    ['Payment method', getPaymentMethodLabel(getBookingPaymentMethod(booking), t)]
  ];
  return <OwnerDialog title={`Reservation #${booking.booking_id}`} onClose={onClose} actions={<>
    <button type="button" className="gov-btn-ghost" onClick={onPayments}>View payments</button>
    {['pending', 'confirmed'].includes(booking.status) && <button type="button" className="gov-btn-danger" onClick={onCancel}>Cancel reservation…</button>}
  </>}>
    <dl className="owner-detail-fields">{rows.map(([label, value]) => <React.Fragment key={label}><dt>{label}</dt><dd>{value}</dd></React.Fragment>)}</dl>
    <h3>Guest requests</h3><p>{booking.special_requests || 'No special requests.'}</p>
    <h3>Policies agreed at booking</h3>
    {policies.length ? <ul>{policies.map((line, index) => <li key={index}>{line.text}</li>)}</ul> : <p>No stored policy snapshot is available. Current hotel policies are not substituted for historical terms.</p>}
  </OwnerDialog>;
}
