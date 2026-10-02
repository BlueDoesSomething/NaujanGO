// Shared derivation of guest-facing booking policy lines.
// `t` is passed in by each surface so every label goes through LanguageContext.

// Icon component names on the default Icons export, keyed by line type.
export const POLICY_LINE_ICONS = {
  calendar: 'Calendar',
  refund: 'Info',
  money: 'Money',
  clock: 'Clock',
  rule: 'Document',
  house: 'Hotel'
};

const formatPolicyDate = (date) =>
  date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

// Free-cancellation cutoff: end of (check-in minus freeDays).
export const getCancellationCutoff = (checkInKey, freeDays) => {
  if (!checkInKey) return null;
  const date = new Date(`${String(checkInKey).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const days = Number.isFinite(Number(freeDays)) ? Math.max(0, Math.trunc(Number(freeDays))) : 1;
  date.setDate(date.getDate() - days);
  return date;
};

const normalizePolicy = (policy) => ({
  cancellation_type: policy?.cancellation_type || 'free_until',
  free_cancellation_days: policy?.free_cancellation_days == null ? 1 : Number(policy.free_cancellation_days),
  custom_policy_text: policy?.custom_policy_text || null,
  house_rules: policy?.house_rules || null,
  check_in_time: policy?.check_in_time ? String(policy.check_in_time).slice(0, 5) : '14:00',
  check_out_time: policy?.check_out_time ? String(policy.check_out_time).slice(0, 5) : '12:00',
  reservation_fee: policy?.reservation_fee == null ? null : Number(policy.reservation_fee),
  balance_due_days: policy?.balance_due_days == null ? 1 : Number(policy.balance_due_days),
  balance_due_at: policy?.balance_due_at || null
});

/**
 * Returns [{ icon, text }] rows for the policy card.
 * options: { checkIn, balanceDueAt, showBalance, t }
 *  - checkIn       : booking check-in date (YYYY-MM-DD) — drives the computed cutoff
 *  - balanceDueAt  : explicit balance deadline (YYYY-MM-DD), overrides computation
 *  - showBalance   : show the "remaining balance" row (hide for full prepayment)
 */
export const buildPolicyLines = (policy, options) => {
  const { checkIn = null, balanceDueAt = null, showBalance = false, t } = options || {};
  const p = normalizePolicy(policy);
  const lines = [];

  if (p.cancellation_type === 'non_refundable') {
    lines.push({ icon: 'calendar', text: t('policy_nonrefundable_notice') });
  } else {
    const cutoff = getCancellationCutoff(checkIn, p.free_cancellation_days);
    const headline = cutoff
      ? `${t('policy_free_cancel_until')} ${formatPolicyDate(cutoff)}`
      : `${t('policy_free_cancel_until')} ${p.free_cancellation_days} ${t('policy_days_before_checkin')}`;
    lines.push({ icon: 'calendar', text: headline });
    lines.push({
      icon: 'refund',
      text: p.cancellation_type === 'partial'
        ? t('policy_after_cutoff_partial')
        : t('policy_after_cutoff_nonrefundable')
    });
  }

  lines.push({ icon: 'money', text: t('policy_payment_terms') });
  if (p.reservation_fee != null && p.reservation_fee > 0) {
    lines.push({ icon: 'money', text: t('policy_fee_nonrefundable') });
  }
  if (showBalance) {
    const dueDate = balanceDueAt || p.balance_due_at;
    if (dueDate) {
      const formatted = formatPolicyDate(new Date(`${String(dueDate).slice(0, 10)}T00:00:00`));
      lines.push({ icon: 'money', text: `${t('policy_balance_due')} ${formatted}` });
    }
  }

  lines.push({
    icon: 'clock',
    text: `${t('policy_checkin_from')} ${p.check_in_time}  ·  ${t('policy_checkout_until')} ${p.check_out_time}`
  });
  lines.push({ icon: 'rule', text: t('policy_modifications') });
  lines.push({ icon: 'rule', text: t('policy_noshow') });

  if (p.house_rules) {
    lines.push({ icon: 'house', text: `${t('policy_property_rules')}: ${p.house_rules}` });
  }
  if (p.custom_policy_text) {
    lines.push({ icon: 'rule', text: p.custom_policy_text });
  }

  return lines;
};

// Snapshot stored on the booking (JSON parsed by the API layer).
export const policyLinesFromSnapshot = (snapshot, options) => {
  if (!snapshot) return [];
  return buildPolicyLines(snapshot, {
    balanceDueAt: snapshot.balance_due_at || null,
    ...options
  });
};

// Owner/admin card chip: { label, bg, fg } or null.
export const policyChip = (hotel, t) => {
  const type = hotel?.cancellation_type || 'free_until';
  if (type === 'non_refundable') {
    return { label: t('chip_nonrefundable'), bg: '#fef2f2', fg: '#dc2626', border: '#fecaca' };
  }
  if (type === 'partial') {
    return { label: t('chip_partial_refund'), bg: '#fffbeb', fg: '#d97706', border: '#fde68a' };
  }
  const days = hotel?.free_cancellation_days == null ? 1 : Number(hotel.free_cancellation_days);
  return {
    label: `${t('chip_free_cancel')} · ${days} ${t('unit_days')}`,
    bg: '#f0fdf4',
    fg: '#16a34a',
    border: '#bbf7d0'
  };
};
