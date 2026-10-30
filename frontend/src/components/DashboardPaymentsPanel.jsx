import React, { useCallback, useEffect, useState } from 'react';
import api from '../api';
import PaymentSummaryCards from './PaymentSummaryCards';
import ArchiveRecordModal from './ArchiveRecordModal';

const DashboardPaymentsPanel = ({ archivedOnly = false, onChanged }) => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(null);
  const close = useCallback(() => setSelected(null), []);

  useEffect(() => {
    const controller = new AbortController();
    const params = { archived: archivedOnly ? '1' : includeArchived ? 'all' : '0', limit: 500, ...(status !== 'all' ? { status } : {}) };
    setError('');
    Promise.all([api.get(archivedOnly ? '/admin/payments/archived' : '/admin/payments', { params, signal: controller.signal }),
      api.get('/admin/payments/stats', { params, signal: controller.signal })]).then(([rows, summary]) => {
      setPayments(rows.data); setStats(summary.data);
    }).catch(failure => {
      if (!controller.signal.aborted) { setError(failure.response?.data?.error || 'Could not load payments.'); setPayments([]); setStats(null); }
    });
    return () => controller.abort();
  }, [archivedOnly, includeArchived, status, revision]);

  const changeArchive = async payment => {
    const restoring = Number(payment.archived) === 1;
    if (!window.confirm(`${restoring ? 'Restore' : 'Archive'} payment #${payment.payment_id} in your dashboard only? Financial history is retained.`)) return;
    setBusy(payment.payment_id);
    try {
      await api.put(`/admin/payments/${payment.payment_id}/${restoring ? 'restore' : 'archive'}`);
      setRevision(value => value + 1);
      await onChanged?.();
    } catch (failure) { setError(failure.response?.data?.error || 'Archive operation failed.'); }
    finally { setBusy(null); }
  };

  return <div>
    <h2>{archivedOnly ? 'Your archived payments' : 'Payments'}</h2>
    <p>Archives are personal to your account. Owners and other administrators keep their own transaction visibility.</p>
    {!archivedOnly && <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1rem 0' }}>
      <label>Status <select className="gov-input" value={status} onChange={event => setStatus(event.target.value)}>
        {['all', 'succeeded', 'pending', 'failed', 'refunded'].map(value => <option key={value} value={value}>{value}</option>)}
      </select></label>
      <button type="button" className="gov-btn gov-btn-ghost" aria-pressed={includeArchived} onClick={() => setIncludeArchived(value => !value)}>{includeArchived ? 'Hide archived' : 'Show archived'}</button>
    </div>}
    {error && <p role="alert">{error}</p>}
    {!archivedOnly && <PaymentSummaryCards stats={stats} />}
    <div className="gov-table-wrap"><table className="gov-table">
      <thead><tr><th>ID</th><th>Booking</th><th>Guest</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>{payments.map(payment => <tr key={payment.payment_id}>
        <td>#{payment.payment_id}</td><td>{payment.booking_reference || payment.booking_id}</td><td>{payment.customer_name || '—'}</td>
        <td>₱{Number(payment.amount || 0).toLocaleString()}</td><td>{payment.status}{Number(payment.archived) === 1 ? ' · Archived' : ''}</td>
        <td><button type="button" className="gov-btn gov-btn-ghost" onClick={() => setSelected(payment)}>View</button>{' '}
          {(Number(payment.archived) === 1 || ['failed', 'refunded', 'succeeded'].includes(payment.status)) && <button type="button" className="gov-btn gov-btn-primary" disabled={busy === payment.payment_id} onClick={() => changeArchive(payment)}>{Number(payment.archived) === 1 ? 'Restore' : 'Archive'}</button>}
        </td>
      </tr>)}</tbody>
    </table></div>
    {!payments.length && <p>No matching payments.</p>}
    {Number(stats?.total_transactions) > payments.length && <p>Showing the latest {payments.length} matching payments. Summary totals include all matches.</p>}
    {selected && <ArchiveRecordModal type="payment" record={selected} onClose={close} />}
  </div>;
};

export default DashboardPaymentsPanel;
