// Shared helpers for the hotels.allowed_payment_methods column.
//
// The column stores a comma-separated string of method keys, e.g.
// "card,gcash,pay_at_property". Admin and owner write paths both go through
// parsePaymentMethodsInput so the whitelist can never drift between the two
// dashboards; the frontend renders the same keys via
// frontend/src/utils/hotelPaymentMethods.js.

// Upper bound for a single uploaded hotel image. Phone photos and screenshots
// regularly exceed 6MB, so this is deliberately generous; shared with the
// owner controller so both dashboards behave identically.
export const HOTEL_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

export const DEFAULT_PAYMENT_METHODS = [
  'card',
  'gcash',
  'grabpay',
  'qrph',
  'paypal',
  'bank_transfer',
  'pay_at_property'
];

const PAYMENT_METHOD_SET = new Set(DEFAULT_PAYMENT_METHODS);

// Normalizes whatever shape the client sent (array, CSV string, JSON array
// string, single value) into the CSV the column expects. Unknown keys are
// dropped; an empty result falls back to the full default set.
export const parsePaymentMethodsInput = (methods) => {
  if (methods === null || methods === undefined) return DEFAULT_PAYMENT_METHODS.join(',');
  let parsed = [];

  if (Array.isArray(methods)) {
    parsed = methods;
  } else if (typeof methods === 'string') {
    const trimmed = methods.trim();
    if (!trimmed) return DEFAULT_PAYMENT_METHODS.join(',');
    if (trimmed.startsWith('[')) {
      try {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr)) {
          parsed = arr;
        }
      } catch {
        parsed = trimmed.split(',');
      }
    } else {
      parsed = trimmed.split(',');
    }
  } else {
    parsed = [String(methods)];
  }

  const normalized = parsed
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => PAYMENT_METHOD_SET.has(item));

  const unique = [...new Set(normalized)];
  return (unique.length ? unique : DEFAULT_PAYMENT_METHODS).join(',');
};

// Reads the stored CSV back out as a list for API responses.
export const parseStoredPaymentMethods = (value) => {
  const parsed = parsePaymentMethodsInput(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : DEFAULT_PAYMENT_METHODS;
};