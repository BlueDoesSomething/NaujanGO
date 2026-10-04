import React, { useEffect, useState } from 'react';
import Icons from '../components/Icons';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { BookingsLineChart, RevenueBarChart, ChartLoader } from '../components/AdminCharts';
import ReportsAndAnalyticsDashboard from '../components/ReportsAndAnalyticsDashboard';
import api from '../api';
import Pagination from '../components/Pagination';
import RoomManagement from '../components/RoomManagement';
import RoomRevenueReport from '../components/RoomRevenueReport';
import { policyChip } from '../utils/bookingPolicy';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import naujanGoLogo from '../assets/552820828_1195483019268738_3720769628710779316_n.png';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './OwnerDashboard.css';
import './HotelDetail.css';

const getHotelPaymentMethodOptions = (t) => [
  { value: 'card', label: t('payment_provider_card') },
  { value: 'gcash', label: t('payment_provider_gcash') },
  { value: 'grabpay', label: t('payment_provider_grabpay') },
  { value: 'qrph', label: t('payment_provider_qrph') || 'QR PH' },
  { value: 'paypal', label: t('payment_provider_paypal') },
  { value: 'bank_transfer', label: t('payment_provider_bank_transfer') },
  { value: 'pay_at_property', label: t('payment_method_pay_at_property') }
];

const PAYMENT_METHOD_LABELS = {
  card: 'Credit/Debit Card',
  gcash: 'GCash',
  grabpay: 'GrabPay',
  qrph: 'QR PH',
  paypal: 'PayPal',
  bank_transfer: 'Bank Transfer',
  pay_at_property: 'Pay at Property'
};

