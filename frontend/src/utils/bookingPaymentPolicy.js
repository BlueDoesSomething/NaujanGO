export const PAY_AT_PROPERTY_NOTICE = 'Pay at the property. No advance deposit is requested through NaujanGO. NaujanGO does not process or verify this payment.';
export const MANUAL_GCASH_NOTICE = 'Pay the owner directly through GCash. Use Message property on your booking to ask for the owner’s GCash QR code or number. Confirm the recipient and amount with the owner before transferring. NaujanGO does not collect or verify this payment.';
const snapshotFor = booking => {
  let snapshot = booking?.policy_snapshot;
  if (typeof snapshot === 'string') { try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; } }
  return snapshot;
};
export const isExternalPaymentBooking = booking => snapshotFor(booking)?.payment_handling === 'external';
export const isManualGCashBooking = booking => isExternalPaymentBooking(booking) && (snapshotFor(booking)?.payment_arrangement || booking?.payment_method) === 'gcash';
export const externalPaymentLabel = booking => isManualGCashBooking(booking) ? 'GCash · direct to owner' : 'Pay at property';
export const externalPaymentNotice = booking => isManualGCashBooking(booking) ? MANUAL_GCASH_NOTICE : PAY_AT_PROPERTY_NOTICE;
