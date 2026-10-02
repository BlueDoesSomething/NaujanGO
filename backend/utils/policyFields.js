// Shared validation for hotel policy / house-rule writes (owner + admin).
const CANCELLATION_TYPES = ['free_until', 'partial', 'non_refundable'];
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const normalizeText = (value) =>
  value === null || String(value).trim() === '' ? null : String(value).trim().slice(0, 4000);

// Returns { fields: { col: value } } or { error }.
export const parsePolicyFields = (body) => {
  const fields = {};
  const { cancellation_type, free_cancellation_days, custom_policy_text, house_rules, check_in_time, check_out_time, balance_due_days, is_active } = body || {};

  if (cancellation_type !== undefined) {
    if (!CANCELLATION_TYPES.includes(cancellation_type)) {
      return { error: 'Invalid cancellation type' };
    }
    fields.cancellation_type = cancellation_type;
  }

  if (free_cancellation_days !== undefined) {
    if (free_cancellation_days === null || free_cancellation_days === '') {
      fields.free_cancellation_days = 1;
    } else {
      const days = parseInt(free_cancellation_days, 10);
      if (!Number.isInteger(days) || days < 0 || days > 60) {
        return { error: 'Free cancellation days must be between 0 and 60' };
      }
      fields.free_cancellation_days = days;
    }
  }

  if (balance_due_days !== undefined) {
    if (balance_due_days === null || balance_due_days === '') {
      fields.balance_due_days = 1;
    } else {
      const days = parseInt(balance_due_days, 10);
      if (!Number.isInteger(days) || days < 0 || days > 30) {
        return { error: 'Balance due days must be between 0 and 30' };
      }
      fields.balance_due_days = days;
    }
  }

  if (check_in_time !== undefined) {
    if (!check_in_time || !TIME_PATTERN.test(String(check_in_time))) {
      return { error: 'Check-in time must be in HH:MM format' };
    }
    fields.check_in_time = String(check_in_time).slice(0, 5);
  }

  if (check_out_time !== undefined) {
    if (!check_out_time || !TIME_PATTERN.test(String(check_out_time))) {
      return { error: 'Check-out time must be in HH:MM format' };
    }
    fields.check_out_time = String(check_out_time).slice(0, 5);
  }

  if (custom_policy_text !== undefined) fields.custom_policy_text = normalizeText(custom_policy_text);
  if (house_rules !== undefined) fields.house_rules = normalizeText(house_rules);
  if (is_active !== undefined) fields.is_active = is_active ? 1 : 0;

  return { fields };
};

export const POLICY_FIELD_COLUMNS = [
  'cancellation_type',
  'free_cancellation_days',
  'custom_policy_text',
  'house_rules',
  'check_in_time',
  'check_out_time',
  'balance_due_days'
];
