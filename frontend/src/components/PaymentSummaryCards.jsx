import React from 'react';

export const paymentSummaryCards = stats => [
  { title: 'Lifetime revenue', value: `₱${Number(stats.total_revenue || 0).toLocaleString()}`, note: 'All records, including archived payments', color: '#166534' },
  { title: 'Successful (filtered)', value: Number(stats.successful_transactions || 0), note: 'Payment attempts matching the current filters', color: '#15803d' },
  { title: 'Pending amount (filtered)', value: `₱${Number(stats.pending_amount || 0).toLocaleString()}`, note: 'Pending transactions cannot be archived', color: '#b45309' },
  { title: 'Failed amount (filtered)', value: `₱${Number(stats.failed_amount || 0).toLocaleString()}`, note: `${Number(stats.failed_transactions || 0)} failed payment ${Number(stats.failed_transactions || 0) === 1 ? 'attempt' : 'attempts'} — not lost revenue`, color: '#b91c1c' }
];

const PaymentSummaryCards = ({ stats }) => !stats ? null : (
  <>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
      {paymentSummaryCards(stats).map(card => (
        <div key={card.title} className="gov-glass-panel" style={{ borderTop: `3px solid ${card.color}`, padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{card.title}</h3>
          <p style={{ fontSize: '1.7rem', fontWeight: 800, color: card.color, margin: '0 0 0.5rem' }}>{card.value}</p>
          <small>{card.note}</small>
        </div>
      ))}
    </div>
    <p style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
      {stats.archive_scope === 'including_archived' ? 'Filtered totals include your archived payments.'
        : stats.archive_scope === 'archived_only' ? 'Filtered totals include only your archived payments.'
          : 'Filtered totals exclude your archived payments.'}
      {' '}Booking archives do not archive payments. Financial history and lifetime revenue are retained.
    </p>
  </>
);

export default PaymentSummaryCards;
