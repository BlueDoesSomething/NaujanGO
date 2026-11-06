export const PAY_AT_PROPERTY_NOTICE = 'Pay at the property. No advance deposit is requested through NaujanGO. NaujanGO does not process or verify this payment.';
export const isExternalPaymentBooking = booking => {
  let snapshot = booking?.policy_snapshot;
  if (typeof snapshot === 'string') { try { snapshot = JSON.parse(snapshot); } catch { snapshot = null; } }
  return snapshot?.payment_handling === 'external';
};
