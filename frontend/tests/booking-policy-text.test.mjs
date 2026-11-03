import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPolicyLines, policyLinesFromSnapshot } from '../src/utils/bookingPolicy.js';
import { receiptExportReport } from '../src/utils/itineraryExports.js';

// The booking policy card mixes owner data with platform default wording.
// Owners can now rewrite the three standard lines; blank must keep today's text.
const t = (key) => `EN:${key}`;
const texts = (policy, options = {}) =>
  buildPolicyLines(policy, { checkIn: null, t, ...options }).map((line) => line.text);

const defaults = {
  cancellation_type: 'free_until',
  free_cancellation_days: 1,
  payment_terms_text: null,
  modification_policy_text: null,
  noshow_policy_text: null
};

test('blank owner wording keeps the platform default policy lines', () => {
  const lines = texts(defaults);
  assert.ok(lines.includes('EN:policy_payment_terms'), lines.join(' | '));
  assert.ok(lines.includes('EN:policy_modifications'), lines.join(' | '));
  assert.ok(lines.includes('EN:policy_noshow'), lines.join(' | '));
});

test('owner wording replaces each standard line independently', () => {
  const lines = texts({
    ...defaults,
    payment_terms_text: '50% deposit, balance on arrival.',
    modification_policy_text: 'One free date change.',
    noshow_policy_text: 'Late arrivals after 10 PM must call ahead.'
  });
  assert.ok(lines.includes('50% deposit, balance on arrival.'), lines.join(' | '));
  assert.ok(lines.includes('One free date change.'), lines.join(' | '));
  assert.ok(lines.includes('Late arrivals after 10 PM must call ahead.'), lines.join(' | '));
  assert.ok(!lines.includes('EN:policy_payment_terms'), 'default must be replaced');
  assert.ok(!lines.includes('EN:policy_noshow'), 'default must be replaced');
});

test('one blank field falls back while the others stay custom', () => {
  const lines = texts({
    ...defaults,
    payment_terms_text: 'Pay on arrival.',
    noshow_policy_text: null
  });
  assert.ok(lines.includes('Pay on arrival.'));
  assert.ok(lines.includes('EN:policy_payment_terms') === false);
  assert.ok(lines.includes('EN:policy_noshow'), 'blank field still shows the default');
  assert.ok(lines.includes('EN:policy_modifications'), 'untouched field still shows the default');
});

test('owner data lines (house rules, custom text) still render after the standard ones', () => {
  const lines = texts({
    ...defaults,
    house_rules: 'Pets allowed',
    custom_policy_text: 'Refunds are not allowed'
  });
  assert.ok(lines.includes('EN:policy_property_rules: Pets allowed'), lines.join(' | '));
  assert.ok(lines.includes('Refunds are not allowed'), lines.join(' | '));
});

test('empty and whitespace-only edits preview the default instead of an invisible line', () => {
  const lines = texts({ payment_terms_text: ' ', modification_policy_text: '', noshow_policy_text: '\n\t' });
  for (const key of ['policy_payment_terms', 'policy_modifications', 'policy_noshow']) {
    assert.ok(lines.includes(`EN:${key}`));
  }
});

test('booking history and receipt exports use frozen wording, not later hotel edits', () => {
  const hotel = { payment_terms_text: 'Original payment terms', modification_policy_text: 'Original changes', noshow_policy_text: 'Original no-show terms' };
  const snapshot = JSON.parse(JSON.stringify(hotel));
  hotel.payment_terms_text = 'Later hotel edit';
  const lines = policyLinesFromSnapshot(snapshot, { t }).map(line => line.text);
  assert.ok(lines.includes('Original payment terms'));
  assert.ok(!lines.includes(hotel.payment_terms_text));
  for (const policy_snapshot of [snapshot, JSON.stringify(snapshot)]) {
    const report = receiptExportReport({ policy_snapshot }, t);
    const exported = report.rows.map(row => row.value);
    for (const value of Object.values(snapshot)) assert.ok(exported.includes(value));
    assert.ok(!exported.includes(hotel.payment_terms_text));
  }
});
