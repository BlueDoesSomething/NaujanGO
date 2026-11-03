import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../api';
import { getPaymentPlans } from '../utils/stayBooking';

const choices = [
  { value: 'reservation', label: 'Reservation fee', detail: 'Pay a fixed fee now and the balance later.' },
  { value: 'half', label: 'Half payment', detail: 'Pay 50% now and the balance later.' },
  { value: 'full', label: 'Full payment', detail: 'Pay the entire booking amount.' }
];

export default function PaymentPlanSettings({ hotels, onSaved, onDirtyChange, onBusyChange, confirmLeave }) {
  const [hotelId, setHotelId] = useState('');
  const [plans, setPlans] = useState([]);
  const [fee, setFee] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const baseline = useRef('');
  const current = JSON.stringify({ hotelId, plans: [...plans].sort(), fee: String(fee) });
  const dirty = Boolean(baseline.current && current !== baseline.current);
  const hotel = hotels.find(item => String(item.hotel_id) === String(hotelId)) || hotels[0];
  useEffect(() => {
    if (!hotel) return;
    if (dirty) return;
    const nextPlans = getPaymentPlans(hotel.allowed_payment_options).filter(plan => plan !== 'reservation' || Number(hotel.reservation_fee) > 0);
    const nextFee = hotel.reservation_fee ?? '';
    setPlans(nextPlans); setFee(nextFee);
    baseline.current = JSON.stringify({ hotelId, plans: [...nextPlans].sort(), fee: String(nextFee) });
  }, [hotel]);
  useLayoutEffect(() => { onDirtyChange?.(dirty); onBusyChange?.(saving); }, [dirty, saving, onDirtyChange, onBusyChange]);
  useLayoutEffect(() => () => { onDirtyChange?.(false); onBusyChange?.(false); }, [onDirtyChange, onBusyChange]);
  if (!hotel) return null;
  const save = async () => {
    setError(''); setMessage('');
    if (!plans.length) { setError('Keep at least one payment plan enabled.'); return; }
    if (plans.includes('reservation') && !(Number(fee) > 0)) { setError('Enter a positive reservation fee.'); return; }
    try {
      setSaving(true);
      await api.put(`/owner/hotels/${hotel.hotel_id}`, {
        allowed_payment_options: plans, reservation_fee: fee === '' ? null : Number(fee)
      });
      baseline.current = current;
      await onSaved?.();
      setMessage('Payment plans saved. Existing bookings keep their agreed payment terms.');
    } catch (error) { setError(error.response?.data?.error || 'Could not save payment plans.'); }
    finally { setSaving(false); }
  };
  return (
    <section className="gov-glass-panel" style={{ marginBottom: '1rem' }} aria-label="Payment plan settings">
      <h2 style={{ fontSize: '1rem', color: '#1B5E20' }}>Payment Plan Settings</h2>
      {hotels.length > 1 && <label>Hotel
        <select className="gov-input" value={hotel.hotel_id} disabled={saving} onChange={event => {
          const value = event.target.value;
          const change = () => { baseline.current = ''; setHotelId(value); setMessage(''); setError(''); };
          if (confirmLeave) confirmLeave(change); else change();
        }}>{hotels.map(item => <option key={item.hotel_id} value={item.hotel_id}>{item.name}</option>)}</select>
      </label>}
      <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Choose how guests may pay for {hotel.name}. These are payment plans, not GCash/card settings.</p>
      <div style={{ display: 'grid', gap: '0.8rem' }}>
        {choices.map(choice => <label key={choice.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
          <input type="checkbox" disabled={saving} checked={plans.includes(choice.value)} onChange={event => {
            setPlans(current => event.target.checked ? [...current, choice.value] : current.filter(plan => plan !== choice.value));
            setMessage('');
          }} />
          <span><strong>{choice.label}</strong><small style={{ display: 'block', color: '#6b7280' }}>{choice.detail}</small></span>
        </label>)}
      </div>
      {plans.includes('reservation') && <label style={{ display: 'block', marginTop: '1rem', maxWidth: 300 }}>
        Reservation fee ({hotel.currency || 'PHP'})
        <input className="gov-input" type="number" min="0.01" step="0.01" disabled={saving} value={fee} onChange={event => setFee(event.target.value)} />
        <small>The fee must be below the booking total; otherwise guests must choose another enabled plan.</small>
      </label>}
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#166534' }}>{message}</p>}
      <button type="button" className="gov-btn-primary" style={{ marginTop: '1rem' }} disabled={saving} onClick={save}>
        {saving ? 'Saving...' : 'Save Payment Plans'}
      </button>
    </section>
  );
}
