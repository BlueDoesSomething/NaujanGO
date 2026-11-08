export const PAY_AT_PROPERTY_NOTICE = 'Pay at the property. No advance deposit is requested through NaujanGO. NaujanGO does not process or verify this payment.';
const manualLabel = method => method === 'maya' ? 'Maya' : 'GCash';
export const manualDirectNotice = method => `Pay the owner directly through ${manualLabel(method)}. Use Message property on your booking to ask for the owner’s ${manualLabel(method)} QR code or number. Confirm the recipient and amount with the owner before transferring. NaujanGO does not collect or verify this payment.`;
export const MANUAL_GCASH_NOTICE = manualDirectNotice('gcash');
const snapshotFor = booking => {
  let snapshot = booking?.policy_snapshot;
  if (typeof snapshot === 'string') { try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; } }
  return snapshot;
};
export const isExternalPaymentBooking = booking => snapshotFor(booking)?.payment_handling === 'external';
export const externalPaymentArrangement = booking => snapshotFor(booking)?.payment_arrangement || booking?.payment_method || '';
export const isManualDirectWalletBooking = booking => isExternalPaymentBooking(booking) && ['gcash', 'maya'].includes(externalPaymentArrangement(booking));
export const isManualGCashBooking = booking => externalPaymentArrangement(booking) === 'gcash' && isExternalPaymentBooking(booking);
export const externalPaymentLabel = booking => isManualDirectWalletBooking(booking) ? `${manualLabel(externalPaymentArrangement(booking))} · direct to owner` : 'Pay at property';
export const externalPaymentNotice = booking => isManualDirectWalletBooking(booking) ? manualDirectNotice(externalPaymentArrangement(booking)) : PAY_AT_PROPERTY_NOTICE;
