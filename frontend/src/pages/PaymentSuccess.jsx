import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getApiBaseUrl, getLatestPaymentByBooking, getPaymentHistory, submitPaymentReference } from '../api';
import axios from 'axios';

const API_BASE_URL = getApiBaseUrl() + '/api';

const REFERENCE_PROVIDERS = [
  { value: 'gcash', label: 'GCash', example: 'ABC1234567890', length: 13, pattern: /^[A-Za-z0-9]{13}$/ },
  { value: 'gotyme', label: 'GoTyme', example: 'ABC123456789012345', length: 18, pattern: /^[A-Za-z0-9]{18}$/ },
  { value: 'maya', label: 'Maya', example: 'ABC123456789', length: 12, pattern: /^[A-Za-z0-9]{12}$/ },
  { value: 'grabpay', label: 'GrabPay', example: 'ABC123456789', length: 12, pattern: /^[A-Za-z0-9]{12}$/ },
  { value: 'instapay', label: 'InstaPay', example: 'ABC1234567890', length: 13, pattern: /^[A-Za-z0-9]{13}$/ },
  { value: 'bank_transfer', label: 'Bank Transfer / Other', example: 'Any reference', length: null, pattern: null }
];

function getProviderValidation(providerValue) {
  return REFERENCE_PROVIDERS.find(p => p.value === providerValue) || REFERENCE_PROVIDERS[5];
}