const getPaymentMethodLabel = (method, t) => {
  if (!method) return 'N/A';
  const key = PAYMENT_METHOD_LABELS[String(method).toLowerCase()];
  if (key) return t(`payment_provider_${String(method).toLowerCase()}`) || PAYMENT_METHOD_LABELS[String(method).toLowerCase()];
  return method;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const emptyHotelForm = {
    name: '',
    location: '',
    description: '',
    price_per_night: '',
    currency: 'PHP',
    rating: '',
    amenities: '',
    image_url: '',
    image_urls: [],
    allowed_payment_methods: ['card', 'gcash', 'grabpay', 'qrph', 'paypal', 'bank_transfer', 'pay_at_property'],
    reservation_fee: '',
    map_url: '',
    contact_phone: '',
    contact_email: '',
    latitude: '',
    longitude: '',
    cancellation_type: 'free_until',
    free_cancellation_days: 1,
    balance_due_days: 1,
    check_in_time: '14:00',
    check_out_time: '12:00',
    house_rules: '',
    custom_policy_text: '',
    is_active: 1
  };

  const [stats, setStats] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [paymentDateFrom, setPaymentDateFrom] = useState('');
  const [paymentDateTo, setPaymentDateTo] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodSettings, setPaymentMethodSettings] = useState(['card', 'gcash', 'paypal', 'bank_transfer', 'pay_at_property']);
  const [paymentMethodSettingsSaving, setPaymentMethodSettingsSaving] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingHotel, setEditingHotel] = useState(null);
  const [creatingHotel, setCreatingHotel] = useState(false);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const [hotelSaving, setHotelSaving] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [managingRoomsHotel, setManagingRoomsHotel] = useState(null);
  const [reportHotel, setReportHotel] = useState(null);
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const dedupePaymentsByBooking = (paymentRows) => {
    const latestByBooking = new Map();

    (Array.isArray(paymentRows) ? paymentRows : []).forEach((payment) => {
      const bookingKey = payment.booking_id ?? payment.transaction_reference ?? payment.payment_id;
      const existing = latestByBooking.get(bookingKey);

      if (!existing) {
        latestByBooking.set(bookingKey, payment);
        return;
      }

      const existingId = Number(existing.payment_id) || 0;
      const nextId = Number(payment.payment_id) || 0;
      const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
      const nextTime = new Date(payment.updated_at || payment.created_at || 0).getTime();

      if (nextId > existingId || nextTime >= existingTime) {
        latestByBooking.set(bookingKey, payment);
      }
    });

    return Array.from(latestByBooking.values()).sort((a, b) => {
      const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
      const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
      return bTime - aTime || (Number(b.payment_id) || 0) - (Number(a.payment_id) || 0);
    });
  };
  
    // Booking Management State
    const [bookingFilter, setBookingFilter] = useState('all');
    const [bookingSearch, setBookingSearch] = useState('');
  
    // Business Profile State
    const [businessProfile, setBusinessProfile] = useState({
      business_name: user?.first_name || user?.username || '',
      business_email: user?.email || '',
      business_phone: user?.phone || '',
      business_address: '',
      tax_id: '',
      bank_name: '',
      bank_account: '',
      business_permit_no: '',
      business_permit_expiry: '',
      business_permit_file: '',
      dot_no: '',
      dot_expiry: '',
      dot_file: '',
      philgeps_no: '',
      philgeps_expiry: '',
      philgeps_file: ''
    });
    const [profileEditing, setProfileEditing] = useState(false);
    // Full vs limited dashboard authorization (legitimacy requirements)
    const [authorization, setAuthorization] = useState('full');
    const [missingRequirements, setMissingRequirements] = useState([]);
    const [profileStatus, setProfileStatus] = useState({ verification_status: 'pending', rejection_reason: '' });
    const [docUploading, setDocUploading] = useState('');
  
    // Availability Calendar State
    const [selectedHotelForCalendar, setSelectedHotelForCalendar] = useState(null);
    const [availabilityForm, setAvailabilityForm] = useState({
      rooms_total: '',
      rooms_available: '',
      is_active: 1
    });
    const [availabilitySaving, setAvailabilitySaving] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => new Date());
    const [availabilityByDate, setAvailabilityByDate] = useState({});
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [selectedAvailabilityRange, setSelectedAvailabilityRange] = useState({ start: null, end: null });
    const [availabilityEditForm, setAvailabilityEditForm] = useState({
      rooms_available: '',
      is_closed: 0
    });
    const [rooms, setRooms] = useState([]);
  
    // Review Management State
    const [replyingToReview, setReplyingToReview] = useState(null);
    const [reviewReply, setReviewReply] = useState('');
  
    // Notifications State
    const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
    const [messageSearch, setMessageSearch] = useState('');
    const [messageFilter, setMessageFilter] = useState('all');
    const [messageComposer, setMessageComposer] = useState(null);
    const [messageSending, setMessageSending] = useState(false);
    const [messageSendError, setMessageSendError] = useState('');
  const [archivedBookings, setArchivedBookings] = useState([]);
  const [archivedPayments, setArchivedPayments] = useState([]);
  const [archiveSubSection, setArchiveSubSection] = useState('bookings');

  // ── Pagination ─────────────────────────────────────────────────────────
  const OWNER_TABLE_SIZE = 10;
  const OWNER_CARD_SIZE  = 9;
  const [ownerHotelsPage,   setOwnerHotelsPage]   = useState(1);
  const [ownerBookingsPage, setOwnerBookingsPage] = useState(1);
  const [paymentsPage,      setPaymentsPage]      = useState(1);
  const [reviewsPage,       setReviewsPage]       = useState(1);
  
    // Analytics State
    const [analyticsData, setAnalyticsData] = useState(null);
    const [reportType, setReportType] = useState('monthly');
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedHotelForCalendar) {
      loadAvailabilityForMonth(selectedHotelForCalendar.hotel_id, calendarMonth);
    }
  }, [selectedHotelForCalendar, calendarMonth]);

  // Reset pagination when filters change
  useEffect(() => { setOwnerBookingsPage(1); }, [bookingSearch, bookingFilter]);
  useEffect(() => { setPaymentsPage(1);      }, [paymentFilter, paymentMethodFilter, paymentDateFrom, paymentDateTo, paymentSearch]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
    }
  }, [activeTab, paymentFilter, paymentMethodFilter, paymentDateFrom, paymentDateTo, paymentSearch]);

  useEffect(() => {
    if (!hotels.length) return;
    const firstHotel = hotels[0];
    if (Array.isArray(firstHotel.allowed_payment_methods) && firstHotel.allowed_payment_methods.length) {
      setPaymentMethodSettings(firstHotel.allowed_payment_methods);
    }
  }, [hotels]);

  // Lock page scroll while the Room Management modal is open (mirrors HotelDetail).
  useEffect(() => {
    if (!managingRoomsHotel) return;
    const body = document.body;
    const html = document.documentElement;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const prevHtmlOverflow = html.style.overflow;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    const onKey = (e) => {
      if (e.key === 'Escape') setManagingRoomsHotel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
      html.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [managingRoomsHotel]);

  const fetchDashboardData = async () => {
    try {
      const [hotelsRes, roomsRes, profileRes] = await Promise.all([
        api.get('/owner/hotels'),
        api.get('/owner/rooms'),
        api.get('/owner/profile')
      ]);
      setHotels(hotelsRes.data);
      setRooms(roomsRes.data);

      const profileData = profileRes.data || {};
      const bp = profileData.businessProfile;

      // Load business profile if it exists
      if (bp) {
        setBusinessProfile({
          business_name: bp.business_name || user?.first_name || user?.username || '',
          business_email: bp.business_email || user?.email || '',
          business_phone: bp.business_phone || user?.phone || '',
          business_address: bp.business_address || '',
          tax_id: bp.tax_id || '',
          bank_name: bp.bank_name || '',
          bank_account: '',
          business_permit_no: bp.business_permit_no || '',
          business_permit_expiry: bp.business_permit_expiry ? String(bp.business_permit_expiry).slice(0, 10) : '',
          business_permit_file: bp.business_permit_file || '',
          dot_no: bp.dot_no || '',
          dot_expiry: bp.dot_expiry ? String(bp.dot_expiry).slice(0, 10) : '',
          dot_file: bp.dot_file || '',
          philgeps_no: bp.philgeps_no || '',
          philgeps_expiry: bp.philgeps_expiry ? String(bp.philgeps_expiry).slice(0, 10) : '',
          philgeps_file: bp.philgeps_file || ''
        });
      }
      setProfileStatus({
        verification_status: bp?.verification_status || 'pending',
        rejection_reason: bp?.rejection_reason || ''
      });

      // Admins always get the full dashboard; owners depend on legitimacy.
      const authz = user?.role === 'admin' ? 'full' : (profileData.authorization || 'limited');
      setAuthorization(authz);
      setMissingRequirements(profileData.missing_requirements || []);

      if (authz === 'full') {
        const [statsRes, bookingsRes] = await Promise.all([
          api.get('/owner/dashboard/stats'),
          api.get('/owner/bookings')
        ]);
        setStats(statsRes.data);
        setBookings(bookingsRes.data);
      } else {
        setStats(null);
        setBookings([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 403) {
        alert('Access denied');
        navigate('/');
      }
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get('/owner/reviews');
      setReviews(res.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const params = {
        limit: 250
      };
      if (paymentFilter !== 'all') params.status = paymentFilter;
      if (paymentMethodFilter !== 'all') params.method = paymentMethodFilter;
      if (paymentDateFrom) params.startDate = paymentDateFrom;
      if (paymentDateTo) params.endDate = paymentDateTo;
      if (paymentSearch.trim()) params.search = paymentSearch.trim();

      const res = await api.get('/owner/payments', { params });
      setPayments(dedupePaymentsByBooking(res.data));
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchPaymentStats = async () => {
    try {
      const res = await api.get('/owner/payments/stats');
      setPaymentStats(res.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🔓 Logout initiated from OwnerDashboard...');
      await logout();
      console.log('✅ Logout completed, redirecting to login...');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ Logout error:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleSaveBusinessProfile = async () => {
    try {
      const payload = {
        first_name: user?.first_name,
        last_name: user?.last_name,
        phone: user?.phone,
        email: user?.email,
        businessName: businessProfile.business_name,
        businessEmail: businessProfile.business_email,
        businessPhone: businessProfile.business_phone,
        businessAddress: businessProfile.business_address,
        taxId: businessProfile.tax_id,
        bankName: businessProfile.bank_name,
        bankAccount: businessProfile.bank_account,
        // Legitimacy & accreditation details
        business_permit_no: businessProfile.business_permit_no,
        business_permit_expiry: businessProfile.business_permit_expiry,
        business_permit_file: businessProfile.business_permit_file,
        dot_no: businessProfile.dot_no,
        dot_expiry: businessProfile.dot_expiry,
        dot_file: businessProfile.dot_file,
        philgeps_no: businessProfile.philgeps_no,
        philgeps_expiry: businessProfile.philgeps_expiry,
        philgeps_file: businessProfile.philgeps_file
      };

      const res = await api.put('/owner/profile', payload);
      
      if (res.data.success) {
        alert('Business profile updated successfully!');
        setProfileEditing(false);
        // Reload profile data
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error saving business profile:', error);
      alert(error.response?.data?.error || 'Failed to save business profile');
    }
  };

  const handleDocumentUpload = async (field, file) => {
    if (!file) return;
    setDocUploading(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/owner/profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBusinessProfile((prev) => ({ ...prev, [field]: res.data.url }));
    } catch (error) {
      console.error('Document upload failed:', error);
      alert(error.response?.data?.error || 'Document upload failed');
    } finally {
      setDocUploading('');
    }
  };

  const missingLabel = (key) =>
    key === 'business_permit'
      ? t('missing_business_permit')
      : key === 'dot_or_philgeps'
        ? t('missing_dot_or_philgeps')
        : t('missing_verification');

  // One legitimacy document group (number + expiry + file upload)
  const docGroup = (label, numberLabel, noKey, expiryKey, fileKey) => {
    const submitted = Boolean(businessProfile[noKey] || businessProfile[fileKey]);
    const isVerified = profileStatus.verification_status === 'verified';
    const inputStyle = {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #c8e6c9',
      borderRadius: '8px',
      fontSize: '0.95rem',
      background: profileEditing ? 'white' : '#f8fdf7'
    };

    return (
      <div style={{ gridColumn: '1 / -1', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '1.1rem 1.25rem', background: '#fbfffb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <span style={{ fontWeight: 800, color: '#1B5E20', fontSize: '0.95rem' }}>{label}</span>
          {submitted && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              background: isVerified ? '#dcfce7' : profileStatus.verification_status === 'rejected' ? '#fee2e2' : '#fef3c7',
              color: isVerified ? '#166534' : profileStatus.verification_status === 'rejected' ? '#991b1b' : '#92400e'
            }}>
              {isVerified
                ? t('verification_verified')
                : profileStatus.verification_status === 'rejected'
                  ? t('verification_rejected')
                  : t('verification_pending')}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
              {numberLabel}
            </label>
            <input
              type="text"
              value={businessProfile[noKey]}
              onChange={(e) => setBusinessProfile({ ...businessProfile, [noKey]: e.target.value })}
              disabled={!profileEditing}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
              {t('field_doc_expiry')}
            </label>
            <input
              type="date"
              value={businessProfile[expiryKey]}
              onChange={(e) => setBusinessProfile({ ...businessProfile, [expiryKey]: e.target.value })}
              disabled={!profileEditing}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
              {t('upload_document')}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {businessProfile[fileKey] ? (
                <a
                  href={businessProfile[fileKey]}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1B5E20', wordBreak: 'break-all' }}
                >
                  {t('document_uploaded')}
                </a>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>—</span>
              )}
              {profileEditing && (
                <label className="gov-btn-ghost" style={{ cursor: 'pointer', margin: 0, padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}>
                  {docUploading === fileKey ? '…' : t('upload_document')}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => handleDocumentUpload(fileKey, e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const parseImageUrls = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          return trimmed.split(',').map(item => item.trim()).filter(Boolean);
        }
      }
      return trimmed.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
  };

    const toDateKey = (value) => {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getMonthRange = (value) => {
      const start = new Date(value.getFullYear(), value.getMonth(), 1);
      const end = new Date(value.getFullYear(), value.getMonth() + 1, 0);
      return { start, end };
    };

    const buildCalendarDays = (value) => {
      const monthStart = new Date(value.getFullYear(), value.getMonth(), 1);
      const monthEnd = new Date(value.getFullYear(), value.getMonth() + 1, 0);
      const startDay = monthStart.getDay();
      const daysInMonth = monthEnd.getDate();
      const days = [];
      for (let i = 0; i < startDay; i += 1) {
        days.push(null);
      }
      for (let day = 1; day <= daysInMonth; day += 1) {
        days.push(new Date(value.getFullYear(), value.getMonth(), day));
      }
      while (days.length % 7 !== 0) {
        days.push(null);
      }
      return days;
    };

    const isDateInRange = (dateKey, range) => {
      if (!range.start) return false;
      if (!range.end) return dateKey === range.start;
      return dateKey >= range.start && dateKey <= range.end;
    };

    const loadAvailabilityForMonth = async (hotelId, monthDate) => {
      const { start, end } = getMonthRange(monthDate);
      const startKey = toDateKey(start);
      const endKey = toDateKey(end);
      try {
        setAvailabilityLoading(true);
        const response = await api.get(`/owner/hotels/${hotelId}/availability`, {
          params: { start: startKey, end: endKey }
        });
        const nextByDate = {};
        (response.data || []).forEach((entry) => {
          nextByDate[entry.date] = entry;
        });
        setAvailabilityByDate(nextByDate);
      } catch (error) {
        console.error('Error loading availability calendar:', error);
      } finally {
        setAvailabilityLoading(false);
      }
    };

  const selectHotelForCalendar = (hotel) => {
    setSelectedHotelForCalendar(hotel);
    setAvailabilityForm({
      rooms_total: hotel.rooms_total ?? '',
      rooms_available: hotel.rooms_available ?? '',
      price_per_night: hotel.price_per_night ?? '',
      is_active: hotel.is_active ? 1 : 0
    });
    setCalendarMonth(new Date());
    setSelectedAvailabilityRange({ start: null, end: null });
    setAvailabilityEditForm({ rooms_available: '', is_closed: 0 });
  };

  const handleAvailabilitySave = async () => {
    if (!selectedHotelForCalendar) return;
    const payload = {
      rooms_total: availabilityForm.rooms_total === '' ? null : Number(availabilityForm.rooms_total),
      rooms_available: availabilityForm.rooms_available === '' ? null : Number(availabilityForm.rooms_available),
      price_per_night: availabilityForm.price_per_night === '' ? null : Number(availabilityForm.price_per_night),
      is_active: availabilityForm.is_active ? 1 : 0
    };

    try {
      setAvailabilitySaving(true);
      await api.put(`/owner/hotels/${selectedHotelForCalendar.hotel_id}`, payload);
      await fetchDashboardData();
      setSelectedHotelForCalendar((prev) =>
        prev
          ? {
              ...prev,
              rooms_total: payload.rooms_total ?? prev.rooms_total,
              rooms_available: payload.rooms_available ?? prev.rooms_available,
              price_per_night: payload.price_per_night ?? prev.price_per_night,
              is_active: payload.is_active
            }
          : prev
      );
      alert('Availability settings saved.');
    } catch (error) {
      console.error('Error saving availability settings:', error);
      alert('Failed to save availability settings.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleCalendarDateClick = (dateKey) => {
    if (!selectedAvailabilityRange.start || selectedAvailabilityRange.end) {
      setSelectedAvailabilityRange({ start: dateKey, end: null });
    } else {
      const start = selectedAvailabilityRange.start;
      const end = dateKey;
      if (start <= end) {
        setSelectedAvailabilityRange({ start, end });
      } else {
        setSelectedAvailabilityRange({ start: end, end: start });
      }
    }

    const entry = availabilityByDate[dateKey];
    setAvailabilityEditForm({
      rooms_available: entry?.rooms_available ?? '',
      is_closed: entry?.is_closed ? 1 : 0
    });
  };

  const handleAvailabilityRangeSave = async () => {
    if (!selectedHotelForCalendar || !selectedAvailabilityRange.start) return;
    const payload = {
      start_date: selectedAvailabilityRange.start,
      end_date: selectedAvailabilityRange.end || selectedAvailabilityRange.start,
      rooms_available: availabilityEditForm.rooms_available === '' ? null : Number(availabilityEditForm.rooms_available),
      is_closed: availabilityEditForm.is_closed ? 1 : 0
    };

    try {
      setAvailabilitySaving(true);
      await api.post(`/owner/hotels/${selectedHotelForCalendar.hotel_id}/availability`, payload);
      await loadAvailabilityForMonth(selectedHotelForCalendar.hotel_id, calendarMonth);
      alert('Availability updated successfully.');
    } catch (error) {
      console.error('Error saving availability calendar:', error);
      alert(error.response?.data?.error || 'Failed to save availability.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const startHotelEdit = (hotel) => {
    setCreatingHotel(false);
    setEditingHotel(hotel);
    setHotelForm({
      name: hotel.name || '',
      location: hotel.location || '',
      description: hotel.description || '',
      price_per_night: hotel.price_per_night ?? '',
      currency: hotel.currency || 'PHP',
      rating: hotel.rating ?? '',
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : (hotel.amenities || ''),
      image_url: hotel.image_url || '',
      image_urls: parseImageUrls(hotel.image_urls),
      allowed_payment_methods: Array.isArray(hotel.allowed_payment_methods) && hotel.allowed_payment_methods.length
        ? hotel.allowed_payment_methods
        : ['card', 'gcash', 'paypal', 'bank_transfer', 'pay_at_property'],
      reservation_fee: hotel.reservation_fee ?? '',
      map_url: hotel.map_url || '',
      contact_phone: hotel.contact_phone || '',
      contact_email: hotel.contact_email || '',
      latitude: hotel.latitude || '',
      longitude: hotel.longitude || '',
      cancellation_type: hotel.cancellation_type || 'free_until',
      free_cancellation_days: hotel.free_cancellation_days ?? 1,
      balance_due_days: hotel.balance_due_days ?? 1,
      check_in_time: hotel.check_in_time ? String(hotel.check_in_time).slice(0, 5) : '14:00',
      check_out_time: hotel.check_out_time ? String(hotel.check_out_time).slice(0, 5) : '12:00',
      house_rules: hotel.house_rules || '',
      custom_policy_text: hotel.custom_policy_text || '',
      is_active: hotel.is_active ? 1 : 0
    });
  };

  const handleHotelSave = async () => {
    if (!editingHotel) return;

    try {
      setHotelSaving(true);
      const imageUrls = Array.isArray(hotelForm.image_urls) ? hotelForm.image_urls.filter(Boolean) : [];
      const primaryImage = hotelForm.image_url || imageUrls[0] || '';
      const payload = {
        name: hotelForm.name,
        location: hotelForm.location,
        description: hotelForm.description,
        price_per_night: hotelForm.price_per_night === '' ? null : Number(hotelForm.price_per_night),
        currency: hotelForm.currency || 'PHP',
        rating: hotelForm.rating === '' ? null : Number(hotelForm.rating),
        amenities: hotelForm.amenities,
        image_url: primaryImage,
        image_urls: imageUrls,
        allowed_payment_methods: hotelForm.allowed_payment_methods,
        reservation_fee: hotelForm.reservation_fee === '' ? null : Number(hotelForm.reservation_fee),
        map_url: hotelForm.map_url,
        contact_phone: hotelForm.contact_phone,
        contact_email: hotelForm.contact_email,
        latitude: hotelForm.latitude === '' ? null : Number(hotelForm.latitude),
        longitude: hotelForm.longitude === '' ? null : Number(hotelForm.longitude),
        cancellation_type: hotelForm.cancellation_type || 'free_until',
        free_cancellation_days: hotelForm.free_cancellation_days === '' || hotelForm.free_cancellation_days == null ? 1 : Number(hotelForm.free_cancellation_days),
        balance_due_days: hotelForm.balance_due_days === '' || hotelForm.balance_due_days == null ? 1 : Number(hotelForm.balance_due_days),
        check_in_time: hotelForm.check_in_time || '14:00',
        check_out_time: hotelForm.check_out_time || '12:00',
        house_rules: (hotelForm.house_rules || '').trim() || null,
        custom_policy_text: (hotelForm.custom_policy_text || '').trim() || null,
        is_active: Number(hotelForm.is_active) || 0
      };

      await api.put(`/owner/hotels/${editingHotel.hotel_id}`, payload);
      setEditingHotel(null);
      setHotelForm(emptyHotelForm);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error saving hotel:', error);
      alert('Failed to save hotel. Please try again.');
    } finally {
      setHotelSaving(false);
    }
  };

  const startHotelCreate = () => {
    setCreatingHotel(true);
    setEditingHotel(null);
    setHotelForm(emptyHotelForm);
    setGalleryUrlInput('');
  };

  const handleHotelCreate = async () => {
    if (!hotelForm.name || !hotelForm.location || hotelForm.price_per_night === '') {
      alert('Hotel name, location, and price per night are required.');
      return;
    }
    try {
      setHotelSaving(true);
      const imageUrls = Array.isArray(hotelForm.image_urls) ? hotelForm.image_urls.filter(Boolean) : [];
      const primaryImage = hotelForm.image_url || imageUrls[0] || '';
      const payload = {
        name: hotelForm.name,
        location: hotelForm.location,
        description: hotelForm.description,
        price_per_night: hotelForm.price_per_night === '' ? null : Number(hotelForm.price_per_night),
        currency: hotelForm.currency || 'PHP',
        rating: hotelForm.rating === '' ? null : Number(hotelForm.rating),
        amenities: hotelForm.amenities,
        image_url: primaryImage,
        image_urls: imageUrls,
        allowed_payment_methods: hotelForm.allowed_payment_methods,
        reservation_fee: hotelForm.reservation_fee === '' ? null : Number(hotelForm.reservation_fee),
        map_url: hotelForm.map_url,
        contact_phone: hotelForm.contact_phone,
        contact_email: hotelForm.contact_email,
        latitude: hotelForm.latitude === '' ? null : Number(hotelForm.latitude),
        longitude: hotelForm.longitude === '' ? null : Number(hotelForm.longitude),
        cancellation_type: hotelForm.cancellation_type || 'free_until',
        free_cancellation_days: hotelForm.free_cancellation_days === '' || hotelForm.free_cancellation_days == null ? 1 : Number(hotelForm.free_cancellation_days),
        balance_due_days: hotelForm.balance_due_days === '' || hotelForm.balance_due_days == null ? 1 : Number(hotelForm.balance_due_days),
        check_in_time: hotelForm.check_in_time || '14:00',
        check_out_time: hotelForm.check_out_time || '12:00',
        house_rules: (hotelForm.house_rules || '').trim() || null,
        custom_policy_text: (hotelForm.custom_policy_text || '').trim() || null,
        is_active: Number(hotelForm.is_active) || 0
      };

      await api.post('/owner/hotels', payload);
      setCreatingHotel(false);
      setHotelForm(emptyHotelForm);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error creating hotel:', error);
      if (error.response?.status === 409) {
        alert('You already have a hotel. Owners can manage only one hotel.');
      } else {
        alert('Failed to create hotel. Please try again.');
      }
    } finally {
      setHotelSaving(false);
    }
  };

  const addGalleryUrl = () => {
    const trimmed = galleryUrlInput.trim();
    if (!trimmed) return;
    const next = Array.isArray(hotelForm.image_urls) ? hotelForm.image_urls.slice() : [];
    if (!next.includes(trimmed)) {
      next.push(trimmed);
      setHotelForm({ ...hotelForm, image_urls: next });
    }
    setGalleryUrlInput('');
  };

  const removeGalleryUrl = (url) => {
    const next = Array.isArray(hotelForm.image_urls)
      ? hotelForm.image_urls.filter(item => item !== url)
      : [];
    setHotelForm({ ...hotelForm, image_urls: next });
  };

  const initializeCoordinatePicker = () => {
    if (mapInstance) return;
    
    setTimeout(() => {
      const container = document.getElementById('coordinate-picker-map');
      if (!container || container.offsetHeight === 0) return;

      const center = [
        hotelForm.latitude ? parseFloat(hotelForm.latitude) : 12.42,
        hotelForm.longitude ? parseFloat(hotelForm.longitude) : 121.32
      ];

      const map = L.map('coordinate-picker-map').setView(center, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      const marker = L.marker(center, { draggable: true }).addTo(map);
      
      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        setHotelForm({
          ...hotelForm,
          latitude: pos.lat.toFixed(5),
          longitude: pos.lng.toFixed(5)
        });
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setHotelForm({
          ...hotelForm,
          latitude: e.latlng.lat.toFixed(5),
          longitude: e.latlng.lng.toFixed(5)
        });
      });

      setMapInstance(map);
    }, 100);
  };

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    try {
      setImageUploading(true);
      const uploads = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await api.post('/owner/hotels/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data?.url;
      });

      const results = await Promise.all(uploads);
      const validUrls = results.filter(Boolean);
      if (validUrls.length > 0) {
        const next = Array.isArray(hotelForm.image_urls) ? hotelForm.image_urls.slice() : [];
        validUrls.forEach(url => {
          if (!next.includes(url)) next.push(url);
        });
        setHotelForm({ ...hotelForm, image_urls: next });
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Image upload failed. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const ownerModules = [
    { id: 'overview', label: 'Overview', icon: <Icons.ChartPie size={22} /> },
    { id: 'hotels', label: 'Hotels', icon: <Icons.Hotel size={22} /> },
    { id: 'bookings', label: 'Reservations', icon: <Icons.Calendar size={22} /> },
    { id: 'calendar', label: 'Availability', icon: <Icons.Calendar size={22} /> },
    { id: 'payments', label: 'Payments', icon: <Icons.Money size={22} /> },
    { id: 'reviews', label: 'Reviews', icon: <Icons.Star size={22} /> },
    { id: 'analytics', label: 'Analytics', icon: <Icons.ChartLineUp size={22} /> },
    { id: 'profile', label: 'Business Profile', icon: <Icons.User size={22} /> },
    { id: 'messages', label: 'Messages', icon: <Icons.Email size={22} /> },
    { id: 'archive', label: 'Archive', icon: <Icons.Archive size={22} /> }
  ];

  // Limited authorization: incomplete/ unverified legitimacy requirements
  // restricts the dashboard to hotel listing management + business profile.
  const isLimitedOwner = authorization !== 'full' && user?.role !== 'admin';
  const visibleOwnerModules = isLimitedOwner
    ? ownerModules.filter((module) => module.id === 'hotels' || module.id === 'profile')
    : ownerModules;

  useEffect(() => {
    if (isLimitedOwner && !['hotels', 'profile'].includes(activeTab)) {
      setActiveTab('hotels');
    }
    if (isLimitedOwner && reportHotel) {
      setReportHotel(null);
    }
  }, [isLimitedOwner, activeTab]);

  const isCurrentUser = (userId) => String(userId) === String(user?.user_id);
  
    const ownerHotelIds = new Set(hotels.map((hotel) => hotel.hotel_id));
    const filteredPayments = payments;
    const filteredBookings = bookings.filter(booking => {
      if (ownerHotelIds.size > 0 && !ownerHotelIds.has(booking.hotel_id)) return false;
      
      // Handle archived filter
      if (bookingFilter === 'archived') {
        if (!booking.archived) return false;
      } else if (bookingFilter !== 'all') {
        if (booking.archived) return false;  // Hide archived bookings when viewing active bookings
        if (booking.status !== bookingFilter) return false;
      }
      
      if (bookingSearch) {
        const search = bookingSearch.toLowerCase();
        return (
          booking.hotel_name?.toLowerCase().includes(search) ||
          booking.username?.toLowerCase().includes(search) ||
          booking.customer_name?.toLowerCase().includes(search)
        );
      }
      return true;
    });

    const normalizedMessageSearch = messageSearch.trim().toLowerCase();
    const filteredNotifications = notifications.filter((notification) => {
      if (messageFilter === 'unread' && notification.is_read) return false;
      if (!normalizedMessageSearch) return true;
      return `${notification.title} ${notification.message}`.toLowerCase().includes(normalizedMessageSearch);
    });
    const filteredMessages = messages.filter((message) => {
      if (messageFilter === 'unread' && (message.is_read || !isCurrentUser(message.receiver_id))) return false;
      if (messageFilter === 'sent' && !isCurrentUser(message.sender_id)) return false;
      if (messageFilter === 'received' && !isCurrentUser(message.receiver_id)) return false;
      if (!normalizedMessageSearch) return true;
      return `${message.subject} ${message.message} ${message.sender_name} ${message.receiver_name}`
        .toLowerCase()
        .includes(normalizedMessageSearch);
    });
    const unreadNotificationCount = notifications.filter((notification) => !notification.is_read).length;
    const unreadMessageCount = messages.filter((message) => !message.is_read && isCurrentUser(message.receiver_id)).length;
  
    const handleBookingStatusChange = async (bookingId, newStatus) => {
      try {
        await api.put(`/owner/bookings/${bookingId}/status`, { status: newStatus });
        await fetchDashboardData();
      } catch (error) {
        console.error('Error updating booking:', error);
        alert('Failed to update booking status');
      }
    };

    const handleArchiveBooking = async (bookingId) => {
      try {
        await api.put(`/owner/bookings/${bookingId}/archive`);
        await fetchDashboardData();
        alert('Booking archived successfully');
      } catch (error) {
        console.error('Error archiving booking:', error);
        alert('Failed to archive booking');
      }
    };
  
    const handleReviewReply = async (reviewId) => {
      if (!reviewReply.trim()) return;
      try {
        await api.post(`/owner/reviews/${reviewId}/reply`, { reply: reviewReply });
        setReplyingToReview(null);
        setReviewReply('');
        await fetchReviews();
      } catch (error) {
        console.error('Error replying to review:', error);
        alert('Failed to send reply');
      }
    };
  
    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const res = await api.get('/owner/analytics');
        setAnalyticsData(res.data);
      } catch (error) {
        console.error('Error loading analytics:', error);
        setAnalyticsData({
          monthlyTrends: [],
          hotelPerformance: []
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };
  
    const loadNotifications = async () => {
      try {
        const [notifRes, messagesRes] = await Promise.all([
          api.get('/messages/notifications'),
          api.get('/messages/messages')
        ]);
        setNotifications(notifRes.data || []);
        setMessages(messagesRes.data || []);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
        setMessages([]);
      }
    };

    const markAllNotificationsRead = async () => {
      try {
        await api.put('/messages/notifications/read-all');
        setNotifications((currentNotifications) => currentNotifications.map((notification) => ({
          ...notification,
          is_read: true
        })));
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    };

    const markAllMessagesRead = async () => {
      try {
        await api.put('/messages/messages/read-all');
        setMessages((currentMessages) => currentMessages.map((message) => ({
          ...message,
          is_read: true
        })));
      } catch (error) {
        console.error('Failed to mark all messages as read:', error);
      }
    };

    const sendOwnerMessage = async (event) => {
      event.preventDefault();
      if (!messageComposer?.receiver_id || !messageComposer.message.trim()) return;

      try {
        setMessageSending(true);
        setMessageSendError('');
        await api.post('/messages/messages', {
          receiver_id: messageComposer.receiver_id,
          subject: messageComposer.subject.trim() || 'No Subject',
          message: messageComposer.message.trim()
        });
        setMessageComposer(null);
        await loadNotifications();
      } catch (error) {
        console.error('Failed to send message:', error);
        setMessageSendError(error.response?.data?.error || 'Failed to send message. Please try again.');
      } finally {
        setMessageSending(false);
      }
    };

    const loadArchivedBookings = async () => {
      try {
        const res = await api.get('/owner/bookings/archived');
        setArchivedBookings(res.data);
      } catch (error) {
        console.error('Error loading archived bookings:', error);
      }
    };

    const loadArchivedPayments = async () => {
      try {
        const res = await api.get('/owner/payments/archived');
        setArchivedPayments(res.data);
      } catch (error) {
        console.error('Error loading archived payments:', error);
      }
    };
  
    const exportReport = (type) => {
      const data = type === 'bookings' ? bookings : type === 'payments' ? payments : reviews;
      const csv = generateCSV(data);
      downloadCSV(csv, `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
    };
  
    const generateCSV = (data) => {
      if (!data || data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','));
      return [headers.join(','), ...rows].join('\n');
    };
  
    const downloadCSV = (content, filename) => {
      const blob = new Blob([content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    };

  if (loading) {
    return (
      <div className="gov-splash-screen">
        <div className="gov-splash-inner">
          <div className="gov-splash-logo">
            <img src={naujanGoLogo} alt="NaujanGO" style={{ width: '72px', height: '72px', borderRadius: '18px', objectFit: 'cover', boxShadow: '0 8px 32px rgba(46,125,50,0.3)' }} />
          </div>
          <div className="gov-splash-title">NaujanGO</div>
          <div className="gov-splash-subtitle">Owner Portal</div>
          <div className="gov-splash-bar-wrap">
            <div className="gov-splash-bar" />
          </div>
          <div className="gov-splash-skeleton">
            <div className="gov-splash-skel-sidebar">
              {[45,60,50,70,55,65].map((w, i) => (
                <div key={i} className="gov-skel-line" style={{ width: `${w}%`, animationDelay: `${i * 0.09}s` }} />
              ))}
            </div>
            <div className="gov-splash-skel-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[0,1,2].map((i) => (
                  <div key={i} className="gov-skel-card" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              {[72,85,60].map((w, i) => (
                <div key={i} className="gov-skel-line" style={{ width: `${w}%`, height: '14px', marginBottom: '0.75rem', animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
          <div className="gov-splash-dots"><span /><span /><span /></div>
          <div className="gov-splash-hint">Loading your hotel dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gov-dashboard gov-dashboard--owner">
      <div className="gov-shell">
        <aside className="gov-sidebar">
          {/* Sidebar Brand */}
          <div className="gov-sidebar-brand">
            <Link to="/owner" className="gov-brand">
              <img
                className="gov-logo-image"
                src={naujanGoLogo}
                alt="NaujanGo logo"
              />
              <div>
                <div className="gov-brand__title">Municipality of Naujan</div>
                <div className="gov-brand__subtitle">Tourism &amp; Hospitality Owner Portal</div>
              </div>
            </Link>
          </div>
          {/* Sidebar User Info */}
          <div className="gov-sidebar-user">
            <div className="gov-user__info">
              <div className="gov-user__name">{user?.first_name || user?.username}</div>
              <div className="gov-user__role">Registered Hotel Owner</div>
            </div>
            <button className="gov-logout" onClick={handleLogout}>
              {t('auth_sign_out')}
            </button>
          </div>
          <nav className={`gov-nav${visibleOwnerModules.length <= 3 ? ' gov-nav--compact' : ''}`}>
            {visibleOwnerModules.map((module, index) => {
              const isActive = activeTab === module.id;
              return (
                <button
                  key={module.id}
                  className={`gov-nav-btn${isActive ? ' is-active' : ''}`}
                  style={{ '--i': index }}
                  onClick={() => {
                    setActiveTab(module.id);
                    if (module.id === 'reviews') fetchReviews();
                    if (module.id === 'payments') { fetchPayments(); fetchPaymentStats(); }
                    if (module.id === 'analytics') loadAnalytics();
                    if (module.id === 'messages') loadNotifications();
                    if (module.id === 'archive') { loadArchivedBookings(); loadArchivedPayments(); }
                  }}
                >
                  <span className="gov-nav-btn__icon">{module.icon}</span>
                  <span className="gov-nav-btn__label">
                    {module.label}
                    {module.id === 'messages' && (unreadNotificationCount + unreadMessageCount) > 0 && (
                      <span style={{ marginLeft: '0.5rem', minWidth: '1.25rem', padding: '0.1rem 0.35rem', borderRadius: '999px', background: '#c62828', color: '#fff', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>
                        {unreadNotificationCount + unreadMessageCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="gov-main">
        {/* Overview */}
        {activeTab === 'overview' && stats && (() => {
          const total = stats.bookingStats?.total_bookings || 0;
          const confirmed = stats.bookingStats?.confirmed || 0;
          const pending = stats.bookingStats?.pending || 0;
          const cancelled = stats.bookingStats?.cancelled || 0;
          const confPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
          const pendPct = total > 0 ? Math.round((pending / total) * 100) : 0;
          const cancPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
          const outstanding = Number(stats.paymentStats?.outstanding || 0);
          const collected = Number(stats.paymentStats?.collected || 0);
          const partialBookings = Number(stats.paymentStats?.partial_bookings || 0);
          const metricCards = [
            { label: 'Hotels Managed', value: stats.hotelCount ?? 0, accent: '#16a34a', sub: 'Your property' },
            { label: 'Total Bookings', value: total, accent: '#7c3aed', sub: 'All time' },
            { label: 'Confirmed', value: confirmed, accent: '#2563eb', sub: `${confPct}% of total` },
            { label: 'Pending', value: pending, accent: '#d97706', sub: 'Awaiting action' },
            {
              label: 'Outstanding balance',
              value: outstanding,
              prefix: '₱',
              accent: '#dc2626',
              sub: `₱${collected.toLocaleString()} collected${partialBookings > 0 ? ` · ${partialBookings} partial` : ''}`
            },
          ];
          return (
            <div>
              {/* Header */}
              <div style={{ marginBottom: '2rem' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{today}</p>
                <h1 style={{ margin: '0.25rem 0 0.35rem', fontSize: '1.8rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                  Welcome back, {user?.first_name || user?.username}
                </h1>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>Here's how your property is performing.</p>
              </div>

              {/* Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${metricCards.length}, 1fr)`, gap: '1rem', marginBottom: '1.25rem' }}>
                {metricCards.map(({ label, value, accent, sub, prefix }) => (
                  <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: `3px solid ${accent}`, borderRadius: '10px', padding: '1.25rem 1.5rem' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: '0.35rem' }}>{prefix || ''}{Number(value).toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Booking Breakdown + Quick Actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>

                {/* Booking Status */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Booking Breakdown</h2>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{total.toLocaleString()} total</span>
                  </div>
                  {total > 0 && (
                    <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: '1.25rem', gap: 2 }}>
                      <div style={{ width: `${confPct}%`, background: '#16a34a', borderRadius: 99 }} />
                      <div style={{ width: `${pendPct}%`, background: '#f59e0b', borderRadius: 99 }} />
                      <div style={{ width: `${cancPct}%`, background: '#ef4444', borderRadius: 99 }} />
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                    {[
                      { label: 'Confirmed', value: confirmed, pct: confPct, color: '#16a34a', bg: '#f0fdf4' },
                      { label: 'Pending', value: pending, pct: pendPct, color: '#d97706', bg: '#fffbeb' },
                      { label: 'Cancelled', value: cancelled, pct: cancPct, color: '#dc2626', bg: '#fef2f2' },
                    ].map(({ label, value, pct, color, bg }) => (
                      <div key={label} style={{ background: bg, borderRadius: 8, padding: '0.75rem 0.9rem' }}>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginTop: '0.25rem' }}>{label}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                  <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Quick Actions</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {[
                      { label: 'Manage Bookings', sub: 'Review & update booking status', tab: 'bookings', color: '#7c3aed' },
                      { label: 'My Hotels', sub: 'Edit listing details and gallery', tab: 'hotels', color: '#2563eb' },
                      { label: 'Guest Reviews', sub: 'See what guests are saying', tab: 'reviews', color: '#16a34a' },
                      { label: 'Analytics', sub: 'Revenue & occupancy trends', tab: 'analytics', color: '#d97706' },
                    ].map(({ label, sub, tab, color }) => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderLeft: `3px solid ${color}`, borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{label}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{sub}</div>
                        </div>
                        <span style={{ color: '#d1d5db', fontSize: '0.9rem' }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Bookings */}
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>Recent Bookings</h2>
                  <button className="gov-btn gov-btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.9rem' }}
                    onClick={() => setActiveTab('bookings')}>View all</button>
                </div>
                <div className="gov-table-wrap">
                  <table className="gov-table" style={{ fontSize: '0.875rem' }}>
                    <thead>
                      <tr>
                        <th style={{ width: 70 }}>ID</th>
                        <th>Hotel</th>
                        <th>Guest</th>
                        <th>Check-in</th>
                        <th style={{ width: 110 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentBookings?.slice(0, 8).map((booking) => (
                        <tr key={booking.booking_id}>
                          <td><span style={{ fontWeight: 700, color: '#374151' }}>#{booking.booking_id}</span></td>
                          <td style={{ color: '#374151' }}>{booking.hotel_name || '—'}</td>
                          <td style={{ color: '#374151' }}>{booking.username || '—'}</td>
                          <td style={{ color: '#6b7280' }}>{new Date(booking.check_in).toLocaleDateString()}</td>
                          <td>
                            <span className={`gov-badge-status gov-badge-status--${booking.status}`}>{t(booking.status) || booking.status}</span>
                          </td>
                        </tr>
                      ))}
                      {(!stats.recentBookings || stats.recentBookings.length === 0) && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No bookings yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Hotels */}
        {activeTab === 'hotels' && (
          <div>
            <h1 className="gov-page-title">
              <Icons.Hotel size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> My Hotels
            </h1>

            {isLimitedOwner && (
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                marginBottom: '1.5rem',
                padding: '0.9rem 1.25rem',
                borderRadius: '10px',
                border: '1px solid #fde68a',
                background: '#fffbeb',
                color: '#92400e',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                <Icons.Shield size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{t('access_limited_banner')}</span>
              </div>
            )}

            {hotels.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button
                  className="gov-btn-primary"
                  onClick={startHotelCreate}
                >
                  {t('admin_add_new_hotel_btn')}
                </button>
              </div>
            ) : (
              <div style={{
                background: '#f8fdf7',
                border: '1px solid #c8e6c9',
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                color: '#2E7D32',
                fontWeight: 700,
                marginBottom: '1.5rem'
              }}>
                Owners can manage one hotel listing only. Contact admin to change ownership.
              </div>
            )}

            {(editingHotel || creatingHotel) && (
              <div
                style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
                onClick={(e) => { if (e.target === e.currentTarget) { setEditingHotel(null); setCreatingHotel(false); setHotelForm(emptyHotelForm); setGalleryUrlInput(''); } }}
              >
                <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'680px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>
                  {/* Header */}
                  <div style={{ background:'linear-gradient(135deg,#2E7D32 0%,#66bb6a 100%)', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.5rem', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexShrink:0 }}>
                    <div>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>{creatingHotel ? 'New Hotel' : 'Editing Hotel'}</div>
                      <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{creatingHotel ? 'Add New Hotel' : editingHotel?.name}</div>
                      {editingHotel?.location && <div style={{ fontSize:'0.82rem', opacity:0.8, marginTop:'2px' }}>{editingHotel.location}</div>}
                    </div>
                    <button onClick={() => { setEditingHotel(null); setCreatingHotel(false); setHotelForm(emptyHotelForm); setGalleryUrlInput(''); }} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'#fff', fontSize:'1.1rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                  </div>
                  {/* Image preview */}
                  {hotelForm.image_url && (
                    <div style={{ height:'140px', background:`url(${hotelForm.image_url}) center/cover no-repeat`, borderBottom:'1px solid #e5e7eb', flexShrink:0 }} />
                  )}
                  {/* Body */}
                  <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem', overflowY:'auto' }}>
                    {/* Basic Info */}
                    <div>
                      <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Basic Info</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Hotel Name *</span>
                          <input type="text" value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} required />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Location *</span>
                          <input type="text" value={hotelForm.location} onChange={(e) => setHotelForm({ ...hotelForm, location: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} required />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Price per Night (₱)</span>
                          <input type="number" min="0" step="0.01" value={hotelForm.price_per_night} onChange={(e) => setHotelForm({ ...hotelForm, price_per_night: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Rating (0–5)</span>
                          <input type="number" step="0.1" min="0" max="5" value={hotelForm.rating} onChange={(e) => setHotelForm({ ...hotelForm, rating: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Description</span>
                          <textarea value={hotelForm.description} onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })} rows={3} className="gov-input" style={{ borderRadius:'8px', resize:'vertical' }} />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Amenities <span style={{ color:'#9ca3af', fontWeight:400 }}>(comma-separated)</span></span>
                          <input type="text" value={hotelForm.amenities} onChange={(e) => setHotelForm({ ...hotelForm, amenities: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="WiFi, Swimming Pool, Restaurant, Bar, Parking" />
                        </label>
                      </div>
                    </div>
                    {/* Contact */}
                    <div>
                      <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Contact</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Phone</span>
                          <input type="text" value={hotelForm.contact_phone} onChange={(e) => setHotelForm({ ...hotelForm, contact_phone: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Email</span>
                          <input type="email" value={hotelForm.contact_email} onChange={(e) => setHotelForm({ ...hotelForm, contact_email: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                        </label>
                      </div>
                    </div>
                    {/* Location Coordinates */}
                    <div>
                      <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Map Coordinates</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem', marginBottom:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Latitude</span>
                          <input type="number" step="0.00001" value={hotelForm.latitude} onChange={(e) => setHotelForm({ ...hotelForm, latitude: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="e.g., 12.4200" />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Longitude</span>
                          <input type="number" step="0.00001" value={hotelForm.longitude} onChange={(e) => setHotelForm({ ...hotelForm, longitude: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="e.g., 121.3200" />
                        </label>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowCoordinatePicker(!showCoordinatePicker);
                          if (!showCoordinatePicker) {
                            initializeCoordinatePicker();
                          }
                        }} 
                        style={{ background:'#2E7D32', color:'white', border:'none', padding:'0.6rem 1.2rem', borderRadius:'8px', fontSize:'0.85rem', fontWeight:700, cursor:'pointer', width:'100%' }}
                      >
                        {showCoordinatePicker ? '✕ Close Map' : '📍 Pick on Map'}
                      </button>
                      {showCoordinatePicker && (
                        <div style={{ marginTop:'0.85rem', borderRadius:'8px', overflow:'hidden', border:'1px solid #c8e6c9' }}>
                          <div id="coordinate-picker-map" style={{ width:'100%', height:'280px', background:'#f0f0f0' }} />
                          <div style={{ padding:'0.75rem', background:'#f8fdf7', fontSize:'0.8rem', color:'#565656' }}>
                            Click on map or drag marker to set hotel location. Current: ({hotelForm.latitude || '—'}, {hotelForm.longitude || '—'})
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Media */}
                    <div>
                      <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Media &amp; Links</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Cover Image URL</span>
                          <input type="text" value={hotelForm.image_url} onChange={(e) => setHotelForm({ ...hotelForm, image_url: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="https://example.com/hotel-image.jpg" />
                        </label>
                        <div>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151', display:'block', marginBottom:'0.5rem' }}>Gallery Images</span>
                          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
                            <input
                              type="text"
                              value={galleryUrlInput}
                              onChange={(e) => setGalleryUrlInput(e.target.value)}
                              placeholder="https://example.com/photo.jpg"
                              className="gov-input"
                              style={{ flex:'1 1 220px', borderRadius:'8px' }}
                            />
                            <button type="button" className="gov-btn gov-btn-primary" onClick={addGalleryUrl} style={{ whiteSpace:'nowrap' }}>Add URL</button>
                            <label style={{ padding:'0.6rem 1rem', background: imageUploading ? '#9CA3AF' : '#f1f5f9', color: imageUploading ? 'white' : '#1f2937', border:'1px solid #cbd5e1', borderRadius:'8px', cursor: imageUploading ? 'not-allowed' : 'pointer', fontWeight:700, fontSize:'0.85rem', whiteSpace:'nowrap' }}>
                              {imageUploading ? 'Uploading...' : 'Upload Images'}
                              <input type="file" accept="image/*" multiple disabled={imageUploading} onChange={(e) => { handleImageUpload(e.target.files); e.target.value = ''; }} style={{ display:'none' }} />
                            </label>
                          </div>
                          {Array.isArray(hotelForm.image_urls) && hotelForm.image_urls.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', marginTop:'0.85rem' }}>
                              {hotelForm.image_urls.map((url) => (
                                <div key={url} style={{ border:'1px solid #c8e6c9', borderRadius:'8px', padding:'0.5rem', background:'#f8fdf7', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                                  <img src={url} alt="Gallery" style={{ width:'56px', height:'42px', objectFit:'cover', borderRadius:'6px' }} />
                                  <button type="button" className="gov-btn gov-btn-danger" style={{ fontSize:'0.78rem', padding:'0.3rem 0.6rem' }} onClick={() => removeGalleryUrl(url)}>Remove</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Map URL (Embed)</span>
                          <input type="text" value={hotelForm.map_url} onChange={(e) => setHotelForm({ ...hotelForm, map_url: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="https://www.google.com/maps/embed?..." />
                        </label>
                      </div>
                    </div>
                    {/* Policies */}
                    <div>
                      <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>{t('policies_section')}</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('cancellation_type_label')}</span>
                          <select
                            value={hotelForm.cancellation_type}
                            onChange={(e) => setHotelForm({ ...hotelForm, cancellation_type: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px', cursor:'pointer' }}
                          >
                            <option value="free_until">{t('cancellation_free_until')}</option>
                            <option value="partial">{t('cancellation_partial')}</option>
                            <option value="non_refundable">{t('cancellation_nonrefundable')}</option>
                          </select>
                        </label>
                        {hotelForm.cancellation_type !== 'non_refundable' && (
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('free_cancel_days_label')}</span>
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={hotelForm.free_cancellation_days}
                              onChange={(e) => setHotelForm({ ...hotelForm, free_cancellation_days: e.target.value })}
                              className="gov-input"
                              style={{ borderRadius:'8px' }}
                            />
                          </label>
                        )}
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('balance_due_days_label')}</span>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={hotelForm.balance_due_days}
                            onChange={(e) => setHotelForm({ ...hotelForm, balance_due_days: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px' }}
                          />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('checkin_time_label')}</span>
                          <input
                            type="time"
                            value={hotelForm.check_in_time}
                            onChange={(e) => setHotelForm({ ...hotelForm, check_in_time: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px' }}
                          />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('checkout_time_label')}</span>
                          <input
                            type="time"
                            value={hotelForm.check_out_time}
                            onChange={(e) => setHotelForm({ ...hotelForm, check_out_time: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px' }}
                          />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('house_rules_label')}</span>
                          <textarea
                            rows="2"
                            value={hotelForm.house_rules}
                            onChange={(e) => setHotelForm({ ...hotelForm, house_rules: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px', resize:'vertical' }}
                            placeholder={t('house_rules_placeholder')}
                          />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('custom_policy_label')}</span>
                          <textarea
                            rows="2"
                            value={hotelForm.custom_policy_text}
                            onChange={(e) => setHotelForm({ ...hotelForm, custom_policy_text: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px', resize:'vertical' }}
                            placeholder={t('custom_policy_placeholder')}
                          />
                        </label>
                        <div style={{ gridColumn:'1 / -1', background:'#f8fdf7', border:'1px solid #c8e6c9', borderRadius:'8px', padding:'0.75rem 0.9rem', fontSize:'0.82rem', color:'#2E7D32' }}>
                          <span style={{ fontWeight:700, display:'block', marginBottom:'0.25rem', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('policy_preview_label')}</span>
                          {hotelForm.cancellation_type === 'non_refundable'
                            ? t('policy_nonrefundable_notice')
                            : `${t('policy_free_cancel_until')} ${Number(hotelForm.free_cancellation_days ?? 1) || 0} ${t('policy_days_before_checkin')}`}
                        </div>
                      </div>
                    </div>
                    {/* Settings */}
                    <div>
                      <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Settings</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Currency</span>
                          <input type="text" value={hotelForm.currency} onChange={(e) => setHotelForm({ ...hotelForm, currency: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Reservation Fee (₱)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={hotelForm.reservation_fee}
                            onChange={(e) => setHotelForm({ ...hotelForm, reservation_fee: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px' }}
                            placeholder="Blank to disable"
                          />
                          <span style={{ fontSize:'0.72rem', color:'#6b7280' }}>Lets guests book by paying just this fee now. Leave blank to hide the option.</span>
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('listing_status_label')}</span>
                          <select
                            value={Number(hotelForm.is_active) || 0}
                            onChange={(e) => setHotelForm({ ...hotelForm, is_active: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius:'8px', cursor:'pointer' }}
                          >
                            <option value={1}>{t('listing_active')}</option>
                            <option value={0}>{t('listing_inactive')}</option>
                          </select>
                          <span style={{ fontSize:'0.72rem', color:'#6b7280' }}>Inactive listings are hidden from guests.</span>
                        </label>
                        <div style={{ gridColumn:'1 / -1', display:'flex', flexDirection:'column', gap:'0.55rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Allowed Payment Methods</span>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem 1rem' }}>
                            {getHotelPaymentMethodOptions(t).map((option) => {
                              const checked = Array.isArray(hotelForm.allowed_payment_methods)
                                ? hotelForm.allowed_payment_methods.includes(option.value)
                                : false;
                              return (
                                <label key={option.value} style={{ display:'inline-flex', alignItems:'center', gap:'0.45rem', fontSize:'0.85rem', color:'#374151' }}>
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                      const current = Array.isArray(hotelForm.allowed_payment_methods)
                                        ? hotelForm.allowed_payment_methods
                                        : [];
                                      const next = event.target.checked
                                        ? [...new Set([...current, option.value])]
                                        : current.filter((item) => item !== option.value);
                                      setHotelForm({ ...hotelForm, allowed_payment_methods: next });
                                    }}
                                  />
                                  {option.label}
                                </label>
                              );
                            })}
                          </div>
                          <div style={{ fontSize:'0.75rem', color:'#6b7280' }}>
                            Users will only see and use the enabled methods for this hotel.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Footer */}
                  <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', justifyContent:'flex-end', background:'#f9fafb', borderRadius:'0 0 16px 16px', flexShrink:0 }}>
                    <button className="gov-btn gov-btn-ghost" onClick={() => { setEditingHotel(null); setCreatingHotel(false); setHotelForm(emptyHotelForm); setGalleryUrlInput(''); }}>Cancel</button>
                    <button onClick={creatingHotel ? handleHotelCreate : handleHotelSave} disabled={hotelSaving} className="gov-btn gov-btn-primary" style={{ minWidth:'140px' }}>
                      {hotelSaving ? 'Saving...' : creatingHotel ? 'Create Hotel' : 'Save Changes'}
                    </button>
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
                  <RoomManagement hotel={managingRoomsHotel} onClose={() => setManagingRoomsHotel(null)} t={t} />
                </div>
              </div>
            )}

            {/* Room revenue report modal (full authorization only) */}
            {reportHotel && !isLimitedOwner && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                onClick={(e) => { if (e.target === e.currentTarget) setReportHotel(null); }}
              >
                <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <div style={{ background: 'linear-gradient(135deg,#2E7D32 0%,#66bb6a 100%)', borderRadius: '16px 16px 0 0', padding: '1.4rem 1.5rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexShrink: 0 }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Room Revenue Report</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{reportHotel.hotel_name || reportHotel.name}</div>
                      <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '2px' }}>{reportHotel.location}</div>
                    </div>
                    <button onClick={() => setReportHotel(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', color: '#fff', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
                  </div>
                  {/* Body */}
                  <div style={{ overflowY: 'auto', flex: 1 }}>
                    <RoomRevenueReport hotelId={reportHotel.hotel_id} hotelName={reportHotel.hotel_name || reportHotel.name} />
                  </div>
                  {/* Footer */}
                  <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '0 0 16px 16px', flexShrink: 0, textAlign: 'right' }}>
                    <button className="gov-btn gov-btn-primary" onClick={() => setReportHotel(null)}>Done</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {hotels.slice((ownerHotelsPage - 1) * OWNER_CARD_SIZE, ownerHotelsPage * OWNER_CARD_SIZE).map((hotel) => {
                const gallery = Array.isArray(hotel.image_urls) ? hotel.image_urls : [];
                const hotelImage = hotel.image_url || hotel.image || gallery[0];
                return (
                <div key={hotel.hotel_id} style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #c8e6c9',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.08)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(46, 125, 50, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.08)';
                }}>
                  <div style={{
                    background: hotelImage ? `url(${hotelImage}) center/cover no-repeat` : 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
                    height: '180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3.5rem',
                    color: 'white'
                  }}>
                    {!hotelImage && <Icons.Hotel size={56} />}
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1B5E20', fontSize: '1.2rem', fontWeight: 800 }}>
                      {hotel.hotel_name || hotel.name}
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', color: '#718096', fontSize: '0.9rem' }}>
                      <Icons.Location size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> {hotel.location || 'Location not specified'}
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      fontSize: '0.9rem'
                    }}>
                      <span style={{ color: '#2E7D32', fontWeight: 700 }}><Icons.Star size={14} filled={true} /> {hotel.rating || '5.0'}</span>
                      {hotel.price_per_night && (
                        <span style={{ color: '#2E7D32', fontWeight: 700 }}>• ₱{hotel.price_per_night}/night</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                      {(() => {
                        const chip = policyChip(hotel, t);
                        return (
                          <span style={{ background: chip.bg, color: chip.fg, border: `1px solid ${chip.border}`, borderRadius: '999px', padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 800 }}>
                            {chip.label}
                          </span>
                        );
                      })()}
                      <span style={{
                        background: hotel.is_active ? '#f0fdf4' : '#f3f4f6',
                        color: hotel.is_active ? '#16a34a' : '#6b7280',
                        border: `1px solid ${hotel.is_active ? '#bbf7d0' : '#e5e7eb'}`,
                        borderRadius: '999px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        {hotel.is_active ? t('listing_active') : t('listing_inactive')}
                      </span>
                      {hotel.booking_enabled === false && (
                        <span
                          style={{
                            background: '#fffbeb',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            borderRadius: '999px',
                            padding: '0.2rem 0.65rem',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}
                          title={t('listing_only_notice')}
                        >
                          {t('promo_listing')}
                        </span>
                      )}
                      {hotel.booking_enabled === true && (
                        <span style={{
                          background: '#f0fdf4',
                          color: '#16a34a',
                          border: '1px solid #bbf7d0',
                          borderRadius: '999px',
                          padding: '0.2rem 0.65rem',
                          fontSize: '0.72rem',
                          fontWeight: 800
                        }}>
                          {t('bookings_active_badge')}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="gov-btn-primary"
                        onClick={() => startHotelEdit(hotel)}
                        style={{ flex: 1 }}
                      >
                        Edit
                      </button>
                      <button
                        className="gov-btn gov-btn-secondary"
                        onClick={() => setManagingRoomsHotel(hotel)}
                        style={{ flex: 1, whiteSpace: 'nowrap' }}
                        title="Manage rooms for this hotel"
                      >
                        <Icons.Hotel size={16} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Rooms
                      </button>
                      {/* Financial reports follow the full-authorization gate
                          (same rule as the Analytics tab). */}
                      {!isLimitedOwner && (
                        <button
                          className="gov-btn gov-btn-secondary"
                          onClick={() => setReportHotel(hotel)}
                          style={{ flex: 1, whiteSpace: 'nowrap' }}
                          title="View room revenue report"
                        >
                          <Icons.ChartPie size={16} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Report
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
            <Pagination page={ownerHotelsPage} totalPages={Math.ceil(hotels.length / OWNER_CARD_SIZE)} onPageChange={setOwnerHotelsPage} totalItems={hotels.length} pageSize={OWNER_CARD_SIZE} label="hotels" />
            {hotels.length === 0 && (
              <div className="gov-empty">
                <Icons.Hotel size={48} style={{ color: '#c8e6c9', marginBottom: '1rem' }} />
                <p style={{ color: '#718096' }}>No hotels yet</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings */}
        {/* Enhanced Bookings & Reservation Management */}
        {activeTab === 'bookings' && (
          <div>
            <h1 className="gov-page-title">
              <Icons.Calendar size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Booking & Reservation Management
            </h1>
            
            {/* Filters and Search */}
            <div className="gov-glass-panel">
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <input
                    type="text"
                    placeholder={t('payments_hotel_guest_search')}
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #c8e6c9',
                      borderRadius: '8px',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['all', 'confirmed', 'pending', 'cancelled', 'archived'].map(status => (
                    <button
                      key={status}
                      className={bookingFilter === status ? 'gov-btn-primary' : 'gov-btn-ghost'}
                      onClick={() => setBookingFilter(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  className="gov-btn-primary"
                  onClick={() => exportReport('bookings')}
                >
                  {t('payments_export_csv')}
                </button>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#718096', fontWeight: 600 }}>
                Showing {filteredBookings.length} of {bookings.length} bookings
              </div>
            </div>
            
            <div className="gov-glass-panel">
              <div className="gov-table-wrap">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Hotel</th>
                      <th>Room Type</th>
                      <th>Guest</th>
                      <th>Dates</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.slice((ownerBookingsPage - 1) * OWNER_TABLE_SIZE, ownerBookingsPage * OWNER_TABLE_SIZE).map((booking) => (
                      <tr key={booking.booking_id}>
                        <td>#{booking.booking_id}</td>
                        <td>{booking.hotel_name}</td>
                        <td>
                          {booking.room_type_name ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{booking.room_type_name}</div>
                              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{booking.rooms} room{booking.rooms > 1 ? 's' : ''}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af' }}> -</span>
                          )}
                        </td>
                        <td>{booking.username}</td>
                        <td>
                          {new Date(booking.check_in).toLocaleDateString()} → {new Date(booking.check_out).toLocaleDateString()}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>₱{parseFloat(booking.total_amount || 0).toLocaleString()}</div>
                          <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                            Paid ₱{parseFloat(booking.amount_paid || 0).toLocaleString()}
                            {Number(booking.balance_due) > 0 ? ` · ₱${parseFloat(booking.balance_due).toLocaleString()} due` : ''}
                          </div>
                          {booking.payment_status && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '999px',
                              color: '#fff',
                              marginTop: '0.15rem',
                              background:
                                booking.payment_status === 'paid' ? '#16a34a' :
                                booking.payment_status === 'partial' ? '#d97706' :
                                booking.payment_status === 'pending' ? '#2563eb' :
                                booking.payment_status === 'failed' ? '#dc2626' : '#6b7280'
                            }}>
                              {booking.payment_status}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`gov-badge-status gov-badge-status--${booking.status}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  className="gov-btn-primary"
                                  onClick={() => handleBookingStatusChange(booking.booking_id, 'confirmed')}
                                  title="Confirm this booking"
                                >
                                  Confirm
                                </button>
                                <button
                                  className="gov-btn-danger"
                                  onClick={() => handleBookingStatusChange(booking.booking_id, 'cancelled')}
                                  title="Cancel this booking"
                                >
                                  Cancel Booking
                                </button>
                                <button
                                  className="gov-btn-ghost"
                                  onClick={() => handleArchiveBooking(booking.booking_id)}
                                  title="Archive this booking"
                                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                >
                                  Archive
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <>
                                <button
                                  className="gov-btn-danger"
                                  onClick={() => handleBookingStatusChange(booking.booking_id, 'cancelled')}
                                  title="Cancel this booking"
                                >
                                  Cancel Booking
                                </button>
                                <button
                                  className="gov-btn-ghost"
                                  onClick={() => handleArchiveBooking(booking.booking_id)}
                                  title="Archive this booking"
                                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                                >
                                  Archive
                                </button>
                              </>
                            )}
                            {booking.status === 'cancelled' && (
                              <button
                                className="gov-btn-ghost"
                                onClick={() => handleArchiveBooking(booking.booking_id)}
                                title="Archive this cancelled booking"
                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                              >
                                Archive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={ownerBookingsPage} totalPages={Math.ceil(filteredBookings.length / OWNER_TABLE_SIZE)} onPageChange={setOwnerBookingsPage} totalItems={filteredBookings.length} pageSize={OWNER_TABLE_SIZE} label="bookings" />
              {bookings.length === 0 && (
                <div className="gov-empty">
                  <p>No bookings yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payments */}
        {activeTab === 'payments' && (
          <div>
            <h1 className="gov-page-title">
              <Icons.Money size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Payment Management
            </h1>

            {hotels.length > 0 && (
              <div className="gov-glass-panel" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1B5E20', marginBottom: '0.65rem' }}>
                  Payment Method Settings
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.85rem' }}>
                  Control which payment options are available for {hotels[0].name || 'this hotel'}.
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem 1rem', marginBottom: '0.85rem' }}>
                  {getHotelPaymentMethodOptions(t).map((option) => {
                    const checked = paymentMethodSettings.includes(option.value);
                    return (
                      <label key={option.value} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', color: '#374151' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...new Set([...paymentMethodSettings, option.value])]
                              : paymentMethodSettings.filter((item) => item !== option.value);
                            setPaymentMethodSettings(next);
                          }}
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
                <button
                  className="gov-btn-primary"
                  disabled={paymentMethodSettingsSaving}
                  onClick={async () => {
                    if (!paymentMethodSettings.length) {
                      alert('At least one payment method must stay enabled.');
                      return;
                    }
                    try {
                      setPaymentMethodSettingsSaving(true);
                      await api.put(`/owner/hotels/${hotels[0].hotel_id}`, {
                        allowed_payment_methods: paymentMethodSettings
                      });
                      await fetchDashboardData();
                      alert('Payment method settings updated.');
                    } catch (error) {
                      console.error('Failed to update payment methods:', error);
                      alert(error.response?.data?.error || 'Failed to update payment settings.');
                    } finally {
                      setPaymentMethodSettingsSaving(false);
                    }
                  }}
                >
                  {paymentMethodSettingsSaving ? 'Saving...' : 'Save Payment Settings'}
                </button>
              </div>
            )}

            {/* Payment Filters */}
            <div className="gov-glass-panel">
              {/* Search Bar Section - Prominent and Full Width */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                  {t('payments_search_label')}
                </label>
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(event) => setPaymentSearch(event.target.value)}
                  placeholder={t('payments_search_placeholder')}
                  className="gov-input"
                  style={{ fontSize: '0.95rem', padding: '0.75rem 1rem' }}
                />
              </div>

              {/* Status Filter Buttons */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                  Payment Status
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['all', 'succeeded', 'pending', 'failed', 'refunded'].map(status => (
                    <button
                      key={status}
                      className={paymentFilter === status ? 'gov-btn-primary' : 'gov-btn-ghost'}
                      onClick={() => setPaymentFilter(status)}
                      style={{ flex: 'none' }}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Filters Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(event) => setPaymentMethodFilter(event.target.value)}
                    className="gov-select"
                  >
                    <option value="all">All Methods</option>
                    <option value="card">Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="gcash">GCash</option>
                    <option value="grabpay">GrabPay</option>
                    <option value="qrph">QR PH</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="pay_at_property">Pay at Property</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={paymentDateFrom}
                    onChange={(event) => setPaymentDateFrom(event.target.value)}
                    className="gov-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={paymentDateTo}
                    onChange={(event) => setPaymentDateTo(event.target.value)}
                    className="gov-input"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  className="gov-btn-ghost"
                  onClick={() => {
                    setPaymentFilter('all');
                    setPaymentMethodFilter('all');
                    setPaymentDateFrom('');
                    setPaymentDateTo('');
                    setPaymentSearch('');
                  }}
                >
                  {t('payments_clear_filters')}
                </button>
                <button
                  className="gov-btn-primary"
                  onClick={() => exportReport('payments')}
                >
                  {t('payments_export_csv')}
                </button>
              </div>
            </div>

            {paymentStats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
              }}>
                {[
                  { title: 'Total Revenue', value: `₱${parseFloat(paymentStats.total_revenue || 0).toLocaleString()}`, icon: <Icons.Money size={24} />, color: '#2E7D32' },
                  { title: 'Successful', value: paymentStats.successful_transactions || 0, icon: <Icons.Check size={24} />, color: '#388E3C' },
                  { title: 'Pending', value: `₱${parseFloat(paymentStats.pending_amount || 0).toLocaleString()}`, icon: <Icons.Calendar size={24} />, color: '#FFB74D' },
                  { title: 'Failed', value: `₱${parseFloat(paymentStats.failed_amount || 0).toLocaleString()}`, icon: <Icons.X size={24} />, color: '#E53935' }
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                    border: `2px solid ${stat.color}`,
                    padding: '2rem',
                    borderRadius: '12px',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {stat.title}
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color }}>
                          {stat.value}
                        </div>
                      </div>
                      <div style={{ fontSize: '2.5rem' }}>{stat.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="gov-glass-panel">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1B5E20', margin: '0 0 1.5rem 0' }}>
                Transactions ({filteredPayments.length})
              </h2>
              <div className="gov-table-wrap">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Booking</th>
                      <th>Room Type</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.slice((paymentsPage - 1) * OWNER_TABLE_SIZE, paymentsPage * OWNER_TABLE_SIZE).map((payment) => (
                      <tr key={payment.payment_id}>
                        <td>#{payment.payment_id}</td>
                        <td>
                          {payment.booking_id ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>#{payment.booking_id}</div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Ref: {payment.booking_reference || '—'}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td>
                          {payment.room_type_name ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{payment.room_type_name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>🛏️</div>
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td>{payment.customer_name || 'N/A'}</td>
                        <td>
                          ₱{parseFloat(payment.amount || 0).toLocaleString()}
                        </td>
                        <td>
                          {getPaymentMethodLabel(payment.method, t)}
                        </td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {payment.customer_reference_number ? (
                            <div style={{ fontWeight: 700 }}>{payment.customer_reference_number}</div>
                          ) : (
                            <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>—</div>
                          )}
                        </td>
                        <td>
                          <span className={`gov-badge-status gov-badge-status--${payment.status}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="gov-btn-primary"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              View
                            </button>
                            {payment.status === 'succeeded' && (
                              <button
                                className="gov-btn-warning"
                                onClick={() => setRefundModal(payment)}
                              >
                                Refund
                              </button>
                            )}
                            {(payment.status === 'succeeded' || payment.status === 'failed') && (
                              <button
                                className="gov-btn-ghost"
                                onClick={async () => {
                                  if (window.confirm('Archive this payment record?')) {
                                    try {
                                      await api.put(`/owner/payments/${payment.payment_id}/archive`);
                                      fetchPayments();
                                      fetchPaymentStats();
                                    } catch (error) {
                                      console.error('Archive error:', error);
                                      alert(error.response?.data?.error || 'Failed to archive payment');
                                    }
                                  }
                                }}
                              >
                                Archive
                              </button>
                            )}
                            {payment.status === 'pending' && (
                              <>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Confirm this pending payment?')) {
                                      try {
                                        await api.put(`/owner/payments/${payment.payment_id}/confirm`);
                                        alert('Payment confirmed successfully');
                                        fetchPayments();
                                        fetchPaymentStats();
                                      } catch (error) {
                                        console.error('Confirm error:', error);
                                        alert(error.response?.data?.error || 'Failed to confirm payment');
                                      }
                                    }
                                  }}
                                  className="gov-btn-primary"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Cancel this pending payment?')) {
                                      try {
                                        await api.put(`/owner/payments/${payment.payment_id}/cancel`);
                                        alert('Payment cancelled successfully');
                                        fetchPayments();
                                        fetchPaymentStats();
                                      } catch (error) {
                                        console.error('Cancel error:', error);
                                        alert(error.response?.data?.error || 'Failed to cancel payment');
                                      }
                                    }
                                  }}
                                  className="gov-btn-danger"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={paymentsPage} totalPages={Math.ceil(filteredPayments.length / OWNER_TABLE_SIZE)} onPageChange={setPaymentsPage} totalItems={filteredPayments.length} pageSize={OWNER_TABLE_SIZE} label="transactions" />
              {filteredPayments.length === 0 && (
                <div className="gov-empty">
                  <p>No transactions found</p>
                </div>
              )}
            </div>

            {/* Payment Details Modal */}
            {selectedPayment && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }} onClick={() => setSelectedPayment(null)}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#1B5E20', fontSize: '1.5rem', fontWeight: 800 }}>
                      Payment Details #{selectedPayment.payment_id}
                    </h2>
                    <button
                      className="gov-btn-ghost"
                      onClick={() => setSelectedPayment(null)}
                    >
                      &times;
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: '#fffaf0', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Customer Reference</div>
                      <div style={{ fontWeight: 700, color: '#92400e' }}>{selectedPayment.customer_reference_number || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '1rem', background: '#f8fdf7', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Transaction Reference</div>
                      <div style={{ fontWeight: 700, color: '#1B5E20' }}>{selectedPayment.transaction_reference || 'N/A'}</div>
                    </div>
                    <div style={{ padding: '1rem', background: '#f8fdf7', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Amount</div>
                      <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: '1.5rem' }}>₱{parseFloat(selectedPayment.amount || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ padding: '1rem', background: '#f8fdf7', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Method</div>
                        <div style={{ fontWeight: 700, color: '#1B5E20' }}>{getPaymentMethodLabel(selectedPayment.method, t)}</div>
                      </div>
                      <div style={{ padding: '1rem', background: '#f8fdf7', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Provider</div>
                        <div style={{ fontWeight: 700, color: '#1B5E20' }}>{selectedPayment.provider || 'N/A'}</div>
                      </div>
                    </div>
                    <div style={{ padding: '1rem', background: '#f8fdf7', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Customer</div>
                      <div style={{ fontWeight: 700, color: '#1B5E20' }}>{selectedPayment.customer_name || 'N/A'}</div>
                      <div style={{ fontSize: '0.85rem', color: '#718096' }}>{selectedPayment.customer_email || ''}</div>
                    </div>
                    <div style={{ padding: '1rem', background: '#f8fdf7', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Status</div>
                      <span className={`gov-badge-status gov-badge-status--${selectedPayment.status}`}>
                        {selectedPayment.status}
                      </span>
                    </div>
                    {selectedPayment.paid_at && (
                      <div style={{ padding: '1rem', background: '#f8fdf7', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.25rem' }}>Paid At</div>
                        <div style={{ fontWeight: 700, color: '#1B5E20' }}>{new Date(selectedPayment.paid_at).toLocaleString()}</div>
                      </div>
                    )}
                    {selectedPayment.refund_amount && (
                      <div style={{ padding: '1rem', background: '#fce4ec', borderRadius: '8px', border: '1px solid #f48fb1' }}>
                        <div style={{ fontSize: '0.85rem', color: '#880e4f', marginBottom: '0.25rem' }}>Refund Amount</div>
                        <div style={{ fontWeight: 700, color: '#880e4f' }}>₱{parseFloat(selectedPayment.refund_amount).toLocaleString()}</div>
                        {selectedPayment.refund_reason && (
                          <div style={{ fontSize: '0.85rem', color: '#880e4f', marginTop: '0.5rem' }}>Reason: {selectedPayment.refund_reason}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Refund Modal */}
            {refundModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }} onClick={() => { setRefundModal(null); setRefundReason(''); setRefundAmount(''); }}>
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '2rem',
                  maxWidth: '500px',
                  width: '90%'
                }} onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ margin: '0 0 1.5rem 0', color: '#1B5E20', fontSize: '1.5rem', fontWeight: 800 }}>
                    Process Refund
                  </h2>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '0.5rem' }}>Payment ID: #{refundModal.payment_id}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1B5E20' }}>Amount: ₱{parseFloat(refundModal.amount || 0).toLocaleString()}</div>
                  </div>
                  <label style={{ display: 'block', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', marginBottom: '0.5rem' }}>Refund Amount (optional)</div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={`Max ${parseFloat(refundModal.amount || 0).toFixed(2)}`}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.4rem' }}>
                      Leave empty for full refund.
                    </div>
                  </label>
                  <label style={{ display: 'block', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', marginBottom: '0.5rem' }}>Refund Reason</div>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Enter reason for refund..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        resize: 'vertical'
                      }}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      className="gov-btn-ghost"
                      onClick={() => { setRefundModal(null); setRefundReason(''); setRefundAmount(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="gov-btn-warning"
                      onClick={async () => {
                        if (!refundReason.trim()) {
                          alert('Please enter a refund reason');
                          return;
                        }
                        const maxAmount = Number(refundModal.amount || 0);
                        let parsedRefundAmount;
                        if (refundAmount !== '') {
                          parsedRefundAmount = Number(refundAmount);
                          if (!Number.isFinite(parsedRefundAmount) || parsedRefundAmount <= 0) {
                            alert('Refund amount must be a positive number');
                            return;
                          }
                          if (parsedRefundAmount > maxAmount) {
                            alert('Refund amount cannot exceed the original payment amount');
                            return;
                          }
                        }
                        try {
                          const payload = { reason: refundReason };
                          if (refundAmount !== '') {
                            payload.amount = parsedRefundAmount;
                          }
                          await api.post(`/payments/${refundModal.payment_id}/refund`, payload);
                          alert('Refund processed successfully');
                          setRefundModal(null);
                          setRefundReason('');
                          setRefundAmount('');
                          fetchPayments();
                          fetchPaymentStats();
                        } catch (error) {
                          alert(error.response?.data?.error || 'Failed to process refund');
                        }
                      }}
                    >
                      Process Refund
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div>
            <h1 className="gov-page-title">
                <Icons.Star size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Customer Review Monitoring
            </h1>
              {reviews.length > 0 && (
                <div className="gov-glass-panel">
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20' }}>
                        Review Summary
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                        Total Reviews: {reviews.length} | Avg Rating: {(reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)} 
                      </div>
                    </div>
                    <button
                      className="gov-btn-primary"
                      onClick={() => exportReport('reviews')}
                    >
                      {t('payments_export_csv')}
                    </button>
                  </div>
                </div>
              )}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {reviews.length > 0 ? (
              reviews.slice((reviewsPage - 1) * OWNER_CARD_SIZE, reviewsPage * OWNER_CARD_SIZE).map((review) => (
                  <div key={review.review_id} style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #c8e6c9',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.08)',
                    borderLeft: '4px solid #2E7D32'
                  }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1B5E20' }}>
                        {review.username || 'Anonymous'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.25rem' }}>
                        {review.hotel_name}
                      </div>
                      <div style={{ fontSize: '1.1rem', color: '#FFB74D', marginTop: '0.5rem', display: 'flex', gap: '2px' }}>
                        {Array.from({length: Math.floor(review.rating || 5)}, (_, i) => <Icons.Star key={i} size={16} filled={true} />)}
                      </div>
                    </div>
                    <p style={{ margin: '1rem 0 0 0', color: '#2d3748', fontSize: '0.9rem', lineHeight: '1.6' }}>
                      {review.comment}
                    </p>
                      {review.owner_reply && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          background: '#f8fdf7',
                          borderRadius: '8px',
                          borderLeft: '3px solid #2E7D32'
                        }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2E7D32', marginBottom: '0.5rem' }}>
                            Owner's Reply:
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#2d3748' }}>
                            {review.owner_reply}
                          </div>
                        </div>
                      )}
                      {replyingToReview === review.review_id ? (
                        <div style={{ marginTop: '1rem' }}>
                          <textarea
                            value={reviewReply}
                            onChange={(e) => setReviewReply(e.target.value)}
                            placeholder="Write your reply..."
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #c8e6c9',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              marginBottom: '0.5rem'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="gov-btn-primary"
                              onClick={() => handleReviewReply(review.review_id)}
                            >
                              Send Reply
                            </button>
                            <button
                              className="gov-btn-ghost"
                              onClick={() => {
                                setReplyingToReview(null);
                                setReviewReply('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : !review.owner_reply && (
                        <button
                          className="gov-btn-ghost"
                          style={{ marginTop: '1rem' }}
                          onClick={() => setReplyingToReview(review.review_id)}
                        >
                          Reply to Review
                        </button>
                      )}
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e8f5e9' }}>
                      {new Date(review.review_date).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></div>
                  <p style={{ color: '#718096' }}>No reviews yet</p>
                </div>
              )}
            </div>
            <Pagination page={reviewsPage} totalPages={Math.ceil(reviews.length / OWNER_CARD_SIZE)} onPageChange={setReviewsPage} totalItems={reviews.length} pageSize={OWNER_CARD_SIZE} label="reviews" />
          </div>
        )}

          {/* Availability Calendar & Listing Management */}
          {activeTab === 'calendar' && (
            <div>
              <h1 className="gov-page-title">
                 Availability Calendar & Listing Management
              </h1>

              {/* Hotel Selection */}
              {!selectedHotelForCalendar ? (
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem' }}>
                    Select a Hotel to Manage
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.5rem'
                  }}>
                    {hotels.map((hotel) => (
                      <div
                        key={hotel.hotel_id}
                        onClick={() => selectHotelForCalendar(hotel)}
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          border: '2px solid #c8e6c9',
                          padding: '1.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          boxShadow: '0 4px 12px rgba(46, 125, 50, 0.08)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.borderColor = '#2E7D32';
                          e.currentTarget.style.boxShadow = '0 8px 20px rgba(46, 125, 50, 0.15)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.borderColor = '#c8e6c9';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.08)';
                        }}
                      >
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}></div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1B5E20', fontSize: '1.1rem', fontWeight: 800, textAlign: 'center' }}>
                          {hotel.hotel_name || hotel.name}
                        </h3>
                        <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem', textAlign: 'center' }}>
                           {hotel.location}
                        </p>
                      </div>
                    ))}
                  </div>
                  {hotels.length === 0 && (
                    <div className="gov-empty">
                      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></div>
                      <p style={{ color: '#718096' }}>No hotels available. Please add a hotel first.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Back Button */}
                  <button
                    className="gov-btn-ghost"
                    style={{ marginBottom: '1.5rem' }}
                    onClick={() => setSelectedHotelForCalendar(null)}
                  >
                    ← Back to Hotel Selection
                  </button>

                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem' }}>
                    Managing: {selectedHotelForCalendar.hotel_name || selectedHotelForCalendar.name}
                  </h2>

                  {/* Room Types Summary */}
                  {rooms && rooms.length > 0 && (
                    <div className="gov-glass-panel" style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                        <Icons.Hotel size={22} style={{ marginRight: '1rem' }} /> Room Types Inventory
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {rooms.filter(r => r.hotel_id === selectedHotelForCalendar.hotel_id).map((room) => (
                          <div key={room.room_id} style={{
                            border: '1px solid #c8e6c9',
                            borderRadius: '10px',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #f8fdf7 0%, #e8f5e9 100%)',
                            transition: 'all 0.3s'
                          }}
                            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.15)'}
                            onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                          >
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1B5E20', marginBottom: '0.75rem' }}>
                              {room.room_type_name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#2d3748', marginBottom: '0.5rem' }}>
                              <div><strong>Capacity:</strong> {room.capacity} guest{room.capacity > 1 ? 's' : ''}</div>
                              <div><strong>Available:</strong> <span style={{ fontWeight: 700, color: '#2E7D32' }}>{room.quantity_available} unit{room.quantity_available > 1 ? 's' : ''}</span></div>
                              <div><strong>Price/Night:</strong> <span style={{ fontWeight: 700, color: '#2E7D32' }}>₱{parseFloat(room.price_per_night || 0).toLocaleString()}</span></div>
                            </div>
                            {room.description && (
                              <div style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #c8e6c9' }}>
                                {room.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#f1f8e9', borderRadius: '8px', border: '1px solid #81c784', fontSize: '0.9rem', color: '#2E7D32', fontWeight: 600 }}>
                        <strong>TIP:</strong> Individual room type prices and availability are managed in the Rooms Manager. Use this section to set total room counts and mark dates as closed.
                      </div>
                    </div>
                  )}

                  {/* Base Availability Settings */}
                  <div className="gov-glass-panel">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                      <Icons.Calendar size={22} style={{ marginRight: '1rem' }} /> Base Availability Settings
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                      <label style={{ fontSize: '0.9rem', color: '#2d3748', fontWeight: 700 }}>
                        Total Rooms
                        <input
                          type="number"
                          value={availabilityForm.rooms_total}
                          onChange={(e) => setAvailabilityForm({ ...availabilityForm, rooms_total: e.target.value })}
                          min="0"
                          style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            border: '1px solid #c8e6c9',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </label>
                      <label style={{ fontSize: '0.9rem', color: '#2d3748', fontWeight: 700 }}>
                        Available Rooms
                        <input
                          type="number"
                          value={availabilityForm.rooms_available}
                          onChange={(e) => setAvailabilityForm({ ...availabilityForm, rooms_available: e.target.value })}
                          min="0"
                          style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            padding: '0.75rem',
                            border: '1px solid #c8e6c9',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </label>
                      <label style={{ fontSize: '0.9rem', color: '#2d3748', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={availabilityForm.is_active === 1}
                          onChange={(e) => setAvailabilityForm({ ...availabilityForm, is_active: e.target.checked ? 1 : 0 })}
                          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        Active for Booking
                      </label>
                    </div>
                    <button
                      className="gov-btn-primary"
                      style={{ marginTop: '1.5rem' }}
                      onClick={handleAvailabilitySave}
                      disabled={availabilitySaving}
                    >
                      {availabilitySaving ? 'Saving...' : 'Save Base Settings'}
                    </button>
                  </div>

                  {/* Calendar View */}
                  <div className="gov-glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20', margin: 0 }}>
                        Availability Calendar
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button
                          className="gov-btn-ghost"
                          onClick={() => {
                            const prev = new Date(calendarMonth);
                            prev.setMonth(prev.getMonth() - 1);
                            setCalendarMonth(prev);
                          }}
                        >
                          ←
                        </button>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1B5E20', minWidth: '150px', textAlign: 'center' }}>
                          {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button
                          className="gov-btn-ghost"
                          onClick={() => {
                            const next = new Date(calendarMonth);
                            next.setMonth(next.getMonth() + 1);
                            setCalendarMonth(next);
                          }}
                        >
                          →
                        </button>
                      </div>
                    </div>

                    {availabilityLoading ? (
                      <div className="gov-empty">
                        Loading calendar...
                      </div>
                    ) : (
                      <div>
                        {/* Calendar Grid */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          gap: '0.5rem',
                          marginBottom: '2rem'
                        }}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} style={{
                              padding: '0.75rem',
                              textAlign: 'center',
                              fontWeight: 800,
                              color: '#2E7D32',
                              fontSize: '0.85rem',
                              background: '#f8fdf7',
                              borderRadius: '6px'
                            }}>
                              {day}
                            </div>
                          ))}
                          {buildCalendarDays(calendarMonth).map((date, idx) => {
                            if (!date) {
                              return <div key={`empty-${idx}`} style={{ padding: '0.75rem' }} />;
                            }
                            const dateKey = toDateKey(date);
                            const entry = availabilityByDate[dateKey];
                            const isSelected = isDateInRange(dateKey, selectedAvailabilityRange);
                            const isClosed = entry?.is_closed === 1;
                            const roomsAvail = entry?.rooms_available ?? availabilityForm.rooms_available;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isPast = date < today;

                            return (
                              <div
                                key={dateKey}
                                onClick={() => !isPast && handleCalendarDateClick(dateKey)}
                                style={{
                                  padding: '0.75rem',
                                  border: isSelected ? '2px solid #2E7D32' : '1px solid #c8e6c9',
                                  borderRadius: '8px',
                                  cursor: isPast ? 'not-allowed' : 'pointer',
                                  background: isPast ? '#f5f5f5' : isClosed ? '#ffcccc' : isSelected ? '#e8f5e9' : 'white',
                                  opacity: isPast ? 0.5 : 1,
                                  transition: 'all 0.2s',
                                  minHeight: '80px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between'
                                }}
                                onMouseOver={(e) => {
                                  if (!isSelected && !isPast) e.currentTarget.style.background = '#f8fdf7';
                                }}
                                onMouseOut={(e) => {
                                  if (!isSelected && !isPast) e.currentTarget.style.background = isClosed ? '#ffcccc' : 'white';
                                }}
                              >
                                <div style={{ fontWeight: 700, color: isPast ? '#9CA3AF' : '#1B5E20', fontSize: '0.9rem' }}>
                                  {date.getDate()}
                                </div>
                                {isClosed ? (
                                  <div style={{ fontSize: '0.75rem', color: '#c62828', fontWeight: 700 }}>CLOSED</div>
                                ) : (
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: isPast ? '#9CA3AF' : '#718096' }}>
                                      {roomsAvail} rooms
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Date Range Editor */}
                        {selectedAvailabilityRange.start && (
                          <div style={{
                            background: '#f8fdf7',
                            border: '2px solid #2E7D32',
                            borderRadius: '12px',
                            padding: '1.5rem'
                          }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1rem' }}>
                              Edit Availability for Selected Date{selectedAvailabilityRange.end ? 's' : ''}
                            </h4>
                            <div style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '1.5rem' }}>
                              {selectedAvailabilityRange.start}
                              {selectedAvailabilityRange.end && selectedAvailabilityRange.end !== selectedAvailabilityRange.start && (
                                <> to {selectedAvailabilityRange.end}</>
                              )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                              <label style={{ fontSize: '0.9rem', color: '#2d3748', fontWeight: 700 }}>
                                Rooms Available
                                <input
                                  type="number"
                                  value={availabilityEditForm.rooms_available}
                                  onChange={(e) => setAvailabilityEditForm({ ...availabilityEditForm, rooms_available: e.target.value })}
                                  min="0"
                                  placeholder="Leave empty to use base setting"
                                  style={{
                                    width: '100%',
                                    marginTop: '0.5rem',
                                    padding: '0.75rem',
                                    border: '1px solid #c8e6c9',
                                    borderRadius: '8px',
                                    fontSize: '0.95rem'
                                  }}
                                />
                              </label>
                              <label style={{ fontSize: '0.9rem', color: '#2d3748', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                  type="checkbox"
                                  checked={availabilityEditForm.is_closed === 1}
                                  onChange={(e) => setAvailabilityEditForm({ ...availabilityEditForm, is_closed: e.target.checked ? 1 : 0 })}
                                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                Mark as Closed
                              </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <button
                                className="gov-btn-primary"
                                onClick={handleAvailabilityRangeSave}
                                disabled={availabilitySaving}
                              >
                                {availabilitySaving ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button
                                className="gov-btn-ghost"
                                onClick={() => {
                                  setSelectedAvailabilityRange({ start: null, end: null });
                                  setAvailabilityEditForm({ rooms_available: '', is_closed: 0 });
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Legend */}
                        <div style={{
                          marginTop: '2rem',
                          padding: '1rem',
                          background: '#f8fdf7',
                          borderRadius: '8px',
                          border: '1px solid #c8e6c9'
                        }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1B5E20', marginBottom: '0.75rem' }}>
                            Legend:
                          </div>
                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '20px', height: '20px', background: 'white', border: '1px solid #c8e6c9', borderRadius: '4px' }} />
                              <span style={{ color: '#2d3748' }}>Available</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '20px', height: '20px', background: '#e8f5e9', border: '2px solid #2E7D32', borderRadius: '4px' }} />
                              <span style={{ color: '#2d3748' }}>Selected</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '20px', height: '20px', background: '#ffcccc', border: '1px solid #c8e6c9', borderRadius: '4px' }} />
                              <span style={{ color: '#2d3748' }}>Closed</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '20px', height: '20px', background: '#f5f5f5', border: '1px solid #c8e6c9', borderRadius: '4px', opacity: 0.5 }} />
                              <span style={{ color: '#2d3748' }}>Past Date</span>
                            </div>
                          </div>
                          
                          {/* Room Types Info */}
                          <div style={{ paddingTop: '1rem', borderTop: '1px solid #c8e6c9' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1B5E20', marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                              <Icons.Info size={16} style={{ marginRight: '0.75rem' }} /> Room Types & Pricing:
                            </div>
                            <ul style={{ fontSize: '0.85rem', color: '#2d3748', margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                              <li><strong>Closed Dates:</strong> Mark dates as closed to block all room bookings temporarily</li>
                              <li><strong>Room Availability:</strong> Set how many total rooms are available for each date</li>
                              <li><strong>Individual Pricing:</strong> Each room type has its own price, managed in the Rooms Manager</li>
                              <li><strong>System Allocation:</strong> When guests book, system intelligently assigns available room types</li>
                              <li><strong>No Price Overrides:</strong> Calendar focuses only on availability—pricing is purely room-type based</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports & Analytics */}
          {activeTab === 'analytics' && (
            <ReportsAndAnalyticsDashboard
              data={analyticsData}
              stats={{
                totals: {
                  bookings: stats?.bookingStats?.total_bookings || 0,
                  hotels: stats?.hotelCount || 0,
                  users: 0
                },
                roleDistribution: []
              }}
              loading={analyticsLoading}
              userRole="owner"
              onExport={(type) => exportReport(type)}
            />
          )}

          {/* Business Profile Management */}
          {activeTab === 'profile' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.User size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Business Profile Management
              </h1>
            
              <div className="gov-glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B5E20', margin: 0 }}>
                    Business Information
                  </h2>
                  <button
                    className={profileEditing ? 'gov-btn-ghost' : 'gov-btn-primary'}
                    onClick={() => setProfileEditing(!profileEditing)}
                  >
                    {profileEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {/* Verification status & authorization banner */}
                <div style={{
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                  marginBottom: '1.5rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: profileStatus.verification_status === 'verified' && !isLimitedOwner
                    ? '#bbf7d0'
                    : profileStatus.verification_status === 'rejected'
                      ? '#fecaca'
                      : '#fde68a',
                  background: profileStatus.verification_status === 'verified' && !isLimitedOwner
                    ? '#f0fdf4'
                    : profileStatus.verification_status === 'rejected'
                      ? '#fef2f2'
                      : '#fffbeb'
                }}>
                  <Icons.Shield size={24} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#1B5E20' }} />
                  <div>
                    <div style={{ fontWeight: 800, color: '#1B5E20', fontSize: '0.95rem' }}>
                      {profileStatus.verification_status === 'verified'
                        ? t('verification_verified')
                        : profileStatus.verification_status === 'rejected'
                          ? t('verification_rejected')
                          : t('verification_pending')}
                      {' — '}
                      {isLimitedOwner ? t('requirements_incomplete') : t('requirements_complete')}
                    </div>
                    {isLimitedOwner && missingRequirements.length > 0 && (
                      <div style={{ fontSize: '0.85rem', color: '#92400e', marginTop: '0.35rem' }}>
                        {t('requirements_missing_label')}{missingRequirements.map(missingLabel).join(', ')}
                      </div>
                    )}
                    {profileStatus.verification_status === 'rejected' && profileStatus.rejection_reason && (
                      <div style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '0.35rem' }}>
                        {profileStatus.rejection_reason}
                      </div>
                    )}
                    {!isLimitedOwner && (
                      <div style={{ fontSize: '0.82rem', color: '#4b5563', marginTop: '0.35rem' }}>
                        {t('legitimacy_hint')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={businessProfile.business_name}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, business_name: e.target.value })}
                      disabled={!profileEditing}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: profileEditing ? 'white' : '#f8fdf7'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
                      Business Email *
                    </label>
                    <input
                      type="email"
                      value={businessProfile.business_email}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, business_email: e.target.value })}
                      disabled={!profileEditing}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: profileEditing ? 'white' : '#f8fdf7'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
                      Business Phone *
                    </label>
                    <input
                      type="text"
                      value={businessProfile.business_phone}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, business_phone: e.target.value })}
                      disabled={!profileEditing}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: profileEditing ? 'white' : '#f8fdf7'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
                      Tax ID
                    </label>
                    <input
                      type="text"
                      value={businessProfile.tax_id}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, tax_id: e.target.value })}
                      disabled={!profileEditing}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: profileEditing ? 'white' : '#f8fdf7'
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
                      Business Address *
                    </label>
                    <textarea
                      value={businessProfile.business_address}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, business_address: e.target.value })}
                      disabled={!profileEditing}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: profileEditing ? 'white' : '#f8fdf7',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={businessProfile.bank_name}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, bank_name: e.target.value })}
                      disabled={!profileEditing}
                      placeholder="e.g., BDO, BPI, Metrobank"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: profileEditing ? 'white' : '#f8fdf7'
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2d3748', display: 'block', marginBottom: '0.5rem' }}>
                      Bank Account Number (for payments)
                    </label>
                    <input
                      type="password"
                      value={businessProfile.bank_account}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, bank_account: e.target.value })}
                      disabled={!profileEditing}
                      placeholder="Account number (hidden for security)"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #c8e6c9',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: profileEditing ? 'white' : '#f8fdf7'
                      }}
                    />
                  </div>

                  {/* Legitimacy & Accreditation */}
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1B5E20', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.4rem' }}>
                      <Icons.Shield size={18} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
                      {t('legitimacy_section')}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.4rem' }}>{t('legitimacy_hint')}</div>
                  </div>
                  {docGroup(t('field_business_permit_no'), t('field_business_permit_no'), 'business_permit_no', 'business_permit_expiry', 'business_permit_file')}
                  {docGroup(t('field_dot_no'), t('field_dot_no'), 'dot_no', 'dot_expiry', 'dot_file')}
                  {docGroup(t('field_philgeps_no'), t('field_philgeps_no'), 'philgeps_no', 'philgeps_expiry', 'philgeps_file')}
                </div>
              
                {profileEditing && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                    <button
                      className="gov-btn-ghost"
                      onClick={() => setProfileEditing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="gov-btn-primary"
                      onClick={handleSaveBusinessProfile}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages & Notifications */}
          {activeTab === 'messages' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Email size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Messages & Notifications
              </h1>

              <div className="gov-glass-panel" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="search"
                  value={messageSearch}
                  onChange={(event) => setMessageSearch(event.target.value)}
                  placeholder="Search messages and notifications"
                  aria-label="Search messages and notifications"
                  style={{ flex: '1 1 260px', minWidth: '220px', padding: '0.7rem 0.85rem', border: '1px solid #c8e6c9', borderRadius: '6px' }}
                />
                <select
                  value={messageFilter}
                  onChange={(event) => setMessageFilter(event.target.value)}
                  aria-label="Filter messages"
                  style={{ padding: '0.7rem 0.85rem', border: '1px solid #c8e6c9', borderRadius: '6px' }}
                >
                  <option value="all">All activity</option>
                  <option value="unread">Unread ({unreadNotificationCount + unreadMessageCount})</option>
                  <option value="received">Received messages</option>
                  <option value="sent">Sent messages</option>
                </select>
                <button className="gov-btn-ghost" onClick={markAllNotificationsRead} disabled={unreadNotificationCount === 0}>
                  Mark notifications read
                </button>
                <button className="gov-btn-ghost" onClick={markAllMessagesRead} disabled={unreadMessageCount === 0}>
                  Mark messages read
                </button>
              </div>
            
              {/* Notifications Section */}
              <div className="gov-glass-panel">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem' }}>
                  <Icons.Sparkles size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Recent Notifications
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => (
                      <div key={notif.notification_id} style={{
                        padding: '1.25rem',
                        background: notif.is_read ? '#f8fdf7' : '#e8f5e9',
                        borderRadius: '8px',
                        border: '1px solid #c8e6c9',
                        borderLeft: `4px solid ${notif.is_read ? '#c8e6c9' : '#2E7D32'}`,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={async () => {
                        if (!notif.is_read) {
                          try {
                            await api.put(`/messages/notifications/${notif.notification_id}/read`);
                            loadNotifications();
                          } catch (err) {
                            console.error('Failed to mark as read:', err);
                          }
                        }
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#e8f5e9'}
                      onMouseOut={(e) => e.currentTarget.style.background = notif.is_read ? '#f8fdf7' : '#e8f5e9'}>
                        <div style={{ fontSize: '2rem' }}>
                          {notif.type === 'booking' ? <Icons.Calendar size={20} /> : notif.type === 'payment' ? <Icons.Money size={20} /> : notif.type === 'message' ? <Icons.Chat size={20} /> : <Icons.Sparkles size={20} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1B5E20', marginBottom: '0.25rem' }}>
                            {notif.title}
                          </div>
                          <div style={{ fontSize: '0.9rem', color: '#2d3748', marginBottom: '0.5rem' }}>
                            {notif.message}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                            {new Date(notif.created_at).toLocaleString()}
                          </div>
                        </div>
                        {!notif.is_read && (
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#2E7D32'
                          }} />
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
                      {notifications.length > 0 ? 'No notifications match your filter' : 'No notifications yet'}
                    </div>
                  )}
                </div>
              </div>

              {/* Messages Section */}
              <div className="gov-glass-panel">
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <Icons.Chat size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Messages
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((msg) => (
                      <div key={msg.message_id} style={{
                        padding: '1.5rem',
                        background: msg.is_read ? '#f8fdf7' : '#e8f5e9',
                        borderRadius: '8px',
                        border: '1px solid #c8e6c9',
                        borderLeft: `4px solid ${msg.is_read ? '#c8e6c9' : '#2E7D32'}`,
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onClick={async () => {
                        if (!msg.is_read && isCurrentUser(msg.receiver_id)) {
                          try {
                            await api.put(`/messages/messages/${msg.message_id}/read`);
                              setMessages((currentMessages) => currentMessages.map((currentMessage) => (
                                currentMessage.message_id === msg.message_id
                                  ? { ...currentMessage, is_read: true }
                                  : currentMessage
                              )));
                              loadNotifications();
                          } catch (err) {
                            console.error('Failed to mark message as read:', err);
                          }
                        }
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#e8f5e9'}
                      onMouseOut={(e) => e.currentTarget.style.background = msg.is_read ? '#f8fdf7' : '#e8f5e9'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1B5E20' }}>
                              {isCurrentUser(msg.sender_id) ? `To: ${msg.receiver_name}` : `From: ${msg.sender_name}`}
                            </div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2d3748', marginTop: '0.25rem' }}>
                              {msg.subject}
                            </div>
                          </div>
                          {!msg.is_read && isCurrentUser(msg.receiver_id) && (
                            <div style={{
                              padding: '0.25rem 0.75rem',
                              background: '#2E7D32',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              NEW
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#2d3748', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                          {msg.message}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                        {!isCurrentUser(msg.sender_id) && (
                          <button
                            type="button"
                            className="gov-btn-ghost"
                            style={{ marginTop: '0.75rem' }}
                            onClick={(event) => {
                              event.stopPropagation();
                              setMessageSendError('');
                              setMessageComposer({
                                receiver_id: msg.sender_id,
                                recipient_name: msg.sender_name,
                                subject: msg.subject?.startsWith('Re:') ? msg.subject : `Re: ${msg.subject || 'No Subject'}`,
                                message: ''
                              });
                            }}
                          >
                            <Icons.Email size={16} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} /> Reply
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
                      {messages.length > 0 ? 'No messages match your filter' : 'No messages yet'}
                    </div>
                  )}
                </div>
              </div>

              {messageComposer && (
                <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setMessageComposer(null)}>
                  <div className="gov-glass-panel" style={{ width: 'min(620px, 100%)', border: '2px solid #2E7D32', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)' }} onClick={(event) => event.stopPropagation()}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1rem' }}>
                      Reply to {messageComposer.recipient_name}
                    </h2>
                    <form onSubmit={sendOwnerMessage} style={{ display: 'grid', gap: '0.75rem' }}>
                    <input
                      value={messageComposer.subject}
                      onChange={(event) => setMessageComposer({ ...messageComposer, subject: event.target.value })}
                      placeholder="Subject"
                      aria-label="Message subject"
                      style={{ padding: '0.7rem 0.85rem', border: '1px solid #c8e6c9', borderRadius: '6px' }}
                    />
                    <textarea
                      value={messageComposer.message}
                      onChange={(event) => setMessageComposer({ ...messageComposer, message: event.target.value })}
                      placeholder="Write your reply..."
                      aria-label="Message body"
                      rows={5}
                      required
                      autoFocus
                      style={{ padding: '0.7rem 0.85rem', border: '1px solid #c8e6c9', borderRadius: '6px', resize: 'vertical' }}
                    />
                    {messageSendError && <div role="alert" style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{messageSendError}</div>}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button type="button" className="gov-btn-ghost" onClick={() => setMessageComposer(null)}>Cancel</button>
                      <button type="submit" className="gov-btn-primary" disabled={messageSending || !messageComposer.message.trim()}>
                        {messageSending ? 'Sending...' : 'Send reply'}
                      </button>
                    </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Archive */}
          {activeTab === 'archive' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Archive size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Archive
              </h1>

              {/* Archive Sub-Navigation */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #c8e6c9',
                padding: '1rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 12px rgba(46, 125, 50, 0.08)',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {[
                  { id: 'bookings', label: 'Booking & Reservation', icon: <Icons.Calendar size={18} /> },
                  { id: 'payments', label: 'Payment Management', icon: <Icons.Money size={18} /> }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    className={archiveSubSection === sub.id ? 'gov-btn-primary' : 'gov-btn-ghost'}
                    onClick={() => setArchiveSubSection(sub.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {sub.icon} {sub.label}
                  </button>
                ))}
              </div>

              {/* Archived Bookings */}
              {archiveSubSection === 'bookings' && (
                <div className="gov-glass-panel">
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1B5E20', margin: '0 0 1.5rem 0' }}>
                    <Icons.Calendar size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Archived Bookings & Reservations
                  </h2>
                  <div className="gov-table-wrap">
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Hotel</th>
                          <th>Guest</th>
                          <th>Dates</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedBookings.map((booking) => (
                          <tr key={booking.booking_id}>
                            <td>#{booking.booking_id}</td>
                            <td>{booking.hotel_name}</td>
                            <td>{booking.username}</td>
                            <td>
                              {new Date(booking.check_in).toLocaleDateString()} → {new Date(booking.check_out).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 700, color: '#2E7D32' }}>
                              ₱{parseFloat(booking.total_amount || 0).toLocaleString()}
                            </td>
                            <td>
                              <span className="gov-badge-status gov-badge-status--cancelled">
                                {booking.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="gov-btn-primary"
                                onClick={async () => {
                                  try {
                                    await api.put(`/owner/bookings/${booking.booking_id}/restore`);
                                    loadArchivedBookings();
                                    fetchDashboardData();
                                  } catch (error) {
                                    console.error('Restore error:', error);
                                    alert(error.response?.data?.error || 'Failed to restore booking');
                                  }
                                }}
                              >
                                ↺ Restore
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedBookings.length === 0 && (
                    <div className="gov-empty">
                      <p>No archived bookings found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Archived Payments */}
              {archiveSubSection === 'payments' && (
                <div className="gov-glass-panel">
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1B5E20', margin: '0 0 1.5rem 0' }}>
                    <Icons.Money size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Archived Payments
                  </h2>
                  <div className="gov-table-wrap">
                    <table className="gov-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Customer</th>
                          <th>Amount</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedPayments.map((payment) => (
                          <tr key={payment.payment_id}>
                            <td>#{payment.payment_id}</td>
                            <td>{payment.customer_name || 'N/A'}</td>
                            <td>
                              ₱{parseFloat(payment.amount || 0).toLocaleString()}
                            </td>
                            <td>
                              {payment.method}
                            </td>
                            <td>
                              <span className="gov-badge-status gov-badge-status--cancelled">
                                {payment.status}
                              </span>
                            </td>
                            <td>
                              {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <button
                                className="gov-btn-primary"
                                onClick={async () => {
                                  try {
                                    await api.put(`/owner/payments/${payment.payment_id}/restore`);
                                    loadArchivedPayments();
                                    fetchPayments();
                                    fetchPaymentStats();
                                  } catch (error) {
                                    console.error('Restore error:', error);
                                    alert(error.response?.data?.error || 'Failed to restore payment');
                                  }
                                }}
                              >
                                ↺ Restore
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {archivedPayments.length === 0 && (
                    <div className="gov-empty">
                      <p>No archived payments found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
