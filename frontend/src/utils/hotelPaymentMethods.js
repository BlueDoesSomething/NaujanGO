// Payment-method options rendered by the hotel editor in both dashboards.
// The `value` keys must stay in sync with DEFAULT_PAYMENT_METHODS in
// backend/utils/paymentMethods.js, which validates what gets written to the
// hotels.allowed_payment_methods column.

export const HOTEL_PAYMENT_METHOD_OPTIONS = (t) => [
  { value: 'card', label: t('payment_provider_card') },
  { value: 'gcash', label: t('payment_provider_gcash') },
  { value: 'grabpay', label: t('payment_provider_grabpay') },
  { value: 'qrph', label: t('payment_provider_qrph') || 'QR PH' },
  { value: 'paypal', label: t('payment_provider_paypal') },
  { value: 'bank_transfer', label: t('payment_provider_bank_transfer') },
  { value: 'pay_at_property', label: t('payment_method_pay_at_property') }
];

export const DEFAULT_HOTEL_PAYMENT_METHODS = [
  'card',
  'gcash',
  'grabpay',
  'qrph',
  'paypal',
  'bank_transfer',
  'pay_at_property'
];