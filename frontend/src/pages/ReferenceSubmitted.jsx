import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ReferenceSubmitted() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookingId = searchParams.get('booking_id');
  const paymentId = searchParams.get('payment_id');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 12, maxWidth: 720, width: '95%', textAlign: 'center' }}>
        <h1 style={{ marginBottom: 8 }}>Reference Submitted</h1>
        <p style={{ color: '#666' }}>
          Thank you — your transaction reference has been submitted to the merchant. The owner will verify your payment shortly.
        </p>
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <p><strong>Booking ID:</strong> {bookingId || 'N/A'}</p>
          <p><strong>Payment ID:</strong> {paymentId || 'N/A'}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
          <button onClick={() => navigate('/bookings')} className="gov-btn gov-btn-primary">View My Bookings</button>
          <button onClick={() => navigate('/')} className="gov-btn">Return Home</button>
        </div>
      </div>
    </div>
  );
}
