import React, { useEffect, useMemo, useState } from 'react';
// Style constants moved to top for hoisting
const labelStyle = {
  fontSize: '1rem',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '0.25rem'
};
// Style constants moved to top for hoisting

const fieldStyle = {
  marginBottom: '1rem'
};




// Style constants moved to top for hoisting
const sectionHeading = {
  fontSize: '1.2rem',
  fontWeight: 700,
  color: '#1b1f2a',
  marginBottom: '1.25rem'
};


import { useNavigate, useParams } from 'react-router-dom';
import { fetchHotelBookings, startPaymentCheckout, getPaymentHistory } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const getPaymentMethods = (t) => [
  { 
    value: 'card', 
    label: t('payment_provider_card'),
    description: t('payment_desc_card'),
    icon: '💳',
    provider: 'PayMongo',
    badge: t('payment_badge_fastest') || 'Fastest'
  },
  { 
    value: 'gcash', 
    label: t('payment_provider_gcash'),
    description: t('payment_desc_gcash'),
    icon: '📱',
    provider: 'Xendit',
    badge: t('payment_badge_popular') || 'Popular'
  },
  { 
    value: 'grab_pay', 
    label: t('payment_provider_grabpay'),
    description: t('payment_desc_grabpay'),
    icon: '🚗',
    provider: 'PayMongo',
    badge: t('payment_badge_new') || 'New'
  },
  { 
    value: 'qrph', 
    label: t('payment_provider_qrph') || 'QR Phone',
    description: t('payment_desc_qrph') || 'Pay using QR code',
    icon: '📲',
    provider: 'PayMongo',
    badge: t('payment_badge_new') || 'New'
  },
  { 
    value: 'paypal', 
    label: t('payment_provider_paypal'),
    description: t('payment_desc_paypal'),
    icon: '🅿️',
    provider: 'PayPal',
    badge: null
  },
  { 
    value: 'bank_transfer', 
    label: t('payment_provider_bank_transfer'),
    description: t('payment_desc_bank_transfer'),
    icon: '🏦',
    provider: 'Direct',
    badge: null
  },
  { 
    value: 'pay_at_property', 
    label: t('payment_method_pay_at_property'),
    description: t('payment_desc_pay_at_property'),
    icon: '🏨',
    provider: 'On-site',
    badge: null
  }
];

const formatCurrency = (value, currency) => {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return `${currency || 'USD'} 0.00`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(numValue);
  } catch {
    return `${currency || 'USD'} ${Number(value || 0).toFixed(2)}`;
  }
};

