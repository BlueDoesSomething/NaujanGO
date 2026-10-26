const METHODS = {
  card: ['payment_provider_card', 'Credit/Debit Card'],
  gcash: ['payment_provider_gcash', 'GCash'],
  grabpay: ['payment_provider_grabpay', 'GrabPay'],
  qrph: ['payment_provider_qrph', 'QR PH'],
  paypal: ['payment_provider_paypal', 'PayPal'],
  bank_transfer: ['payment_provider_bank_transfer', 'Bank Transfer'],
  pay_at_property: ['payment_method_pay_at_property', 'Pay at Property']
};

const text = value => typeof value === 'string' ? value.trim() : '';

export const getPaymentMethodLabel = (method, t = key => key) => {
  const value = text(method);
  if (!value) return '—';
  const option = METHODS[value.toLowerCase()];
  if (!option) return value;
  const [key, fallback] = option;
  const translated = t(key);
  return typeof translated === 'string' && translated.trim() && translated !== key
    ? translated
    : fallback;
};

export const getBookingPaymentMethod = booking =>
  text(booking?.display_payment_method) || text(booking?.payment_method);

export const getPaymentReferences = (payment) => {
  const references = [];
  const customer = text(payment?.customer_reference_number);
  const transaction = text(payment?.transaction_reference);
  if (customer) references.push({ label: 'Customer payment', value: customer });
  if (transaction) references.push({
    label: payment?.provider === 'manual_ledger' ? 'Internal payment' : 'Transaction',
    value: transaction
  });
  return references;
};

export const getBookingReferences = (booking) => {
  const references = [];
  const bookingReference = text(booking?.booking_reference);
  const receipt = text(booking?.receipt_number);
  if (bookingReference) references.push({ label: 'Booking', value: bookingReference });
  else if (receipt) references.push({ label: 'Receipt', value: receipt });
  else references.push({ label: 'Booking', value: null });

  const paymentReferences = getPaymentReferences({
    customer_reference_number: booking?.payment_customer_reference,
    transaction_reference: booking?.payment_record_id
      ? booking.payment_transaction_reference
      : text(booking?.payment_transaction_reference) || text(booking?.payment_reference),
    provider: booking?.payment_provider
  });
  return references.concat(paymentReferences.length ? paymentReferences : [{ label: 'Payment', value: null }]);
};
