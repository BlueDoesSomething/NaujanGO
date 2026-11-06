import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPaymentReference } from '../api';
import useBookingPolicy from '../hooks/useBookingPolicy';

const providers = [
  { value: 'gcash', label: 'GCash', length: 13 }, { value: 'gotyme', label: 'GoTyme', length: 18 },
  { value: 'maya', label: 'Maya', length: 12 }, { value: 'grabpay', label: 'GrabPay', length: 12 },
  { value: 'instapay', label: 'InstaPay', length: 13 }, { value: 'bank_transfer', label: 'Bank transfer / Other' }
];

export default function PaymentReferenceForm({ bookingId, payment }) {
  const navigate = useNavigate();
  const bookingPolicy = useBookingPolicy();
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState('gcash');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (bookingPolicy.paymentsDisabled || !payment?.payment_id || payment.status === 'succeeded' || !['gcash', 'qrph', 'bank_transfer'].includes(payment.method)) return null;
  const selected = providers.find(item => item.value === provider);
  const submit = async event => {
    event.preventDefault(); setError('');
    const value = reference.trim();
    if (!/^[a-z0-9_-]{6,64}$/i.test(value) || (selected.length && value.length !== selected.length)) {
      setError(selected.length ? `${selected.label} reference must contain ${selected.length} characters.` : 'Enter a valid 6–64 character reference.'); return;
    }
    try {
      setBusy(true);
      await submitPaymentReference(payment.payment_id, value, provider);
      navigate(`/reference-submitted?booking_id=${bookingId}&payment_id=${payment.payment_id}`);
    } catch (failure) { setError(failure.response?.data?.error || 'Reference could not be submitted. Please try again.'); }
    finally { setBusy(false); }
  };
  return <section style={{ marginTop: 20, padding: 16, background: '#fff7e6', borderRadius: 10, textAlign: 'left' }}>
    <label style={{ display: 'flex', gap: 8 }}>
      <input type="checkbox" checked={open} disabled={busy} onChange={event => setOpen(event.target.checked)} />
      Money was deducted and I have a transaction receipt.
    </label>
    {open && <form onSubmit={submit}>
      <p>Submit the reference for hotel review. This is not automatic proof of a successful payment. Do not pay again while it is being checked.</p>
      <label>Where did you pay?<select className="gov-input" value={provider} disabled={busy} onChange={event => { setProvider(event.target.value); setError(''); }}>
        {providers.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select></label>
      <label>Reference number<input className="gov-input" value={reference} maxLength={64} disabled={busy} onChange={event => setReference(event.target.value.replace(/\s/g, ''))} /></label>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      <button className="gov-btn-primary" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit for review'}</button>
    </form>}
  </section>;
}
