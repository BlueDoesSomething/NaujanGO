import { bookingInstant, getStayExtensions } from './stayBooking.js';

export const canResumeBookingPayment = (booking, now = Date.now()) => {
  if (!booking || !['pending', 'confirmed'].includes(booking.status) || Number(booking.archived) === 1
      || ['paid', 'refunded'].includes(booking.payment_status) || !(Number(booking.balance_due) > 0)) return false;
  if (Number(booking.amount_paid || 0) <= 0 && booking.expires_at) {
    const expiry = new Date(booking.expires_at).getTime();
    if (!Number.isFinite(expiry) || expiry <= now) return false;
  }
  return bookingInstant(booking).getTime() > now
    || (booking.status === 'confirmed' && getStayExtensions(booking).length > 0);
};

export const paymentReturnPresentation = (result, cancelled = false) => {
  if (!result) return { kind: 'unknown', icon: '?', title: 'Payment not verified', text: 'We could not verify this payment. Open Booking History and check the correct booking. Do not pay again if money was deducted.' };
  if (result.state === 'review' || result.needs_staff_review) return { kind: 'review', icon: '!', title: 'Hotel review needed', text: 'This payment or reservation needs reconciliation. Contact the hotel before paying again. A return from checkout does not confirm a room.' };
  if (result.state === 'succeeded') return { kind: 'success', icon: '✓', title: 'Payment received', text: result.booking?.status === 'confirmed'
    ? Number(result.booking.balance_due) > 0 ? 'Your payment was verified. The booking is confirmed, with a remaining balance shown below.' : 'Your payment was verified and your booking is confirmed.'
    : 'Your payment was recorded. Check Booking History for the reservation status.' };
  if (result.state === 'checking' || result.verification_unavailable) return { kind: 'checking', icon: '…', title: 'Payment verification pending', text: 'We cannot confirm the provider result yet. Check again when your connection returns. If money was deducted, do not pay again.' };
  return { kind: 'pending', icon: '↩', title: cancelled || result.state === 'not_completed' ? 'Payment not completed' : 'Awaiting payment confirmation', text: 'No successful payment has been verified for this attempt. You can resume an eligible unpaid booking from Booking History. If money was deducted, check status before retrying.' };
};
