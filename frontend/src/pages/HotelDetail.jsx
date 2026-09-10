import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { fetchHotels, createHotelBooking, startPaymentCheckout, getApiBaseUrl } from '../api';
import * as api from '../api';
import axios from 'axios';
import LeafletMap from '../components/LeafletMap';
import Icons from '../components/Icons';
import HeroSlideshow from '../components/HeroSlideshow';
import RoomManagement from '../components/RoomManagement';

const API_BASE_URL = getApiBaseUrl() + '/api';

const DEFAULT_PAYMENT_METHOD_VALUES = ['card', 'gcash', 'grabpay', 'qrph', 'paypal', 'bank_transfer', 'pay_at_property'];

const getPaymentMethodOptions = (t) => [
  { value: 'card', label: t('payment_method_card') },
  { value: 'gcash', label: t('payment_provider_gcash') },
  { value: 'grabpay', label: t('payment_provider_grabpay') },
  { value: 'qrph', label: t('payment_provider_qrph') || 'QR Phone' },
  { value: 'paypal', label: t('payment_provider_paypal') },
  { value: 'bank_transfer', label: t('payment_provider_bank_transfer') },
  { value: 'pay_at_property', label: t('payment_method_pay_at_property') }
];

const DEFAULT_ALLOWED_PAYMENT_METHODS = DEFAULT_PAYMENT_METHOD_VALUES;

const toPhilippineLocalNumber = (value) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('63')) return digits.slice(2, 12);
  if (digits.startsWith('0')) return digits.slice(1, 11);
  return digits.slice(0, 10);
};

const toPhilippineE164 = (localNumber) => {
  const digits = String(localNumber || '').replace(/\D/g, '').slice(0, 10);
  return digits ? `+63${digits}` : '';
};

// Attempt to parse messy amenity input into a readable string/array
const tryParseMaybeJson = (input) => {
  let v = input;
  // Replace smart quotes with normal quotes
  if (typeof v === 'string') {
    v = v.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  }

  // Try iterative JSON.parse up to a few times
  for (let i = 0; i < 4; i++) {
    try {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        // quick check to avoid parsing plain words
        if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
          const parsed = JSON.parse(trimmed);
          v = parsed;
          continue;
        }
      }
      break;
    } catch (e) {
      // try to clean common escaping issues then retry
      if (typeof v === 'string') {
        // remove excessive backslashes
        v = v.replace(/\\+/g, '\\').replace(/\"/g, '"').replace(/\\'/g, "'");
        // replace weird commas inside quotes - leave for next parse
        continue;
      }
      break;
    }
  }
  return v;
};

