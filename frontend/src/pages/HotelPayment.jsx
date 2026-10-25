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
import { fetchHotelBookings, startPaymentCheckout, getPaymentHistory, getApiBaseUrl, getCsrfToken } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Icons from '../components/Icons';
import { policyLinesFromSnapshot, POLICY_LINE_ICONS } from '../utils/bookingPolicy';

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
    value: 'grabpay', 
    label: t('payment_provider_grabpay'),
    description: t('payment_desc_grabpay'),
    icon: '🚗',
    provider: 'PayMongo',
    badge: t('payment_badge_new') || 'New'
  },
  { 
    value: 'qrph', 
    label: t('payment_provider_qrph') || 'QR PH',
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
  const [policyAgreed, setPolicyAgreed] = useState(false);

  const safeBookingId = useMemo(() => Number(bookingId), [bookingId]);

  // Policy terms frozen on the booking at creation time (legacy rows have none).
  const policyLines = useMemo(
    () => policyLinesFromSnapshot(booking?.policy_snapshot, {
      checkIn: booking?.check_in,
      balanceDueAt: booking?.balance_due_at,
      showBalance: Number(booking?.balance_due) > 0,
      t
    }),
    [booking, t]
  );

  // The single payment method the user has chosen — only this one is shown/focused.
  const selectedMethod = useMemo(() => {
    return getPaymentMethods(t).find((m) => m.value === paymentMethod) || getPaymentMethods(t)[0];
  }, [paymentMethod, t]);

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
    if (policyLines.length > 0 && !policyAgreed) return;

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
          amount: booking.amount_due_now ?? booking.balance_due ?? booking.total_amount,
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
                {booking.payment_status !== 'paid' && booking.payment_status !== 'refunded' && (
                  <>
                    <div>
                      <div style={labelStyle}>Amount due now</div>
                      <div style={valueStyle}>
                        {formatCurrency(booking.amount_due_now ?? booking.balance_due ?? booking.total_amount, booking.currency)}
                      </div>
                    </div>
                    {Number(booking.amount_paid) > 0 && (
                      <>
                        <div>
                          <div style={labelStyle}>Paid so far</div>
                          <div style={valueStyle}>{formatCurrency(booking.amount_paid, booking.currency)}</div>
                        </div>
                        <div>
                          <div style={labelStyle}>Balance due</div>
                          <div style={valueStyle}>{formatCurrency(booking.balance_due, booking.currency)}</div>
                        </div>
                      </>
                    )}
                  </>
                )}
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
                    {/* Payment method selector — only the chosen method is shown focused below */}
                    <div style={paymentMethodSelectorStyle}>
                      <label style={labelStyle}>{t('choose_payment_method') || 'Choose Payment Method'}</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        style={selectStyle}
                      >
                        {getPaymentMethods(t).map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Focused view of the selected payment method */}
                    <div style={selectedPaymentMethodContainerStyle}>
                      <div style={selectedPaymentMethodCardStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div style={selectedPaymentMethodIconStyle}>{selectedMethod.icon}</div>
                        <div>
                          <div style={selectedPaymentMethodTitleStyle}>{selectedMethod.label}</div>
                          <div style={selectedPaymentMethodProviderStyle}>{selectedMethod.provider}</div>
                        </div>
                      </div>
                      <div style={selectedPaymentMethodDescStyle}>{selectedMethod.description}</div>
                      {selectedMethod.badge && (
                        <span style={badgeStyle}>{selectedMethod.badge}</span>
                      )}
                    </div>

                    {/* Security banner for the selected method */}
                    {(['card', 'gcash', 'grabpay', 'qrph'].includes(paymentMethod)) && (paymentMethod === 'card' || paymentMethod === 'grabpay' || paymentMethod === 'qrph') ? (
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

                    {/* Booking policies — final agreement before paying */}
                    {policyLines.length > 0 && (
                      <div style={{ marginTop: '1rem', border: '1.5px solid #c8e6c9', borderRadius: '10px', background: '#f8fdf7', padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {t('booking_policies_title')}
                        </div>
                        {policyLines.map((line, idx) => {
                          const IconComp = Icons[POLICY_LINE_ICONS[line.icon] || 'Info'];
                          return (
                            <div key={idx} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', fontSize: '0.86rem', color: '#374151', lineHeight: 1.5 }}>
                              <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: '#e8f5e9', color: '#2E7D32', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconComp size={14} />
                              </span>
                              <span>{line.text}</span>
                            </div>
                          );
                        })}
                        <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginTop: '0.35rem', paddingTop: '0.85rem', borderTop: '1px dashed #c8e6c9', cursor: 'pointer', fontSize: '0.88rem', color: '#1B5E20', fontWeight: 600, lineHeight: 1.45 }}>
                          <input
                            type="checkbox"
                            checked={policyAgreed}
                            onChange={(e) => setPolicyAgreed(e.target.checked)}
                            style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#2E7D32', flexShrink: 0 }}
                          />
                          <span>{t('agree_policies_checkbox')}</span>
                        </label>
                      </div>
                    )}

                    <button
                      style={{ ...primaryButtonStyle, ...(checkoutState?.status === 'loading' || (policyLines.length > 0 && !policyAgreed) ? { opacity: 0.7, cursor: 'not-allowed' } : {}) }}
                      onClick={handleCheckout}
                      disabled={checkoutState?.status === 'loading' || (policyLines.length > 0 && !policyAgreed)}
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
                  </div>
                </>
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
  backgroundColor: 'transparent',
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

const selectedPaymentMethodContainerStyle = {
  marginTop: '1rem'
};

const paymentMethodSelectorStyle = {
  marginBottom: '1rem',
  padding: '0.75rem 1rem',
  borderRadius: '12px',
  border: '1.5px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
};

const selectedPaymentMethodCardStyle = {
  padding: '1.5rem 1.25rem',
  borderRadius: '16px',
  border: '2px solid #2e7d32',
  backgroundColor: '#f0fdf4',
  textAlign: 'center',
  boxShadow: '0 0 0 4px rgba(46, 125, 50, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#1b5e20',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
  }
};

const selectedPaymentMethodIconStyle = {
  fontSize: '3rem',
  marginBottom: '0.75rem'
};

const selectedPaymentMethodTitleStyle = {
  fontSize: '1.25rem',
  fontWeight: 700,
  color: '#1b5e20',
  marginBottom: '0.25rem'
};

const selectedPaymentMethodProviderStyle = {
  fontSize: '0.75rem',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '0.75rem'
};

const selectedPaymentMethodDescStyle = {
  fontSize: '0.9rem',
  color: '#374151',
  marginBottom: '0.75rem',
  lineHeight: 1.5
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
