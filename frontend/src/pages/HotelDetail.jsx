import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { fetchHotels, fetchHotelCalendar, createHotelBooking, startPaymentCheckout, getApiBaseUrl } from '../api';
import * as api from '../api';
import axios from 'axios';
import LeafletMap from '../components/LeafletMap';
import Icons from '../components/Icons';
import RoomManagement from '../components/RoomManagement';
import { buildPolicyLines, POLICY_LINE_ICONS } from '../utils/bookingPolicy';
import './HotelDetail.css';

const API_BASE_URL = getApiBaseUrl() + '/api';

const DEFAULT_PAYMENT_METHOD_VALUES = ['card', 'gcash', 'grabpay', 'qrph', 'paypal', 'bank_transfer', 'pay_at_property'];

const getPaymentMethodOptions = (t) => [
  { value: 'card', label: t('payment_method_card') },
  { value: 'gcash', label: t('payment_provider_gcash') },
  { value: 'grabpay', label: t('payment_provider_grabpay') },
  { value: 'qrph', label: t('payment_provider_qrph') || 'QR PH' },
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

const amenityIconFor = (amenity) => {
  const a = String(amenity || '').toLowerCase();
  if (a.includes('wi-fi') || a.includes('wifi') || a.includes('internet')) return <Icons.Wifi size={16} />;
  if (a.includes('air-con') || a.includes('air con') || a.includes('aircond') || a.includes('condition') || a.includes('snow')) return <Icons.Snowflake size={16} />;
  if (a.includes('laundry') || a.includes('wash') || a.includes('linen') || a.includes('shirt') || a.includes('iron')) return <Icons.Shirt size={16} />;
  if (a.includes('restaurant') || a.includes('dining') || a.includes('breakfast') || a.includes('bar') || a.includes('kitchen')) return <Icons.Utensils size={16} />;
  if (a.includes('pool') || a.includes('spa') || a.includes('water')) return <Icons.Waves size={16} />;
  if (a.includes('parking') || a.includes('car') || a.includes('shuttle')) return <Icons.MapPin size={16} />;
  if (a.includes('coffee') || a.includes('tea')) return <Icons.Coffee size={16} />;
  if (a.includes('gym') || a.includes('fitness') || a.includes('sport')) return <Icons.Users size={16} />;
  if (a.includes('tv') || a.includes('television') || a.includes('cable')) return <Icons.Photo size={16} />;
  return <Icons.Check size={16} />;
};

// '14:00' / '14:00:00' -> '2:00 PM' (mysql2 returns TIME with seconds).
const fmtTime = (value) => {
  if (!value) return '';
  const m = String(value).match(/(\d{1,2}):(\d{2})/);
  if (!m) return String(value);
  const hour = parseInt(m[1], 10);
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m[2]} ${meridiem}`;
};

const CALENDAR_LOCALES = {
  en: 'en-US',
  es: 'es-ES',
  tl: 'fil-PH',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE'
};

const getCalendarLocale = (language) => CALENDAR_LOCALES[language] || 'en-US';

const toCalendarDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Sunday-first month grid with leading/trailing blanks (same shape as the owner calendar).
const buildCalendarDays = (value) => {
  const monthStart = new Date(value.getFullYear(), value.getMonth(), 1);
  const monthEnd = new Date(value.getFullYear(), value.getMonth() + 1, 0);
  const days = [];
  for (let i = 0; i < monthStart.getDay(); i += 1) {
    days.push(null);
  }
  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    days.push(new Date(value.getFullYear(), value.getMonth(), day));
  }
  while (days.length % 7 !== 0) {
    days.push(null);
  }
  return days;
};

// 2024-01-07 is a Sunday; offsets give Sun..Sat labels in the active locale.
const getWeekdayLabels = (locale) => {
  const labels = [];
  for (let i = 0; i < 7; i += 1) {
    labels.push(new Date(2024, 0, 7 + i).toLocaleDateString(locale, { weekday: 'short' }));
  }
  return labels;
};

export default function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
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
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarDays, setCalendarDays] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [calendarRange, setCalendarRange] = useState({ start: null, end: null });
  
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2,
    rooms: 1,
    paymentMethod: 'card',
    paymentOption: 'full',
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
  const [policyAgreed, setPolicyAgreed] = useState(false);
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

  // Auto-open the booking modal (with the inline calendar) when linked with ?calendar=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('calendar') === '1') {
      setShowBookingModal(true);
    }
  }, [location.search]);

  // Fresh calendar state for every open of the booking modal, however it was opened.
  useEffect(() => {
    if (showBookingModal) return;
    setCalendarRange({ start: null, end: null });
    setCalendarError('');
  }, [showBookingModal]);

  // Load per-date availability for the visible month (room-type aware)
  useEffect(() => {
    if (!showBookingModal || !id) return undefined;
    let cancelled = false;
    const loadCalendar = async () => {
      setCalendarLoading(true);
      setCalendarError('');
      try {
        const start = toCalendarDateKey(calendarMonth);
        const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
        const end = toCalendarDateKey(monthEnd);
        const response = await fetchHotelCalendar(id, start, end, bookingForm.selectedRoomId || null);
        if (cancelled) return;
        const days = Array.isArray(response.data?.days) ? response.data.days : [];
        const byDate = {};
        days.forEach((day) => {
          byDate[day.date] = day;
        });
        setCalendarDays(byDate);
      } catch (error) {
        if (!cancelled) {
          setCalendarError(error.response?.data?.error || t('availability_na'));
        }
      } finally {
        if (!cancelled) {
          setCalendarLoading(false);
        }
      }
    };
    loadCalendar();
    return () => {
      cancelled = true;
    };
  }, [showBookingModal, calendarMonth, bookingForm.selectedRoomId, id]);

  const maxGuestsAllowed = 100;

  // Public rooms fetch (normalized). Reused by loadHotelData and by the
  // Room Management onRoomsChanged callback so the Room Details modal
  // reflects owner edits without a reload.
  const fetchRooms = async () => {
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
      return normalizedRooms;
    } catch (error) {
      console.error('Could not load rooms:', error);
      setRooms([]);
      return [];
    }
  };

  // Called after owner room edits/deletes: refresh public rooms and keep
  // the open Room Details modal in sync (close it if the room is gone).
  const refreshRooms = async () => {
    const normalizedRooms = await fetchRooms();
    setSelectedRoom((prev) => {
      if (!prev) return prev;
      const fresh = normalizedRooms.find((r) => String(r.room_id) === String(prev.room_id));
      if (!fresh) return null;
      return { ...fresh };
    });
    setRoomImageIndex(0);
  };

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
      await fetchRooms();
      
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

  // Flexible payment option (reservation fee / half / full) — mirrors backend
  // utils/paymentAmounts.js dueNow() so the card amounts match what the
  // server will charge at checkout.
  const modalNights = bookingForm.checkIn && bookingForm.checkOut
    ? Math.max(0, Math.ceil((new Date(bookingForm.checkOut) - new Date(bookingForm.checkIn)) / (1000 * 60 * 60 * 24)))
    : 0;
  const modalSelectedRoom = rooms.find((r) => r.room_id === bookingForm.selectedRoomId);
  const modalPricePerNight = modalSelectedRoom ? modalSelectedRoom.price_per_night : hotel?.pricePerNight;
  const bookingTotal = Number((modalPricePerNight || 0)) * modalNights * (bookingForm.rooms || 1);
  const reservationFee = hotel?.reservation_fee;
  const reservationFeeUsable = reservationFee != null && Number(reservationFee) > 0;
  const reservationFeeValid = reservationFeeUsable && (bookingTotal <= 0 || Number(reservationFee) < bookingTotal);
  const selectedPaymentOption =
    bookingForm.paymentOption === 'reservation' && !reservationFeeValid ? 'full' : (bookingForm.paymentOption || 'full');
  const computeDueNow = (option) => {
    if (!bookingTotal || bookingTotal <= 0) return null;
    if (option === 'half') return Math.ceil(bookingTotal / 2);
    if (option === 'reservation') return reservationFeeValid ? Number(reservationFee) : null;
    return bookingTotal;
  };
  const selectedDueNow = computeDueNow(selectedPaymentOption);
  const selectedBalanceDue = selectedDueNow !== null ? Math.max(bookingTotal - selectedDueNow, 0) : 0;
  let selectedBalanceDueAt = null;
  if (selectedBalanceDue > 0 && bookingForm.checkIn) {
    const d = new Date(`${bookingForm.checkIn}T00:00:00`);
    const balanceDays = Number.isFinite(Number(hotel?.balance_due_days)) ? Math.max(0, Number(hotel.balance_due_days)) : 1;
    d.setDate(d.getDate() - balanceDays);
    selectedBalanceDueAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const policyLines = buildPolicyLines(hotel, {
    checkIn: bookingForm.checkIn,
    balanceDueAt: selectedBalanceDueAt,
    showBalance: selectedBalanceDue > 0,
    t
  });
  const paymentOptionChoices = [
    { value: 'reservation', title: 'Reservation fee', subtitle: 'Secure the booking now, pay the rest later', available: reservationFeeUsable },
    { value: 'half', title: 'Half payment', subtitle: 'Pay 50% now, balance before check-in', available: true },
    { value: 'full', title: 'Full payment', subtitle: 'Pay the total amount now', available: true }
  ].filter((choice) => choice.available);
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
    setPolicyAgreed(false);
    setShowBookingModal(true);
  };

  const changeCalendarMonth = (delta) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setCalendarRange({ start: null, end: null });
  };

  // The calendar's room-type dropdown doubles as the booking's room choice:
  // same filtering/clamping the old Select Room Type field had, plus a range
  // reset because availability differs per type. The fetch effect watches
  // bookingForm.selectedRoomId, so the calendar refetches for the new type.
  const handleRoomSelectChange = (event) => {
    const value = event.target.value;
    const selectedRoom = rooms.find((room) => String(room.room_id) === String(value));
    const maxAllowed = selectedRoom ? (selectedRoom.quantity_available || primaryAvailability) : primaryAvailability;
    setBookingForm((prev) => ({
      ...prev,
      selectedRoomId: value ? Number(value) : null,
      selectedRoomType: selectedRoom ? selectedRoom.room_type_name : null,
      rooms: Math.min(prev.rooms || 1, Math.max(1, maxAllowed))
    }));
    setCalendarRange({ start: null, end: null });
    setCalendarError('');
    setBookingError('');
  };

  const isCalendarDayBookable = (dateKey) => {
    const day = calendarDays[dateKey];
    if (!day || day.closed === 1 || Number(day.available) <= 0) return false;
    return dateKey >= toCalendarDateKey(new Date());
  };

  const handleCalendarDayClick = (dateKey) => {
    if (!isCalendarDayBookable(dateKey)) return;

    setCalendarError('');
    const { start, end } = calendarRange;

    // Clicking a selected date (check-in or check-out) unselects everything.
    if (dateKey === start || dateKey === end) {
      setCalendarRange({ start: null, end: null });
      setBookingForm((prev) => ({ ...prev, checkIn: '', checkOut: '' }));
      setBookingError('');
      return;
    }

    // First pick (or restart) sets the check-in date; the form's dates clear
    // until a full range is picked so inputs and calendar never disagree.
    if (!start || end || dateKey < start) {
      setCalendarRange({ start: dateKey, end: null });
      setBookingForm((prev) => ({ ...prev, checkIn: '', checkOut: '' }));
      setBookingError('');
      return;
    }

    // Second pick must leave every night in [start, dateKey) available.
    const nights = [];
    const cursor = new Date(`${start}T00:00:00`);
    const limit = new Date(`${dateKey}T00:00:00`);
    while (cursor < limit) {
      nights.push(toCalendarDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    const allAvailable = nights.length > 0 && nights.every((key) => {
      const day = calendarDays[key];
      return day && day.closed !== 1 && Number(day.available) > 0;
    });

    if (!allAvailable) {
      setCalendarRange({ start: dateKey, end: null });
      setBookingForm((prev) => ({ ...prev, checkIn: '', checkOut: '' }));
      setBookingError('');
      return;
    }

    // Range complete: apply it to the booking form immediately (the calendar
    // lives inside the booking modal now, so there is no separate confirm).
    setCalendarRange({ start, end: dateKey });
    setBookingForm((prev) => ({ ...prev, checkIn: start, checkOut: dateKey }));
    setBookingError('');
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

    if (!policyAgreed) {
      setBookingError(t('agree_policies_checkbox'));
      return;
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
        payment_option: selectedPaymentOption,
        pay_now: false,
        policy_agreed: policyAgreed,
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
        const fullTotal = Number((pricePerNight * nights * bookingForm.rooms).toFixed(2));
        const dueNowAmount = selectedDueNow !== null
          ? selectedDueNow
          : fullTotal;

        // Show a slow-network warning after 7 s if the checkout API hasn't responded yet
        const slowTimer = setTimeout(() => setSlowConnection(true), 7000);

        try {
          // Abort if the payment gateway takes longer than 30 s
          const checkoutResponse = await Promise.race([
            startPaymentCheckout({
              booking_id: bookingId,
              payment_method: bookingForm.paymentMethod,
              amount: dueNowAmount,
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

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [toastText, setToastText] = useState('');
  const toastTimerRef = useRef(null);

  const gallery = useMemo(() => {
    const imgs = Array.isArray(hotel?.images) ? hotel.images.filter(Boolean) : [];
    if (imgs.length > 0) return imgs;
    if (hotel?.image) return [hotel.image];
    return ['/placeholder-hotel.svg'];
  }, [hotel]);

  const ratingStats = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (Array.isArray(reviews) ? reviews : []).forEach((r) => {
      const star = Math.round(Number(r.rating) || 0);
      if (counts[star] !== undefined) counts[star] += 1;
    });
    return counts;
  }, [reviews]);

  const showToast = (message) => {
    setToastText(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastText(''), 2600);
  };

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(String(text));
      showToast(t('copied_toast_pattern').replace('{label}', String(text)));
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const showPreviousImage = () => {
    if (gallery.length < 2) return;
    setGalleryIndex((i) => (i - 1 + gallery.length) % gallery.length);
  };

  const showNextImage = () => {
    if (gallery.length < 2) return;
    setGalleryIndex((i) => (i + 1) % gallery.length);
  };

  useEffect(() => {
    setGalleryIndex(0);
  }, [id]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && fullscreenImage) {
        setFullscreenImage(null);
        return;
      }
      if (e.key === 'Escape' && selectedRoom) {
        setSelectedRoom(null);
        setRoomImageIndex(0);
        return;
      }
      if (e.key === 'Escape' && managingRoomsHotel) {
        setManagingRoomsHotel(null);
        return;
      }
      if (showBookingModal || showContactModal || selectedRoom || fullscreenImage) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (gallery.length < 2) return;
      if (e.key === 'ArrowLeft') showPreviousImage();
      if (e.key === 'ArrowRight') showNextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Lock the hotel page scroll while a modal is open (the modal itself still scrolls)
  const anyModalOpen = Boolean(showBookingModal || showContactModal || selectedRoom || managingRoomsHotel || fullscreenImage);

  useEffect(() => {
    if (!anyModalOpen) return;
    const body = document.body;
    const html = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const prevHtmlOverflow = html.style.overflow;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [anyModalOpen]);

  if (loading) {
    return (
      <div className="hd-page">
        <div className="hd-state">
          <p>{t('loading_hotel_details')}</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="hd-page">
        <div className="hd-state">
          <p>{t('Hotels')} not found</p>
          <Link to="/hotels">{t('back_to_hotels')}</Link>
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

  const activeIndex = gallery.length > 0 ? Math.min(galleryIndex, gallery.length - 1) : 0;
  const activeImage = gallery[activeIndex] || '/placeholder-hotel.svg';

  const priceMin = rooms.length > 0 ? Math.min(...rooms.map(r => parseFloat(r.price_per_night) || 0)) : null;
  const priceMax = rooms.length > 0 ? Math.max(...rooms.map(r => parseFloat(r.price_per_night) || 0)) : null;
  const heroPrice = priceMin === null
    ? (hotel.pricePerNight || hotel.price_per_night
      ? `₱${parseFloat(hotel.pricePerNight || hotel.price_per_night).toLocaleString()}`
      : null)
    : priceMin === priceMax
      ? `₱${priceMin.toLocaleString()}`
      : `₱${priceMin.toLocaleString()} – ₱${priceMax.toLocaleString()}`;

  const availabilityText = hasAvailability || hasRoomTypes
    ? primaryAvailability > 0
      ? t('availability_rooms_pattern').replace('{count}', String(primaryAvailability))
      : t('button_sold_out')
    : t('availability_na');

  const totalRoomsCount = hotel.rooms_total || rooms.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0) || 0;
  const ratingNote = reviewEligibilityReason || t('review_booking_history_note');
  const totalReviewsCount = averageRating.total || reviews.length;

  // Room Details modal derived values
  // All uploaded photos: primary first, then the rest (deduped). image_urls
  // can arrive as an array or a JSON string depending on the endpoint.
  const roomImages = (() => {
    if (!selectedRoom) return [];
    let urls = [];
    const rawUrls = selectedRoom.image_urls;
    if (Array.isArray(rawUrls)) {
      urls = rawUrls;
    } else if (typeof rawUrls === 'string' && rawUrls.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(rawUrls);
        if (Array.isArray(parsed)) urls = parsed;
      } catch (e) { /* keep empty */ }
    }
    const all = [selectedRoom.primary_image_url, ...urls]
      .filter(Boolean)
      .map((u) => String(u).trim())
      .filter(Boolean);
    return Array.from(new Set(all));
  })();
  const roomImgIndex = roomImages.length ? Math.min(roomImageIndex, roomImages.length - 1) : 0;
  const roomAmenities = selectedRoom && Array.isArray(selectedRoom.amenities)
    ? selectedRoom.amenities.map(formatAmenity).filter(Boolean)
    : [];
  const roomUnavailable = Boolean(selectedRoom && (!selectedRoom.is_active || !(selectedRoom.quantity_available > 0)));
  const roomPromoOnly = hotel.booking_enabled === false;
  const roomBookable = Boolean(selectedRoom && !roomUnavailable && !roomPromoOnly);

  // Real, room-specific guest quotes (reviews with a comment tied to this
  // room). Section renders only when at least one exists.
  const roomQuotes = selectedRoom
    ? reviews
        .filter((r) => Number(r.room_id) === Number(selectedRoom.room_id) && r.comment)
        .slice(0, 2)
    : [];

  const closeRoomModal = () => {
    setSelectedRoom(null);
    setRoomImageIndex(0);
  };

  const roomBookNow = () => {
    if (!selectedRoom) return;
    setBookingForm(prev => ({
      ...prev,
      selectedRoomId: selectedRoom.room_id,
      selectedRoomType: selectedRoom.room_type_name
    }));
    setSelectedRoom(null);
    setRoomImageIndex(0);
    setShowBookingModal(true);
  };

  const shareRoom = () => {
    if (!selectedRoom) return;
    const shareUrl = window.location.href;
    const shareText = `Check out ${selectedRoom.room_type_name} at ${hotel.name}! ⭐`;
    if (navigator.share) {
      navigator.share({ title: selectedRoom.room_type_name, text: shareText, url: shareUrl }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      showToast(t('room_link_copied'));
    }
  };

  return (
    <div className="hd-page">
      {/* Hero */}
      <header className="hd-hero">
        <img className="hd-hero-img" src={hotel.image || activeImage} alt={hotel.name} onError={handleImageError} />
        <div className="hd-hero-shade" />
        <div className="hd-hero-inner">
          <Link to="/hotels" className="hd-back">
            <Icons.ChevronLeft size={16} />
            {t('back_to_hotels')}
          </Link>
          <div className="hd-hero-body">
            {hotel.booking_enabled === false && (
              <span className="hd-tag hd-tag-amber">
                <Icons.Megaphone size={12} /> {t('promo_listing')}
              </span>
            )}
            <h1 className="hd-hero-title">{hotel.name}</h1>
            <p className="hd-hero-loc">
              <Icons.MapPin size={15} />
              {hotel.location}
            </p>
            <div className="hd-hero-pills">
              <span className="hd-pill">
                <Icons.Star size={13} filled />
                {parseFloat(averageRating.average || 0).toFixed(1)} · {totalReviewsCount} {t('reviews_label')}
              </span>
              {heroPrice && (
                <span className="hd-pill">
                  <Icons.Money size={13} />
                  {heroPrice}
                </span>
              )}
              <span className="hd-pill">
                <Icons.Bed size={13} />
                {availabilityText}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Legitimacy & accreditation tags (verified items only) */}
      {hotel.legitimacy && (hotel.legitimacy.business_permit || hotel.legitimacy.dot || hotel.legitimacy.philgeps) ? (
        <div className="hd-legit-wrap">
          <div className="hd-legit">
            {hotel.legitimacy.business_permit && (
              <span className="hd-legit-item hd-legit-green">
                <Icons.Shield size={14} /> {t('badge_business_permit')}
              </span>
            )}
            {hotel.legitimacy.dot && (
              <span className="hd-legit-item hd-legit-blue">
                <Icons.ShieldCheck size={14} /> {t('badge_dot')}
              </span>
            )}
            {hotel.legitimacy.philgeps && (
              <span className="hd-legit-item hd-legit-amber">
                <Icons.Document size={14} /> {t('badge_philgeps')}
              </span>
            )}
          </div>
        </div>
      ) : null}

      <main className="hd-layout">
        {/* Gallery */}
        <section className="hd-card hd-span-2 hd-gallery">
          <div className="hd-gallery-main">
            <img
              className="hd-gallery-img"
              src={activeImage}
              alt={hotel.name}
              onClick={() => setFullscreenImage(activeImage)}
              onError={handleImageError}
            />
            {gallery.length > 1 && (
              <>
                <button className="hd-arrow hd-arrow-l" onClick={showPreviousImage} aria-label="Previous image">
                  <Icons.ChevronLeft size={18} />
                </button>
                <button className="hd-arrow hd-arrow-r" onClick={showNextImage} aria-label="Next image">
                  <Icons.ChevronRight size={18} />
                </button>
                <span className="hd-count">{activeIndex + 1} / {gallery.length}</span>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="hd-thumbs">
              {gallery.map((url, index) => (
                <button
                  key={`${url}-${index}`}
                  className={`hd-thumb${index === activeIndex ? ' is-current' : ''}`}
                  onClick={() => setGalleryIndex(index)}
                  aria-label={`${hotel.name} ${index + 1}`}
                >
                  <img src={url} alt="" onError={handleImageError} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Booking card */}
        <section className="hd-card hd-book">
          {bookingForm.selectedRoomId && rooms.length > 0 ? (
            <div>
              <div className="hd-price-label">{t('price_per_night')}</div>
              <div className="hd-price-amount">
                ₱{parseFloat(rooms.find(r => r.room_id === bookingForm.selectedRoomId)?.price_per_night || 0).toLocaleString()}
              </div>
            </div>
          ) : rooms.length > 0 ? (
            <div>
              <div className="hd-price-label">{t('price_range')}</div>
              <div className="hd-price-amount">
                ₱{priceMin.toLocaleString()} – ₱{priceMax.toLocaleString()}
              </div>
              <small className="hd-price-note">{t('select_room_for_exact_price')}</small>
            </div>
          ) : null}

          <div className={`hd-avail${isSoldOut ? ' is-out' : ''}`}>
            {availabilityText}
            {roomTypeAvailabilityMismatch && (
              <div className="hd-avail-sub">
                {t('total_across_room_types_pattern').replace('{count}', String(totalRoomTypeAvailability))}
              </div>
            )}
          </div>

          <div className="hd-contacts">
            <div className="hd-crow">
              <Icons.Phone size={17} />
              <span className="hd-crow-val">{hotel.phone || t('contact_not_available')}</span>
              <button className="hd-copy" type="button" onClick={() => copyToClipboard(hotel.phone)} disabled={!hotel.phone}>
                <Icons.Copy size={12} />
                {t('copy_button')}
              </button>
            </div>
            <div className="hd-crow">
              <Icons.Email size={17} />
              <span className="hd-crow-val">{hotel.email || t('contact_not_available')}</span>
              <button className="hd-copy" type="button" onClick={() => copyToClipboard(hotel.email)} disabled={!hotel.email}>
                <Icons.Copy size={12} />
                {t('copy_button')}
              </button>
            </div>
          </div>

          {hotel.booking_enabled === false ? (
            <div className="hd-promo">{t('listing_only_notice')}</div>
          ) : (
            <button className="hd-cta" onClick={handleBookNow} disabled={isSoldOut}>
              <Icons.Booking size={19} />
              {isSoldOut ? t('button_sold_out') : isLoggedIn ? t('book_now') : t('login_to_book')}
            </button>
          )}

          <button className="hd-talk" onClick={() => isLoggedIn ? setShowContactModal(true) : navigate('/login')}>
            <Icons.Chat size={17} />
            {t('button_contact_owner')}
          </button>

          <ul className="hd-trust">
            <li><Icons.Check size={14} />{t('booking_benefit_free_cancellation').replace('✓', '').trim()}</li>
            <li><Icons.Check size={14} />{t('booking_benefit_no_fees').replace('✓', '').trim()}</li>
            <li><Icons.Check size={14} />{t('booking_benefit_instant_confirmation').replace('✓', '').trim()}</li>
          </ul>
        </section>

          {/* About */}
          <section className="hd-card hd-span-2">
            <h2 className="hd-h2"><Icons.Hotel size={18} /> About {t('about_hotel_fallback')}</h2>
            <p className="hd-desc">{hotel.description}</p>
            <div className="hd-stats">
              <div className="hd-stat">
                <span className="hd-stat-ic"><Icons.Bed size={18} /></span>
                <div>
                  <strong>{rooms.length}</strong>
                  <small>{t('room_types_label')}</small>
                </div>
              </div>
              <div className="hd-stat">
                <span className="hd-stat-ic"><Icons.Door size={18} /></span>
                <div>
                  <strong>{totalRoomsCount}</strong>
                  <small>{t('total_rooms_label')}</small>
                </div>
              </div>
              <div className="hd-stat">
                <span className="hd-stat-ic"><Icons.Sparkles size={18} /></span>
                <div>
                  <strong>{sanitizedHotelAmenities.length}</strong>
                  <small>{t('section_amenities')}</small>
                </div>
              </div>
            </div>
          </section>

          {/* Amenities */}
          <section className="hd-card">
            <h2 className="hd-h2"><Icons.Check size={18} /> {t('section_amenities')}</h2>
            {sanitizedHotelAmenities.length > 0 ? (
              <ul className="hd-amen">
                {sanitizedHotelAmenities.map((amenity, index) => (
                  <li key={index}>
                    <span className="hd-amen-ic">{amenityIconFor(amenity)}</span>
                    {amenity}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hd-empty">{t('no_amenities_listed')}</p>
            )}
          </section>

          {/* Room types */}
          {rooms && rooms.length > 0 && (
            <section className="hd-card hd-span-3">
              <h2 className="hd-h2">
                <Icons.Users size={18} />
                {t('room_types_pattern').replace('{count}', String(rooms.length))}
              </h2>

              <div className="hd-rooms">
                {rooms.map((room) => (
                  <article
                    key={room.room_id}
                    className="hd-room"
                    onClick={() => { setRoomImageIndex(0); setSelectedRoom(room); }}
                  >
                    {/* Room image */}
                    <div className="hd-room-img">
                      {room.primary_image_url ? (
                        <img src={room.primary_image_url} alt={room.room_type_name} onError={handleImageError} />
                      ) : (
                        <div className="hd-room-ph"><Icons.Hotel size={28} /></div>
                      )}
                      {!room.is_active || !(room.quantity_available > 0) ? (
                        <span className="hd-tag hd-tag-red">{t('room_unavailable_badge')}</span>
                      ) : (
                        <span className="hd-tag hd-tag-green">
                          {t('availability_rooms_pattern').replace('{count}', String(room.quantity_available))}
                        </span>
                      )}
                    </div>

                    {/* Room body */}
                    <div className="hd-room-body">
                      <h3>{room.room_type_name}</h3>

                      <div className="hd-room-meta">
                        <span>
                          <Icons.Users size={14} />
                          {room.capacity} {room.capacity === 1 ? t('person') : t('people')}
                        </span>
                        {room.room_size_sqm && (
                          <span>
                            <Icons.Ruler size={14} />
                            {room.room_size_sqm} m²
                          </span>
                        )}
                      </div>

                      {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                        <div className="hd-room-tags">
                          {room.amenities.slice(0, 3).map((amenity, i) => (
                            <span key={i} className="hd-room-tag">{formatAmenity(amenity)}</span>
                          ))}
                          {room.amenities.length > 3 && (
                            <span className="hd-room-tag">+{room.amenities.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="hd-room-foot">
                        <div className="hd-room-price">
                          <small>{t('per_night')}</small>
                          <strong>₱{parseFloat(room.price_per_night).toLocaleString()}</strong>
                        </div>
                        <button
                          className="hd-room-cta"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoomImageIndex(0);
                            setSelectedRoom(room);
                          }}
                        >
                          {t('view_details')}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Location */}
          {hotel.latitude && hotel.longitude && (
            <section className="hd-card hd-span-2">
              <div className="hd-h2-row">
                <h2 className="hd-h2"><Icons.MapPin size={18} /> {t('section_location')}</h2>
                <a
                  className="hd-dir"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${parseFloat(hotel.latitude)},${parseFloat(hotel.longitude)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icons.Route size={15} />
                  {t('get_directions')}
                </a>
              </div>
              <div className="hd-map">
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
            </section>
          )}

          {/* Guest rating */}
          <section className="hd-card">
            <h2 className="hd-h2"><Icons.Star size={18} /> {t('guest_rating')}</h2>
            <div className="hd-rate">
              <strong className="hd-rate-num">{parseFloat(averageRating.average || 0).toFixed(1)}</strong>
              <div>
                <div className="hd-stars">{renderStars(Math.round(parseFloat(averageRating.average || 0)))}</div>
                <small>{t('based_on_reviews_pattern').replace('{count}', String(totalReviewsCount))}</small>
              </div>
            </div>
            <div className="hd-hist">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingStats[star] || 0;
                const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div className="hd-hist-row" key={star}>
                    <span>{star}</span>
                    <Icons.Star size={11} filled />
                    <span className="hd-hist-bar"><i style={{ width: `${pct}%` }} /></span>
                    <em>{count}</em>
                  </div>
                );
              })}
            </div>
            <p className="hd-note">{ratingNote}</p>
          </section>

          {/* Reviews */}
          <section className="hd-card hd-span-3">
            <div className="hd-h2-row">
              <h2 className="hd-h2">
                <Icons.Chat size={18} />
                {t('section_guest_reviews')} ({reviews.length})
              </h2>
              {isLoggedIn && canReview && (
                <button className="hd-write" onClick={() => setShowReviewForm(!showReviewForm)}>
                  {showReviewForm ? t('cancel_button') : t('write_review_button')}
                </button>
              )}
            </div>

            {showReviewForm && (
              <form className="hd-rform" onSubmit={handleSubmitReview}>
                <h3>{t('write_your_review')}</h3>

                {/* Rating */}
                <div style={{ marginBottom: '1.1rem' }}>
                  <label className="hd-label">{t('your_rating')}</label>
                  <div className="hd-stars-pick">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        className={`hd-star-btn${star <= reviewForm.rating ? ' is-on' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        aria-label={`${star} stars`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="hd-field">
                  <label className="hd-label">{t('your_review')}</label>
                  <textarea
                    className="hd-textarea"
                    rows="4"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder={t('share_experience_placeholder')}
                  />
                </div>

                {reviewMessage && (
                  <div className={`hd-msg${reviewMessage.includes('success') ? ' ok' : ''}`}>
                    {reviewMessage}
                  </div>
                )}

                <button className="hd-send" type="submit" disabled={submittingReview}>
                  {submittingReview ? t('submitting_review') : t('submit_review')}
                </button>
              </form>
            )}

            <div className="hd-revs">
              {reviews.length === 0 ? (
                <p className="hd-norev">{t('no_reviews_yet')}</p>
              ) : (
                reviews.map((review) => (
                  <article key={review.review_id} className="hd-rev">
                    <div className="hd-rev-top">
                      <div>
                        <div className="hd-rev-name">
                          {review.first_name || review.username || t('anonymous_user')}
                        </div>
                        <div className="hd-rev-date">
                          {new Date(review.review_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="hd-rev-stars">{renderStars(review.rating)}</div>
                    </div>
                    <p className="hd-rev-comment">{review.comment}</p>
                    {review.room_type_name && (
                      <p className="hd-rev-room">
                        <Icons.Bed size={14} />
                        {review.room_type_name}
                      </p>
                    )}
                    {review.owner_reply && (
                      <div className="hd-rev-reply">
                        <div className="hd-rev-reply-label">{t('owner_reply_label')}</div>
                        <div className="hd-rev-reply-body">{review.owner_reply}</div>
                      </div>
                    )}
                    <button className="hd-help" onClick={() => handleMarkHelpful(review.review_id)}>
                      <Icons.ThumbUp size={13} />
                      {t('helpful_label')} ({review.helpful_count || 0})
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="hd-bm-back">
          <div className="hd-bm-card">
            {/* Modal Header */}
            <div className="hd-bm-head">
              <div>
                <h2>Book {hotel.name}</h2>
                <p className="hd-bm-sub">{hotel.location}</p>
              </div>
              <button className="hd-bm-close" onClick={() => {
                setShowBookingModal(false);
                setBookingError('');
              }}><Icons.X size={18} /></button>
            </div>

            <div className="hd-bm-body">
              <h3 className="hd-bm-sec-h"><Icons.Calendar size={17} /> {t('modal_stay_details')}</h3>
              <div className="hd-bm-grid">
                  <div>
                  <label className="hd-bm-label"><Icons.Calendar size={16} /> {t('form_check_in')}</label>
                  <input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => {
                      setBookingForm({ ...bookingForm, checkIn: e.target.value });
                      setBookingError('');
                    }}
                    className="hd-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="hd-bm-label"><Icons.Calendar size={16} /> {t('form_check_out')}</label>
                  <input
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => {
                      setBookingForm({ ...bookingForm, checkOut: e.target.value });
                      setBookingError('');
                    }}
                    className="hd-input"
                    min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="hd-bm-label"><Icons.User size={16} /> {t('form_guests')}</label>
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
                    className="hd-input"
                  />
                </div>
                <div>
                  <label className="hd-bm-label">
                    <Icons.Booking size={16} /> {t('form_rooms')}
                    <span className="hd-bm-max">
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
                    className="hd-input"
                  />
                </div>
                <div className="hd-bm-grid-full">
                  {/* Inline availability calendar with room-type selector */}
                  <div className="hd-bm-cals">
                    {rooms.length > 0 && (
                      <div className="hd-bm-cal-room">
                        <label htmlFor="booking-room-type" className="hd-bm-cal-room-label">
                          Select Room Type:
                        </label>
                        <select
                          id="booking-room-type"
                          value={bookingForm.selectedRoomId || ''}
                          onChange={handleRoomSelectChange}
                          className="hd-bm-cal-room-select"
                        >
                          <option value="">All room types</option>
                          {suitableRoomTypesForGuests.length > 0 ? (
                            suitableRoomTypesForGuests.map((room) => {
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
                            })
                          ) : (
                            <option value="" disabled>{`No room types available for ${bookingForm.guests} guest(s)`}</option>
                          )}
                        </select>
                      </div>
                    )}
                    <div className="hd-bm-cal-nav">
                      <button className="hd-bm-cal-nav-btn" onClick={() => changeCalendarMonth(-1)} aria-label={t('prev')}>
                        &#8249;
                      </button>
                      <div className="hd-bm-cal-month">
                        {calendarMonth.toLocaleDateString(getCalendarLocale(language), { month: 'long', year: 'numeric' })}
                      </div>
                      <button className="hd-bm-cal-nav-btn" onClick={() => changeCalendarMonth(1)} aria-label={t('next')}>
                        &#8250;
                      </button>
                    </div>

                    {calendarLoading ? (
                      <div className="hd-bm-cal-msg">{t('loading')}</div>
                    ) : calendarError ? (
                      <div className="hd-bm-cal-msg is-error">{calendarError}</div>
                    ) : (
                      <>
                        <div className="hd-cal-grid">
                          {getWeekdayLabels(getCalendarLocale(language)).map((label, idx) => (
                            <div key={`wd-${idx}`} className="hd-cal-wd">{label}</div>
                          ))}
                          {buildCalendarDays(calendarMonth).map((date, idx) => {
                            if (!date) return <div key={`empty-${idx}`} className="hd-cal-day is-empty" />;

                            const dateKey = toCalendarDateKey(date);
                            const day = calendarDays[dateKey];
                            const todayKey = toCalendarDateKey(new Date());
                            const isPast = dateKey < todayKey;
                            const isClosed = day?.closed === 1;
                            const isFull = !!day && Number(day.available) <= 0;
                            const isSelectable = isCalendarDayBookable(dateKey);
                            const isSelected = calendarRange.start === dateKey || calendarRange.end === dateKey;
                            const inRange = !!calendarRange.start && !!calendarRange.end
                              && dateKey > calendarRange.start && dateKey < calendarRange.end;

                            const dayState = [
                              isPast ? 'is-past' : '',
                              isSelected ? 'is-selected' : '',
                              inRange ? 'is-range' : '',
                              isClosed ? 'is-closed' : '',
                              isFull ? 'is-full' : '',
                              isSelectable ? 'is-selectable' : ''
                            ].filter(Boolean).join(' ');

                            return (
                              <div
                                key={dateKey}
                                onClick={() => isSelectable && handleCalendarDayClick(dateKey)}
                                title={day && day.price != null ? `₱${Number(day.price).toLocaleString()}` : undefined}
                                className={`hd-cal-day${dayState ? ` ${dayState}` : ''}`}
                              >
                                <div className="hd-cal-day-num">{date.getDate()}</div>
                                {isClosed ? (
                                  <div className="hd-cal-day-tag is-closed">Closed</div>
                                ) : isFull ? (
                                  <div className="hd-cal-day-tag is-full">{t('availability_sold_out')}</div>
                                ) : day ? (
                                  <div className="hd-cal-day-tag">
                                    {Number(day.available)} {t('form_rooms').toLowerCase()}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        <div className="hd-cal-legend">
                          <span className="hd-cal-leg-item">
                            <span className="hd-cal-swatch is-avail" />
                            {t('available_label')}
                          </span>
                          <span className="hd-cal-leg-item">
                            <span className="hd-cal-swatch is-selected" />
                            Selected
                          </span>
                          <span className="hd-cal-leg-item">
                            <span className="hd-cal-swatch is-full" />
                            {t('availability_sold_out')}
                          </span>
                          <span className="hd-cal-leg-item">
                            <span className="hd-cal-swatch is-closed" />
                            Closed
                          </span>
                          <span className="hd-cal-leg-item">
                            <span className="hd-cal-swatch is-past" />
                            Past
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <h3 className="hd-bm-sec-h"><Icons.User size={17} /> {t('modal_guest_information')}</h3>
              <div className="hd-bm-grid">
                <div className="hd-bm-grid-full">
                  <label className="hd-bm-label"><Icons.User size={16} /> {t('form_full_name')}</label>
                  <input
                    type="text"
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    className="hd-input"
                    placeholder={t('placeholder_full_name')}
                  />
                </div>
                <div>
                  <label className="hd-bm-label"><Icons.Email size={16} /> {t('form_email')}</label>
                  <input
                    type="email"
                    value={bookingForm.customerEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                    className="hd-input"
                    placeholder={t('placeholder_email')}
                  />
                </div>
                <div>
                  <label className="hd-bm-label"><Icons.Phone size={16} /> {t('form_phone')}</label>
                  <div className="hd-bm-phone">
                    <input
                      type="text"
                      value="+63"
                      readOnly
                      className="hd-input hd-bm-prefix"
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
                      className="hd-input"
                      placeholder="9XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              <h3 className="hd-bm-sec-h"><Icons.Money size={17} /> {t('modal_payment_details')}</h3>

              <div>
                <label className="hd-bm-label">Payment option</label>
                <div className="hd-bm-payopts">
                  {paymentOptionChoices.map((choice) => {
                    const isSelected = selectedPaymentOption === choice.value;
                    const due = computeDueNow(choice.value);
                    return (
                      <button
                        key={choice.value}
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, paymentOption: choice.value })}
                        className={`hd-bm-payopt${isSelected ? ' is-selected' : ''}`}
                      >
                        <span className="hd-bm-payopt-t">{choice.title}</span>
                        <span className="hd-bm-payopt-s">{choice.subtitle}</span>
                        <span className="hd-bm-payopt-p">
                          {due !== null
                            ? `₱${due.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : modalNights > 0 ? 'Select room' : 'Enter dates'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedDueNow !== null && selectedBalanceDue > 0 && (
                  <div className="hd-bm-balance">
                    <Icons.Money size={13} /> Balance of ₱{selectedBalanceDue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {selectedBalanceDueAt ? ` due by ${selectedBalanceDueAt}` : ''} (before check-in).
                  </div>
                )}
              </div>

              <div className="hd-bm-grid">
                <div className="hd-bm-grid-full">
                  <label className="hd-bm-label">{t('form_payment_method')}</label>
                  <select
                    value={bookingForm.paymentMethod}
                    onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                    className="hd-input"
                  >
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {bookingForm.paymentMethod === 'card' && (
                <div>
                  <label className="hd-bm-label"><Icons.Shield size={16} /> {t('form_card_last_4')}</label>
                  <input
                    type="text"
                    maxLength="4"
                    value={bookingForm.cardLast4}
                    onChange={(e) => setBookingForm({ ...bookingForm, cardLast4: e.target.value.replace(/\D/g, '') })}
                    className="hd-input"
                    placeholder={t('placeholder_card_last_4')}
                  />
                  <div className="hd-bm-note"><Icons.Shield size={13} /> {t('form_secure_note')}</div>
                </div>
              )}

              <h3 className="hd-bm-sec-h"><Icons.Document size={17} /> {t('modal_additional_info')}</h3>
              <div>
                <label className="hd-bm-label">{t('form_special_requests')}</label>
                <textarea
                  rows="4"
                  value={bookingForm.specialRequests}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                  className="hd-textarea"
                  placeholder={t('placeholder_special_requests')}
                />
              </div>

              {/* Booking policies — shown before payment confirmation */}
              <h3 className="hd-bm-sec-h"><Icons.ShieldCheck size={17} /> {t('booking_policies_title')}</h3>
              <div className="hd-bm-policies">
                {policyLines.map((line, idx) => {
                  const IconComp = Icons[POLICY_LINE_ICONS[line.icon] || 'Info'];
                  return (
                    <div key={idx} className="hd-bm-policyline">
                      <span className="hd-bm-policyic">
                        <IconComp size={14} />
                      </span>
                      <span>{line.text}</span>
                    </div>
                  );
                })}
                <label className="hd-bm-policyagree">
                  <input
                    type="checkbox"
                    checked={policyAgreed}
                    onChange={(e) => setPolicyAgreed(e.target.checked)}
                  />
                  <span>{t('agree_policies_checkbox')}</span>
                </label>
              </div>

              {slowConnection && !checkoutState && (
                <div className="hd-bm-slow">
                  Slow connection detected. Please wait while we process your booking...
                </div>
              )}

              {checkoutState && (
                <div className="hd-bm-checkout">
                  <div>
                    <strong>Payment Window Opening</strong>
                    <p>
                      If the payment window doesn't open automatically, click the button below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(checkoutState.url, '_blank', 'noopener,noreferrer')}
                    className="hd-bm-checkout-btn"
                  >
                    {t('open_payment')}
                  </button>
                </div>
              )}

              {bookingError && (
                <div className="hd-bm-error">
                  <div className="hd-bm-error-row">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {getErrorMessage(bookingError)}
                  </div>
                  {pendingBookingId && (
                    <button
                      type="button"
                      className="hd-bm-goto"
                      onClick={() => { setShowBookingModal(false); navigate('/bookings'); }}
                    >
                      {t('go_to_bookings_cta')}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="hd-bm-foot">
              <button className="hd-bm-cancel" onClick={() => setShowBookingModal(false)}>
                <span className="hd-bm-foot-ic"><Icons.X size={15} /> {t('cancel_button')}</span>
              </button>
              <button
                className={`hd-bm-confirm${isSubmitting || !policyAgreed ? ' is-disabled' : ''}`}
                onClick={handleSubmitBooking}
                disabled={isSubmitting || !!checkoutState || !policyAgreed}
              >
                {slowConnection ? (
                  <span className="hd-bm-foot-ic"><Icons.Clock size={15} /> {t('button_connecting_slow')}</span>
                ) : isSubmitting ? (
                  <span className="hd-bm-foot-ic"><Icons.Clock size={15} /> {t('processing')}</span>
                ) : (
                  <span className="hd-bm-foot-ic"><Icons.Check size={15} /> {t('confirm_booking')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Owner Modal */}
      {showContactModal && (
        <div className="hd-modal-back">
          <div className="hd-cmodal">
            {/* Modal header */}
            <div className="hd-cmodal-head">
              <div>
                <h2 className="hd-cmodal-title">{t('modal_contact_title')}</h2>
                <p className="hd-cmodal-sub">{t('get_in_touch_owner')}</p>
              </div>
              <button
                className="hd-cmodal-close"
                onClick={() => setShowContactModal(false)}
              >
                <Icons.X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form className="hd-cmodal-body" onSubmit={handleSubmitContact}>
              <div className="hd-cmodal-contacts">
                <div className="hd-cmodal-row">
                  <Icons.Phone size={17} />
                  <div className="hd-cmodal-row-txt">
                    <small>{t('phone')}</small>
                    <strong>{hotel.phone || t('contact_not_available')}</strong>
                  </div>
                  <button
                    className="hd-copy"
                    type="button"
                    onClick={() => copyToClipboard(hotel.phone)}
                    disabled={!hotel.phone}
                  >
                    <Icons.Copy size={12} />
                    {t('copy_button')}
                  </button>
                </div>
                <div className="hd-cmodal-row">
                  <Icons.Email size={17} />
                  <div className="hd-cmodal-row-txt">
                    <small>{t('email')}</small>
                    <strong>{hotel.email || t('contact_not_available')}</strong>
                  </div>
                  <button
                    className="hd-copy"
                    type="button"
                    onClick={() => copyToClipboard(hotel.email)}
                    disabled={!hotel.email}
                  >
                    <Icons.Copy size={12} />
                    {t('copy_button')}
                  </button>
                </div>
              </div>

              <div className="hd-field">
                <label className="hd-label">{t('form_subject')}</label>
                <input
                  className="hd-input"
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder={t('contact_owner_subject_placeholder')}
                  required
                />
              </div>

              <div className="hd-field">
                <label className="hd-label">{t('form_message')}</label>
                <textarea
                  className="hd-textarea"
                  rows="5"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder={t('contact_owner_message_placeholder')}
                  required
                />
              </div>

              {contactMessage && (
                <div className={`hd-msg${contactMessage.includes('success') ? ' ok' : ''}`}>
                  {contactMessage}
                </div>
              )}

              <div className="hd-form-actions">
                <button className="hd-btn-quiet" type="button" onClick={() => setShowContactModal(false)}>
                  {t('cancel_button')}
                </button>
                <button className="hd-send" type="submit">
                  {t('send_message')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Details Modal */}
      {selectedRoom && (
        <div className="hd-modal-back hd-rm-back">
          <div className="hd-rm-panel">
            <button className="hd-rm-close" onClick={closeRoomModal} aria-label="Close">
              <Icons.X size={18} />
            </button>

            <div className="hd-rm-scroll">
              <div className="hd-rm-grid">
                {/* Left: details */}
                <div className="hd-rm-main">
                  {/* Gallery */}
                  <div className="hd-rm-gallery hd-rm-gallery-zoom">
                    {roomImages.length > 0 ? (
                      <img
                        src={roomImages[roomImgIndex]}
                        alt={selectedRoom.room_type_name}
                        onError={handleImageError}
                        onClick={() => setFullscreenImage(roomImages[roomImgIndex])}
                      />
                    ) : (
                      <div className="hd-rm-ph"><Icons.Bed size={56} /></div>
                    )}
                    <button
                      className="hd-rm-gnav hd-rm-gprev"
                      aria-label="Previous photo"
                      disabled={roomImgIndex <= 0}
                      onClick={() => setRoomImageIndex(Math.max(0, roomImgIndex - 1))}
                    >
                      <Icons.ChevronLeft size={18} />
                    </button>
                    <button
                      className="hd-rm-gnav hd-rm-gnext"
                      aria-label="Next photo"
                      disabled={roomImgIndex >= roomImages.length - 1}
                      onClick={() => setRoomImageIndex(Math.min(roomImages.length - 1, roomImgIndex + 1))}
                    >
                      <Icons.ChevronRight size={18} />
                    </button>
                    <span className="hd-rm-gcount">
                      <Icons.Camera size={12} />
                      {roomImgIndex + 1} / {Math.max(roomImages.length, 1)}
                    </span>
                    {roomUnavailable ? (
                      <span className="hd-rm-flag hd-rm-flag-bad">
                        <Icons.Info size={12} /> {t('room_currently_unavailable')}
                      </span>
                    ) : roomPromoOnly ? (
                      <span className="hd-rm-flag hd-rm-flag-amber">
                        <Icons.Megaphone size={12} /> {t('promo_listing')}
                      </span>
                    ) : (
                      <span className="hd-rm-flag hd-rm-flag-ok">
                        <Icons.Check size={12} /> Instant Confirmation
                      </span>
                    )}
                  </div>

                  {/* Title + chips */}
                  <div className="hd-rm-head">
                    <h2>{selectedRoom.room_type_name}</h2>
                    <p>
                      <Icons.MapPin size={13} />
                      {hotel.name} · {hotel.location}
                    </p>
                    <div className="hd-rm-chips">
                      <span className="hd-rm-chip hd-rm-chip-green">
                        <Icons.Check size={12} /> {t('booking_benefit_free_cancellation')}
                      </span>
                      <span className="hd-rm-chip hd-rm-chip-green">
                        <Icons.Calendar size={12} /> {t('instant_booking')}
                      </span>
                      <span className="hd-rm-chip hd-rm-chip-amber">
                        <Icons.Star size={12} filled /> {t('best_value')}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedRoom.description && (
                    <p className="hd-rm-desc">{selectedRoom.description}</p>
                  )}

                  {/* Stats bento */}
                  <div className="hd-rm-stats">
                    <div className="hd-rm-stat">
                      <Icons.Users size={16} />
                      <p className="hd-rm-stat-label">Capacity</p>
                      <p className="hd-rm-stat-value">
                        {selectedRoom.capacity} {selectedRoom.capacity === 1 ? t('person') : t('people')}
                      </p>
                    </div>
                    {selectedRoom.bed_type ? (
                      <div className="hd-rm-stat">
                        <Icons.Bed size={16} />
                        <p className="hd-rm-stat-label">Bed Type</p>
                        <p className="hd-rm-stat-value">{selectedRoom.bed_type}</p>
                      </div>
                    ) : null}
                    {selectedRoom.room_size_sqm ? (
                      <div className="hd-rm-stat">
                        <Icons.Ruler size={16} />
                        <p className="hd-rm-stat-label">Room Size</p>
                        <p className="hd-rm-stat-value">{selectedRoom.room_size_sqm} m²</p>
                      </div>
                    ) : (
                      <div className="hd-rm-stat">
                        <Icons.Calendar size={16} />
                        <p className="hd-rm-stat-label">Availability</p>
                        <p className="hd-rm-stat-value">{selectedRoom.quantity_available}</p>
                      </div>
                    )}
                  </div>

                  {/* Guest rating */}
                  <div className="hd-rm-rating">
                    <p className="hd-rm-rating-score">
                      {parseFloat(averageRating.average || 0).toFixed(1)}
                      <span className="hd-rm-stars">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Icons.Star key={i} size={15} filled={i < Math.round(parseFloat(averageRating.average || 0))} />
                        ))}
                      </span>
                    </p>
                    <p className="hd-rm-rating-sub">
                      {totalReviewsCount > 0
                        ? t('based_on_reviews_pattern').replace('{count}', String(totalReviewsCount))
                        : t('no_reviews_yet')}
                    </p>
                  </div>

                  {/* Amenities */}
                  <div className="hd-rm-sec">
                    <p className="hd-rm-sec-title">Amenities</p>
                    {roomAmenities.length > 0 ? (
                      <div className="hd-rm-amen">
                        {roomAmenities.map((amenity, i) => (
                          <div className="hd-rm-amen-row" key={i}>
                            <span className="hd-rm-amen-ic">{amenityIconFor(amenity)}</span>
                            <p>{amenity}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="hd-rm-empty">{t('no_amenities_listed')}</p>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="hd-rm-sec">
                    <p className="hd-rm-sec-title">Why guests love this room</p>
                    <div className="hd-rm-grid2">
                      {(Array.isArray(selectedRoom.room_features) && selectedRoom.room_features.length > 0
                        ? selectedRoom.room_features
                        : ['Modern Design', 'Great Views', 'Premium Beds', 'Luxury Bath']
                      ).slice(0, 8).map((text, i) => {
                        const IconComponent = [Icons.Sparkles, Icons.Mountain, Icons.Heart, Icons.Waves][i % 4];
                        return (
                          <div className="hd-rm-mini" key={i}>
                            <span className="hd-rm-mini-ic"><IconComponent size={14} /></span>
                            <p>{text}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Guest quotes (room-specific only, hidden when none) */}
                  {roomQuotes.length > 0 && (
                    <div className="hd-rm-sec">
                      <p className="hd-rm-sec-title">What guests say</p>
                      <div className="hd-rm-grid2">
                        {roomQuotes.map((review) => (
                          <div className="hd-rm-quote" key={review.review_id || review.id}>
                            <span className="hd-rm-stars">
                              {[0, 1, 2, 3, 4].map((s) => (
                                <Icons.Star
                                  key={s}
                                  size={12}
                                  filled={s < Math.round(Number(review.rating) || 0)}
                                />
                              ))}
                            </span>
                            <p>"{review.comment}"</p>
                            <small>
                              {review.first_name || review.username || 'Guest'} ·{' '}
                              {review.review_date ? new Date(review.review_date).toLocaleDateString() : ''}
                            </small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Policies */}
                  <div className="hd-rm-sec">
                    <p className="hd-rm-sec-title">Room rules &amp; policies</p>
                    <div className="hd-rm-grid2">
                      <div className="hd-rm-policy">
                        <p className="hd-rm-policy-t"><Icons.Clock size={14} /> Check-in / Check-out</p>
                        <p className="hd-rm-policy-d">
                          Check-in: {fmtTime(selectedRoom.check_in_time || '14:00')} · Check-out: {fmtTime(selectedRoom.check_out_time || '11:00')}
                        </p>
                      </div>
                      <div className="hd-rm-policy">
                        <p className="hd-rm-policy-t"><Icons.Filter size={14} /> Pet Policy</p>
                        <p className="hd-rm-policy-d">{Number(selectedRoom.pets_allowed) ? 'Pets allowed' : 'Pets not allowed'}</p>
                      </div>
                      <div className="hd-rm-policy">
                        <p className="hd-rm-policy-t"><Icons.Info size={14} /> Smoking Policy</p>
                        <p className="hd-rm-policy-d">{Number(selectedRoom.smoking_allowed) ? 'Smoking allowed' : 'Non-smoking room'}</p>
                      </div>
                      <div className="hd-rm-policy">
                        <p className="hd-rm-policy-t"><Icons.X size={14} /> Events &amp; Parties</p>
                        <p className="hd-rm-policy-d">{Number(selectedRoom.events_allowed) ? 'Permitted' : 'Not permitted'}</p>
                      </div>
                    </div>
                  </div>

                  {/* FAQ */}
                  <div className="hd-rm-sec">
                    <p className="hd-rm-sec-title">Common questions</p>
                    <div className="hd-rm-faq">
                      {[
                        { q: 'Can I modify my booking?', a: 'Yes, free modifications up to 7 days before check-in' },
                        { q: 'What is the earliest check-in?', a: '2:00 PM standard, subject to availability' },
                        { q: 'Is breakfast included?', a: 'Yes, complimentary daily breakfast' },
                        { q: 'Is WiFi available?', a: 'Yes, free high-speed WiFi throughout' }
                      ].map((item, i) => (
                        <details className="hd-rm-faq-item" key={i}>
                          <summary>
                            <span><Icons.Info size={13} /> {item.q}</span>
                            <span className="hd-rm-chev"><Icons.ChevronDown size={14} /></span>
                          </summary>
                          <p>{item.a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: booking panel */}
                <div className="hd-rm-side">
                  <div className="hd-rm-side-inner">
                    {/* Perfect for */}
                    <div className="hd-rm-sec">
                      <p className="hd-rm-sec-title">Perfect for</p>
                      <div className="hd-rm-grid2">
                        {[
                          { icon: Icons.Users, label: 'Family Trips', detail: '3–4 guests with comfort' },
                          { icon: Icons.Heart, label: 'Couples', detail: 'Romantic getaway' },
                          { icon: Icons.MapPin, label: 'Business Travel', detail: 'Work & relaxation' },
                          { icon: Icons.User, label: 'Solo Travelers', detail: 'Independent exploration' }
                        ].map((item, idx) => {
                          const IconComponent = item.icon;
                          return (
                            <div className="hd-rm-perfect" key={idx}>
                              <IconComponent size={14} />
                              <p className="hd-rm-perfect-l">{item.label}</p>
                              <p className="hd-rm-perfect-d">{item.detail}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price + availability */}
                    <div className="hd-rm-pricebox">
                      <div>
                        <p className="hd-rm-sec-title">Price per night</p>
                        <p className="hd-rm-price">₱{parseFloat(selectedRoom.price_per_night).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="hd-rm-sec-title">Availability</p>
                        <p className={`hd-rm-avail${selectedRoom.quantity_available > 0 ? '' : ' bad'}`}>
                          <span className="hd-rm-dot" />
                          {selectedRoom.quantity_available > 0 ? selectedRoom.quantity_available : '0'}
                        </p>
                        <p className="hd-rm-avail-sub">
                          {selectedRoom.quantity_available > 0
                            ? t('availability_rooms_pattern').replace('{count}', String(selectedRoom.quantity_available))
                            : t('room_currently_unavailable')}
                        </p>
                      </div>
                    </div>

                    {/* Perks */}
                    <div className="hd-rm-perks">
                      <div className="hd-rm-perk hd-rm-perk-amber">
                        <Icons.Money size={15} />
                        <p className="hd-rm-perk-t">BEST RATES</p>
                        <p className="hd-rm-perk-d">Guaranteed best price</p>
                      </div>
                      <div className="hd-rm-perk hd-rm-perk-green">
                        <Icons.Check size={15} />
                        <p className="hd-rm-perk-t">INSTANT BOOK</p>
                        <p className="hd-rm-perk-d">Confirmation within 2 hours</p>
                      </div>
                      <div className="hd-rm-perk hd-rm-perk-purple">
                        <Icons.Sparkles size={15} />
                        <p className="hd-rm-perk-t">WELCOME OFFER</p>
                        <p className="hd-rm-perk-d">Special perks for new guests</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className={`hd-rm-status${selectedRoom.is_active ? '' : ' bad'}`}>
                      <p className="hd-rm-status-label">Room status</p>
                      <p className="hd-rm-status-value">
                        <Icons.Check size={14} />
                        {!roomUnavailable ? t('available_for_booking') : t('room_currently_unavailable')}
                      </p>
                    </div>

                    {roomPromoOnly && (
                      <div className="hd-rm-note">
                        <Icons.Megaphone size={13} />
                        <p>{t('listing_only_notice')}</p>
                      </div>
                    )}

                    {/* Desktop CTA */}
                    <div className="hd-rm-cta">
                      {roomBookable && (
                        <button className="hd-rm-book" onClick={roomBookNow}>{t('book_now')}</button>
                      )}
                      <button
                        className={`hd-rm-share${roomBookable ? '' : ' full'}`}
                        onClick={shareRoom}
                        title={t('share_this_room')}
                        aria-label={t('share_this_room')}
                      >
                        <Icons.ArrowUpRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile sticky CTA */}
            <div className="hd-rm-mbar">
              <div className="hd-rm-mbar-price">
                <small>{t('per_night')}</small>
                <strong>₱{parseFloat(selectedRoom.price_per_night).toLocaleString()}</strong>
              </div>
              {roomBookable ? (
                <button className="hd-rm-book" onClick={roomBookNow}>{t('book_now')}</button>
              ) : (
                <button
                  className="hd-rm-share"
                  onClick={shareRoom}
                  title={t('share_this_room')}
                  aria-label={t('share_this_room')}
                >
                  <Icons.ArrowUpRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Room Management Modal */}
      {managingRoomsHotel && (
        <div className="hd-modal-back hd-rm-back" onClick={(e) => { if (e.target === e.currentTarget) setManagingRoomsHotel(null); }}>
          <div className="hd-rm-panel">
            <button className="hd-rm-close" onClick={() => setManagingRoomsHotel(null)} aria-label="Close">
              <Icons.X size={18} />
            </button>

            <RoomManagement
              hotel={managingRoomsHotel}
              onClose={() => setManagingRoomsHotel(null)}
              t={t}
              onRoomsChanged={refreshRooms}
            />
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {fullscreenImage && (
        <div className="hd-lightbox" onClick={() => setFullscreenImage(null)}>
          <img src={fullscreenImage} alt={hotel.name} onClick={(e) => e.stopPropagation()} />
          <button
            className="hd-lightbox-close"
            onClick={() => setFullscreenImage(null)}
            aria-label="Close image"
          >
            <Icons.X size={20} />
          </button>
        </div>
      )}

      {/* Copy toast */}
      {toastText && <div className="hd-toast">{toastText}</div>}
    </div>
  );
}

// Styles
const mapStyle = {
  width: '100%',
  height: '100%'
};