const HotelPayment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [checkoutState, setCheckoutState] = useState(null);
  const [slowConnection, setSlowConnection] = useState(false);
    const [manualStatus, setManualStatus] = useState('');
    const [manualStatusLoading, setManualStatusLoading] = useState(false);
    const [manualStatusError, setManualStatusError] = useState('');
    const [manualStatusSuccess, setManualStatusSuccess] = useState('');

  const safeBookingId = useMemo(() => Number(bookingId), [bookingId]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/hotels/payment/${bookingId}`)}`);
      return;
    }

    const loadBooking = async () => {
      try {
        setLoading(true);
        const response = await fetchHotelBookings();
        const bookingRows = response.data || [];
        const found = bookingRows.find((row) => Number(row.booking_id) === safeBookingId);
        if (!found) {
          setError(t('booking_not_found'));
          return;
        }
        setBooking(found);
        if (found.payment_method) {
          setPaymentMethod(found.payment_method);
        }
        
        // Fetch payment record
        try {
          const paymentHistoryResponse = await getPaymentHistory();
          const payments = paymentHistoryResponse.data || [];
          const bookingPayment = payments.find(p => Number(p.booking_id) === safeBookingId);
          if (bookingPayment) {
            setPayment(bookingPayment);
          }
        } catch (paymentErr) {
          console.error('Failed to load payment:', paymentErr);
        }
      } catch (err) {
        console.error('Failed to load booking:', err);
        setError(t('failed_to_load_booking_details'));
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(safeBookingId) && safeBookingId > 0) {
      loadBooking();
    } else {
      setLoading(false);
      setError(t('invalid_booking_id'));
    }
  }, [bookingId, isLoggedIn, navigate, safeBookingId]);

  // Restore a checkout URL saved in sessionStorage if the browser redirect stalled before
  useEffect(() => {
    if (!booking || booking.payment_status === 'paid') return;
    const saved = sessionStorage.getItem(`pendingCheckout_${safeBookingId}`);
    if (saved) {
      const savedMethod = sessionStorage.getItem(`pendingCheckoutMethod_${safeBookingId}`) || 'paypal';
      setPaymentMethod(savedMethod);
      setCheckoutState({
        status: 'ready',
        message: t('previous_payment_session_found'),
        url: saved,
        resumed: true
      });
    }
  }, [booking, safeBookingId]);

  const handleCheckout = async () => {
    if (!booking) return;

    if (['bank_transfer', 'pay_at_property'].includes(paymentMethod)) {
      setCheckoutState({
        status: 'info',
        message: t('payment_method_offline_msg')
      });
      return;
    }

    if (!navigator.onLine) {
      setCheckoutState({ status: 'error', message: t('no_internet_connection') });
      return;
    }

    setSlowConnection(false);

    try {
      setCheckoutState({ status: 'loading', message: t('starting_checkout') });

      // Show slow-network warning after 7 s
      const slowTimer = setTimeout(() => setSlowConnection(true), 7000);

      const checkoutResponse = await Promise.race([
        startPaymentCheckout({
          booking_id: booking.booking_id,
          payment_method: paymentMethod,
          amount: booking.total_amount,
          currency: booking.currency,
          customer_email: booking.customer_email,
          customer_phone: booking.customer_phone
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('CHECKOUT_TIMEOUT')), 30000)
        )
      ]);

      clearTimeout(slowTimer);
      setSlowConnection(false);

      if (checkoutResponse.status >= 400) {
        setCheckoutState({
          status: 'error',
          message: checkoutResponse.data?.error || t('failed_to_start_checkout')
        });
        return;
      }

      const checkoutUrl = checkoutResponse.data?.checkout_url;
      if (!checkoutUrl) {
        setCheckoutState({ status: 'error', message: t('checkout_url_error') || 'Checkout URL not available. Please try again.' });
        return;
      }

      // Persist URL so the user can resume if the redirect stalls
      sessionStorage.setItem('pendingReceiptBookingId', String(booking.booking_id));
      sessionStorage.setItem(`pendingCheckout_${booking.booking_id}`, checkoutUrl);
      sessionStorage.setItem(`pendingCheckoutMethod_${booking.booking_id}`, paymentMethod);

      setCheckoutState({
        status: 'ready',
        message: t('payment_window_opening') + ' ' + (t('payment_window_opening_fallback') || ''),
        url: checkoutUrl
      });
      setTimeout(() => { window.location.assign(checkoutUrl); }, 400);
    } catch (err) {
      console.error('Checkout error:', err);
      setSlowConnection(false);
      if (err.message === 'CHECKOUT_TIMEOUT') {
        setCheckoutState({
          status: 'error',
          message: t('connection_timed_out_checkout')
        });
      } else {
        setCheckoutState({ status: 'error', message: t('failed_to_start_checkout') });
      }
    }
  };

  return (
    <div style={pageStyle}>
      <div style={headerSection}>
        <div style={headerContent}>
            <h1 style={titleStyle}>{t('complete_your_payment')}</h1>
            <p style={subtitleStyle}>{t('finalize_hotel_booking')}</p>
          </div>
      </div>

      <div style={contentWrapper}>
        {loading ? (
          <div style={cardStyle}>{t('loading_payment_details')}</div>
        ) : error ? (
          <div style={cardStyle}>
            <p style={errorTextStyle}>{error}</p>
            <button style={secondaryButtonStyle} onClick={() => navigate('/bookings')}>
              {t('view_booking_history') || 'View Booking History'}
            </button>
          </div>
        ) : !booking ? null : (
          <div style={contentGrid}>
            <div style={cardStyle}>
              <div style={sectionHeading}>{t('booking_summary')}</div>
              <div style={summaryGrid}>
                <div>
                  <div style={labelStyle}>{t('booking_label') || 'Booking'}</div>
                  <div style={valueStyle}>#{booking.booking_id}</div>
                  {booking.booking_reference && (
                    <div style={metaTextStyle}>{t('booking_reference_label')} {booking.booking_reference}</div>
                  )}
                </div>
                <div>
                  <div style={labelStyle}>{t('hotel_label') || 'Hotel'}</div>
                  <div style={valueStyle}>{booking.hotel_name}</div>
                </div>
                <div>
                  <div style={labelStyle}>{t('stay_label') || 'Stay'}</div>
                  <div style={valueStyle}>{booking.check_in} - {booking.check_out}</div>
                </div>
                <div>
                  <div style={labelStyle}>{t('guests_label') || 'Guests'}</div>
                  <div style={valueStyle}>{booking.guests} guests, {booking.rooms} rooms</div>
                </div>
                <div>
                  <div style={labelStyle}>{t('total_label') || 'Total'}</div>
                  <div style={valueStyle}>{formatCurrency(booking.total_amount, booking.currency)}</div>
                </div>
                <div>
                  <div style={labelStyle}>{t('payment_status_label') || 'Payment Status'}</div>
                  <div style={valueStyle}>{t(booking.payment_status) || booking.payment_status}</div>
                </div>
                {payment && (
                  <>
                    <div>
                      <div style={labelStyle}>{t('payment_reference_label')}</div>
                      <div style={valueStyle}>{payment.transaction_reference}</div>
                    </div>
                    <div>
                      <div style={labelStyle}>{t('payment_provider_label')}</div>
                      <div style={valueStyle}>{payment.provider}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={sectionHeading}>{t('payment_method_section')}</div>
              {booking.payment_status === 'paid' ? (
                <div style={paidBannerStyle}>{t('payment_already_completed')}</div>
              ) : (
                <>
                  {/* Payment Methods Grid */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={paymentMethodsContainerStyle}>
                      {getPaymentMethods(t).map((method) => (
                        <div
                          key={method.value}
                          style={{
                            ...paymentMethodCardStyle(paymentMethod === method.value),
                            cursor: 'pointer'
                          }}
                          onClick={() => setPaymentMethod(method.value)}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setPaymentMethod(method.value);
                            }
                          }}
                        >
                          <div style={paymentMethodIconStyle}>{method.icon}</div>
                          <div style={paymentMethodLabelStyle}>{method.label}</div>
                          <div style={paymentMethodDescStyle}>{method.description}</div>
                          <div style={methodProviderStyle}>{method.provider}</div>
                          {method.badge && (
                            <div style={{ marginTop: '0.5rem' }}>
                              <span style={badgeStyle}>{method.badge}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Xendit Security Info */}
                  {(['card', 'gcash', 'grab_pay', 'qrph'].includes(paymentMethod)) && (paymentMethod === 'card' || paymentMethod === 'grab_pay' || paymentMethod === 'qrph') ? (
                    <div style={paymongoSecurityBannerStyle}>
                      <span style={paymongoSecurityIconStyle}>🔐</span>
                      <span>
                        <strong>{t('payment_secured_by_paymongo')}</strong> — {t('payment_paymongo_description')}
                      </span>
                    </div>
                  ) : paymentMethod === 'gcash' ? (
                    <div style={paymongoSecurityBannerStyle}>
                      <span style={paymongoSecurityIconStyle}>🔐</span>
                      <span>
                        <strong>Secured by Xendit</strong> — Bank-level security for all GCash payments
                      </span>
                    </div>
                  ) : null}

                  <button
                    style={{ ...primaryButtonStyle, ...(checkoutState?.status === 'loading' ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                    onClick={handleCheckout}
                    disabled={checkoutState?.status === 'loading'}
                  >
                    {checkoutState?.status === 'loading'
                      ? (slowConnection ? (t('button_connecting_slow') || '\u23f3 Connecting (slow network)\u2026') : (t('processing') || '\u23f3 Processing...'))
                        : t('continue_to_payment')}
                  </button>

                  {slowConnection && checkoutState?.status === 'loading' && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: '10px', background: '#fef9c3', color: '#78350f', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>\u23f3</span>
                      <span>{t('error_slow_connection')}</span>
                    </div>
                  )}

                  {checkoutState && (
                    <div style={checkoutBannerStyle(checkoutState.status)}>
                      {checkoutState.resumed && (
                          <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>{t('resume_payment')}</div>
                      )}
                      <div>{checkoutState.message}</div>
                      {checkoutState.url && (
                        <button
                          style={secondaryButtonStyle}
                          onClick={() => window.open(checkoutState.url, '_blank', 'noopener,noreferrer')}
                        >
                          {t('open_payment')}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Manual Status Update (Admin Only) */}
              {payment && (
                  <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                  <div style={sectionHeading}>{t('manual_status_update_admin')}</div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{t('set_payment_status')}</label>
                    <select
                      value={manualStatus}
                      onChange={e => setManualStatus(e.target.value)}
                      style={selectStyle}
                    >
                      <option value="">{t('select_status') || 'Select status...'}</option>
                      <option value="succeeded">{t('succeeded') || 'Succeeded'}</option>
                      <option value="pending">{t('pending_status') || 'Pending'}</option>
                      <option value="failed">{t('failed_status') || 'Failed'}</option>
                      <option value="refunded">{t('refunded_status') || 'Refunded'}</option>
                    </select>
                  </div>
                  <button
                    style={primaryButtonStyle}
                    disabled={!manualStatus || manualStatusLoading}
                    onClick={async () => {
                      setManualStatusLoading(true);
                      setManualStatusError('');
                      setManualStatusSuccess('');
                      try {
                        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                        const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments/${payment.payment_id}/status`, {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ status: manualStatus })
                        });
                        const data = await resp.json();
                        if (!resp.ok) {
                          setManualStatusError(data.error || t('failed_to_update_status'));
                        } else {
                          setManualStatusSuccess(t('status_updated_successfully'));
                          // Reload booking data
                          setTimeout(() => {
                            window.location.reload();
                          }, 1500);
                        }
                      } catch (err) {
                        setManualStatusError(t('failed_to_update_status'));
                      } finally {
                        setManualStatusLoading(false);
                      }
                    }}
                  >
                    {manualStatusLoading ? t('updating_status') : t('update_status')}
                  </button>
                  {manualStatusError && (
                    <div style={checkoutBannerStyle('error')}>{manualStatusError}</div>
                  )}
                  {manualStatusSuccess && (
                    <div style={checkoutBannerStyle('ready')}>{manualStatusSuccess}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const headerContent = {
  maxWidth: '1200px',
  margin: '0 auto'
};

const contentWrapper = {
  maxWidth: '1200px',
  margin: '2rem auto',
  padding: '0 1.5rem'
};

const contentGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '2rem'
};

const summaryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem'
};

const subtitleStyle = {
  margin: '0.5rem 0 0 0',
  fontSize: '1.1rem',
  opacity: 0.9
};

const pageStyle = {
  backgroundColor: '#f8f9fa',
  minHeight: '100vh',
  paddingBottom: '3rem'
};

const headerSection = {
  background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
  color: '#ffffff',
  padding: '2.5rem 1.5rem'
};



// Removed duplicate and stray code after HotelPayment component

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '2rem',
  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.12)'
};


const titleStyle = {
  margin: 0,
  fontSize: '2.3rem',
  fontWeight: 700,
  letterSpacing: '0.05em'
};

const valueStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111827'
};

const metaTextStyle = {
  marginTop: '0.3rem',
  fontSize: '0.85rem',
  color: '#6b7280'
};


const selectStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1px solid #d1d5db'
};

const paymentMethodsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '1rem',
  marginTop: '0.75rem'
};

const paymentMethodCardStyle = (isSelected) => ({
  padding: '1.25rem 1rem',
  borderRadius: '12px',
  border: isSelected ? '2px solid #2e7d32' : '2px solid #e5e7eb',
  backgroundColor: isSelected ? '#f0f9ff' : '#fff',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'center',
  boxShadow: isSelected ? '0 0 0 3px rgba(46, 125, 50, 0.1)' : 'none',
  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
  '&:hover': {
    borderColor: '#2e7d32',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
});

const paymentMethodIconStyle = {
  fontSize: '2.5rem',
  marginBottom: '0.5rem'
};

const paymentMethodLabelStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#1f2937',
  marginBottom: '0.25rem'
};

const paymentMethodDescStyle = {
  fontSize: '0.75rem',
  color: '#6b7280',
  marginBottom: '0.5rem'
};

const badgeStyle = {
  display: 'inline-block',
  backgroundColor: '#2e7d32',
  color: '#fff',
  fontSize: '0.65rem',
  padding: '0.2rem 0.5rem',
  borderRadius: '20px',
  fontWeight: 600
};

const paymongoSecurityBannerStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  borderRadius: '12px',
  backgroundColor: '#f0fdf4',
  border: '1px solid #86efac',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  fontSize: '0.9rem',
  color: '#166534'
};

const paymongoSecurityIconStyle = {
  fontSize: '1.5rem'
};

const methodProviderStyle = {
  fontSize: '0.7rem',
  color: '#9ca3af',
  marginTop: '0.25rem'
};

const primaryButtonStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#2e7d32',
  color: '#ffffff',
  fontWeight: 600,
  cursor: 'pointer'
};

const secondaryButtonStyle = {
  marginTop: '0.75rem',
  padding: '0.65rem 1rem',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  backgroundColor: '#ffffff',
  color: '#1f2937',
  fontWeight: 600,
  cursor: 'pointer'
};

const errorTextStyle = {
  color: '#b91c1c',
  marginBottom: '1rem'
};

const paidBannerStyle = {
  backgroundColor: '#e8f5e9',
  color: '#1b5e20',
  padding: '1rem',
  borderRadius: '10px',
  fontWeight: 600
};

const checkoutBannerStyle = (status) => ({
  marginTop: '1rem',
  padding: '1rem',
  borderRadius: '10px',
  backgroundColor: status === 'error' ? '#fee2e2' : status === 'loading' ? '#fef9c3' : '#dbeafe',
  color: '#1f2937'
});

export default HotelPayment;
