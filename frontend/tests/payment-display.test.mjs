import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { getPaymentMethodLabel, getBookingPaymentMethod, getBookingReferences, getPaymentReferences } from '../src/utils/paymentDisplay.js';

const compiled = await build({
  stdin: {
    contents: "export { default } from './src/components/ReferenceDetails.jsx';",
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx'
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'installed-react', setup(builder) {
    builder.onResolve({ filter: /^react$/ }, () => ({ path: import.meta.resolve('react'), external: true }));
  } }]
});
const { default: ReferenceDetails } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const render = entries => renderToStaticMarkup(React.createElement(ReferenceDetails, { entries }));

test('payment method labels cover all supported methods, including pay at property', () => {
  for (const [method, label] of Object.entries({
    card: 'Credit/Debit Card', gcash: 'GCash', grabpay: 'GrabPay', qrph: 'QR PH',
    paypal: 'PayPal', bank_transfer: 'Bank Transfer', pay_at_property: 'Pay at Property'
  })) assert.equal(getPaymentMethodLabel(method), label);
  assert.equal(getPaymentMethodLabel(' QRPH '), 'QR PH');
  assert.equal(getPaymentMethodLabel('other_method'), 'other_method');
  assert.equal(getPaymentMethodLabel(null), '—');
});

test('uses the correct existing translation key for pay at property', () => {
  const keys = [];
  assert.equal(getPaymentMethodLabel('pay_at_property', key => { keys.push(key); return 'Pay on arrival'; }), 'Pay on arrival');
  assert.deepEqual(keys, ['payment_method_pay_at_property']);
  assert.equal(getPaymentMethodLabel('pay_at_property', key => key), 'Pay at Property');
});

test('reservations use selected payment metadata with a legacy booking-method fallback', () => {
  assert.equal(getBookingPaymentMethod({ display_payment_method: 'qrph', payment_method: 'paypal' }), 'qrph');
  assert.equal(getBookingPaymentMethod({ payment_method: 'pay_at_property' }), 'pay_at_property');
});

test('displays booking, customer payment, and transaction references with distinct labels', () => {
  assert.deepEqual(getBookingReferences({
    booking_reference: 'HB000155', receipt_number: 'RECEIPT-155', payment_record_id: 8,
    payment_customer_reference: 'CUSTOMER-REF', payment_transaction_reference: 'cs_paid'
  }), [
    { label: 'Booking', value: 'HB000155' },
    { label: 'Customer payment', value: 'CUSTOMER-REF' },
    { label: 'Transaction', value: 'cs_paid' }
  ]);
});

test('payments with no customer reference still show their stored transaction reference', () => {
  assert.deepEqual(getPaymentReferences({ transaction_reference: 'cs_paid' }), [{ label: 'Transaction', value: 'cs_paid' }]);
  assert.match(render(getPaymentReferences({ transaction_reference: 'cs_paid' })), /cs_paid/);
});

test('manual notebook records are labeled as internal references, not gateway confirmations', () => {
  const entries = getPaymentReferences({ provider: 'manual_ledger', transaction_reference: 'LEDGER-H8-20261021-PM-01' });
  assert.equal(entries[0].label, 'Internal payment');
  assert.match(render(entries), /LEDGER-H8-20261021-PM-01/);
});

test('missing references show a placeholder instead of inventing a transaction ID', () => {
  assert.deepEqual(getBookingReferences({ receipt_number: 'RECEIPT-1' }), [
    { label: 'Receipt', value: 'RECEIPT-1' }, { label: 'Payment', value: null }
  ]);
  assert.equal(getPaymentReferences({ booking_reference: 'HB000001', receipt_number: 'RECEIPT-1' }).length, 0);
  assert.match(render([]), /—/);
});

test('a new selected payment never displays a stale legacy reference', () => {
  const entries = getBookingReferences({ payment_record_id: 8, payment_reference: 'old-attempt', payment_transaction_reference: null });
  assert.equal(entries.some(entry => entry.value === 'old-attempt'), false);
});

test('reference text is escaped and long references remain complete', () => {
  const reference = 'cs_' + 'a'.repeat(200);
  const html = render([{ label: 'Transaction', value: reference }, { label: 'Customer payment', value: '<img src=x onerror=alert(1)>' }]);
  assert.ok(html.includes(reference));
  assert.match(html, /overflow-wrap:anywhere/);
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;img/);
});

test('active and archived reservations retain payment methods without a References column', () => {
  const source = readFileSync(new URL('../src/pages/OwnerDashboard.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /<th>References<\/th>/);
  assert.doesNotMatch(source, /entries=\{getBookingReferences\(booking\)\}/);
  assert.equal((source.match(/<td>\{getPaymentMethodLabel\(getBookingPaymentMethod\(booking\), t\)\}<\/td>/g) || []).length, 2);
  assert.ok(!source.includes('payment_provider_${String(method)'));
  assert.match(source, /booking\.payment_customer_reference, booking\.payment_transaction_reference/);
});

test('active and archived payment tables still display payment references', () => {
  const source = readFileSync(new URL('../src/pages/OwnerDashboard.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/<th>Payment References<\/th>/g) || []).length, 2);
  assert.equal((source.match(/entries=\{getPaymentReferences\(payment\)\}/g) || []).length, 2);
});
