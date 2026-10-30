import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';

const reactUrl = import.meta.resolve('react');
const compiled = await build({
  stdin: { contents: `export { default as PaymentSummaryCards, paymentSummaryCards } from './src/components/PaymentSummaryCards.jsx';
    export { default as ArchiveRecordModal } from './src/components/ArchiveRecordModal.jsx';`,
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx' },
  bundle: true, write: false, platform: 'node', format: 'esm', loader: { '.css': 'empty' },
  plugins: [{ name: 'isolated-ui', setup(builder) {
    builder.onResolve({ filter: /^react$/ }, () => ({ path: reactUrl, external: true }));
    builder.onResolve({ filter: /^\.\.\/api$/ }, () => ({ path: 'fake-api', namespace: 'fixture' }));
    builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export default { get() { throw new Error("No network in UI tests"); } };', loader: 'js' }));
  } }]
});
const { PaymentSummaryCards, paymentSummaryCards, ArchiveRecordModal } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test('summary clearly distinguishes retained lifetime revenue from filtered failed attempts', () => {
  const before = paymentSummaryCards({ total_revenue: 1000, failed_amount: 500, failed_transactions: 2 });
  const after = paymentSummaryCards({ total_revenue: 1000, failed_amount: 300, failed_transactions: 1 });
  assert.equal(before[0].value, after[0].value);
  assert.match(after[0].note, /including archived/);
  assert.notEqual(before[3].value, after[3].value);
  assert.match(after[3].title, /Failed amount \(filtered\)/);
  assert.match(after[3].note, /1 failed payment attempt —/);
  assert.match(after[3].note, /not lost revenue/);
});

test('summary explains archive scope and that booking archives do not alter payments', () => {
  let html = render(PaymentSummaryCards, { stats: { archive_scope: 'unarchived' } });
  assert.match(html, /exclude your archived payments/);
  assert.match(html, /Booking archives do not archive payments/);
  html = render(PaymentSummaryCards, { stats: { archive_scope: 'including_archived' } });
  assert.match(html, /include your archived payments/);
  html = render(PaymentSummaryCards, { stats: { archive_scope: 'archived_only' } });
  assert.match(html, /only your archived payments/);
});

test('financial record details never offer permanent deletion, even for an admin', () => {
  for (const type of ['booking', 'payment']) {
    const html = render(ArchiveRecordModal, { type, allowDeletion: true,
      record: { booking_id: 10, payment_id: 20, archived: 1, status: 'failed', provider_response: 'Private provider payload' }, onClose() {} });
    assert.match(html, /cannot permanently delete/);
    assert.match(html, /role="dialog"/);
    assert.ok(!html.includes('Delete permanently'));
    assert.ok(!html.includes('Private provider payload'));
    assert.ok(!html.includes('Deletion reason'));
  }
});

test('record details display text safely and hide content-deletion controls from owners', () => {
  const html = render(ArchiveRecordModal, { type: 'attraction', record: { id: 30, name: '<script>unsafe</script>', archived: 1 }, onClose() {} });
  assert.match(html, /&lt;script&gt;/);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('Permanent deletion safety check'));
});
