import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkBookingPaymentStatus } from '../api';
import PaymentReferenceForm from '../components/PaymentReferenceForm';
import { paymentReturnPresentation } from '../utils/paymentRecovery';
import { formatBookingBoundary } from '../utils/stayBooking';

// This route is a provider RETURN page, not evidence that payment succeeded.
export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const value = params.get('booking_id');
  const bookingId = /^\d+$/.test(value || '') && Number(value) > 0 ? Number(value) : null;
  const cancelled = params.get('status') === 'cancelled';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(Boolean(bookingId));
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true, timer;
    let checks = 0;
    setResult(null); setError('');
    if (!bookingId) { setLoading(false); return; }
    const check = async () => {
      setLoading(true);
      try {
        const response = await checkBookingPaymentStatus(bookingId);
        if (!active) return;
        setResult(response.data); setError('');
        if (response.data.state === 'succeeded') {
          try {
            sessionStorage.removeItem(`pendingCheckout_${bookingId}`);
            sessionStorage.removeItem(`pendingCheckoutMethod_${bookingId}`);
            if (sessionStorage.getItem('pendingReceiptBookingId') === String(bookingId)) sessionStorage.removeItem('pendingReceiptBookingId');
          } catch { /* Payment truth never depends on browser storage. */ }
        } else if (['pending', 'checking'].includes(response.data.state) && !cancelled && ++checks < 5) {
          timer = setTimeout(check, 3000);
        }
      } catch (failure) {
        if (active) setError(failure.response?.data?.error || 'Connection interrupted. Your payment result is unknown—check again before paying a second time.');
      } finally { if (active) setLoading(false); }
    };
    check();
    const reconnect = () => { clearTimeout(timer); checks = 0; check(); };
    window.addEventListener('online', reconnect);
    return () => { active = false; clearTimeout(timer); window.removeEventListener('online', reconnect); };
  }, [bookingId, cancelled, refresh]);

  const display = paymentReturnPresentation(result, cancelled);
  const booking = result?.booking;
  const colors = { success: '#166534', review: '#92400e', checking: '#1d4ed8', pending: '#92400e', unknown: '#64748b' };
  return <main style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: 20 }}>
    <section style={{ width: 'min(100%, 640px)', background: 'white', borderRadius: 20, padding: 'clamp(20px, 5vw, 40px)', boxShadow: '0 15px 45px rgba(0,0,0,.15)', textAlign: 'center' }}>
      <div aria-hidden="true" style={{ fontSize: 56, color: loading ? '#64748b' : colors[display.kind] }}>{loading ? '…' : display.icon}</div>
      <h1>{loading && !result ? 'Checking payment status…' : display.title}</h1>
      <p role="status" style={{ lineHeight: 1.7 }}>{loading && !result ? 'Waiting for server verification. Returning from checkout alone does not confirm payment.' : display.text}</p>
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {booking && <dl style={{ textAlign: 'left', padding: 16, borderRadius: 10, background: '#f8fafc', lineHeight: 1.8 }}>
        <dt>Booking</dt><dd>#{booking.booking_id} · {booking.hotel_name}</dd>
        <dt>Stay</dt><dd>{formatBookingBoundary(booking)} — {formatBookingBoundary(booking, 'out')}</dd>
        <dt>Reservation status</dt><dd>{booking.status}</dd>
        <dt>Recorded paid amount</dt><dd>{booking.currency} {Number(booking.amount_paid || 0).toFixed(2)}</dd>
        <dt>Balance</dt><dd>{booking.currency} {Number(booking.balance_due || 0).toFixed(2)}</dd>
      </dl>}
      {bookingId && <button className="gov-btn-ghost" type="button" disabled={loading} onClick={() => setRefresh(current => current + 1)}>{loading ? 'Checking…' : 'Check payment status again'}</button>}
      {result?.can_retry && <button className="gov-btn-primary" type="button" style={{ display: 'block', margin: '16px auto' }} onClick={() => navigate(`/hotels/payment/${bookingId}`)}>Resume payment</button>}
      {result && !['succeeded', 'review'].includes(result.state) && <PaymentReferenceForm bookingId={bookingId} payment={result.payment} />}
      <button className="gov-btn-primary" type="button" style={{ display: 'block', margin: '20px auto 0' }} onClick={() => navigate('/bookings')}>View Booking History</button>
    </section>
  </main>;
}