export default function PaymentSuccess() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [latestPayment, setLatestPayment] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [referenceProvider, setReferenceProvider] = useState('gcash');
  const [submitState, setSubmitState] = useState('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const bookingId = searchParams.get('booking_id');
  const provider = searchParams.get('provider') || 'unknown';
  const sourceId = searchParams.get('source_id');
  const forceReference = searchParams.get('requires_reference') === '1' || searchParams.get('reference_required') === '1';
  const requiresReference = (provider === 'gcash' || provider === 'qrph') && (forceReference || latestPayment?.status !== 'succeeded');

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        setBookingDetails(response.data?.booking || response.data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching booking details:', error);
        }
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    const fetchLatestPayment = async () => {
      try {
        if (bookingId && (provider === 'gcash' || provider === 'qrph')) {
          const response = await getLatestPaymentByBooking(bookingId);
          setLatestPayment(response.data);
          return;
        }

        const historyResponse = await getPaymentHistory();
        const history = Array.isArray(historyResponse.data) ? historyResponse.data : [];
        const latestMatch = history.find((payment) => {
          const method = String(payment?.method || '').toLowerCase();
          return method === 'gcash' || method === 'qrph';
        });

        if (latestMatch) {
          setLatestPayment(latestMatch);
        }
      } catch (error) {
        console.error('Error loading latest payment:', error);
      }
    };

    fetchLatestPayment();
  }, [bookingId, provider]);

  useEffect(() => {
    if (requiresReference) return;

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate('/bookings');
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate, requiresReference]);

  const handleReferenceSubmit = async (event) => {
    event.preventDefault();

    if (!latestPayment?.payment_id) {
      setSubmitState('error');
      setSubmitMessage('Unable to find payment record. Please contact support.');
      return;
    }

    const normalizedReference = referenceNumber.trim();
    const validation = getProviderValidation(referenceProvider);

    if (!normalizedReference) {
      setSubmitState('error');
      setSubmitMessage('Please enter your reference number.');
      return;
    }

    if (validation.pattern && !validation.pattern.test(normalizedReference)) {
      setSubmitState('error');
      setSubmitMessage(`${validation.label} reference must be exactly ${validation.length} digits. You entered ${normalizedReference.length} characters.`);
      return;
    }

    if (normalizedReference.length < 6) {
      setSubmitState('error');
      setSubmitMessage('Reference number must be at least 6 characters.');
      return;
    }

    try {
      setSubmitState('loading');
      setSubmitMessage('');
      const response = await submitPaymentReference(latestPayment.payment_id, normalizedReference, referenceProvider);
      setSubmitState('success');
      setSubmitMessage(response.data?.message || 'Reference submitted successfully.');
      setLatestPayment((prev) => ({
        ...prev,
        customer_reference_number: `[${referenceProvider.toUpperCase()}] ${normalizedReference}`,
        reference_status: 'pending'
      }));
      navigate(`/reference-submitted?booking_id=${bookingId}&payment_id=${latestPayment?.payment_id || ''}`);
    } catch (error) {
      setSubmitState('error');
      setSubmitMessage(error.response?.data?.error || 'Failed to submit reference number.');
    }
  };

  const getProviderLabel = () => {
    const labels = {
      gcash: t('payment_provider_gcash'),
      qrph: 'QR PH',
      grabpay: t('payment_provider_grabpay'),
      paypal: t('payment_provider_paypal'),
      card: t('payment_provider_card'),
      bank_transfer: t('payment_provider_bank_transfer')
    };
    return labels[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const containerStyle = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    padding: '60px 40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center'
  };

  const checkmarkStyle = {
    width: '120px',
    height: '120px',
    background: '#4caf50',
    borderRadius: '50%',
    margin: '0 auto 30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'scaleIn 0.6s ease-out'
  };

  const titleStyle = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: '20px 0 10px',
    fontFamily: 'Arial, sans-serif'
  };

  const subtitleStyle = {
    fontSize: '16px',
    color: '#666',
    margin: '10px 0 30px',
    lineHeight: '1.6'
  };

  const detailsStyle = {
    background: '#f8f9fa',
    borderRadius: '12px',
    padding: '20px',
    margin: '30px 0',
    textAlign: 'left'
  };

  const detailRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e0e0e0'
  };

  const detailRowStyle_last = {
    ...detailRowStyle,
    borderBottom: 'none'
  };

  const labelStyle = {
    color: '#666',
    fontWeight: '500'
  };

  const valueStyle = {
    color: '#333',
    fontWeight: 'bold'
  };

  const buttonStyle = {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '14px 40px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'background 0.3s ease',
    width: '100%'
  };

  const referenceCardStyle = {
    background: '#fff7e6',
    border: '1px solid #f6d48f',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '20px',
    textAlign: 'left'
  };

  const referenceInputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    marginTop: '10px',
    marginBottom: '10px',
    fontSize: '15px'
  };

  const selectStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    background: 'white',
    cursor: 'pointer'
  };

  const countdownStyle = {
    fontSize: '14px',
    color: '#999',
    marginTop: '30px',
    fontStyle: 'italic'
  };

  const activeValidation = getProviderValidation(referenceProvider);

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .redirect-pulse {
          animation: pulse 1s infinite;
        }
      `}</style>

      <div style={containerStyle}>
        {loading ? (
          <div style={{ padding: '40px' }}>
            <p style={{ fontSize: '18px', color: '#666' }}>Loading payment confirmation...</p>
          </div>
        ) : (
          <>
            <div style={checkmarkStyle}>
              <span style={{ fontSize: '60px', color: 'white', lineHeight: '1' }}>✓</span>
            </div>

            <h1 style={titleStyle}>Payment Successful!</h1>
            <p style={subtitleStyle}>
              {requiresReference
                ? 'Your payment is complete. Please enter the reference number from your transaction receipt for verification.'
                : 'Your payment has been received and your booking is confirmed.'}
            </p>

            {bookingDetails && (
              <div style={detailsStyle}>
                <div style={detailRowStyle}>
                  <span style={labelStyle}>Booking ID:</span>
                  <span style={valueStyle}>#{bookingDetails.booking_id || bookingId}</span>
                </div>

                <div style={detailRowStyle}>
                  <span style={labelStyle}>Hotel:</span>
                  <span style={valueStyle}>{bookingDetails.hotel_name || 'N/A'}</span>
                </div>

                {bookingDetails.check_in && (
                  <div style={detailRowStyle}>
                    <span style={labelStyle}>Check-in:</span>
                    <span style={valueStyle}>{formatDate(bookingDetails.check_in)}</span>
                  </div>
                )}

                {bookingDetails.check_out && (
                  <div style={detailRowStyle}>
                    <span style={labelStyle}>Check-out:</span>
                    <span style={valueStyle}>{formatDate(bookingDetails.check_out)}</span>
                  </div>
                )}

                {bookingDetails.total_price && (
                  <div style={detailRowStyle}>
                    <span style={labelStyle}>Total Amount:</span>
                    <span style={valueStyle}>
                      {bookingDetails.currency || 'PHP'} {parseFloat(bookingDetails.total_price).toFixed(2)}
                    </span>
                  </div>
                )}

                <div style={detailRowStyle}>
                  <span style={labelStyle}>Payment Method:</span>
                  <span style={valueStyle}>{getProviderLabel()}</span>
                </div>

                {bookingDetails.guests && (
                  <div style={detailRowStyle_last}>
                    <span style={labelStyle}>Guests:</span>
                    <span style={valueStyle}>{bookingDetails.guests}</span>
                  </div>
                )}
              </div>
            )}

            <p style={subtitleStyle}>
              {requiresReference
                ? 'Select the e-wallet or bank you used to pay, then paste the reference number from your receipt. The owner will verify it before confirming your booking.'
                : 'A confirmation email has been sent. You can view your booking details in your booking history.'}
            </p>

            {requiresReference && (
              <form style={referenceCardStyle} onSubmit={handleReferenceSubmit}>
                <strong style={{ fontSize: '16px' }}>Reference Number Confirmation</strong>

                <label style={{ display: 'block', marginTop: '14px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                  Where did you pay?
                </label>
                <select
                  style={selectStyle}
                  value={referenceProvider}
                  onChange={(e) => {
                    setReferenceProvider(e.target.value);
                    setReferenceNumber('');
                    setSubmitMessage('');
                    setSubmitState('idle');
                  }}
                  disabled={submitState === 'loading' || submitState === 'success'}
                >
                  {REFERENCE_PROVIDERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>

                <label style={{ display: 'block', marginTop: '12px', fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                  Reference Number
                  {activeValidation.length && (
                    <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '6px' }}>
                      ({activeValidation.length} characters)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value.replace(/\s/g, ''))}
                  placeholder={activeValidation.example || 'Enter your reference number'}
                  style={referenceInputStyle}
                  disabled={submitState === 'loading' || submitState === 'success'}
                  maxLength={64}
                />
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#9ca3af' }}>
                  {provider === 'qrph'
                    ? 'You paid via QR PH. Select above which app you scanned with and enter the transaction reference.'
                    : 'Paste the exact reference number from your receipt after payment.'}
                </p>

                {activeValidation.length && referenceNumber && referenceNumber.length !== activeValidation.length && (
                  <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#d97706' }}>
                    Expected {activeValidation.length} characters — you entered {referenceNumber.length}.
                  </p>
                )}

                <button
                  type="submit"
                  style={{ ...buttonStyle, marginTop: 0 }}
                  disabled={submitState === 'loading' || submitState === 'success'}
                >
                  {submitState === 'loading' ? 'Submitting...' : 'Submit Reference Number'}
                </button>
                {submitMessage && (
                  <p style={{ marginTop: '10px', color: submitState === 'error' ? '#b91c1c' : '#166534' }}>
                    {submitMessage}
                  </p>
                )}
              </form>
            )}

            <button
              onClick={() => navigate('/bookings')}
              style={buttonStyle}
              onMouseEnter={(e) => e.target.style.background = '#5568d3'}
              onMouseLeave={(e) => e.target.style.background = '#667eea'}
            >
              View My Bookings
            </button>

            {!requiresReference && (
              <div style={countdownStyle} className="redirect-pulse">
                Redirecting to bookings in {redirectCountdown}s...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
