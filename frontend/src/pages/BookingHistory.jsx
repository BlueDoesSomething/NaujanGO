import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchHotelBookings, fetchHotelReceipt, modifyHotelBooking } from '../api';
import * as api from '../api';
import HeroSlideshow from '../components/HeroSlideshow';
import { getApiBaseUrl } from '../api';

export default function BookingHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // all, hotel, location, date
  const [receiptHtml, setReceiptHtml] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [modifyModal, setModifyModal] = useState(null);
  const [modifyForm, setModifyForm] = useState({});
  const [submittingModify, setSubmittingModify] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    loadBookings();
  }, [isLoggedIn]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await fetchHotelBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      confirmed: '#28a745',
      cancelled: '#dc3545',
      completed: '#6c757d'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: t('pending'),
      confirmed: t('confirmed'),
      cancelled: t('cancelled'),
      completed: t('completed')
    };
    return labels[status] || status;
  };

  const isUpcoming = (checkIn) => {
    return new Date(checkIn) > new Date();
  };

  const isPast = (checkOut) => {
    return new Date(checkOut) < new Date();
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'upcoming') return isUpcoming(booking.check_in) && booking.status !== 'cancelled';
    if (filter === 'past') return isPast(booking.check_out);
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  }).filter((booking) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    
    if (searchFilter === 'hotel') {
      return (booking.hotel_name || '').toLowerCase().includes(query);
    } else if (searchFilter === 'location') {
      return (booking.hotel_location || '').toLowerCase().includes(query);
    } else if (searchFilter === 'date') {
      return `${booking.check_in || ''} ${booking.check_out || ''}`.toLowerCase().includes(query);
    } else {
      return `${booking.hotel_name || ''} ${booking.hotel_location || ''} ${booking.status || ''} ${booking.check_in || ''} ${booking.check_out || ''}`
        .toLowerCase()
        .includes(query);
    }
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return nights;
  };

  const renderReceiptHtml = (receipt) => {
    if (!receipt) return '';

    const totalAmount = `${receipt.currency} ${Number(receipt.total_amount || 0).toLocaleString()}`;
    const issuedAt = new Date(receipt.issued_at).toLocaleString();

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Booking Receipt</title>
  <style>
    body {
      background: #f4f7fb;
      font-family: 'Poppins', Arial, sans-serif;
      margin: 0;
      padding: 32px 16px;
      color: #1f2937;
    }
    .receipt-card {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.12);
      overflow: hidden;
    }
    .receipt-header {
      background: linear-gradient(135deg, #2e7d32, #4caf50);
      color: #ffffff;
      padding: 28px 32px;
      text-align: center;
    }
    .receipt-header h1 {
      margin: 0 0 6px;
      font-size: 2rem;
      font-weight: 700;
    }
    .receipt-header p {
      margin: 0;
      opacity: 0.9;
    }
    .receipt-body {
      padding: 28px 32px 32px;
    }
    .section {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 18px;
    }
    .section h3 {
      margin: 0 0 12px;
      font-size: 1.1rem;
      color: #1b1f2a;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px 18px;
    }
    .label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .value {
      font-weight: 600;
      color: #111827;
    }
    .reference-box {
      background: #e8f5e9;
      border: 1px solid #a5d6a7;
      border-radius: 10px;
      padding: 12px 16px;
      text-align: center;
      font-weight: 700;
      margin: 18px 0;
      font-family: 'Courier New', monospace;
    }
    .notes {
      background: #fff3cd;
      border: 1px solid #ffeeba;
      border-radius: 10px;
      padding: 14px 16px;
      color: #6b4f00;
    }
    .footer {
      margin-top: 18px;
      text-align: center;
      color: #6b7280;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="receipt-header">
      <h1>Booking Confirmed</h1>
      <p>NaujanGO Receipt</p>
    </div>
    <div class="receipt-body">
      <div class="section">
        <h3>Booking Details</h3>
        <div class="grid">
          <div>
            <div class="label">Receipt</div>
            <div class="value">${receipt.receipt_number}</div>
          </div>
          <div>
            <div class="label">Booking ID</div>
            <div class="value">${receipt.booking_id}</div>
          </div>
          <div>
            <div class="label">Hotel</div>
            <div class="value">${receipt.hotel_name}</div>
          </div>
          <div>
            <div class="label">Location</div>
            <div class="value">${receipt.hotel_location || ''}</div>
          </div>
        </div>
      </div>

      ${receipt.booking_reference ? `<div class="reference-box">Booking Reference: ${receipt.booking_reference}</div>` : ''}

      <div class="section">
        <h3>Stay Details</h3>
        <div class="grid">
          <div>
            <div class="label">Check-in</div>
            <div class="value">${receipt.check_in}</div>
          </div>
          <div>
            <div class="label">Check-out</div>
            <div class="value">${receipt.check_out}</div>
          </div>
          <div>
            <div class="label">Nights</div>
            <div class="value">${receipt.nights}</div>
          </div>
          <div>
            <div class="label">Guests</div>
            <div class="value">${receipt.guests}</div>
          </div>
          <div>
            <div class="label">Rooms</div>
            <div class="value">${receipt.rooms}</div>
          </div>
          <div>
            <div class="label">Total</div>
            <div class="value">${totalAmount}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>Guest & Payment</h3>
        <div class="grid">
          <div>
            <div class="label">Guest</div>
            <div class="value">${receipt.customer_name}</div>
          </div>
          <div>
            <div class="label">Email</div>
            <div class="value">${receipt.customer_email}</div>
          </div>
          <div>
            <div class="label">Phone</div>
            <div class="value">${receipt.customer_phone || ''}</div>
          </div>
          <div>
            <div class="label">Payment Method</div>
            <div class="value">${receipt.payment_method}</div>
          </div>
          <div>
            <div class="label">Payment Status</div>
            <div class="value">${receipt.payment_status}</div>
          </div>
          <div>
            <div class="label">Payment Ref</div>
            <div class="value">${receipt.payment_reference || '-'}</div>
          </div>
        </div>
      </div>

      <div class="notes">
        Keep this receipt for your records. Issued on ${issuedAt}.
      </div>

      <div class="footer">Need help? Contact NaujanGO support.</div>
    </div>
  </div>
</body>
</html>`;
  };

  const openReviewModal = async (booking) => {
    // Check review eligibility before opening modal
    try {
      const response = await api.get(`/hotels/${booking.hotel_id}/can-review?user_id=${user?.user_id}&booking_id=${booking.booking_id}`);
      if (!response.data.canReview) {
        alert(response.data.reason || 'You are not eligible to review this hotel.');
        return;
      }
      setReviewModal(booking);
      setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      alert('Error checking review eligibility. Please try again.');
    }
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewForm({ rating: 5, comment: '' });
  };

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) {
      alert('Please write a comment for your review');
      return;
    }
    try {
      setSubmittingReview(true);
      const response = await api.post(`/hotels/${reviewModal.hotel_id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        booking_id: reviewModal.booking_id
      });
      alert('Review submitted successfully!');
      closeReviewModal();
      loadBookings();
    } catch (error) {
      console.error('Error submitting review:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReceiptModal = (receipt) => {
    setReceiptHtml(renderReceiptHtml(receipt));
    setShowReceipt(true);
  };

  const viewReceipt = async (bookingId) => {
    try {
      const response = await fetchHotelReceipt(bookingId);
      openReceiptModal(response.data);
    } catch (error) {
      console.error('Failed to load receipt:', error);
    }
  };

  const openModifyModal = (booking) => {
    setModifyModal(booking);
    setModifyForm({
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests,
      rooms: booking.rooms
    });
  };

  const submitModify = async () => {
    try {
      setSubmittingModify(true);
      await modifyHotelBooking(modifyModal.booking_id, modifyForm);
      alert('Booking modified successfully!');
      setModifyModal(null);
      loadBookings();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to modify booking');
    } finally {
      setSubmittingModify(false);
    }
  };

  const downloadCalendar = (booking) => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NaujanGO//Booking//EN
BEGIN:VEVENT
UID:${booking.booking_id}@naujango.com
DTSTART:${booking.check_in.replace(/-/g, '')}T140000Z
DTEND:${booking.check_out.replace(/-/g, '')}T120000Z
SUMMARY:Hotel Booking - ${booking.hotel_name}
DESCRIPTION:Booking #${booking.booking_id}\nGuests: ${booking.guests}\nRooms: ${booking.rooms}
LOCATION:${booking.hotel_location || booking.hotel_name}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.booking_id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus !== 'success') return;

    const pendingId = sessionStorage.getItem('pendingReceiptBookingId');
    if (!pendingId) return;

    const matching = bookings.find((booking) => Number(booking.booking_id) === Number(pendingId));
    if (matching && ['confirmed', 'completed'].includes(matching.status)) {
      viewReceipt(Number(pendingId));
      sessionStorage.removeItem('pendingReceiptBookingId');
      navigate('/bookings', { replace: true });
    }
  }, [location.search, bookings]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Hero Section with Slideshow */}
      <HeroSlideshow 
        title="My Bookings"
        subtitle="View and manage your hotel reservations"
        height="350px"
        showControls={false}
      />

      <div style={styles.contentWrapper}>
        {/* Search Bar with Filter */}
        <div style={styles.searchContainer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1}}>
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder={`Search bookings${searchFilter !== 'all' ? ` by ${searchFilter}` : ''}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={styles.searchFilterSelect}
          >
            <option value="all">All Fields</option>
            <option value="hotel">Hotel Name</option>
            <option value="location">Location</option>
            <option value="date">Date</option>
          </select>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterContainer}>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'all' ? styles.filterBtnActive : {})
            }}
            onClick={() => setFilter('all')}
          >
            All ({bookings.length})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'upcoming' ? styles.filterBtnActive : {})
            }}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming ({bookings.filter(b => isUpcoming(b.check_in) && b.status !== 'cancelled').length})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'past' ? styles.filterBtnActive : {})
            }}
            onClick={() => setFilter('past')}
          >
            Past ({bookings.filter(b => isPast(b.check_out)).length})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(filter === 'cancelled' ? styles.filterBtnActive : {})
            }}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
          </button>
        </div>

      {/* Bookings List */}
      <div style={styles.bookingsList}>
        {filteredBookings.length === 0 ? (
          <div style={styles.emptyState}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{margin: '0 auto 1.5rem'}}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <h3 style={styles.emptyTitle}>No bookings found</h3>
            <p style={styles.emptyText}>
              {filter === 'all' 
                ? "You haven't made any hotel bookings yet. Start planning your next adventure!"
                : `No ${filter} bookings to display.`}
            </p>
            <button 
              style={styles.browseBtn}
              onClick={() => navigate('/hotels')}
            >
              Browse Hotels
            </button>
          </div>
        ) : (
          filteredBookings.map(booking => (
            <div key={booking.booking_id} style={styles.bookingCard}>
              <div style={styles.bookingHeader}>
                <div>
                  <h3 style={styles.hotelName}>{booking.hotel_name}</h3>
                  <p style={styles.location}>{booking.hotel_location || 'Location not specified'}</p>
                </div>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(booking.status),
                }}>
                  {getStatusLabel(booking.status)}
                </div>
              </div>

              <div style={styles.bookingDetails}>
                <div style={styles.detailRow}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Check-in</span>
                    <span style={styles.detailValue}>{formatDate(booking.check_in)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Check-out</span>
                    <span style={styles.detailValue}>{formatDate(booking.check_out)}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Nights</span>
                    <span style={styles.detailValue}>{calculateNights(booking.check_in, booking.check_out)}</span>
                  </div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Guests</span>
                    <span style={styles.detailValue}>{booking.guests ?? 'N/A'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Rooms</span>
                    <span style={styles.detailValue}>{booking.rooms ?? 'N/A'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Total</span>
                    <span style={styles.detailValue}>₱{booking.total_amount?.toLocaleString() || 'N/A'}</span>
                  </div>
                </div>

                {booking.room_type_name && (
                  <div style={styles.detailRow}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Room Type</span>
                      <span style={styles.detailValue}>{booking.room_type_name}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Room Category</span>
                      <span style={{ ...styles.detailValue, fontSize: '0.9rem', color: '#16a34a', fontWeight: 'bold' }}>🛏️ {booking.rooms} room{booking.rooms > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}

                {booking.special_requests && (
                  <div style={styles.specialRequests}>
                    <span style={styles.detailLabel}>Special Requests:</span>
                    <p style={styles.requestsText}>{booking.special_requests}</p>
                  </div>
                )}
              </div>

              <div style={styles.bookingFooter}>
                <div style={styles.bookingMeta}>
                  <span style={styles.bookingId}>Booking #{booking.booking_id}</span>
                  {booking.booking_reference && (
                    <span style={styles.bookingDate}>Ref {booking.booking_reference}</span>
                  )}
                  <span style={styles.bookingDate}>
                    Booked on {formatDate(booking.created_at)}
                  </span>
                  {booking.expires_at && booking.payment_status === 'unpaid' && new Date(booking.expires_at) > new Date() && (
                    <span style={{fontSize: '12px', color: '#e74c3c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      Expires: {new Date(booking.expires_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <div style={styles.actions}>
                  {['pending', 'confirmed'].includes(booking.status) && isUpcoming(booking.check_in) && (
                    <button style={styles.actionBtn} onClick={() => openModifyModal(booking)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Modify
                    </button>
                  )}
                  {['confirmed', 'completed'].includes(booking.status) && (
                    <button style={styles.actionBtn} onClick={() => viewReceipt(booking.booking_id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      Receipt
                    </button>
                  )}
                  {isPast(booking.check_out) && booking.status === 'confirmed' && (
                    <button style={{...styles.actionBtn, ...styles.reviewBtn}} onClick={() => openReviewModal(booking)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      Review
                    </button>
                  )}
                  {['confirmed', 'completed'].includes(booking.status) && (
                    <button style={{...styles.actionBtn, backgroundColor: '#10b981', color: 'white', border: 'none'}} onClick={() => downloadCalendar(booking)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Calendar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
      {showReceipt && (
        <div style={styles.receiptOverlay}>
          <div style={styles.receiptModal}>
            <button style={styles.receiptClose} onClick={() => setShowReceipt(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem'}}>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Close
            </button>
            <div
              style={styles.receiptContent}
              dangerouslySetInnerHTML={{ __html: receiptHtml }}
            />
          </div>
        </div>
      )}

      {reviewModal && (
        <div style={styles.receiptOverlay}>
          <div style={{...styles.receiptModal, maxWidth: '600px'}}>
            <div style={{padding: '24px'}}>
              <h2 style={{margin: '0 0 20px 0', fontSize: '24px', color: '#2c3e50'}}>Write a Review</h2>
              <p style={{margin: '0 0 20px 0', color: '#7f8c8d'}}>{reviewModal.hotel_name}</p>
              
              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: '600', color: '#2c3e50'}}>Rating</label>
                <div style={{display: 'flex', gap: '10px'}}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setReviewForm({...reviewForm, rating: star})}
                      style={{
                        fontSize: '32px',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: star <= reviewForm.rating ? '#ffc107' : '#e0e0e0'
                      }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '10px', fontWeight: '600', color: '#2c3e50'}}>Your Review</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                  placeholder="Share your experience..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button
                  onClick={closeReviewModal}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    background: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={submittingReview}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    background: submittingReview ? '#95a5a6' : '#3498db',
                    color: 'white',
                    cursor: submittingReview ? 'not-allowed' : 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
    paddingBottom: 'clamp(2rem, 5vw, 3rem)',
    overflowX: 'hidden'
  },
  contentWrapper: {
    width: 'min(100%, 1200px)',
    margin: '3rem auto 0 auto',
    padding: '0 clamp(0.75rem, 3vw, 1.5rem)'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    fontSize: '18px',
    color: '#666'
  },
  searchContainer: {
    position: 'relative',
    marginBottom: '1.5rem',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: 'min(100%, 280px)',
    padding: '0.95rem 1rem 0.95rem 3rem',
    borderRadius: '14px',
    border: '2px solid rgba(156, 163, 175, 0.3)',
    fontSize: '0.9375rem',
    minHeight: '46px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#1f2937',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    boxSizing: 'border-box'
  },
  searchFilterSelect: {
    padding: '0.95rem 1rem',
    borderRadius: '14px',
    border: '2px solid rgba(156, 163, 175, 0.3)',
    fontSize: '0.9375rem',
    outline: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    minWidth: 'min(100%, 150px)',
    minHeight: '46px',
    boxSizing: 'border-box'
  },
  filterContainer: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  filterBtn: {
    padding: '0.8rem 1rem',
    border: '2px solid rgba(156, 163, 175, 0.3)',
    borderRadius: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    cursor: 'pointer',
    fontSize: '0.9375rem',
    minHeight: '44px',
    fontWeight: '600',
    color: '#6b7280',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  },
  filterBtnActive: {
    background: 'rgba(22, 163, 74, 0.15)',
    color: '#16a34a',
    borderColor: '#16a34a',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
    transform: 'translateY(-1px)'
  },
  bookingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  bookingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: 'clamp(14px, 3vw, 20px)',
    padding: 'clamp(1rem, 3vw, 1.75rem)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    transition: 'all 0.3s ease'
  },
  bookingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid rgba(156, 163, 175, 0.2)',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  hotelName: {
    fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.5rem 0'
  },
  location: {
    fontSize: '0.9375rem',
    color: '#6b7280',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  statusBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  bookingDetails: {
    marginBottom: '1.5rem'
  },
  detailRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
    gap: '1rem',
    marginBottom: '1rem'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  detailLabel: {
    fontSize: '0.8125rem',
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  detailValue: {
    fontSize: '1rem',
    color: '#1f2937',
    fontWeight: '600'
  },
  specialRequests: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'rgba(254, 243, 199, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(251, 191, 36, 0.3)'
  },
  requestsText: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.9375rem',
    color: '#92400e',
    lineHeight: '1.5'
  },
  bookingFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(156, 163, 175, 0.2)',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  bookingMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  bookingId: {
    fontSize: '0.875rem',
    color: '#1f2937',
    fontWeight: '600'
  },
  bookingDate: {
    fontSize: '0.8125rem',
    color: '#6b7280'
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    width: '100%'
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '2px solid rgba(156, 163, 175, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    minHeight: '44px',
    fontWeight: '600',
    color: '#374151',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  reviewBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    color: '#d97706',
    borderColor: '#fbbf24'
  },
  emptyState: {
    textAlign: 'center',
    padding: 'clamp(2rem, 6vw, 4rem) clamp(1rem, 4vw, 2rem)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  emptyTitle: {
    fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.75rem 0'
  },
  emptyText: {
    fontSize: 'clamp(0.92rem, 2vw, 1rem)',
    color: '#6b7280',
    margin: '0 0 2rem 0',
    lineHeight: '1.6'
  },
  browseBtn: {
    padding: '0.95rem 1.25rem',
    background: 'rgba(22, 163, 74, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    color: '#16a34a',
    border: '2px solid #16a34a',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    minHeight: '46px',
    width: 'min(100%, 260px)',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
    transition: 'all 0.3s ease'
  },
  receiptOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 'clamp(0.75rem, 3vw, 1rem)'
  },
  receiptModal: {
    backgroundColor: 'white',
    borderRadius: 'clamp(14px, 3vw, 20px)',
    maxWidth: 'min(900px, 100%)',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  },
  receiptClose: {
    position: 'sticky',
    top: 0,
    right: 0,
    padding: '1rem 1.5rem',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    zIndex: 10,
    width: '100%',
    textAlign: 'center',
    borderRadius: '20px 20px 0 0'
  },
  receiptContent: {
    padding: 0
  }
};

// Responsive styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @media (max-width: 1024px) {
      .content-wrapper { padding: 0 1rem !important; }
    }
    
    @media (max-width: 768px) {
      .hero-title { font-size: 2rem !important; }
      .hero-subtitle { font-size: 1rem !important; }
      .filter-container { gap: 0.5rem !important; }
      .filter-btn { padding: 0.625rem 1rem !important; font-size: 0.8125rem !important; }
      .booking-card { padding: 1.25rem !important; }
      .booking-header { flex-direction: column; gap: 1rem; }
      .hotel-name { font-size: 1.25rem !important; }
      .detail-row { grid-template-columns: repeat(2, 1fr) !important; }
      .booking-footer { flex-direction: column; align-items: flex-start !important; }
      .actions { width: 100%; justify-content: flex-start; }
    }
    
    @media (max-width: 480px) {
      .hero-section { padding: 2rem 1rem !important; }
      .hero-title { font-size: 1.75rem !important; }
      .filter-btn { padding: 0.5rem 0.875rem !important; font-size: 0.75rem !important; }
      .booking-card { padding: 1rem !important; }
      .hotel-name { font-size: 1.125rem !important; }
      .detail-row { grid-template-columns: 1fr !important; gap: 0.875rem !important; }
      .action-btn { width: 100%; justify-content: center; }
      .empty-icon { font-size: 3rem !important; }
      .empty-title { font-size: 1.25rem !important; }
    }
  `;
  if (!document.head.querySelector('style[data-bookings-responsive]')) {
    styleSheet.setAttribute('data-bookings-responsive', 'true');
    document.head.appendChild(styleSheet);
  }
}