const parseAmenitiesRaw = (raw) => {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) return raw;
  let v = raw;
  v = tryParseMaybeJson(v);

  // If parsing produced an object/array, normalize
  if (Array.isArray(v)) return v;
  if (typeof v === 'object' && v !== null) {
    // If object has values array-like, try to extract
    if (v.name) return [String(v.name)];
    try {
      return Object.values(v).map(x => (typeof x === 'string' ? x : JSON.stringify(x)));
    } catch (e) {
      return [JSON.stringify(v)];
    }
  }

  // If still a string, attempt to split by commas after cleaning
  if (typeof v === 'string') {
    // remove surrounding brackets/quotes
    const cleaned = v.replace(/^\[|\]$/g, '').replace(/^['"]+|['"]+$/g, '').trim();
    // split by comma if present
    if (cleaned.includes(',')) {
      return cleaned.split(',').map(s => s.replace(/["'\[\]]/g, '').trim()).filter(Boolean);
    }
    // fallback single item
    return cleaned ? [cleaned] : [];
  }

  return [];
};

// Clean up amenity strings for display; return null for garbage
const sanitizeAmenityString = (v) => {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (!s) return null;

  // Remove excessive backslashes and escaped quotes
  s = s.replace(/\\+/g, '\\').replace(/\"/g, '"').replace(/\\'/g, "'");
  // Remove control characters (fallback for environments without Unicode property escapes)
  s = s.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  // Remove surrounding brackets/quotes
  s = s.replace(/^\[|\]$/g, '').replace(/^['"]+|['"]+$/g, '').trim();

  // Collapse repeated punctuation
  s = s.replace(/([\W])\1{2,}/g, '$1');

  // If the string still contains suspicious JSON fragments, discard
  const suspicious = /\\\\|\{\s*\}|\[\s*\]|\"|\'\\|\:\s*\[|\]\s*\,/;
  if (s.match(suspicious) || s.length > 200) {
    // If it looks like a JSON fragment but may contain real words, try to extract words
    const words = s.match(/[A-Za-z0-9][A-Za-z0-9\s\-\/&+]+/);
    if (words && words.length) return words[0].trim();
    return null;
  }

  // Common false values
  if (/^null$/i.test(s) || /^undefined$/i.test(s)) return null;
  return s;
};

const formatAmenity = (a) => {
  try {
    const s = sanitizeAmenityString(a);
    return s || '';
  } catch (e) {
    return '';
  }
};

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLoggedIn, user } = useAuth();
  
  const [hotel, setHotel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [managingRoomsHotel, setManagingRoomsHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomImageIndex, setRoomImageIndex] = useState(0);
  const getErrorMessage = (value) => {
    if (!value) return t('booking_failed');
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value.error_description || value.error || JSON.stringify(value);
    }
    return String(value);
  };
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState({ average: 0, total: 0 });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewEligibilityReason, setReviewEligibilityReason] = useState('');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [checkoutState, setCheckoutState] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [contactMessage, setContactMessage] = useState('');
  
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    paymentMethod: 'card',
    payNow: true,
    cardLast4: '',
    specialRequests: '',
    customerName: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || '',
    customerEmail: user?.email || '',
    customerPhone: toPhilippineLocalNumber(user?.phone),
    selectedRoomId: null,        // NEW: Selected room type ID
    selectedRoomType: null       // NEW: Selected room type name
  });
  const [bookingError, setBookingError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState(null);

  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = '/placeholder-hotel.svg';
  };

  useEffect(() => {
    loadHotelData();
  }, [id]);

  useEffect(() => {
    if (!hotel) return;
    const allowed = Array.isArray(hotel.allowed_payment_methods) && hotel.allowed_payment_methods.length
      ? hotel.allowed_payment_methods
      : DEFAULT_ALLOWED_PAYMENT_METHODS;

    setBookingForm((prev) => {
      if (allowed.includes(prev.paymentMethod)) return prev;
      return { ...prev, paymentMethod: allowed[0] || 'pay_at_property' };
    });
  }, [hotel]);

  // Sync user phone number when user profile updates
  useEffect(() => {
    if (user?.phone) {
      setBookingForm(prev => ({
        ...prev,
        customerPhone: toPhilippineLocalNumber(user.phone)
      }));
    }
  }, [user?.phone]);

  const maxGuestsAllowed = 100;

  const loadHotelData = async () => {
    try {
      setLoading(true);
      const hotelsResponse = await fetchHotels();
      const foundHotel = (Array.isArray(hotelsResponse.data?.data) ? hotelsResponse.data.data : []).find(h => String(h.id) === String(id));
      
      if (!foundHotel) {
        navigate('/hotels');
        return;
      }
      
      setHotel(foundHotel);
      
      // Load reviews
      const reviewsResponse = await axios.get(`${API_BASE_URL}/hotels/${id}/reviews`);
      setReviews(reviewsResponse.data || []);

      // Load rooms
      try {
        const roomsResponse = await axios.get(`${API_BASE_URL}/hotels/${id}/rooms`);
        const rawRooms = roomsResponse.data || [];
        // Normalize amenities: backend may sometimes double-encode or store objects.
        const normalizedRooms = (rawRooms || []).map((r) => {
          const raw = parseAmenitiesRaw(r.amenities || r.amenities_raw || r.amenitiesJson);
          const amenities = (raw || []).map(sanitizeAmenityString).filter(Boolean);
          return { ...r, amenities };
        });

        console.log('Rooms loaded (normalized):', normalizedRooms);
        setRooms(normalizedRooms);
      } catch (error) {
        console.error('Could not load rooms:', error);
        setRooms([]);
      }
      
      // Load average rating
      const ratingResponse = await axios.get(`${API_BASE_URL}/hotels/${id}/average-rating`);
      setAverageRating(ratingResponse.data);
      
      // Check if user can review
      if (user?.user_id) {
        try {
          // Reviews are now managed through BookingHistory with per-booking tracking
          // This check is kept here but will indicate that reviews should be submitted from Booking History
          setCanReview(false);
          setReviewEligibilityReason('Reviews can be submitted from your Booking History after your stay completes');
        } catch (error) {
          console.warn('Could not check review eligibility:', error);
          setCanReview(false);
          setReviewEligibilityReason('Could not verify review eligibility');
        }
      } else {
        setCanReview(false);
      }
    } catch (error) {
      console.error('Error loading hotel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      setReviewMessage(t('please_write_comment'));
      return;
    }
    
    setSubmittingReview(true);
    setReviewMessage('');
    try {
      await axios.post(`${API_BASE_URL}/hotels/${id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        user_id: user?.user_id
      });
      
      setReviewMessage(t('review_submitted_success'));
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
      
      // Reload reviews
      setTimeout(() => {
        loadHotelData();
      }, 1000);
      
    } catch (error) {
      if (error.response?.data?.requiresBooking) {
        setReviewMessage(t('review_eligibility_message'));
      } else {
        setReviewMessage(error.response?.data?.message || t('review_submit_failed'));
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await axios.put(`${API_BASE_URL}/hotels/${id}/reviews/${reviewId}/helpful`);
      loadHotelData(); // Reload to update count
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  const formatCurrency = (value, currency) => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return `$0.00`;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(numValue);
    } catch {
      return `$0.00`;
    }
  };

  const roomsAvailable = Number(hotel?.rooms_available);
  const hasAvailability = Number.isFinite(roomsAvailable);
  
  // Check if hotel has room types defined
  const hasRoomTypes = rooms && rooms.length > 0;
  
  // Calculate total available rooms from room types if they exist
  const totalRoomTypeAvailability = hasRoomTypes 
    ? rooms.reduce((sum, room) => sum + (room.quantity_available || 0), 0)
    : 0;
  
  // Prefer the hotel-level availability so the detail page matches the listing.
  // Fall back to room-type totals only when the hotel record doesn't have a value.
  const primaryAvailability = hasAvailability ? roomsAvailable : totalRoomTypeAvailability;
  const isSoldOut = primaryAvailability <= 0;
  const roomTypeAvailabilityMismatch = hasRoomTypes && hasAvailability && totalRoomTypeAvailability !== roomsAvailable;
  const allowedPaymentMethods = Array.isArray(hotel?.allowed_payment_methods) && hotel.allowed_payment_methods.length
    ? hotel.allowed_payment_methods
    : DEFAULT_ALLOWED_PAYMENT_METHODS;
  const paymentMethodOptions = getPaymentMethodOptions(t).filter((option) => allowedPaymentMethods.includes(option.value));
  const suitableRoomTypesForGuests = rooms.filter((room) => {
    const capacity = Number(room.capacity || 0);
    const quantityAvailable = Number(room.quantity_available || 0);
    return capacity >= Number(bookingForm.guests || 1) && quantityAvailable > 0;
  });

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#ffc107' : '#ddd', fontSize: '1.2rem' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    if (!contactForm.message.trim()) {
      setContactMessage('Please enter a message');
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/messages/contact-owner`, {
        hotel_id: hotel.id,
        subject: contactForm.subject || 'Hotel Inquiry',
        message: contactForm.message
      }, {
        withCredentials: true
      });
      
      setContactMessage('Message sent successfully!');
      setContactForm({ subject: '', message: '' });
      setTimeout(() => {
        setShowContactModal(false);
        setContactMessage('');
      }, 2000);
    } catch (error) {
      setContactMessage(error.response?.data?.error || t('failed_to_send_message') || 'Failed to send message');
    }
  };

  const handleBookNow = () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=${encodeURIComponent(`/hotels/${id}`)}`);
      return;
    }
    setBookingError('');
    setShowBookingModal(true);
  };

  const handleSubmitBooking = async () => {
    if (!hotel) return;

    if (!isLoggedIn) {
      setBookingError('Authentication required. Please log in again.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!bookingForm.checkIn || !bookingForm.checkOut) {
      setBookingError('Please select check-in and check-out dates.');
      return;
    }

    const nights = Math.ceil(
      (new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24)
    );

    if (nights <= 0) {
      setBookingError('Check-out must be after check-in.');
      return;
    }

    if (!/^\d{10}$/.test(bookingForm.customerPhone || '')) {
      setBookingError('Please enter a valid 10-digit phone number after +63.');
      return;
    }

    // Require room type selection if available
    if (hasRoomTypes && !bookingForm.selectedRoomId) {
      setBookingError('Please select a room type before confirming the booking.');
      return;
    }

    // Validate room selection and capacity if a room is selected
    if (bookingForm.selectedRoomId && rooms.length > 0) {
      const selectedRoom = rooms.find(r => r.room_id === bookingForm.selectedRoomId);
      if (selectedRoom) {
        // Check 1: Room capacity must fit guests
        if (selectedRoom.capacity < bookingForm.guests) {
          setBookingError(
            `This room type can only accommodate ${selectedRoom.capacity} guest(s), but you have ${bookingForm.guests} guests. Please select a larger room or reduce guests.`
          );
          return;
        }

        // Check 2: Must have enough quantity available
        if (selectedRoom.quantity_available < bookingForm.rooms) {
          setBookingError(
            `Only ${selectedRoom.quantity_available} unit(s) of "${selectedRoom.room_type_name}" available, but you requested ${bookingForm.rooms}. Please reduce the number of rooms.`
          );
          return;
        }
      }
    }

    if (!navigator.onLine) {
      setBookingError(t('no_internet_connection'));
      return;
    }

    setIsSubmitting(true);
    setBookingError('');
    setCheckoutState(null);
    setSlowConnection(false);
    setPendingBookingId(null);

    try {
      const isExternalCheckout = ['paypal', 'gcash', 'grabpay', 'qrph', 'card'].includes(bookingForm.paymentMethod);

      // Get the price from the selected room
      const selectedRoomData = rooms.find(r => r.room_id === bookingForm.selectedRoomId);
      const pricePerNight = selectedRoomData ? selectedRoomData.price_per_night : hotel.pricePerNight;

      const payload = {
        hotel_id: hotel.id,
        hotel_name: hotel.name,
        hotel_location: hotel.location,
        price_per_night: pricePerNight,
        currency: hotel.currency,
        check_in: bookingForm.checkIn,
        check_out: bookingForm.checkOut,
        guests: bookingForm.guests,
        rooms: bookingForm.rooms,
        special_requests: bookingForm.specialRequests,
        payment_method: bookingForm.paymentMethod,
        pay_now: false,
        customer_name: bookingForm.customerName,
        customer_email: bookingForm.customerEmail,
        customer_phone: toPhilippineE164(bookingForm.customerPhone),
        card_last4: bookingForm.paymentMethod === 'card' ? bookingForm.cardLast4.trim() : null,
        room_id: bookingForm.selectedRoomId,           // NEW: Room selection (optional)
        room_type_name: bookingForm.selectedRoomType   // NEW: Room type name (optional)
      };

      const bookingResponse = await createHotelBooking(payload);

      if (bookingResponse.status === 401) {
        setBookingError('Please log in to make a booking. You can create an account or sign in to continue.');
        return;
      }

      if (bookingResponse.status >= 400) {
        setBookingError(bookingResponse.data?.error || 'Failed to create booking.');
        return;
      }

      const bookingId = bookingResponse.data?.booking?.booking_id;
      if (!bookingId) {
        setBookingError('Failed to create booking.');
        return;
      }

      // Save booking ID so the user can navigate to My Bookings if checkout fails
      setPendingBookingId(bookingId);

      if (isExternalCheckout) {
        const totalAmount = Number((pricePerNight * nights * bookingForm.rooms).toFixed(2));

        // Show a slow-network warning after 7 s if the checkout API hasn't responded yet
        const slowTimer = setTimeout(() => setSlowConnection(true), 7000);

        try {
          // Abort if the payment gateway takes longer than 30 s
          const checkoutResponse = await Promise.race([
            startPaymentCheckout({
              booking_id: bookingId,
              payment_method: bookingForm.paymentMethod,
              amount: totalAmount,
              currency: hotel.currency,
              customer_email: bookingForm.customerEmail,
              customer_phone: toPhilippineE164(bookingForm.customerPhone)
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('CHECKOUT_TIMEOUT')), 30000)
            )
          ]);

          clearTimeout(slowTimer);
          setSlowConnection(false);

          if (checkoutResponse.status >= 400) {
            setBookingError(
              checkoutResponse.data?.error ||
              t('booking_saved_payment_setup_failed').replace('{id}', String(bookingId))
            );
            return;
          }

          const checkoutUrl = checkoutResponse.data?.checkout_url;
          if (!checkoutUrl) {
            setBookingError(
              t('booking_saved_checkout_url_unavailable').replace('{id}', String(bookingId))
            );
            return;
          }

          // Persist URL so the user can resume if the browser redirect stalls
          const methodKey = bookingForm.paymentMethod;
          sessionStorage.setItem(`pendingCheckout_${bookingId}`, checkoutUrl);
          sessionStorage.setItem(`pendingCheckoutMethod_${bookingId}`, methodKey);

          // Render the fallback button immediately, then trigger the redirect
          setCheckoutState({ url: checkoutUrl, method: methodKey });
          setTimeout(() => { window.location.href = checkoutUrl; }, 400);
          return;
        } catch (checkoutErr) {
          clearTimeout(slowTimer);
          setSlowConnection(false);
          const savedMsg = t('booking_saved_notification').replace('{id}', String(bookingId));
          if (checkoutErr.message === 'CHECKOUT_TIMEOUT') {
            setBookingError(t('connection_timed_out_checkout') + ' ' + savedMsg);
          } else {
            setBookingError(checkoutErr.response?.data?.error || savedMsg);
          }
          return;
        }
      }

      setShowBookingModal(false);
      navigate(`/bookings`);
    } catch (error) {
      setBookingError(error.response?.data?.error || t('booking_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('loading_hotel_details')}</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>{t('Hotels')} not found</p>
          <Link to="/hotels" style={backLink}>{t('back_to_hotels')}</Link>
        </div>
      </div>
    );
  }

  // Precompute sanitized amenities for hotel and selected room
  const sanitizedHotelAmenities = Array.isArray(hotel.amenities)
    ? hotel.amenities.map(sanitizeAmenityString).filter(Boolean)
    : [];

  const sanitizedSelectedRoomAmenities = selectedRoom && Array.isArray(selectedRoom.amenities)
    ? selectedRoom.amenities.map(sanitizeAmenityString).filter(Boolean)
    : [];

  return (
    <div style={pageStyle}>
      {/* Hero Header */}
      <HeroSlideshow 
        title={hotel.name}
        subtitle={hotel.location}
        height="400px"
        showControls={false}
      />

      {/* Back to Hotels Button */}
      <div style={breadcrumbContainer}>
        <Link to="/hotels" style={breadcrumbLink}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          {t('back_to_hotels')}
        </Link>
      </div>

      {/* Rating Section */}
      <div style={ratingContainer}>
        <div style={ratingSection}>
          <div style={starsContainer}>{renderStars(Math.round(parseFloat(averageRating.average)))}</div>
          <span style={ratingText}>
            {parseFloat(averageRating.average).toFixed(1)} ({averageRating.total} {t('reviews') || 'reviews'})
          </span>
        </div>
      </div>

      <div style={contentGrid}>
        {/* Left Column */}
        <div style={leftColumn}>
          {/* Hotel Image */}
          <div style={imageContainer}>
            <img
              src={hotel.image || '/placeholder-hotel.svg'}
              alt={hotel.name}
              style={hotelImage}
              onError={handleImageError}
            />
          </div>
          {Array.isArray(hotel.images) && hotel.images.length > 0 && (
            <div style={galleryGrid}>
              {hotel.images.map((url, index) => (
                <img
                  key={`${url}-${index}`}
                  src={url}
                  alt={`${hotel.name} ${index + 1}`}
                  style={galleryImage}
                  onError={handleImageError}
                />
              ))}
            </div>
          )}

          {/* About Section */}
          <div style={sectionCard}>
            <h2 style={sectionTitle}>About {t('about_hotel_fallback')}</h2>
            <p style={descriptionText}>{hotel.description}</p>
          </div>

          {/* Room Types Section - Enhanced Interactive */}
          {rooms && rooms.length > 0 && (
            <div style={{
              ...sectionCard,
              background: '#ffffff',
              border: '2px solid #c8e6c9',
              borderRadius: '14px'
            }}>
              <h2 style={{
                ...sectionTitle,
                margin: 0,
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                Room Types ({rooms.length})
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {rooms.map((room) => (
                  <div 
                    key={room.room_id} 
                    onClick={() => setSelectedRoom(room)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #d0d0d0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(46, 125, 50, 0.15)';
                      e.currentTarget.style.borderColor = '#a5d6a7';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                      e.currentTarget.style.borderColor = '#d0d0d0';
                    }}
                  >
                    {/* Room Image */}
                    <div style={{
                      position: 'relative',
                      background: '#f0fdf4',
                      height: '160px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {room.primary_image_url ? (
                        <img 
                          src={room.primary_image_url} 
                          alt={room.room_type_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s'
                          }}
                          onError={handleImageError}
                          onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.08)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '3rem' }}>■</div>
                      )}
                      {!room.is_active && (
                        <div style={{
                          position: 'absolute',
                          top: '0.75rem',
                          right: '0.75rem',
                          background: '#EF5350',
                          color: 'white',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {t('room_unavailable_badge')}
                        </div>
                      )}
                    </div>

                    {/* Room Details */}
                    <div style={{ padding: '1.25rem' }}>
                      {/* Room Name & Description */}
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#1B5E20'
                      }}>
                        {room.room_type_name}
                      </h3>
                      {room.description && (
                        <p style={{
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.85rem',
                          color: '#666',
                          lineHeight: 1.5,
                          maxHeight: '2.5em',
                          overflow: 'hidden'
                        }}>
                          {room.description}
                        </p>
                      )}

                      {/* Features Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        padding: '0.75rem 0',
                        borderTop: '1px solid #e0e0e0',
                        borderBottom: '1px solid #e0e0e0',
                        marginBottom: '0.75rem',
                        fontSize: '0.9rem'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#424242', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            👥 Capacity
                          </div>
                          <div style={{ color: '#2E7D32', fontWeight: 700, fontSize: '0.95rem' }}>
                            {room.capacity} {room.capacity === 1 ? t('person') : t('people')}
                          </div>
                        </div>
                        {room.room_size_sqm && (
                          <div>
                            <div style={{ fontWeight: 600, color: '#424242', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              📐 Size
                            </div>
                            <div style={{ color: '#2E7D32', fontWeight: 700, fontSize: '0.95rem' }}>
                              {room.room_size_sqm} m²
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Amenities */}
                      {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                        <div style={{
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#999',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                          }}>
                            Amenities
                          </div>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.35rem'
                          }}>
                            {room.amenities.slice(0, 3).map((amenity, i) => (
                              <span key={i} style={{
                                background: '#f0fdf4',
                                color: '#2E7D32',
                                padding: '0.3rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                border: '1px solid #c8e6c9'
                              }}>
                                {formatAmenity(amenity)}
                              </span>
                            ))}
                            {room.amenities.length > 3 && (
                              <span style={{
                                padding: '0.3rem 0.6rem',
                                fontSize: '0.8rem',
                                color: '#2E7D32',
                                fontWeight: 700
                              }}>
                                +{room.amenities.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price Section */}
                      <div style={{
                        background: '#f0fdf4',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        borderTop: '1px solid #e0e0e0',
                        marginTop: '0.75rem'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '0.3rem'
                        }}>
                          {t('price_per_night')}
                        </div>
                        <div style={{
                          fontSize: '1.3rem',
                          fontWeight: 700,
                          color: '#2E7D32'
                        }}>
                          ₱{parseFloat(room.price_per_night).toLocaleString()}
                        </div>
                      </div>

                      {/* Availability Badge */}
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem',
                        background: room.quantity_available > 0 ? '#c8e6c9' : '#ffcdd2',
                        color: room.quantity_available > 0 ? '#1B5E20' : '#c62828',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        {room.quantity_available > 0 
                          ? t('availability_rooms_pattern').replace('{count}', String(room.quantity_available))
                          : t('room_currently_unavailable')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div style={sectionCard}>
            <h2 style={sectionTitle}>{t('section_amenities')}</h2>
            <div style={amenitiesGrid}>
                {sanitizedHotelAmenities.length > 0 ? sanitizedHotelAmenities.map((amenity, index) => (
                  <div key={index} style={amenityItem}>
                    {amenity}
                  </div>
                )) : (
                  <div style={{ color: '#6b7280', fontStyle: 'italic' }}>{t('no_amenities_listed') || 'No amenities listed'}</div>
                )}
            </div>
          </div>

          {/* Map */}
          {hotel.latitude && hotel.longitude && (
            <div style={sectionCard}>
              <h2 style={sectionTitle}>{t('section_location')}</h2>
              <div style={mapContainer}>
                <LeafletMap
                  center={[parseFloat(hotel.latitude), parseFloat(hotel.longitude)]}
                  zoom={16}
                  markers={[{
                    lat: parseFloat(hotel.latitude),
                    lng: parseFloat(hotel.longitude),
                    popup: `<div style="text-align:center;"><strong>${hotel.name}</strong><br/><em>${hotel.location}</em></div>`
                  }]}
                  style={mapStyle}
                />
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div style={sectionCard}>
            <div style={reviewsHeader}>
              <h2 style={sectionTitle}>{t('section_guest_reviews')} ({reviews.length})</h2>
              {isLoggedIn && canReview && (
                <button 
                  style={writeReviewBtn} 
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  {showReviewForm ? t('cancel_button') : t('write_review_button')}
                </button>
              )}
            </div>

            {isLoggedIn && !canReview && (
              <div style={{
                padding: '20px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                marginBottom: '20px',
                color: '#856404'
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {reviewEligibilityReason || 'You must complete a stay at this hotel before writing a review. Book now to share your experience!'}
                </p>
              </div>
            )}

            {showReviewForm && (
              <form onSubmit={handleSubmitReview} style={{
                background: '#ffffff',
                border: '1.5px solid #e8e8e8',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#1B5E20'
                }}>
                  {t('write_your_review')}
                </h3>

                {/* Rating Section */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#1B5E20',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {t('your_rating')}
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '2rem',
                          color: star <= reviewForm.rating ? '#ffc107' : '#ddd',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          transform: star <= reviewForm.rating ? 'scale(1.2)' : 'scale(1)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.3)';
                          e.currentTarget.style.color = '#ffc107';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = star <= reviewForm.rating ? 'scale(1.2)' : 'scale(1)';
                          e.currentTarget.style.color = star <= reviewForm.rating ? '#ffc107' : '#ddd';
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#1B5E20',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {t('your_review')}
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      border: '1.5px solid #d0d0d0',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2E7D32';
                      e.target.style.boxShadow = '0 0 0 3px rgba(46, 125, 50, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d0d0d0';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder={t('share_experience_placeholder')}
                  />
                </div>

                {reviewMessage && (
                  <div style={{
                    padding: '1rem',
                    background: reviewMessage.includes('success') ? '#e8f5e9' : '#ffebee',
                    border: `1.5px solid ${reviewMessage.includes('success') ? '#4caf50' : '#ef5350'}`,
                    borderRadius: '10px',
                    color: reviewMessage.includes('success') ? '#2e7d32' : '#c62828',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    marginBottom: '1rem'
                  }}>
                    {reviewMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submittingReview}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.5rem',
                    background: submittingReview ? '#ccc' : '#2E7D32',
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: submittingReview ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseOver={(e) => {
                    if (!submittingReview) {
                      e.currentTarget.style.background = '#1B5E20';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 125, 50, 0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!submittingReview) {
                      e.currentTarget.style.background = '#2E7D32';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {submittingReview ? t('submitting_review') : t('submit_review')}
                </button>
              </form>
            )}

            <div style={reviewsList}>
              {reviews.length === 0 ? (
                <p style={noReviewsText}>{t('no_reviews_yet')}</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.review_id} style={reviewCard}>
                    <div style={reviewHeader}>
                      <div>
                        <div style={reviewAuthor}>
                          {review.first_name || review.username || t('anonymous_user')}
                        </div>
                        <div style={reviewDate}>
                          {new Date(review.review_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={reviewRating}>{renderStars(review.rating)}</div>
                    </div>
                    <p style={reviewComment}>{review.comment}</p>
                    {/* NEW: Display room type if available */}
                    {review.room_type_name && (
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.75rem', fontWeight: 600 }}>
                        🛏️ {review.room_type_name}
                      </p>
                    )}
                    {review.owner_reply && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#f1f8f4',
                        borderRadius: '8px',
                        borderLeft: '3px solid #2e7d32'
                      }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2e7d32', marginBottom: '0.5rem' }}>
                          {t('owner_reply_label')}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#2d3748' }}>
                          {review.owner_reply}
                        </div>
                      </div>
                    )}
                    <div style={reviewFooter}>
                      <button 
                        style={helpfulBtn}
                        onClick={() => handleMarkHelpful(review.review_id)}
                      >
                        👍 Helpful ({review.helpful_count || 0})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Booking Card */}
        <div style={rightColumn}>
          <div style={bookingCard}>
            {/* Room Price Display - Only show if room selected or price range */}
            {bookingForm.selectedRoomId && rooms.length > 0 ? (
              <div style={priceSection}>
                <div style={priceLabel}>Price per night</div>
                <div style={priceAmount}>
                  ₱{parseFloat(rooms.find(r => r.room_id === bookingForm.selectedRoomId)?.price_per_night || 0).toLocaleString()}
                </div>
              </div>
            ) : rooms.length > 0 ? (
              <div style={priceSection}>
                <div style={priceLabel}>Price Range</div>
                <div style={priceAmount}>
                  ₱{parseFloat(Math.min(...rooms.map(r => r.price_per_night))).toLocaleString()} - ₱{parseFloat(Math.max(...rooms.map(r => r.price_per_night))).toLocaleString()}
                </div>
                <small style={{ color: '#718096', fontSize: '0.8rem', marginTop: '0.25rem' }}>{t('select_room_for_exact_price')}</small>
              </div>
            ) : null}

            <div style={availabilityBanner}>
              {hasAvailability || hasRoomTypes
                ? primaryAvailability > 0
                  ? t('availability_rooms_pattern').replace('{count}', String(primaryAvailability))
                  : t('button_sold_out')
                : t('availability_na')}
              {roomTypeAvailabilityMismatch && (
                <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#718096' }}>
                  {totalRoomTypeAvailability} total across room types
                </div>
              )}
            </div>
            
            <div style={contactSection}>
              <div style={contactItem}>
                <Icons.Phone size={18} />
                <span>{hotel.phone || t('contact_not_available')}</span>
              </div>
              <div style={contactItem}>
                <Icons.Email size={18} />
                <span>{hotel.email || t('contact_not_available')}</span>
              </div>
            </div>

            <button style={bookNowButton} onClick={handleBookNow} disabled={isSoldOut}>
              <Icons.Booking size={20} />
              {isSoldOut ? t('button_sold_out') : isLoggedIn ? t('book_now') : t('login_to_book')}
            </button>

            <button style={contactButton} onClick={() => isLoggedIn ? setShowContactModal(true) : navigate('/login')}>
              <Icons.Chat size={18} />
              {t('button_contact_owner')}
            </button>

            <div style={infoText}>
              <span>{t('booking_benefit_free_cancellation')}</span>
              <span>{t('booking_benefit_no_fees')}</span>
              <span>{t('booking_benefit_instant_confirmation')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div style={modalBackdrop}>
          <div style={modalCard}>
            {/* Modal Header */}
            <div style={modalHeader}>
              <div>
                <h2 style={modalTitle}>Book {hotel.name}</h2>
                <p style={modalSubtitle}>{hotel.location}</p>
              </div>
              <button style={modalClose} onClick={() => {
                setShowBookingModal(false);
                setBookingError('');
              }}><Icons.X size={18} /></button>
            </div>

            <div style={modalBody}>
              <div style={sectionDivider}>
                <h3 style={sectionHeading}><Icons.Calendar size={17} /> {t('modal_stay_details')}</h3>
              </div>
              <div style={modalGrid}>
                  <div>
                  <label style={inputLabel}><Icons.Calendar size={16} /> {t('form_check_in')}</label>
                  <input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => {
                      setBookingForm({ ...bookingForm, checkIn: e.target.value });
                      setBookingError('');
                    }}
                    style={inputFieldEnhanced}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label style={inputLabel}><Icons.Calendar size={16} /> {t('form_check_out')}</label>
                  <input
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => {
                      setBookingForm({ ...bookingForm, checkOut: e.target.value });
                      setBookingError('');
                    }}
                    style={inputFieldEnhanced}
                    min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label style={inputLabel}><Icons.User size={16} /> {t('form_guests')}</label>
                  <input
                    type="number"
                    min="1"
                    max={maxGuestsAllowed}
                    value={bookingForm.guests}
                    onChange={(e) => {
                      const value = Math.min(maxGuestsAllowed, Math.max(1, Number(e.target.value)));
                      const matchingRoom = suitableRoomTypesForGuests.find((room) => Number(room.capacity || 0) >= value) || null;
                      setBookingForm({ 
                        ...bookingForm, 
                        guests: value,
                        selectedRoomId: matchingRoom ? Number(matchingRoom.room_id) : null,
                        selectedRoomType: matchingRoom ? matchingRoom.room_type_name : null,
                        rooms: matchingRoom ? Math.min(bookingForm.rooms || 1, Number(matchingRoom.quantity_available || 1)) : 1
                      });
                      setBookingError('');
                    }}
                    style={inputFieldEnhanced}
                  />
                </div>
                <div>
                  <label style={inputLabel}>
                    <Icons.Booking size={16} /> {t('form_rooms')}
                    <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                      {(() => {
                        const sel = rooms.find(r => String(r.room_id) === String(bookingForm.selectedRoomId));
                        const maxAllowed = sel ? (sel.quantity_available || primaryAvailability) : primaryAvailability;
                        return ` (max ${maxAllowed || 0})`;
                      })()}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    // Limit rooms to selected room type availability or overall availability
                    max={(() => {
                      const sel = rooms.find(r => String(r.room_id) === String(bookingForm.selectedRoomId));
                      return sel ? (sel.quantity_available || primaryAvailability) : primaryAvailability;
                    })()}
                    value={bookingForm.rooms}
                    onChange={(e) => {
                      const raw = Number(e.target.value) || 0;
                      const sel = rooms.find(r => String(r.room_id) === String(bookingForm.selectedRoomId));
                      const maxAllowed = sel ? (sel.quantity_available || primaryAvailability) : primaryAvailability;
                      const value = Math.max(1, Math.min(maxAllowed, raw));
                      setBookingForm({ ...bookingForm, rooms: value });
                      setBookingError('');
                    }}
                    style={inputFieldEnhanced}
                  />
                </div>
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={inputLabel}><Icons.Booking size={16} /> Select Room Type</label>
                  <select
                    value={bookingForm.selectedRoomId || ''}
                    onChange={(e) => {
                      const selectedRoom = rooms.find(r => String(r.room_id) === String(e.target.value));
                      const maxAllowed = selectedRoom ? (selectedRoom.quantity_available || primaryAvailability) : primaryAvailability;
                      setBookingForm({ 
                        ...bookingForm, 
                        selectedRoomId: e.target.value ? Number(e.target.value) : null,
                        selectedRoomType: selectedRoom ? selectedRoom.room_type_name : null,
                        rooms: Math.min(bookingForm.rooms || 1, Math.max(1, maxAllowed))
                      });
                      setBookingError('');
                    }}
                    style={inputFieldEnhanced}
                  >
                    <option value="">{t('choose_room_type')}</option>
                    {suitableRoomTypesForGuests.length > 0 ? suitableRoomTypesForGuests.map((room) => {
                      const quantityOk = room.quantity_available >= bookingForm.rooms;
                      const warningText = !quantityOk 
                        ? ` [Only ${room.quantity_available} available, need ${bookingForm.rooms}]`
                        : '';
                      
                      return (
                        <option 
                          key={room.room_id} 
                          value={room.room_id}
                          disabled={!quantityOk}
                          style={{ opacity: quantityOk ? 1 : 0.5 }}
                        >
                          {room.room_type_name} (₱{parseFloat(room.price_per_night).toLocaleString()}/night, exact for {room.capacity} guest{room.capacity > 1 ? 's' : ''}, {room.quantity_available} avail){warningText}
                        </option>
                      );
                    }) : (
                      <option value="" disabled>{`No room types available for ${bookingForm.guests} guest(s)`}</option>
                    )}
                  </select>
                </div>
              </div>

              <div style={sectionDivider}>
                <h3 style={sectionHeading}><Icons.User size={17} /> {t('modal_guest_information')}</h3>
              </div>
              <div style={modalGrid}>
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={inputLabel}><Icons.User size={16} /> {t('form_full_name')}</label>
                  <input
                    type="text"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    style={inputFieldEnhanced}
                    placeholder={t('placeholder_full_name')}
                  />
                </div>
                <div>
                  <label style={inputLabel}><Icons.Email size={16} /> {t('form_email')}</label>
                  <input
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                    style={inputFieldEnhanced}
                    placeholder={t('placeholder_email')}
                  />
                </div>
                <div>
                  <label style={inputLabel}><Icons.Phone size={16} /> {t('form_phone')}</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      value="+63"
                      readOnly
                      style={{
                        ...inputFieldEnhanced,
                        width: '72px',
                        textAlign: 'center',
                        background: '#f9fafb',
                        color: '#374151',
                        cursor: 'default'
                      }}
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength="10"
                      value={bookingForm.customerPhone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setBookingForm({ ...bookingForm, customerPhone: digitsOnly });
                        setBookingError('');
                      }}
                      style={inputFieldEnhanced}
                      placeholder="9XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <div style={sectionDivider}>
                <h3 style={sectionHeading}><Icons.Money size={17} /> {t('modal_payment_details')}</h3>
              </div>
              <div style={modalGrid}>
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={inputLabel}>{t('form_payment_method')}</label>
                  <select
                    value={bookingForm.paymentMethod}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                    style={inputFieldEnhanced}
                  >
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {bookingForm.paymentMethod === 'card' && (
                <div>
                  <label style={inputLabel}><Icons.Shield size={16} /> {t('form_card_last_4')}</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={bookingForm.cardLast4}
                    onChange={(e) => setBookingForm({ ...bookingForm, cardLast4: e.target.value.replace(/\D/g, '') })}
                    style={inputFieldEnhanced}
                    placeholder={t('placeholder_card_last_4')}
                  />
                  <div style={secureNote}><Icons.Shield size={13} /> {t('form_secure_note')}</div>
                </div>
              )}

              <div style={sectionDivider}>
                <h3 style={sectionHeading}><Icons.Document size={17} /> {t('modal_additional_info')}</h3>
              </div>
              <div>
                <label style={inputLabel}>{t('form_special_requests')}</label>
                <textarea
                  rows="4"
                  value={bookingForm.specialRequests}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                  style={textareaFieldEnhanced}
                  placeholder={t('placeholder_special_requests')}
                />
              </div>

              {slowConnection && !checkoutState && (
                <div style={{
                  background: '#fef3cd',
                  border: '1.5px solid #ffc107',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                  color: '#856404',
                  fontWeight: 500
                }}>
                  Slow connection detected. Please wait while we process your booking...
                </div>
              )}

              {checkoutState && (
                <div style={{
                  background: '#e3f2fd',
                  border: '1.5px solid #2196F3',
                  borderRadius: '10px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong style={{ color: '#1565c0', fontSize: '0.95rem' }}>Payment Window Opening</strong>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#1565c0', fontSize: '0.9rem' }}>
                      If the payment window doesn't open automatically, click the button below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(checkoutState.url, '_blank', 'noopener,noreferrer')}
                    style={{
                      background: '#2196F3',
                      border: 'none',
                      color: 'white',
                      padding: '0.75rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#1976D2';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#2196F3';
                    }}
                  >
                    {t('open_payment')}
                  </button>
                </div>
              )}

              {bookingError && (
                <div style={errorBanner}>
                  <div style={{display:'flex',alignItems:'center',gap:'0.5rem', lineHeight: 1.25}}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {getErrorMessage(bookingError)}
                  </div>
                  {pendingBookingId && (
                    <button
                      type="button"
                      style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: '#1d4ed8', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.88rem', padding: 0 }}
                      onClick={() => { setShowBookingModal(false); navigate('/bookings'); }}
                    >
                      {t('go_to_bookings_cta')}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={modalFooter}>
              <button style={cancelBtnEnhanced} onClick={() => setShowBookingModal(false)}>
                <span style={{display:'flex',alignItems:'center',gap:'0.5rem', lineHeight: 1.2}}><Icons.X size={15} /> {t('cancel_button')}</span>
              </button>
              <button
                style={isSubmitting ? confirmBtnDisabled : confirmBtnEnhanced}
                onClick={handleSubmitBooking}
                disabled={isSubmitting || !!checkoutState}
              >
                {slowConnection ? (
                  <span style={{display:'flex',alignItems:'center',gap:'0.5rem', lineHeight: 1.2}}><Icons.Clock size={15} /> {t('button_connecting_slow')}</span>
                ) : isSubmitting ? (
                  <span style={{display:'flex',alignItems:'center',gap:'0.5rem', lineHeight: 1.2}}><Icons.Clock size={15} /> {t('processing')}</span>
                ) : (
                  <span style={{display:'flex',alignItems:'center',gap:'0.5rem', lineHeight: 1.2}}><Icons.Check size={15} /> {t('confirm_booking')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Owner Modal */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '550px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#2E7D32',
              color: 'white',
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 'none',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem', 
                  fontWeight: 800,
                  letterSpacing: '-0.5px'
                }}>
                  {t('modal_contact_title')}
                </h2>
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  opacity: 0.9
                }}>
                  {t('get_in_touch_owner')}
                </p>
              </div>
              <button 
                onClick={() => setShowContactModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitContact} style={{ padding: '2.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#1B5E20',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    border: '1.5px solid #d0d0d0',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2E7D32';
                    e.target.style.boxShadow = '0 0 0 3px rgba(46, 125, 50, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d0d0d0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder={t('contact_owner_subject_placeholder')}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#1B5E20',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Message
                </label>
                <textarea
                  rows="6"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    border: '1.5px solid #d0d0d0',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2E7D32';
                    e.target.style.boxShadow = '0 0 0 3px rgba(46, 125, 50, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d0d0d0';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder={t('contact_owner_message_placeholder')}
                  required
                />
              </div>

              {contactMessage && (
                <div style={{
                  padding: '1rem',
                  background: contactMessage.includes('success') ? '#e8f5e9' : '#ffebee',
                  border: `1.5px solid ${contactMessage.includes('success') ? '#4caf50' : '#ef5350'}`,
                  borderRadius: '10px',
                  color: contactMessage.includes('success') ? '#2e7d32' : '#c62828',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  marginBottom: '1.5rem'
                }}>
                  {contactMessage}
                </div>
              )}

              {/* Footer Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end'
              }}>
                <button 
                  type="button" 
                  onClick={() => setShowContactModal(false)}
                  style={{
                    padding: '0.85rem 1.5rem',
                    background: 'transparent',
                    border: '1.5px solid #d0d0d0',
                    color: '#666',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#999';
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#d0d0d0';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {t('cancel_button')}
                </button>
                <button 
                  type="submit"
                  style={{
                    padding: '0.85rem 1.5rem',
                    background: '#2E7D32',
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#1B5E20';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 125, 50, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#2E7D32';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {t('send_message')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header - Image Carousel */}
            <div style={{
              position: 'relative',
              height: '320px',
              background: '#f5f5f5',
              overflow: 'hidden'
            }}>
              {/* Image Display */}
              {selectedRoom.primary_image_url ? (
                <img 
                  src={selectedRoom.primary_image_url}
                  alt={selectedRoom.room_type_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={handleImageError}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  color: 'rgba(255,255,255,0.2)'
                }}>
                  ■
                </div>
              )}

              {/* Previous Button */}
              <button
                onClick={() => setRoomImageIndex(Math.max(0, roomImageIndex - 1))}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  cursor: roomImageIndex === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                  opacity: roomImageIndex === 0 ? 0.3 : 0.8
                }}
                onMouseOver={(e) => {
                  if (roomImageIndex > 0) {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                }}
              >
                ‹
              </button>

              {/* Next Button */}
              <button
                onClick={() => setRoomImageIndex(Math.min(0, roomImageIndex + 1))}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  cursor: 'not-allowed',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s',
                  opacity: 0.3
                }}
              >
                ›
              </button>

              {/* Image Counter */}
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '24px',
                fontSize: '0.85rem',
                fontWeight: 700,
                backdropFilter: 'blur(10px)'
              }}>
                Gallery (1 / 1)
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setRoomImageIndex(0);
                }}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  color: '#1B5E20',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
              
              {/* Status Badge */}
              {!selectedRoom.is_active && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  background: '#EF5350',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '24px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  Unavailable
                </div>
              )}

              {/* Instant Confirmation Badge */}
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(46, 125, 50, 0.9) 100%)',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '24px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>✓ Instant</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Confirmation</div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2.5rem' }}>
              {/* Room Name */}
              <h2 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#1B5E20',
                letterSpacing: '-0.5px'
              }}>
                {selectedRoom.room_type_name}
              </h2>

              {/* Description */}
              {selectedRoom.description && (
                <p style={{
                  margin: '0 0 1.5rem 0',
                  color: '#666',
                  fontSize: '0.95rem',
                  lineHeight: 1.8,
                  fontWeight: 500
                }}>
                  {selectedRoom.description}
                </p>
              )}

              {/* Quick Features Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.7rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#e8f5e9',
                  padding: '0.6rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#2e7d32'
                }}>
                  <span>✓</span> {t('booking_benefit_free_cancellation')}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#e8f5e9',
                  padding: '0.6rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#2e7d32'
                }}>
                  <span>⚡</span> {t('instant_booking')}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: '#fff3e0',
                  padding: '0.6rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#f57c00'
                }}>
                  <span>★</span> {t('best_value')}
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: '#e8e8e8',
                marginBottom: '1.5rem'
              }}></div>

              {/* Details Grid - 3 Columns */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '0.75rem'
                  }}>
                    Guest Capacity
                  </span>
                  <span style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: '#2E7D32'
                  }}>
                    {selectedRoom.capacity}
                  </span>
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#999',
                    marginTop: '0.25rem'
                  }}>
                    {selectedRoom.capacity === 1 ? 'person' : 'people'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '0.75rem'
                  }}>
                    Bed Type
                  </span>
                  <span style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: '#2E7D32'
                  }}>
                    King
                  </span>
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#999',
                    marginTop: '0.25rem'
                  }}>
                    bed(s)
                  </span>
                </div>

                {selectedRoom.room_size_sqm && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#999',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '0.75rem'
                    }}>
                      Room Size
                    </span>
                    <span style={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: '#2E7D32'
                    }}>
                      {selectedRoom.room_size_sqm}m²
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      color: '#999',
                      marginTop: '0.25rem'
                    }}>
                      square meters
                    </span>
                  </div>
                )}
              </div>

              {/* Reviews Rating Section */}
              <div style={{
                padding: '1.5rem',
                background: '#f9f9f9',
                borderRadius: '12px',
                border: '1px solid #e8e8e8',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: '#2e7d32'
                  }}>
                    4.8
                  </span>
                  <div style={{
                    display: 'flex',
                    gap: '0.2rem'
                  }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{
                        fontSize: '1.2rem',
                        color: i < 4 ? '#ffc107' : '#ddd'
                      }}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: '#666',
                  fontWeight: 500
                }}>
                  Based on 247 verified guest reviews
                </p>
              </div>

              {/* Amenities Section */}
              {sanitizedSelectedRoomAmenities.length > 0 ? (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#1B5E20',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    Room Amenities
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.7rem'
                  }}>
                    {sanitizedSelectedRoomAmenities.map((amenity, i) => (
                      <span key={i} style={{
                        background: '#f0fdf4',
                        color: '#2E7D32',
                        padding: '0.6rem 1.2rem',
                        borderRadius: '24px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        border: '1.5px solid #c8e6c9',
                        transition: 'all 0.2s'
                      }}>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1rem', color: '#6b7280', fontStyle: 'italic' }}>{t('no_amenities_listed') || 'No amenities listed'}</div>
              )}

              {/* What's Included Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#1B5E20',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  What's Included
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.8rem'
                }}>
                  {[
                    { icon: Icons.Utensils, text: 'Complimentary Breakfast' },
                    { icon: Icons.Cloud, text: 'Free High-Speed WiFi' },
                    { icon: Icons.Cloud, text: 'Air Conditioning' },
                    { icon: Icons.Film, text: 'Smart TV & Streaming' },
                    { icon: Icons.Eye, text: 'Premium Toiletries' },
                    { icon: Icons.Leaf, text: 'Daily Housekeeping' }
                  ].map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                          padding: '0.8rem',
                          background: '#e8f5e9',
                          borderRadius: '8px',
                          border: '1px solid #c8e6c9'
                        }}
                      >
                        <IconComponent size={20} style={{ color: '#2E7D32', minWidth: '20px' }} />
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#2E7D32'
                        }}>
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Highlights Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#1B5E20',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Why Guests Love This Room
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  {[
                    { icon: Icons.Sparkles, text: 'Modern Design' },
                    { icon: Icons.Mountain, text: 'Great Views' },
                    { icon: Icons.Heart, text: 'Premium Beds' },
                    { icon: Icons.Waves, text: 'Luxury Bath' }
                  ].map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: '#f5f5f5',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8'
                      }}>
                        <IconComponent size={20} style={{ color: '#2E7D32', minWidth: '20px' }} />
                        <span style={{
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: '#333'
                        }}>
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: '#e8e8e8',
                marginBottom: '2rem'
              }}></div>

              {/* Guest Testimonials */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#1B5E20',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  What Guests Say
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  {[
                    {
                      quote: "Beautiful room with excellent view. The bed was very comfortable!",
                      author: "Sarah M.",
                      date: "Feb 2024"
                    },
                    {
                      quote: "Loved the modern design and spacious bathroom. Highly recommended!",
                      author: "James P.",
                      date: "Jan 2024"
                    }
                  ].map((testimonial, i) => (
                    <div key={i} style={{
                      padding: '1rem',
                      background: '#f9f9f9',
                      borderRadius: '10px',
                      border: '1px solid #e8e8e8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '0.2rem'
                      }}>
                        {[...Array(5)].map((_, j) => (
                          <span key={j} style={{
                            fontSize: '1rem',
                            color: '#ffc107'
                          }}>
                            ★
                          </span>
                        ))}
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.9rem',
                        color: '#333',
                        fontStyle: 'italic',
                        lineHeight: 1.6
                      }}>
                        "{testimonial.quote}"
                      </p>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#999',
                        fontWeight: 600
                      }}>
                        {testimonial.author} <span style={{ color: '#ccc' }}>•</span> {testimonial.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: '#e8e8e8',
                marginBottom: '2rem'
              }}></div>

              {/* Room Rules & Policies */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#1B5E20',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Room Rules & Policies
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1.5rem'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <Icons.Clock size={20} style={{ color: '#2E7D32', marginTop: '0.2rem', minWidth: '20px' }} />
                      <div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#333',
                          marginBottom: '0.25rem'
                        }}>
                          Check-in / Check-out
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          Check-in: 2:00 PM • Check-out: 11:00 AM
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <Icons.Info size={20} style={{ color: '#2E7D32', marginTop: '0.2rem', minWidth: '20px' }} />
                      <div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#333',
                          marginBottom: '0.25rem'
                        }}>
                          Smoking Policy
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          Non-smoking room
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <Icons.Filter size={20} style={{ color: '#2E7D32', marginTop: '0.2rem', minWidth: '20px' }} />
                      <div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#333',
                          marginBottom: '0.25rem'
                        }}>
                          Pet Policy
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          Pets not allowed
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <Icons.X size={20} style={{ color: '#2E7D32', marginTop: '0.2rem', minWidth: '20px' }} />
                      <div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#333',
                          marginBottom: '0.25rem'
                        }}>
                          Events & Parties
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#666'
                        }}>
                          Not permitted
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                background: '#e8e8e8',
                marginBottom: '2rem'
              }}></div>

              {/* Quick FAQ Section */}
              <div style={{
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#2E7D32',
                  marginBottom: '1rem',
                  letterSpacing: '0.5px'
                }}>
                  Common Questions
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  {[
                    { q: 'Can I modify my booking?', a: 'Yes, free modifications up to 7 days before check-in' },
                    { q: 'What is the earliest check-in?', a: '2:00 PM standard, subject to availability' },
                    { q: 'Is breakfast included?', a: 'Yes, complimentary daily breakfast' },
                    { q: 'Is WiFi available?', a: 'Yes, free high-speed WiFi throughout' }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        background: '#fafafa',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8'
                      }}
                    >
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#2E7D32',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Icons.Info size={16} style={{ color: '#2E7D32' }} />
                        {item.q}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        lineHeight: 1.4
                      }}>
                        {item.a}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#2E7D32',
                  marginBottom: '1rem',
                  letterSpacing: '0.5px'
                }}>
                  Perfect For
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.8rem'
                }}>
                  {[
                    { icon: Icons.Users, label: 'Family Trips', detail: '3-4 guests with comfort' },
                    { icon: Icons.Heart, label: 'Couples', detail: 'Romantic getaway' },
                    { icon: Icons.MapPin, label: 'Business Travel', detail: 'Work & relaxation' },
                    { icon: Icons.User, label: 'Solo Travelers', detail: 'Independent exploration' }
                  ].map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                          padding: '0.8rem',
                          background: '#f5f5f5',
                          borderRadius: '8px',
                          border: '1px solid #e8e8e8'
                        }}
                      >
                        <IconComponent size={24} style={{ color: '#2E7D32', minWidth: '24px' }} />
                        <div>
                          <div style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#2E7D32'
                          }}>
                            {item.label}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#999'
                          }}>
                            {item.detail}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Availability */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                padding: '2rem',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #c8e6c9',
                marginBottom: '2rem'
              }}>
                <div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'block',
                    marginBottom: '0.75rem'
                  }}>
                    Price per Night
                  </span>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: '#2E7D32',
                    lineHeight: 1.2
                  }}>
                    ₱{parseFloat(selectedRoom.price_per_night).toLocaleString()}
                  </div>
                </div>

                <div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'block',
                    marginBottom: '0.75rem'
                  }}>
                    Availability
                  </span>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: selectedRoom.quantity_available > 0 ? '#2E7D32' : '#c62828',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: selectedRoom.quantity_available > 0 ? '#2E7D32' : '#c62828'
                    }}></span>
                    {selectedRoom.quantity_available > 0 
                      ? selectedRoom.quantity_available
                      : '0'
                    }
                  </div>
                  <span style={{
                    fontSize: '0.85rem',
                    color: '#999',
                    marginTop: '0.25rem',
                    display: 'block'
                  }}>
                    {selectedRoom.quantity_available > 0 
                      ? t('availability_rooms_pattern').replace('{count}', String(selectedRoom.quantity_available))
                      : t('room_currently_unavailable')
                    }
                  </span>
                </div>
              </div>

              {/* Booking Benefits Section */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {/* Benefit 1: Flexible Cancellation */}
                <div style={{
                  background: '#fef9e7',
                  border: '1.5px solid #ffd54f',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '0.6rem'
                  }}>
                    <Icons.Money size={28} style={{ color: '#f57f17' }} />
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#f57f17',
                    marginBottom: '0.3rem'
                  }}>
                    BEST RATES
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#555'
                  }}>
                    Guaranteed best price
                  </div>
                </div>

                {/* Benefit 2: Instant Booking */}
                <div style={{
                  background: '#c8e6c9',
                  border: '1.5px solid #81c784',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '0.6rem'
                  }}>
                    <Icons.Check size={28} style={{ color: '#2e7d32' }} />
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#2e7d32',
                    marginBottom: '0.3rem'
                  }}>
                    INSTANT BOOK
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#555'
                  }}>
                    Confirmation within 2 hours
                  </div>
                </div>

                {/* Benefit 3: Special */}
                <div style={{
                  background: '#f3e5f5',
                  border: '1.5px solid #ce93d8',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '0.6rem'
                  }}>
                    <Icons.Sparkles size={28} style={{ color: '#7b1fa2' }} />
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#7b1fa2',
                    marginBottom: '0.3rem'
                  }}>
                    WELCOME OFFER
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#555'
                  }}>
                    Special perks for new guests
                  </div>
                </div>
              </div>

              {/* Room Status Section */}
              <div style={{
                padding: '1.5rem',
                background: selectedRoom.is_active ? '#e8f5e9' : '#ffebee',
                borderRadius: '10px',
                border: `2px solid ${selectedRoom.is_active ? '#4caf50' : '#ef5350'}`,
                marginBottom: '2rem'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: selectedRoom.is_active ? '#2e7d32' : '#c62828',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '0.5rem'
                }}>
                  Room Status
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: selectedRoom.is_active ? '#2e7d32' : '#c62828'
                }}>
                  {selectedRoom.is_active ? t('available_for_booking') || 'Available for Booking' : t('room_currently_unavailable')}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 0.3fr',
                gap: '1rem'
              }}>
                {/* Book Now Button */}
                {selectedRoom.is_active && selectedRoom.quantity_available > 0 && (
                  <button
                    onClick={() => {
                      setBookingForm(prev => ({
                        ...prev,
                        selectedRoomId: selectedRoom.room_id,
                        selectedRoomType: selectedRoom.room_type_name
                      }));
                      setSelectedRoom(null);
                      setShowBookingModal(true);
                    }}
                    style={{
                      padding: '1.2rem',
                      background: '#2E7D32',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#1B5E20';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 125, 50, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#2E7D32';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {t('book_now')}
                  </button>
                )}
                
                {/* Share Room Button */}
                <button
                  onClick={() => {
                    const shareUrl = window.location.href;
                    const shareText = `Check out ${selectedRoom.room_type_name} at ${hotel.name}! ⭐`;
                    
                    if (navigator.share) {
                      navigator.share({
                        title: selectedRoom.room_type_name,
                        text: shareText,
                        url: shareUrl
                      });
                    } else {
                      // Fallback: copy to clipboard
                      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                      alert(t('room_link_copied'));
                    }
                  }}
                  style={{
                    padding: '1.2rem',
                    background: '#f0fdf4',
                    color: '#2E7D32',
                    border: '2px solid #2E7D32',
                    borderRadius: '10px',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#2E7D32';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#f0fdf4';
                    e.currentTarget.style.color = '#2E7D32';
                  }}
                  title={t('share_this_room')}
                >
                  ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Management Modal */}
      {managingRoomsHotel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 25px 80px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              position: 'sticky',
              top: 0,
              background: '#2E7D32',
              color: 'white',
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 'none',
              zIndex: 10
            }}>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem', 
                  fontWeight: 800,
                  letterSpacing: '-0.5px'
                }}>
                  Manage Room Types
                </h2>
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  opacity: 0.9
                }}>
                  {managingRoomsHotel?.name}
                </p>
              </div>
              <button
                onClick={() => setManagingRoomsHotel(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <RoomManagement 
              hotel={managingRoomsHotel}
              onClose={() => setManagingRoomsHotel(null)}
              t={t}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const pageStyle = {
  backgroundColor: '#f0f9ff',
  minHeight: '100vh',
  paddingBottom: '3rem'
};

const breadcrumbContainer = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '2rem 2rem 1rem 2rem'
};

const breadcrumbLink = {
  color: '#16a34a',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '700',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
  borderRadius: '50px',
  border: '2px solid #86efac',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(22, 163, 74, 0.3)'
  }
};

const ratingContainer = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 2rem 1rem 2rem',
  display: 'flex',
  justifyContent: 'center'
};

const ratingSection = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1rem',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  padding: '0.75rem 1.5rem',
  borderRadius: '50px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  border: '2px solid rgba(22, 163, 74, 0.2)'
};

const starsContainer = {
  display: 'flex'
};

const ratingText = {
  fontSize: '1rem',
  color: '#555',
  fontWeight: '600'
};

const contentGrid = {
  maxWidth: '1400px',
  margin: '1rem auto 2rem auto',
  padding: '0 2rem',
  display: 'grid',
  gridTemplateColumns: '1fr 380px',
  gap: '2.5rem'
};

const leftColumn = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem'
};

const rightColumn = {
  position: 'sticky',
  top: '1rem',
  alignSelf: 'flex-start'
};

const imageContainer = {
  borderRadius: '24px',
  overflow: 'hidden',
  boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
  border: '4px solid white',
  position: 'relative',
  transition: 'transform 0.3s ease'
};

const hotelImage = {
  width: '100%',
  height: 'auto',
  display: 'block',
  transition: 'transform 0.3s ease'
};

const galleryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '0.75rem'
};

const galleryImage = {
  width: '100%',
  height: '90px',
  objectFit: 'cover',
  borderRadius: '10px',
  border: '1px solid #e5e7eb'
};

const sectionCard = {
  background: 'white',
  borderRadius: '24px',
  padding: '2.5rem',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  border: '1px solid rgba(22, 163, 74, 0.1)',
  transition: 'all 0.3s ease'
};

const sectionTitle = {
  fontSize: '2rem',
  fontWeight: '800',
  margin: '0 0 1.5rem 0',
  color: '#16a34a',
  textShadow: '0 1px 2px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  paddingBottom: '1rem',
  borderBottom: '3px solid #16a34a'
};

const descriptionText = {
  fontSize: '1rem',
  lineHeight: '1.7',
  color: '#555',
  fontWeight: '400'
};

const amenitiesGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '0.75rem'
};

const amenityItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.85rem 1rem',
  background: 'linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%)',
  borderRadius: '12px',
  border: '1px solid rgba(22, 163, 74, 0.1)',
  transition: 'all 0.3s ease',
  fontSize: '0.95rem',
  fontWeight: '500'
};

const amenityIcon = {
  color: '#16a34a',
  fontWeight: 'bold',
  fontSize: '1.3rem'
};

const mapContainer = {
  height: '300px',
  borderRadius: '12px',
  overflow: 'hidden'
};

const mapStyle = {
  width: '100%',
  height: '100%'
};

const reviewsHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem'
};

const writeReviewBtn = {
  background: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '0.5rem 1rem',
  fontWeight: '600',
  cursor: 'pointer'
};

const reviewFormCard = {
  background: '#f8f9fa',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '1.5rem'
};

const formGroup = {
  marginBottom: '1rem'
};

const formLabel = {
  display: 'block',
  fontWeight: '600',
  marginBottom: '0.5rem',
  color: '#333'
};

const starSelector = {
  display: 'flex',
  gap: '0.25rem'
};

const starButton = {
  fontSize: '2rem',
  cursor: 'pointer',
  transition: 'color 0.2s'
};

const textareaField = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem',
  fontFamily: 'inherit'
};

const reviewMessageBox = {
  padding: '0.75rem',
  background: '#e8f5e9',
  color: '#2e7d32',
  borderRadius: '8px',
  marginBottom: '1rem',
  fontWeight: '600'
};

const submitReviewBtn = {
  background: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '0.75rem 1.5rem',
  fontWeight: '600',
  cursor: 'pointer',
  width: '100%'
};

const reviewsList = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const noReviewsText = {
  textAlign: 'center',
  color: '#999',
  padding: '2rem',
  fontSize: '1rem'
};

const reviewCard = {
  padding: '2rem',
  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
  borderRadius: '16px',
  border: '1px solid #e0e0e0',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  transition: 'all 0.3s ease'
};

const reviewHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.75rem'
};

const reviewAuthor = {
  fontWeight: '700',
  fontSize: '1rem',
  color: '#333'
};

const reviewDate = {
  fontSize: '0.85rem',
  color: '#999',
  marginTop: '0.25rem'
};

const reviewRating = {
  display: 'flex'
};

const reviewComment = {
  fontSize: '0.95rem',
  lineHeight: '1.6',
  color: '#555',
  margin: '0 0 1rem 0'
};

const reviewFooter = {
  display: 'flex',
  gap: '1rem'
};

const helpfulBtn = {
  background: 'white',
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '0.4rem 0.8rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
  color: '#666'
};

const bookingCard = {
  background: 'white',
  borderRadius: '24px',
  padding: '2.5rem',
  boxShadow: '0 20px 50px rgba(22, 163, 74, 0.15)',
  border: '3px solid rgba(22, 163, 74, 0.2)',
  position: 'relative',
  overflow: 'hidden'
};

const priceSection = {
  marginBottom: '2rem',
  paddingBottom: '2rem',
  borderBottom: '2px solid #f0f0f0',
  textAlign: 'center'
};

const priceLabel = {
  fontSize: '0.9rem',
  color: '#666',
  marginBottom: '0.75rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const priceAmount = {
  fontSize: '3rem',
  fontWeight: '900',
  color: '#16a34a',
  textShadow: '0 2px 4px rgba(22, 163, 74, 0.2)'
};

const availabilityBanner = {
  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
  color: '#1b5e20',
  padding: '1rem 1.25rem',
  borderRadius: '15px',
  fontWeight: '700',
  marginBottom: '2rem',
  textAlign: 'center',
  fontSize: '1.05rem',
  boxShadow: '0 4px 12px rgba(27, 94, 32, 0.15)',
  border: '2px solid rgba(27, 94, 32, 0.1)'
};

const contactSection = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginBottom: '1.5rem'
};

const contactItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  lineHeight: 1.3,
  fontSize: '0.95rem',
  color: '#555',
  fontWeight: '500'
};

const contactIcon = {
  fontSize: '1.1rem'
};

const bookNowButton = {
  width: '100%',
  background: 'linear-gradient(135deg, #16a34a, #059669)',
  color: 'white',
  border: 'none',
  borderRadius: '15px',
  padding: '1.5rem',
  fontSize: '1.1rem',
  fontWeight: '800',
  cursor: 'pointer',
  marginBottom: '1rem',
  boxShadow: '0 8px 20px rgba(22, 163, 74, 0.4)',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem'
};

const contactButton = {
  width: '100%',
  background: 'white',
  color: '#16a34a',
  border: '3px solid #16a34a',
  borderRadius: '15px',
  padding: '1.25rem',
  fontSize: '1rem',
  fontWeight: '700',
  cursor: 'pointer',
  marginBottom: '1.5rem',
  transition: 'all 0.3s ease',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem'
};

const infoText = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  fontSize: '0.85rem',
  color: '#666',
  fontWeight: '500'
};

const backLink = {
  color: '#2e7d32',
  textDecoration: 'none',
  fontWeight: '600'
};

const modalBackdrop = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  zIndex: 1000
};

const modalCard = {
  backgroundColor: 'white',
  borderRadius: '20px',
  width: '100%',
  maxWidth: '750px',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
  animation: 'slideUp 0.3s ease-out'
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '2rem 2.5rem',
  background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
  color: 'white',
  borderTopLeftRadius: '20px',
  borderTopRightRadius: '20px'
};

const modalTitle = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: '700',
  color: 'white',
  marginBottom: '0.25rem'
};

const modalSubtitle = {
  margin: 0,
  fontSize: '0.95rem',
  color: 'rgba(255,255,255,0.9)',
  fontWeight: '400'
};

const modalClose = {
  border: 'none',
  background: 'rgba(255,255,255,0.2)',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: 'white',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  ':hover': {
    background: 'rgba(255,255,255,0.3)'
  }
};

const modalBody = {
  padding: '2rem 2.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  backgroundColor: '#fafafa'
};

const modalFooter = {
  padding: '1.5rem 2.5rem',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  borderTop: '2px solid #e0e0e0',
  backgroundColor: 'white',
  borderBottomLeftRadius: '20px',
  borderBottomRightRadius: '20px'
};

const modalGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem'
};

const inputLabel = {
  fontSize: '0.9rem',
  fontWeight: '600',
  marginBottom: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  lineHeight: 1.2,
  color: '#333'
};

const inputField = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid #ddd',
  fontSize: '1rem'
};

const inputFieldEnhanced = {
  width: '100%',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  border: '2px solid #e0e0e0',
  fontSize: '1rem',
  backgroundColor: 'white',
  transition: 'all 0.3s ease',
  outline: 'none',
  ':focus': {
    borderColor: '#2e7d32',
    boxShadow: '0 0 0 3px rgba(46,125,50,0.1)'
  }
};

const textareaFieldEnhanced = {
  width: '100%',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  border: '2px solid #e0e0e0',
  fontSize: '0.95rem',
  backgroundColor: 'white',
  fontFamily: 'inherit',
  resize: 'vertical',
  transition: 'all 0.3s ease',
  outline: 'none',
  ':focus': {
    borderColor: '#2e7d32',
    boxShadow: '0 0 0 3px rgba(46,125,50,0.1)'
  }
};

const sectionDivider = {
  marginTop: '0.5rem',
  marginBottom: '0.5rem'
};

const sectionHeading = {
  fontSize: '1.1rem',
  fontWeight: '600',
  color: '#2e7d32',
  margin: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  lineHeight: 1.25
};

const secureNote = {
  fontSize: '0.8rem',
  color: '#666',
  marginTop: '0.5rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  lineHeight: 1.25
};

const checkoutBanner = {
  backgroundColor: '#f1f8e9',
  color: '#2e7d32',
  padding: '1rem 1.25rem',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  border: '2px dashed #81c784'
};

const checkoutText = {
  flex: 1
};

const checkoutButton = {
  background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  padding: '0.7rem 1rem',
  fontWeight: '700',
  cursor: 'pointer',
  whiteSpace: 'nowrap'
};

const cancelBtnEnhanced = {
  padding: '0.85rem 1.5rem',
  background: 'white',
  border: '2px solid #d0d0d0',
  color: '#666',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const confirmBtnEnhanced = {
  padding: '0.85rem 1.5rem',
  background: '#2e7d32',
  border: 'none',
  color: 'white',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: '700',
  cursor: 'pointer',
  transition: 'all 0.3s ease'
};

const confirmBtnDisabled = {
  padding: '0.85rem 1.5rem',
  background: '#ccc',
  border: 'none',
  color: '#999',
  borderRadius: '10px',
  fontSize: '0.95rem',
  fontWeight: '700',
  cursor: 'not-allowed',
  transition: 'all 0.3s ease'
};

const errorBanner = {
  backgroundColor: '#ffebee',
  color: '#c62828',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  fontWeight: '600'
};

const cancelBtn = {
  background: 'transparent',
  color: '#666',
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '0.75rem 1.5rem',
  fontWeight: '600',
  cursor: 'pointer'
};
