import React, { useCallback, useEffect, useLayoutEffect, useState, useRef } from 'react';
import Icons from '../components/Icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ReportsAndAnalyticsDashboard from '../components/ReportsAndAnalyticsDashboard';
import api from '../api';
import Pagination from '../components/Pagination';
import RoomManagement from '../components/RoomManagement';
import RoomRevenueReport from '../components/RoomRevenueReport';
import PaymentPlanSettings from '../components/PaymentPlanSettings';
import StayExtensionControls from '../components/StayExtensionControls';
import { formatBookingBoundary } from '../utils/stayBooking';
import { buildPolicyLines, policyChip } from '../utils/bookingPolicy';
import BookingIssuedCell from '../components/BookingIssuedCell';
import { getBookingGuestName } from '../utils/bookingGuestName';
import ReferenceDetails from '../components/ReferenceDetails';
import ArchiveRecordModal from '../components/ArchiveRecordModal';
import OwnerDialog from '../components/OwnerDialog';
import OwnerReservationDetails from '../components/OwnerReservationDetails';
import OwnerSetupChecklist from '../components/OwnerSetupChecklist';
import OwnerTourismArrivals from '../components/OwnerTourismArrivals';
import TourismArrivalReminder from '../components/TourismArrivalReminder';
import BookingConversation from '../components/BookingConversation';
import useBookingPolicy from '../hooks/useBookingPolicy';
import useDashboardNotifications from '../hooks/useDashboardNotifications';
import DashboardNotifications, { NotificationBadge } from '../components/DashboardNotifications';
import { isExternalPaymentBooking, externalPaymentLabel } from '../utils/bookingPaymentPolicy';
import { formatHotelCurrency } from '../utils/hotelCurrency';
import { OWNER_PATHS, ownerTabFromPath, ownerStartingPrice, roomsForHotel, validateOwnerHotel, ownerTodayTasks } from '../utils/ownerDashboard';
import { registerOwnerHistoryGuard } from '../utils/ownerHistoryGuard';
import PaymentSummaryCards from '../components/PaymentSummaryCards';
import { getPaymentMethodLabel, getBookingPaymentMethod, getPaymentReferences } from '../utils/paymentDisplay';
import { ownerRecordReport } from '../utils/reportExports';
import OwnerCredentialFields from '../components/OwnerCredentialFields';
import { credentialForm } from '../utils/businessCredentials';
import { downloadReportCsv } from '../utils/exportFiles';
import ExportPdfButton from '../components/ExportPdfButton';
import { HOTEL_PAYMENT_METHOD_OPTIONS, DEFAULT_HOTEL_PAYMENT_METHODS } from '../utils/hotelPaymentMethods';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import naujanGoLogo from '../assets/552820828_1195483019268738_3720769628710779316_n.png';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './OwnerDashboard.css';
import './HotelDetail.css';

const getHotelPaymentMethodOptions = HOTEL_PAYMENT_METHOD_OPTIONS;

const OwnerDashboard = () => {
  const bookingPolicy = useBookingPolicy();
  const { user, logout } = useAuth();
  const notificationFeed = useDashboardNotifications(user?.user_id);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
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
    allowed_payment_methods: [...DEFAULT_HOTEL_PAYMENT_METHODS],
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
    payment_terms_text: '',
    modification_policy_text: '',
    noshow_policy_text: '',
    is_active: 1
  };

  const [stats, setStats] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [paymentLoadError, setPaymentLoadError] = useState('');
  const [paymentLoadedQuery, setPaymentLoadedQuery] = useState('');
  const [paymentStatsLoadedQuery, setPaymentStatsLoadedQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [showArchivedPayments, setShowArchivedPayments] = useState(false);
  const [archiveSelection, setArchiveSelection] = useState(null);
  const paymentListRequest = useRef(0);
  const paymentStatsRequest = useRef(0);
  const [paymentDateFrom, setPaymentDateFrom] = useState('');
  const [paymentDateTo, setPaymentDateTo] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
   const [paymentMethodSettings, setPaymentMethodSettings] = useState([...DEFAULT_HOTEL_PAYMENT_METHODS]);
  const [paymentMethodSettingsSaving, setPaymentMethodSettingsSaving] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const activeTab = ownerTabFromPath(location.pathname);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardLoaded, setDashboardLoaded] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const actionBusyRef = useRef(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [messageBooking, setMessageBooking] = useState(null);
  const [hotelErrors, setHotelErrors] = useState({});
  const [hotelSaveError, setHotelSaveError] = useState('');
  const [hotelSection, setHotelSection] = useState('details');
  const [hotelBaseline, setHotelBaseline] = useState('');
  const [roomDirty, setRoomDirty] = useState(false);
  const [plansDirty, setPlansDirty] = useState(false);
  const [calendarDirty, setCalendarDirty] = useState(false);
  const [capacityDirty, setCapacityDirty] = useState(false);
  const [roomBusy, setRoomBusy] = useState(false);
  const [plansBusy, setPlansBusy] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [roomHotelId, setRoomHotelId] = useState('');
  const [arrivalDirty, setArrivalDirty] = useState(false);
  const [conversationDirty, setConversationDirty] = useState(false);
  const [conversationBusy, setConversationBusy] = useState(false);
  const reportConversationDirty = useCallback(value => setConversationDirty(value), []);
  const reportConversationBusy = useCallback(value => setConversationBusy(value), []);
  const [arrivalBusy, setArrivalBusy] = useState(false);
  const arrivalDraft = useRef(null);
  const reportArrivalDirty = useCallback(value => setArrivalDirty(value), []);
  const reportArrivalBusy = useCallback(value => setArrivalBusy(value), []);
  const roomDrafts = useRef(new Map());
  const reportRoomDirty = useCallback(value => setRoomDirty(value), []);
  const reportPlansDirty = useCallback(value => setPlansDirty(value), []);
  const reportRoomBusy = useCallback(value => setRoomBusy(value), []);
  const reportPlansBusy = useCallback(value => setPlansBusy(value), []);
  const profileBaseline = useRef(null);
  const paymentMethodsBaseline = useRef(null);
  const historyPosition = useRef(typeof window !== 'undefined' ? window.history.state?.idx : null);
  const restoringHistory = useRef(false);
  const [historyRestoring, setHistoryRestoring] = useState(false);
  const allowedHistoryMove = useRef(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [creatingHotel, setCreatingHotel] = useState(false);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const [hotelSaving, setHotelSaving] = useState(false);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [showCoordinatePicker, setShowCoordinatePicker] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);


  // A booking can have several real payment attempts. Keep each payment_id so
  // failed attempts remain reviewable/archivable and agree with the summary.
  
    // Booking Management State
    const [bookingFilter, setBookingFilter] = useState('all');
    const [bookingSearch, setBookingSearch] = useState('');
    const [bookingDayFilter, setBookingDayFilter] = useState('all');
  
    // Business Profile State
    const [businessProfile, setBusinessProfile] = useState({
      business_name: user?.first_name || user?.username || '',
      business_email: user?.email || '',
      business_phone: user?.phone || '',
      business_address: '',
      tax_id: '',
      bank_name: '',
      ...credentialForm()
    });
    const [profileEditing, setProfileEditing] = useState(false);
    // Ref mirror of profileEditing so async refetches (focus/auth refresh)
    // can check it without a stale closure.
    const profileEditingRef = useRef(false);
    useEffect(() => { profileEditingRef.current = profileEditing; }, [profileEditing]);
    // Full vs limited dashboard authorization (legitimacy requirements)
    const [authorization, setAuthorization] = useState('full');
    const [missingRequirements, setMissingRequirements] = useState([]);
    const [profileStatus, setProfileStatus] = useState({ verification_status: 'pending', rejection_reason: '' });
    const [docUploading, setDocUploading] = useState('');

  // Availability drafts remain independent: saving date limits must not clear
  // an unsaved capacity change, and vice versa.
  const [selectedHotelForCalendar, setSelectedHotelForCalendar] = useState(null);
  const [availabilityForm, setAvailabilityForm] = useState({ rooms_total: '', rooms_available: '' });
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [availabilityByDate, setAvailabilityByDate] = useState({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const availabilityRequest = useRef(0);
  const [selectedAvailabilityRange, setSelectedAvailabilityRange] = useState({ start: null, end: null });
  const [availabilityEditForm, setAvailabilityEditForm] = useState({ rooms_available: '', is_closed: 0 });

  const hotelDirty = Boolean((editingHotel || creatingHotel) && JSON.stringify(hotelForm) !== hotelBaseline);
  const profileDirty = Boolean(profileEditing && profileBaseline.current && JSON.stringify(businessProfile) !== JSON.stringify(profileBaseline.current));
  const methodsDirty = Boolean(paymentMethodsBaseline.current && JSON.stringify([...paymentMethodSettings].sort()) !== paymentMethodsBaseline.current);
  const hasUnsavedChanges = hotelDirty || profileDirty || roomDirty || plansDirty || calendarDirty || capacityDirty || arrivalDirty || conversationDirty || (activeTab === 'payment-setup' && methodsDirty);
  const editsBusy = hotelSaving || imageUploading || Boolean(docUploading) || paymentMethodSettingsSaving || availabilitySaving || roomBusy || plansBusy || profileSaving || arrivalBusy || conversationBusy;
  const discardDrafts = (scope = 'all') => {
    if (scope === 'all' || scope === 'arrivals') { arrivalDraft.current = null; setArrivalDirty(false); }
    if (scope === 'all' || scope === 'hotel') {
      setEditingHotel(null); setCreatingHotel(false); setHotelForm(emptyHotelForm); setGalleryUrlInput('');
    }
    if (scope === 'all' || scope === 'profile') {
      if (profileEditingRef.current && profileBaseline.current) setBusinessProfile(profileBaseline.current);
      setProfileEditing(false);
    }
    if (scope === 'all' || scope === 'room') {
      roomDrafts.current.forEach(draft => draft.selectedImages.forEach(image => URL.revokeObjectURL(image.preview)));
      roomDrafts.current.clear(); setRoomDirty(false);
    }
    if (scope === 'all') {
      setConversationDirty(false); setMessageBooking(null);
      setPlansDirty(false); setCalendarDirty(false); setCapacityDirty(false);
      setSelectedAvailabilityRange({ start: null, end: null }); setAvailabilityEditForm({ rooms_available: '', is_closed: 0 });
      if (selectedHotelForCalendar) setAvailabilityForm({ rooms_total: selectedHotelForCalendar.rooms_total ?? '', rooms_available: selectedHotelForCalendar.rooms_available ?? '' });
      setPaymentMethodSettings(hotels[0]?.allowed_payment_methods || [...DEFAULT_HOTEL_PAYMENT_METHODS]);
    }
  };
  const requestLeave = (action, scope = 'all') => {
    if (editsBusy || historyRestoring) { setNotice('Please wait for the current save, upload or navigation to finish.'); return; }
    const dirty = scope === 'hotel' ? hotelDirty : scope === 'profile' ? profileDirty : scope === 'room' ? roomDirty : scope === 'arrivals' ? arrivalDirty : hasUnsavedChanges;
    if (!dirty) { action(); return; }
    setPendingAction({ kind: 'discard', title: 'Discard unsaved changes?', run: () => { discardDrafts(scope); action(); } });
  };
  const setActiveTab = tab => requestLeave(() => { setNavOpen(false); navigate(OWNER_PATHS[tab] || OWNER_PATHS.overview); });
  useEffect(() => { setMessageBooking(null); }, [activeTab]);
  useEffect(() => {
    const warn = event => { if (hasUnsavedChanges || editsBusy) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges, editsBusy]);

  useLayoutEffect(() => { historyPosition.current = window.history.state?.idx; }, [location.pathname]);
  useLayoutEffect(() => {
    // BrowserRouter uses history.state.idx. Capture a browser Back/Forward
    // before the router unmounts the editor. Neither the blocked pop nor its
    // restoration should reach the router; only an explicitly allowed move does.
    const protectHistory = event => {
      if (restoringHistory.current) { restoringHistory.current = false; setHistoryRestoring(false); event.stopImmediatePropagation(); return; }
      if (allowedHistoryMove.current) { allowedHistoryMove.current = false; return; }
      if (!hasUnsavedChanges && !editsBusy) return;
      const next = window.history.state?.idx, previous = historyPosition.current;
      if (!Number.isInteger(next) || !Number.isInteger(previous) || next === previous) return;
      const delta = next - previous;
      event.stopImmediatePropagation(); restoringHistory.current = true; setHistoryRestoring(true); window.history.go(-delta);
      if (editsBusy) { setNotice('Please wait for the save or upload to finish.'); return; }
      setPendingAction({ kind: 'discard', title: 'Discard unsaved changes?', run: () => { discardDrafts(); allowedHistoryMove.current = true; window.history.go(delta); } });
    };
    return registerOwnerHistoryGuard(protectHistory);
  }, [hasUnsavedChanges, location.pathname, editsBusy]);

  useEffect(() => () => {
    roomDrafts.current.forEach(draft => draft.selectedImages.forEach(image => URL.revokeObjectURL(image.preview)));
    roomDrafts.current.clear();
  }, []);

  useEffect(() => {
    if (!dashboardLoaded) return;
    setNavOpen(false);
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'analytics') loadAnalytics();
    if (activeTab === 'messages') loadMessages();
    if (activeTab === 'archive') { loadArchivedBookings(); loadArchivedPayments(); }
  }, [activeTab, dashboardLoaded]);

  useEffect(() => {
    if (!navOpen) return;
    const keyboard = event => { if (event.key === 'Escape') { setNavOpen(false); document.querySelector('.gov-menu-btn')?.focus(); } };
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [navOpen]);
  
    const [rooms, setRooms] = useState([]);
  
    // Review Management State
    const [replyingToReview, setReplyingToReview] = useState(null);
    const [reviewReply, setReviewReply] = useState('');
  
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
    // Depend on ids, not the user object: AuthContext.refreshProfile() on
    // window focus replaces `user` with a new identity, which used to
    // re-run this effect and clobber unsaved profile edits / uploads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id, user?.role]);

  useEffect(() => {
    if (selectedHotelForCalendar) {
      loadAvailabilityForMonth(selectedHotelForCalendar.hotel_id, calendarMonth);
    }
  }, [selectedHotelForCalendar, calendarMonth]);

  // Reset pagination when filters change
  useEffect(() => { setOwnerBookingsPage(1); }, [bookingSearch, bookingFilter, bookingDayFilter]);
  useEffect(() => { setPaymentsPage(1);      }, [paymentFilter, paymentMethodFilter, paymentDateFrom, paymentDateTo, paymentSearch, showArchivedPayments]);
  useEffect(() => { if (bookingFilter === 'archived') loadArchivedBookings(); }, [bookingFilter]);

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPayments();
      fetchPaymentStats();
    }
  }, [activeTab, paymentFilter, paymentMethodFilter, paymentDateFrom, paymentDateTo, paymentSearch, showArchivedPayments]);

  useEffect(() => {
    if (!hotels.length) return;
    if (methodsDirty) return;
    const firstHotel = hotels[0];
    const methods = Array.isArray(firstHotel.allowed_payment_methods) && firstHotel.allowed_payment_methods.length ? firstHotel.allowed_payment_methods : [...DEFAULT_HOTEL_PAYMENT_METHODS];
    paymentMethodsBaseline.current = JSON.stringify([...methods].sort());
    setPaymentMethodSettings(methods);
  }, [hotels]);

  useEffect(() => {
    if ((!editingHotel && !creatingHotel) || hotelSection !== 'details') {
      if (mapInstance) { mapInstance.remove(); setMapInstance(null); }
      setShowCoordinatePicker(false);
    }
  }, [editingHotel, creatingHotel, hotelSection, mapInstance]);

  // Access state (verification badge, authorization, stats/bookings) comes
  // from /owner/profile. Shared by the initial load and the focus refresh so
  // an admin's verification shows up without a manual reload.
  const applyAccess = async (profileData) => {
    const bp = profileData.businessProfile;
    setProfileStatus({
      verification_status: bp?.verification_status || 'pending',
      rejection_reason: bp?.rejection_reason || '',
      credentials: Array.isArray(bp?.credentials) ? bp.credentials : null
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
  };

  // Profile-only refresh: never touches the business-profile form state, so
  // it cannot clobber fields the owner is in the middle of editing.
  const refreshAccess = async () => {
    try {
      const res = await api.get('/owner/profile');
      await applyAccess(res.data || {});
    } catch (error) {
      console.error('Error refreshing owner access:', error);
    }
  };

  // Re-validate when the tab regains focus so verification (made by an admin
  // in another tab) unlocks the dashboard in an already-open session.
  useEffect(() => {
    let lastRefresh = 0;
    const refresh = () => {
      const now = Date.now();
      if (now - lastRefresh < 10000) return; // focus + visibility double-fire
      lastRefresh = now;
      refreshAccess();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDashboardData = async () => {
    setDashboardError('');
    try {
      const [hotelsRes, roomsRes, profileRes] = await Promise.all([
        api.get('/owner/hotels'),
        api.get('/owner/rooms'),
        api.get('/owner/profile')
      ]);
      if (!Array.isArray(hotelsRes.data) || !Array.isArray(roomsRes.data)) throw new Error('Invalid listing response');
      setHotels(hotelsRes.data);
      setRooms(roomsRes.data);

      const profileData = profileRes.data || {};
      const bp = profileData.businessProfile;

      // Load business profile if it exists. While the owner is editing the
      // form, keep local state instead of overwriting it with DB values
      // (refetches can fire mid-edit via focus/auth refresh or other actions).
      if (bp && !profileEditingRef.current) {
        setBusinessProfile({
          business_name: bp.business_name || user?.first_name || user?.username || '',
          business_email: bp.business_email || user?.email || '',
          business_phone: bp.business_phone || user?.phone || '',
          business_address: bp.business_address || '',
          tax_id: bp.tax_id || '',
          bank_name: bp.bank_name || '',
          ...credentialForm(bp)
        });
      }
      await applyAccess(profileData);
      setDashboardLoaded(true);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardError('Could not load your dashboard. Your saved property and reservations have not been deleted.');
      if (error.response?.status === 403) {
        alert('Access denied');
        navigate('/');
      }
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setReviewsError('');
    try {
      const res = await api.get('/owner/reviews');
      if (!Array.isArray(res.data)) throw new Error('Invalid review response');
      setReviews(res.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviewsError('Could not load reviews. Please retry.');
    }
  };

  // Lightweight room-only refresh for the availability calendar /
  // Room Types Inventory after Room Management edits.
  const refreshOwnerRooms = async () => {
    try {
      const res = await api.get('/owner/rooms');
      setRooms(res.data);
    } catch (error) {
      console.error('Error refreshing owner rooms:', error);
    }
  };

  const paymentQueryParams = () => ({
    limit: 500, archived: showArchivedPayments ? 'all' : '0',
    ...(paymentFilter !== 'all' ? { status: paymentFilter } : {}),
    ...(paymentMethodFilter !== 'all' ? { method: paymentMethodFilter } : {}),
    ...(paymentDateFrom ? { startDate: paymentDateFrom } : {}),
    ...(paymentDateTo ? { endDate: paymentDateTo } : {}),
    ...(paymentSearch.trim() ? { search: paymentSearch.trim() } : {})
  });

  const fetchPayments = async () => {
    const requestId = ++paymentListRequest.current;
    const params = paymentQueryParams();
    setPaymentLoadedQuery('');
    setPaymentLoadError('');
    try {
      const res = await api.get('/owner/payments', { params });
      if (!Array.isArray(res.data)) throw new Error('Invalid payment response');
      if (requestId === paymentListRequest.current) {
        setPayments(res.data);
        setPaymentLoadedQuery(JSON.stringify(params));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      if (requestId === paymentListRequest.current) {
        setPayments([]);
        setPaymentLoadError(error.response?.data?.error || 'Could not load payments.');
      }
    }
  };

  const fetchPaymentStats = async () => {
    const requestId = ++paymentStatsRequest.current;
    const params = paymentQueryParams();
    setPaymentStatsLoadedQuery('');
    try {
      const res = await api.get('/owner/payments/stats', { params });
      if (requestId === paymentStatsRequest.current) {
        setPaymentStats(res.data);
        setPaymentStatsLoadedQuery(JSON.stringify(params));
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      if (requestId === paymentStatsRequest.current) {
        setPaymentStats(null);
        setPaymentLoadError(error.response?.data?.error || 'Could not load payment totals.');
      }
    }
  };

  const handleLogout = async () => {
    if (hasUnsavedChanges || editsBusy) { requestLeave(() => logout().then(() => navigate('/login', { replace: true }))); return; }
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
    if (docUploading || profileSaving) return;
    setProfileSaving(true);
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
        // Legitimacy & accreditation details
        ...credentialForm(businessProfile)
      };

      const res = await api.put('/owner/profile', payload);
      
      if (res.data.success) {
        setNotice('Business details saved. Guest-facing hotel contacts are edited under My Property.');
        profileBaseline.current = { ...businessProfile };
        setProfileEditing(false);
        // Reload profile data
        await fetchDashboardData();
      }
    } catch (error) {
      console.error('Error saving business profile:', error);
      alert(error.response?.data?.error || 'Failed to save business profile');
    } finally { setProfileSaving(false); }
  };

  const handleDocumentUpload = async (field, file) => {
    if (!file || docUploading || profileSaving) return;
    setDocUploading(field);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('field', field);
      const res = await api.post('/owner/profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBusinessProfile((prev) => ({ ...prev, [field]: res.data.url }));
      if (profileBaseline.current) profileBaseline.current = { ...profileBaseline.current, [field]: res.data.url };
      setProfileStatus(current => ({ ...current, verification_status: 'pending' }));
      await refreshAccess();
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
      const requestId = ++availabilityRequest.current;
      const { start, end } = getMonthRange(monthDate);
      const startKey = toDateKey(start);
      const endKey = toDateKey(end);
      try {
        setAvailabilityLoading(true); setAvailabilityReady(false); setAvailabilityError('');
        const response = await api.get(`/owner/hotels/${hotelId}/availability`, {
          params: { start: startKey, end: endKey }
        });
        if (!Array.isArray(response.data)) throw new Error('Invalid availability response');
        if (requestId !== availabilityRequest.current) return;
        const nextByDate = {};
        response.data.forEach((entry) => {
          nextByDate[entry.date] = entry;
        });
        setAvailabilityByDate(nextByDate); setAvailabilityReady(true);
      } catch (error) {
        console.error('Error loading availability calendar:', error);
        if (requestId === availabilityRequest.current) setAvailabilityError('Could not load date limits. Retry before making changes.');
      } finally {
        if (requestId === availabilityRequest.current) setAvailabilityLoading(false);
      }
    };

  const selectHotelForCalendar = (hotel) => {
    setSelectedHotelForCalendar(hotel);
    setAvailabilityForm({
      rooms_total: hotel.rooms_total ?? '',
      rooms_available: hotel.rooms_available ?? '',
      is_active: Number(hotel.is_active) === 1 ? 1 : 0
    });
    setCalendarMonth(new Date());
    setSelectedAvailabilityRange({ start: null, end: null });
    setAvailabilityEditForm({ rooms_available: '', is_closed: 0 });
    setCalendarDirty(false); setCapacityDirty(false);
  };

  const handleAvailabilitySave = async () => {
    if (!selectedHotelForCalendar) return;
    if (['rooms_total', 'rooms_available'].some(key => availabilityForm[key] === '' || !Number.isInteger(Number(availabilityForm[key])) || Number(availabilityForm[key]) < 0)) {
      setAvailabilityError('Enter non-negative whole numbers for the capacity limit and listing counter.'); return;
    }
    const payload = {
      rooms_total: availabilityForm.rooms_total === '' ? null : Number(availabilityForm.rooms_total),
      rooms_available: availabilityForm.rooms_available === '' ? null : Number(availabilityForm.rooms_available)
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
            }
          : prev
      );
      setCapacityDirty(false); setAvailabilityError(''); setNotice('Property capacity limits saved. Room rates and date-specific limits were not changed.');
    } catch (error) {
      console.error('Error saving availability settings:', error);
      setAvailabilityError(error.response?.data?.error || 'Could not save capacity limits. Your edits are retained.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleCalendarDateClick = (dateKey) => {
    if (calendarDirty) { setAvailabilityError('Save or cancel the current date edits before selecting another range.'); return; }
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
      is_closed: Number(entry?.is_closed) === 1 ? 1 : 0
    });
  };

  const handleAvailabilityRangeSave = async () => {
    if (!selectedHotelForCalendar || !selectedAvailabilityRange.start) return;
    if (availabilityEditForm.rooms_available !== '' && (!Number.isInteger(Number(availabilityEditForm.rooms_available)) || Number(availabilityEditForm.rooms_available) < 0)) { setAvailabilityError('Date limits must be a non-negative whole number or blank to use the property cap.'); return; }
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
      setCalendarDirty(false); setNotice('Date limits saved.');
    } catch (error) {
      console.error('Error saving availability calendar:', error);
      setAvailabilityError(error.response?.data?.error || 'Could not save date limits. Your edits are retained.');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const startHotelEdit = (hotel, section = 'details') => {
    setCreatingHotel(false);
    setEditingHotel(hotel);
    setHotelSection(section); setHotelErrors({}); setHotelSaveError('');
    const nextForm = {
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
      payment_terms_text: hotel.payment_terms_text || '',
      modification_policy_text: hotel.modification_policy_text || '',
      noshow_policy_text: hotel.noshow_policy_text || '',
      is_active: Number(hotel.is_active) === 1 ? 1 : 0
    };
    setHotelForm(nextForm); setHotelBaseline(JSON.stringify(nextForm));
  };

  const handleHotelSave = async () => {
    if (!editingHotel) return;
    const hasRooms = roomsForHotel(rooms, editingHotel).length > 0;
    const errors = validateOwnerHotel(hotelForm, hasRooms);
    setHotelErrors(errors); setHotelSaveError('');
    if (Object.keys(errors).length) {
      setHotelSection(Object.keys(errors).some(key => ['name', 'location', 'contact_email', 'currency', 'latitude', 'longitude', 'price_per_night'].includes(key)) ? 'details' : 'policies');
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
        ...(!hasRooms && hotelForm.price_per_night !== '' && hotelForm.price_per_night != null
          ? { price_per_night: Number(hotelForm.price_per_night) }
          : {}),
        currency: hotelForm.currency || 'PHP',
        amenities: hotelForm.amenities,
        image_url: primaryImage,
        image_urls: imageUrls,
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
        payment_terms_text: (hotelForm.payment_terms_text || '').trim() || null,
        modification_policy_text: (hotelForm.modification_policy_text || '').trim() || null,
        noshow_policy_text: (hotelForm.noshow_policy_text || '').trim() || null,
        is_active: Number(hotelForm.is_active) || 0
      };

      const res = await api.put(`/owner/hotels/${editingHotel.hotel_id}`, payload);
      setNotice(res.data?.warning || 'Property changes saved. Your public listing is updated.');
      setEditingHotel(null);
      setHotelForm(emptyHotelForm);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error saving hotel:', error);
      setHotelSaveError(error.response?.data?.error || 'Could not save the property. Your edits are still here; please retry.');
    } finally {
      setHotelSaving(false);
    }
  };

  const startHotelCreate = () => {
    setCreatingHotel(true);
    setEditingHotel(null);
    setHotelForm(emptyHotelForm);
    setHotelBaseline(JSON.stringify(emptyHotelForm)); setHotelSection('details'); setHotelErrors({}); setHotelSaveError('');
    setGalleryUrlInput('');
  };

  const handleHotelCreate = async () => {
    const errors = validateOwnerHotel(hotelForm);
    setHotelErrors(errors); setHotelSaveError('');
    if (Object.keys(errors).length) { setHotelSection('details'); return; }
    try {
      setHotelSaving(true);
      const imageUrls = Array.isArray(hotelForm.image_urls) ? hotelForm.image_urls.filter(Boolean) : [];
      const primaryImage = hotelForm.image_url || imageUrls[0] || '';
      const payload = {
        name: hotelForm.name,
        location: hotelForm.location,
        description: hotelForm.description,
        price_per_night: hotelForm.price_per_night === '' ? 0 : Number(hotelForm.price_per_night),
        currency: hotelForm.currency || 'PHP',
        amenities: hotelForm.amenities,
        image_url: primaryImage,
        image_urls: imageUrls,
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
        payment_terms_text: (hotelForm.payment_terms_text || '').trim() || null,
        modification_policy_text: (hotelForm.modification_policy_text || '').trim() || null,
        noshow_policy_text: (hotelForm.noshow_policy_text || '').trim() || null,
        is_active: Number(hotelForm.is_active) || 0
      };

      await api.post('/owner/hotels', payload);
      setNotice('Property created. Next, add your room types and rates.');
      setCreatingHotel(false);
      setHotelForm(emptyHotelForm);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error creating hotel:', error);
      if (error.response?.status === 409) {
        setHotelSaveError('You already have a property. Refresh the dashboard to manage it.');
      } else {
        setHotelSaveError(error.response?.data?.error || 'Could not create the property. Your edits are still here; please retry.');
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
        setHotelForm(prev => ({
          ...prev,
          latitude: pos.lat.toFixed(5),
          longitude: pos.lng.toFixed(5)
        }));
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setHotelForm(prev => ({
          ...prev,
          latitude: e.latlng.lat.toFixed(5),
          longitude: e.latlng.lng.toFixed(5)
        }));
      });

      setMapInstance(map);
    }, 100);
  };

  const handleImageUpload = async (files) => {
    const picked = Array.from(files || []);
    if (picked.length === 0) return;
    setHotelSaveError('');
    const uploaded = [];
    try {
      setImageUploading(true);
      for (const file of picked) {
        const formData = new FormData(); formData.append('image', file);
        const res = await api.post('/owner/hotels/upload', formData);
        if (!res.data?.url) throw new Error('No image URL returned');
        uploaded.push(res.data.url);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      setHotelSaveError(error.response?.data?.error || 'Some photos could not be uploaded. Successful uploads are kept in this draft; retry the remaining files.');
    } finally {
      if (uploaded.length) setHotelForm(prev => ({ ...prev, image_urls: [...new Set([...prev.image_urls, ...uploaded])] }));
      setImageUploading(false);
    }
  };

  const ownerModules = [
    { id: 'overview', label: 'Overview', icon: <Icons.ChartPie size={22} /> },
    { id: 'hotels', label: 'My Property', icon: <Icons.Hotel size={22} /> },
    { id: 'rooms', label: 'Rooms & Rates', icon: <Icons.Bed size={22} /> },
    { id: 'payment-setup', label: 'Payment Setup', icon: <Icons.Money size={22} /> },
    { id: 'bookings', label: 'Reservations', icon: <Icons.Calendar size={22} /> },
    { id: 'calendar', label: 'Availability', icon: <Icons.Calendar size={22} /> },
    { id: 'payments', label: bookingPolicy.paymentsDisabled ? 'Payment History' : 'Payments', icon: <Icons.Money size={22} /> },
    { id: 'reviews', label: 'Reviews', icon: <Icons.Star size={22} /> },
    { id: 'analytics', label: 'Analytics', icon: <Icons.ChartLineUp size={22} /> },
    { id: 'tourism-arrivals', label: 'Tourism Arrivals', icon: <Icons.Users size={22} /> },
    { id: 'profile', label: 'Business & Verification', icon: <Icons.User size={22} /> },
    { id: 'notifications', label: 'Notifications', icon: <Icons.Bell size={22} /> },
    { id: 'messages', label: 'Messages', icon: <Icons.Email size={22} /> },
    { id: 'archive', label: 'Archive', icon: <Icons.Archive size={22} /> }
  ];

  // Limited authorization: incomplete/ unverified legitimacy requirements
  // restricts the dashboard to hotel listing management + business profile.
  const isLimitedOwner = authorization !== 'full' && user?.role !== 'admin';
  const visibleOwnerModules = ownerModules.filter(module =>
    (module.id !== 'payment-setup' || !bookingPolicy.paymentsDisabled)
    && (!isLimitedOwner || ['hotels', 'rooms', 'payment-setup', 'tourism-arrivals', 'profile', 'notifications'].includes(module.id))
  );

  useEffect(() => {
    if (dashboardLoaded && isLimitedOwner && !['hotels', 'rooms', 'payment-setup', 'tourism-arrivals', 'profile', 'notifications'].includes(activeTab)) {
      navigate(OWNER_PATHS.hotels, { replace: true });
    }
  }, [isLimitedOwner, activeTab, dashboardLoaded]);

  useEffect(() => {
    if (activeTab === 'calendar' && hotels.length === 1 && !selectedHotelForCalendar) selectHotelForCalendar(hotels[0]);
  }, [activeTab, hotels]);

  const isCurrentUser = (userId) => String(userId) === String(user?.user_id);
  
    const ownerHotelIds = new Set(hotels.map((hotel) => hotel.hotel_id));
    const filteredPayments = payments;
    const todayTasks = ownerTodayTasks(bookings);
    const taskBookings = bookingDayFilter === 'all' ? null : new Set((todayTasks[bookingDayFilter] || []).map(booking => booking.booking_id));
    const filteredBookings = (bookingFilter === 'archived' ? archivedBookings : bookings).filter(booking => {
      if (ownerHotelIds.size > 0 && !ownerHotelIds.has(booking.hotel_id)) return false;
      if (taskBookings && !taskBookings.has(booking.booking_id)) return false;
      
      // Handle archived filter
      if (bookingFilter === 'archived') {
        if (!booking.archived) return false;
      } else if (bookingFilter !== 'all') {
        if (booking.archived) return false;  // Hide archived bookings when viewing active bookings
        if (booking.status !== bookingFilter) return false;
      }
      
      const search = bookingSearch.trim().toLowerCase();
      if (search) {
        return [
          booking.hotel_name, booking.username, getBookingGuestName(booking),
          booking.booking_reference, booking.receipt_number,
          booking.payment_customer_reference, booking.payment_transaction_reference,
          booking.payment_reference,
          getPaymentMethodLabel(getBookingPaymentMethod(booking), t)
        ].some(value => typeof value === 'string' && value.toLowerCase().includes(search));
      }
      return true;
    });

    const normalizedMessageSearch = messageSearch.trim().toLowerCase();
    const filteredMessages = messages.filter((message) => {
      if (messageFilter === 'unread' && (message.is_read || !isCurrentUser(message.receiver_id))) return false;
      if (messageFilter === 'sent' && !isCurrentUser(message.sender_id)) return false;
      if (messageFilter === 'received' && !isCurrentUser(message.receiver_id)) return false;
      if (!normalizedMessageSearch) return true;
      return `${message.subject} ${message.message} ${message.sender_name} ${message.receiver_name}`
        .toLowerCase()
        .includes(normalizedMessageSearch);
    });
    const unreadMessageCount = messages.filter((message) => !message.is_read && isCurrentUser(message.receiver_id)).length;
  
    const handleBookingStatusChange = (bookingId, newStatus) => {
      const booking = bookings.find(item => Number(item.booking_id) === Number(bookingId));
      if (!booking) return;
      setPendingAction({ kind: 'reservation', title: newStatus === 'cancelled' ? 'Cancel this reservation?' : 'Confirm this reservation?', booking, status: newStatus,
        run: async () => {
          await api.put(`/owner/bookings/${bookingId}/status`, { status: newStatus });
          setSelectedReservation(null); await fetchDashboardData();
          setNotice(`Reservation #${bookingId} ${newStatus}. Payment records have not been deleted or refunded by this action.`);
        }
      });
    };

    const handleArchiveBooking = async (bookingId) => {
      if (!window.confirm('Archive this booking in your dashboard only? Booking status, payments, and room inventory will not change.')) return;
      try {
        await api.put(`/owner/bookings/${bookingId}/archive`);
        await fetchDashboardData();
        await loadArchivedBookings();
        alert('Booking archived in your dashboard only');
      } catch (error) {
        console.error('Error archiving booking:', error);
        alert(error.response?.data?.error || 'Failed to archive booking');
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

    const handleModerateReview = async (review, moderated) => {
      const confirmed = window.confirm(
        moderated ? t('confirm_restore_review') : t('confirm_hide_review')
      );
      if (!confirmed) return;
      try {
        await api.put(`/owner/reviews/${review.review_id}/moderate`, { moderated });
        await fetchReviews();
      } catch (error) {
        console.error('Error moderating review:', error);
        alert(error.response?.data?.error || t('review_moderation_failed'));
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
          monthlyTrends: []
        });
      } finally {
        setAnalyticsLoading(false);
      }
    };
  
    const loadMessages = async () => {
      try {
        const messagesRes = await api.get('/messages/messages');
        setMessages(messagesRes.data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
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
        await loadMessages();
        await notificationFeed.refresh();
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
  
    const paymentExportUnavailable = Boolean(paymentLoadError)
      || paymentLoadedQuery !== JSON.stringify(paymentQueryParams())
      || paymentStatsLoadedQuery !== JSON.stringify(paymentQueryParams());
    const recordReport = type => ownerRecordReport(type,
      type === 'bookings' ? filteredBookings : type === 'payments' ? filteredPayments : reviews,
      type === 'payments'
        ? `Status: ${paymentFilter}; method: ${paymentMethodFilter}; dates: ${paymentDateFrom || 'any'} to ${paymentDateTo || 'any'}; search: ${paymentSearch || 'none'}; archived: ${showArchivedPayments ? 'included' : 'excluded'}. Loaded matching payment attempts: ${filteredPayments.length}. Matching summary count: ${paymentStats?.total_transactions ?? 'unavailable'}. Not a complete ledger when more matches exist on the server; attempts are not necessarily successful payments.`
        : type === 'bookings' ? `Current booking filter: ${bookingFilter}. Task filter: ${bookingDayFilter}. Search: ${bookingSearch || 'none'}. All loaded matches, not just the current display page.`
          : 'All loaded reviews for the hotels available to this owner.');
    const exportReport = type => downloadReportCsv(recordReport(type));

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
              <div className="gov-grid-3" style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
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

  if (!dashboardLoaded && dashboardError) return <div className="gov-dashboard owner-load-failure">
    <section className="gov-glass-panel"><h1>Dashboard unavailable</h1><p role="alert">{dashboardError}</p>
      <button type="button" className="gov-btn-primary" onClick={() => { setLoading(true); fetchDashboardData(); }}>Retry dashboard</button>
    </section>
  </div>;

  return (
    <div className="gov-dashboard gov-dashboard--owner">
      <button
        className="gov-menu-btn"
        onClick={() => setNavOpen((v) => !v)}
        aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={navOpen}
        aria-controls="owner-nav"
      >
        <span></span><span></span><span></span>
      </button>
      {navOpen && <div className="gov-nav-scrim" onClick={() => setNavOpen(false)} />}
      <div className="gov-shell">
        <aside className={`gov-sidebar${navOpen ? ' is-open' : ''}`}>
          {/* Sidebar Brand */}
          <div className="gov-sidebar-brand">
            <Link to="/owner" className="gov-brand" onClick={event => { event.preventDefault(); setActiveTab('overview'); }}>
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
          <nav className={`gov-nav${visibleOwnerModules.length <= 3 ? ' gov-nav--compact' : ''}`} id="owner-nav">
            {visibleOwnerModules.map((module, index) => {
              const isActive = activeTab === module.id;
              return (<React.Fragment key={module.id}>
                {module.id === 'hotels' && <div className="owner-nav-group">Property setup</div>}
                {module.id === 'bookings' && <div className="owner-nav-group">Daily work</div>}
                {module.id === 'profile' && <div className="owner-nav-group">Business &amp; history</div>}
                <button
                  key={module.id}
                  className={`gov-nav-btn${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={module.id === 'notifications' ? 'Notifications' : undefined}
                  style={{ '--i': index }}
                  onClick={() => {
                    setNavOpen(false);
                    setActiveTab(module.id);
                    if (module.id === 'notifications') notificationFeed.refresh();
                  }}
                >
                  <span className="gov-nav-btn__icon">{module.icon}</span>
                  <span className="gov-nav-btn__label">
                    {module.label}
                    {module.id === 'messages' && unreadMessageCount > 0 && (
                      <span style={{ marginLeft: '0.5rem', minWidth: '1.25rem', padding: '0.1rem 0.35rem', borderRadius: '999px', background: '#c62828', color: '#fff', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>
                        {unreadMessageCount}
                      </span>
                    )}
                  </span>
                  {module.id === 'notifications' && <NotificationBadge count={notificationFeed.unreadCount} />}
                </button></React.Fragment>
              );
            })}
          </nav>
        </aside>

        <main className="gov-main">
        {notice && <div className="owner-notice" role="status">{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice('')}>×</button></div>}
        {dashboardError && <div className="owner-error" role="alert">{dashboardError} Displayed data may be out of date. <button type="button" onClick={fetchDashboardData}>Retry</button></div>}
        {actionError && <p className="owner-error" role="alert">{actionError}</p>}
        {activeTab === 'notifications' && <DashboardNotifications feed={notificationFeed} role="owner" onOpen={isLimitedOwner ? undefined : setActiveTab} />}
        {activeTab === 'rooms' && <section className="owner-rooms-page">
          <h1 className="gov-page-title">Rooms &amp; Rates</h1>
          <p>Set room types, physical inventory and prices here. Use Availability for date-specific limits and closures.</p>
          {hotels.length > 1 && <label>Property <select value={roomHotelId || hotels[0].hotel_id} onChange={event => { const value = event.target.value; requestLeave(() => setRoomHotelId(value), 'room'); }}>{hotels.map(hotel => <option key={hotel.hotel_id} value={hotel.hotel_id}>{hotel.name}</option>)}</select></label>}
          {hotels.length ? <RoomManagement key={roomHotelId || hotels[0].hotel_id} embedded hotel={hotels.find(hotel => String(hotel.hotel_id) === String(roomHotelId)) || hotels[0]}
            t={t} onRoomsChanged={refreshOwnerRooms} draftStore={roomDrafts.current} onDirtyChange={reportRoomDirty} onBusyChange={reportRoomBusy} confirmLeave={action => requestLeave(action, 'room')} />
            : <div className="gov-glass-panel"><p>Create your property before adding room types.</p><button type="button" className="gov-btn-primary" onClick={() => setActiveTab('hotels')}>Set up property</button></div>}
        </section>}
        {activeTab === 'tourism-arrivals' && <OwnerTourismArrivals hotels={hotels} draftStore={arrivalDraft} onDirtyChange={reportArrivalDirty} onBusyChange={reportArrivalBusy} confirmLeave={action => requestLeave(action, 'arrivals')} />}
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
          const metricCards = [
            { label: 'Hotels Managed', value: stats.hotelCount ?? 0, accent: '#16a34a', sub: 'Your property' },
            { label: 'Total Bookings', value: total, accent: '#7c3aed', sub: 'All time' },
            { label: 'Confirmed', value: confirmed, accent: '#2563eb', sub: `${confPct}% of total` },
            { label: 'Pending', value: pending, accent: '#d97706', sub: 'Awaiting action' },
            {
              label: 'Reservations with a balance',
              value: todayTasks.unpaid.length,
              accent: '#dc2626',
              sub: 'View each reservation for its recorded currency and balance'
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
              <section className="owner-today" aria-label="Today’s work">
                <h2>Today’s work <small>Philippine time</small></h2>
                <div className="owner-task-grid">{[
                  ['arrivals', 'Arrivals today'], ['departures', 'Departures today'], ['pending', 'Pending requests'], ['unpaid', 'Reservations with balances']
                ].map(([key, label]) => <button type="button" key={key} onClick={() => { setBookingDayFilter(key === 'pending' ? 'all' : key); setBookingFilter(key === 'pending' ? 'pending' : 'all'); setActiveTab('bookings'); }}>
                  <strong>{todayTasks[key].length}</strong><span>{label}</span>
                </button>)}</div>
              </section>
              <TourismArrivalReminder onOpen={() => setActiveTab('tourism-arrivals')} />
              <OwnerSetupChecklist hotel={hotels[0]} rooms={rooms} verified={!isLimitedOwner} onNavigate={setActiveTab}
                onEdit={(hotel, section) => requestLeave(() => { navigate(OWNER_PATHS.hotels); startHotelEdit(hotel, section); })} />
              <div className="gov-grid-cards" style={{ display: 'grid', gap: '1rem', marginBottom: '1.25rem' }}>
                {metricCards.map(({ label, value, accent, sub, prefix }) => (
                  <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: `3px solid ${accent}`, borderRadius: '10px', padding: '1.25rem 1.5rem' }}>
                    <div className="gov-metric-value" style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: '0.35rem' }}>{prefix || ''}{Number(value).toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Booking Breakdown + Quick Actions */}
              <div className="gov-grid-2" style={{ display: 'grid', gap: '1rem', marginBottom: '1.25rem' }}>

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
                      { label: 'Rooms & Rates', sub: 'Edit room types, inventory and rates', tab: 'rooms', color: '#2563eb' },
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
                          <td style={{ color: '#374151' }}>{getBookingGuestName(booking)}</td>
                          <td style={{ color: '#6b7280' }}>{formatBookingBoundary(booking)}</td>
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
              <Icons.Hotel size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> My Property
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
              <div className="owner-property-guidance">
                Property details describe your hotel. Prices and physical room inventory are managed in Rooms &amp; Rates.
              </div>
            )}

            {(editingHotel || creatingHotel) && (
              <div
                className="owner-property-editor"
              >
                <div className="owner-editor-surface">
                  {/* Header */}
                  <div style={{ background:'linear-gradient(135deg,#2E7D32 0%,#66bb6a 100%)', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.5rem', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexShrink:0 }}>
                    <div>
                      <div style={{ fontSize:'0.72rem', fontWeight:700, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>{creatingHotel ? 'New Hotel' : 'Editing Hotel'}</div>
                      <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{creatingHotel ? 'Add New Hotel' : editingHotel?.name}</div>
                      {editingHotel?.location && <div style={{ fontSize:'0.82rem', opacity:0.8, marginTop:'2px' }}>{editingHotel.location}</div>}
                    </div>
                    <button type="button" aria-label="Close property editor" onClick={() => requestLeave(() => { setEditingHotel(null); setCreatingHotel(false); }, 'hotel')} className="owner-editor-back">Back to property</button>
                  </div>
                  <nav className="owner-editor-tabs" aria-label="Property editor sections">
                    {[['details', 'Details & Contact'], ['photos', 'Photos'], ['policies', 'Policies & House Rules']].map(([value, label]) => <button type="button" key={value} aria-pressed={hotelSection === value} onClick={() => setHotelSection(value)}>{label}</button>)}
                    {!creatingHotel && !bookingPolicy.paymentsDisabled && <button type="button" onClick={() => setActiveTab('payment-setup')}>Payment setup ↗</button>}
                  </nav>
                  {hotelSaveError && <p className="owner-error" role="alert">{hotelSaveError}</p>}
                  {Object.keys(hotelErrors).length > 0 && <div className="owner-error" role="alert"><strong>Please check these fields:</strong><ul>{Object.entries(hotelErrors).map(([key, error]) => <li key={key}>{error}</li>)}</ul></div>}
                  {/* Image preview */}
                  {hotelForm.image_url && (
                    <div style={{ height:'140px', background:`url(${hotelForm.image_url}) center/cover no-repeat`, borderBottom:'1px solid #e5e7eb', flexShrink:0 }} />
                  )}
                  {/* Body */}
                  <fieldset className="owner-editor-body" disabled={hotelSaving} style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem', overflowY:'auto' }}>
                    {/* Basic Info */}
                    <div hidden={hotelSection !== 'details'}>
                      <div className="owner-editor-section-title">Basic Info</div>
                      <div className="gov-grid-2" style={{ display:'grid', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Hotel Name *</span>
                          <input type="text" value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} required />
                          {hotelErrors.name && <small className="owner-field-error">{hotelErrors.name}</small>}
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Location *</span>
                          <input type="text" value={hotelForm.location} onChange={(e) => setHotelForm({ ...hotelForm, location: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} required />
                          {hotelErrors.location && <small className="owner-field-error">{hotelErrors.location}</small>}
                        </label>
                        {(!editingHotel || !roomsForHotel(rooms, editingHotel).length) && <label className="owner-field">
                          <span>Fallback starting price ({hotelForm.currency}) — optional</span>
                          <input type="number" min="0" step="0.01" value={hotelForm.price_per_night} onChange={e => setHotelForm({ ...hotelForm, price_per_night: e.target.value })} className="gov-input" />
                          <small>Only used before room types exist. Leave blank and set your actual prices in Rooms &amp; Rates.</small>
                          {hotelErrors.price_per_night && <small className="owner-field-error">{hotelErrors.price_per_night}</small>}
                        </label>}
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
                    <div hidden={hotelSection !== 'details'}>
                      <p className="owner-help">These contacts appear on the public hotel page. Legal business contacts are separate under Business &amp; Verification.</p>
                      <div className="owner-editor-section-title">Contact</div>
                      <div className="gov-grid-2" style={{ display:'grid', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Phone</span>
                          <input type="text" value={hotelForm.contact_phone} onChange={(e) => setHotelForm({ ...hotelForm, contact_phone: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Email</span>
                          <input type="email" value={hotelForm.contact_email} onChange={(e) => setHotelForm({ ...hotelForm, contact_email: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          {hotelErrors.contact_email && <small className="owner-field-error">{hotelErrors.contact_email}</small>}
                        </label>
                      </div>
                    </div>
                    {/* Technical location fields are optional, not part of basic setup. */}
                    <details hidden={hotelSection !== 'details'}>
                      <summary>Map location &amp; coordinates (optional)</summary>
                      <div className="owner-editor-section-title">Map Coordinates</div>
                      <div className="gov-grid-2" style={{ display:'grid', gap:'0.85rem', marginBottom:'0.85rem' }}>
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
                    </details>
                    {/* Media */}
                    <div hidden={hotelSection !== 'photos'}>
                      <p className="owner-help">Uploads are staged for this draft. Choose Save Changes to publish them; Cancel does not attach them to the listing.</p>
                      <div className="owner-editor-section-title">Media &amp; Links</div>
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
                              <input type="file" accept="image/*" multiple disabled={imageUploading} onChange={(e) => { const picked = Array.from(e.target.files || []); e.target.value = ''; handleImageUpload(picked); }} style={{ display:'none' }} />
                            </label>
                          </div>
                          {Array.isArray(hotelForm.image_urls) && hotelForm.image_urls.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', marginTop:'0.85rem' }}>
                              {hotelForm.image_urls.map((url) => (
                                <div key={url} style={{ border:'1px solid #c8e6c9', borderRadius:'8px', padding:'0.5rem', background:'#f8fdf7', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                                  <img src={url} alt="Gallery" style={{ width:'56px', height:'42px', objectFit:'cover', borderRadius:'6px' }} />
                                  <button type="button" className="gov-btn gov-btn-ghost" onClick={() => setHotelForm({ ...hotelForm, image_url: url })}>{hotelForm.image_url === url ? 'Cover photo' : 'Use as cover'}</button>
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
                    <div hidden={hotelSection !== 'policies'}>
                      <div className="owner-editor-section-title">{t('policies_section')}</div>
                      <div className="gov-grid-2" style={{ display:'grid', gap:'0.85rem' }}>
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
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('payment_terms_label')}</span>
                          <input
                            type="text"
                            value={hotelForm.payment_terms_text}
                            maxLength={4000}
                            onChange={(e) => setHotelForm({ ...hotelForm, payment_terms_text: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px' }}
                            placeholder={t('policy_payment_terms')}
                          />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('modification_policy_label')}</span>
                          <input
                            type="text"
                            value={hotelForm.modification_policy_text}
                            maxLength={4000}
                            onChange={(e) => setHotelForm({ ...hotelForm, modification_policy_text: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px' }}
                            placeholder={t('policy_modifications')}
                          />
                        </label>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('noshow_policy_label')}</span>
                          <input
                            type="text"
                            value={hotelForm.noshow_policy_text}
                            maxLength={4000}
                            onChange={(e) => setHotelForm({ ...hotelForm, noshow_policy_text: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius:'8px' }}
                            placeholder={t('policy_noshow')}
                          />
                          <span style={{ fontSize:'0.72rem', color:'#6b7280' }}>{t('policy_owner_text_hint')}</span>
                        </label>
                        <div className="owner-policy-preview" style={{ gridColumn:'1 / -1' }}>
                          <span style={{ fontWeight:700, display:'block', marginBottom:'0.25rem', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>{t('policy_preview_label')}</span>
                          <ul style={{ margin:'0.5rem 0 0', paddingLeft:'1.2rem' }}>
                            {buildPolicyLines(hotelForm, { t }).map((line, index) => (
                              <li key={index}>{line.text}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    {/* Settings */}
                    <div hidden={hotelSection !== 'details'}>
                      <div className="owner-editor-section-title">Settings</div>
                      <div className="gov-grid-2" style={{ display:'grid', gap:'0.85rem' }}>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Currency</span>
                          <input type="text" maxLength={3} value={hotelForm.currency} onChange={(e) => setHotelForm({ ...hotelForm, currency: e.target.value.toUpperCase() })} className="gov-input" style={{ borderRadius:'8px' }} />
                          <small>Currency code, e.g. PHP. Changing this does not convert prices or alter past bookings.</small>
                          {hotelErrors.currency && <small className="owner-field-error">{hotelErrors.currency}</small>}
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
                      </div>
                    </div>
                  </fieldset>
                  {/* Footer */}
                  <div className="owner-editor-footer" style={{ padding:'1rem 1.5rem', borderTop:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', justifyContent:'flex-end', borderRadius:'0 0 16px 16px', flexShrink:0 }}>
                    <button className="gov-btn gov-btn-ghost" onClick={() => requestLeave(() => { setEditingHotel(null); setCreatingHotel(false); }, 'hotel')} disabled={hotelSaving || imageUploading}>Cancel</button>
                    <button onClick={creatingHotel ? handleHotelCreate : handleHotelSave} disabled={hotelSaving || imageUploading} className="gov-btn gov-btn-primary" style={{ minWidth:'140px' }}>
                      {hotelSaving ? 'Saving...' : creatingHotel ? 'Create Hotel' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div hidden={Boolean(editingHotel || creatingHotel)} style={{
              display: editingHotel || creatingHotel ? 'none' : 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: '1.5rem'
            }}>
              {hotels.map((hotel) => {
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
                       <span className="owner-starting-price">{ownerStartingPrice(hotel, rooms)}</span>
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
                        background: Number(hotel.is_active) === 1 ? '#f0fdf4' : '#f3f4f6',
                        color: Number(hotel.is_active) === 1 ? '#16a34a' : '#6b7280',
                        border: `1px solid ${Number(hotel.is_active) === 1 ? '#bbf7d0' : '#e5e7eb'}`,
                        borderRadius: '999px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        {Number(hotel.is_active) === 1 ? 'Visible to guests' : 'Hidden from guests'}
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
                          Booking access: verification required
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
                          Booking access: verified
                        </span>
                      )}
                    </div>

                    <div className="owner-property-actions">
                      <button
                        className="gov-btn-primary"
                        onClick={() => startHotelEdit(hotel)}
                        style={{ flex: 1 }}
                      >
                        Edit details
                      </button>
                      <button
                        className="gov-btn gov-btn-secondary"
                        onClick={() => { setRoomHotelId(String(hotel.hotel_id)); setActiveTab('rooms'); }}
                        style={{ flex: 1, whiteSpace: 'nowrap' }}
                        title="Manage rooms for this hotel"
                      >
                        <Icons.Hotel size={16} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Rooms &amp; Rates
                      </button>
                      <button type="button" className="gov-btn gov-btn-ghost" onClick={() => startHotelEdit(hotel, 'photos')}>Edit photos</button>
                      <button type="button" className="gov-btn gov-btn-ghost" onClick={() => startHotelEdit(hotel, 'policies')}>Edit policies</button>
                      <Link className="gov-btn gov-btn-ghost" to={`/hotels/${hotel.hotel_id}`} target="_blank" rel="noopener noreferrer">View public listing ↗</Link>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
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
            <label className="owner-task-filter">Show reservations
              <select className="gov-select" value={bookingDayFilter} onChange={event => { setBookingDayFilter(event.target.value); setBookingFilter('all'); }}>
                <option value="all">All dates</option><option value="arrivals">Arrivals today</option><option value="departures">Departures today</option><option value="unpaid">With outstanding balances</option>
              </select>
            </label>
            
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
                <ExportPdfButton className="gov-btn-ghost" getReport={() => recordReport('bookings')} />
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
                      <th>Booked On</th>
                      <th>Amount</th>
                      <th>{t('payment_method_section')}</th>
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
                        <td>{getBookingGuestName(booking)}</td>
                        <td>
                          {formatBookingBoundary(booking)} → {formatBookingBoundary(booking, 'out')}
                          {booking.stay_duration_hours ? ` · ${booking.stay_duration_hours} hours` : ''}
                        </td>
                        <td><BookingIssuedCell booking={booking} /></td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{formatHotelCurrency(booking.total_amount, booking.currency)}</div>
                          <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                            {isExternalPaymentBooking(booking) ? 'Payment outside NaujanGO' : <>Paid {formatHotelCurrency(booking.amount_paid ?? 0, booking.currency)}{Number(booking.balance_due) > 0 ? ` · ${formatHotelCurrency(booking.balance_due, booking.currency)} due` : ''}</>}
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
                              {isExternalPaymentBooking(booking) ? externalPaymentLabel(booking) : booking.payment_status}
                            </span>
                          )}
                        </td>
                        <td>{getPaymentMethodLabel(getBookingPaymentMethod(booking), t)}</td>
                        <td>
                          <span className={`gov-badge-status gov-badge-status--${booking.status}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                           <div className="gov-row-actions">
                            <button type="button" className="gov-btn gov-btn-ghost" onClick={() => setSelectedReservation(booking)}>View details</button>
                            <button type="button" className="gov-btn gov-btn-ghost" onClick={() => setMessageBooking(booking)}>Message guest</button>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  className="gov-btn gov-btn-primary"
                                  onClick={() => handleBookingStatusChange(booking.booking_id, 'confirmed')}
                                  title="Confirm this booking"
                                >
                                  Confirm
                                </button>
                                <button
                                  className="gov-btn gov-btn-danger"
                                  onClick={() => handleBookingStatusChange(booking.booking_id, 'cancelled')}
                                  title="Cancel this booking"
                                >
                                  Cancel Booking
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                className="gov-btn gov-btn-danger"
                                onClick={() => handleBookingStatusChange(booking.booking_id, 'cancelled')}
                                title="Cancel this booking"
                              >
                                Cancel Booking
                              </button>
                            )}
                            {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'cancelled') && (
                              <button
                                className="gov-btn gov-btn-ghost"
                                onClick={() => handleArchiveBooking(booking.booking_id)}
                                title="Archive this booking"
                              >
                                Archive
                              </button>
                            )}
                            <StayExtensionControls booking={booking} onSaved={fetchDashboardData} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={ownerBookingsPage} totalPages={Math.ceil(filteredBookings.length / OWNER_TABLE_SIZE)} onPageChange={setOwnerBookingsPage} totalItems={filteredBookings.length} pageSize={OWNER_TABLE_SIZE} label="bookings" />
              {filteredBookings.length === 0 && !dashboardError && (
                <div className="gov-empty">
                  <p>{bookings.length ? 'No reservations match these filters.' : 'No reservations yet.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment configuration is separate from the transaction ledger. */}
        {activeTab === 'payment-setup' && bookingPolicy.paymentsDisabled && <section className="gov-glass-panel"><h1 className="gov-page-title">{bookingPolicy.loading ? 'Checking online payment policy…' : bookingPolicy.error ? 'Online payment policy unavailable' : 'Online payments disabled'}</h1><p>Bookings remain available in the existing Reservations module. Review and confirm bookings as usual, and use Message guest for direct communication. Guests can pay at the property or choose GCash if accepted by the property, then message you for your GCash QR code or number. NaujanGO does not collect or verify these transfers.</p><p>Saved online gateway methods and payment plans are retained but are not offered while this restriction is active. GCash is arranged directly with the owner, not through a gateway. Owners cannot override the admin switch.</p><button type="button" className="gov-btn-ghost" onClick={() => setActiveTab('bookings')}>Open Reservations</button>{bookingPolicy.error && <p role="alert">{bookingPolicy.error} <button type="button" onClick={bookingPolicy.refresh}>Retry booking policy</button></p>}</section>}
        {activeTab === 'payment-setup' && !bookingPolicy.paymentsDisabled && (
          <div>
            <h1 className="gov-page-title">
              <Icons.Money size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Payment Setup
            </h1>
            <p><strong>Payment plans</strong> control when guests pay. <strong>Payment methods</strong> control how they pay. Neither setting changes existing reservations.</p>

            <PaymentPlanSettings hotels={hotels} onSaved={fetchDashboardData} onDirtyChange={reportPlansDirty} onBusyChange={reportPlansBusy} confirmLeave={requestLeave} />

            {hotels.length > 0 && (
              <div className="gov-glass-panel" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1B5E20', marginBottom: '0.65rem' }}>
                  Payment Method Settings
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.85rem' }}>
                        Choose the methods guests may use for {hotels[0].name || 'this hotel'}. GCash is paid directly to you; guests message you for your QR code or GCash number. It does not use online checkout.
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
                       setActionError('At least one payment method must stay enabled.');
                      return;
                    }
                    try {
                      setPaymentMethodSettingsSaving(true);
                       await api.put(`/owner/hotels/${hotels[0].hotel_id}`, {
                         allowed_payment_methods: paymentMethodSettings
                       });
                       paymentMethodsBaseline.current = JSON.stringify([...paymentMethodSettings].sort());
                      await fetchDashboardData();
                       setActionError(''); setNotice('Payment methods saved.');
                    } catch (error) {
                      console.error('Failed to update payment methods:', error);
                       setActionError(error.response?.data?.error || 'Failed to update payment settings.');
                    } finally {
                      setPaymentMethodSettingsSaving(false);
                    }
                  }}
                >
                  {paymentMethodSettingsSaving ? 'Saving...' : 'Save Payment Settings'}
                </button>
              </div>
            )}

          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h1 className="gov-page-title">{bookingPolicy.paymentsDisabled ? 'Payment History' : 'Payments'}</h1>
            {bookingPolicy.paymentsDisabled ? <section className="gov-glass-panel" aria-label="Online payment availability" aria-busy={bookingPolicy.loading}>
              <p role="status"><strong>{bookingPolicy.loading ? 'Checking online payment policy…' : bookingPolicy.error ? 'Online payment policy unavailable.' : 'Online payments disabled by the administrator.'}</strong></p>
              <p>{bookingPolicy.loading || bookingPolicy.error ? 'Payment setup and financial actions remain unavailable until the current policy can be confirmed.' : 'Guests pay at the property or arrange accepted GCash payments directly with you. Owners cannot override the admin switch.'} Bookings remain available under Reservations; use Message guest to contact guests.</p>
              <p>View-only history: existing transactions, filters and downloads are retained. Historical totals do not mean online payments are enabled. Contact the administrator about refunds for earlier payments.</p>
              {bookingPolicy.error && <p role="alert">{bookingPolicy.error} <button type="button" className="gov-btn-ghost" onClick={bookingPolicy.refresh}>Retry booking policy</button></p>}
            </section> : <p>Recorded transactions and payment attempts. To change how guests pay, open <button type="button" className="gov-btn-ghost" onClick={() => setActiveTab('payment-setup')}>Payment Setup</button>.</p>}
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
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className={showArchivedPayments ? 'gov-btn-primary' : 'gov-btn-ghost'}
                  onClick={() => setShowArchivedPayments((prev) => !prev)}
                  aria-pressed={showArchivedPayments}
                >
                  {showArchivedPayments ? t('payments_hiding_archived') : t('payments_showing_archived')}
                </button>
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
                  disabled={paymentExportUnavailable}
                >
                  {t('payments_export_csv')}
                </button>
                <ExportPdfButton className="gov-btn-ghost" disabled={paymentExportUnavailable} getReport={() => recordReport('payments')} />
              </div>
            </div>

             {paymentLoadError && <p role="alert" className="owner-error">{paymentLoadError} <button type="button" onClick={() => { fetchPayments(); fetchPaymentStats(); }}>Retry payments</button></p>}
            <PaymentSummaryCards stats={paymentStats} />
            {Number(paymentStats?.total_transactions) > filteredPayments.length && <p>Showing the latest {filteredPayments.length} matching payment attempts. Summary totals include all matches.</p>}

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
                      <th>{t('payment_method_section')}</th>
                      <th>Payment References</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.slice((paymentsPage - 1) * OWNER_TABLE_SIZE, paymentsPage * OWNER_TABLE_SIZE).map((payment) => (
                      <tr
                        key={payment.payment_id}
                        style={payment.archived ? { opacity: 0.6, background: 'rgba(148, 163, 184, 0.06)' } : undefined}
                      >
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
                          {formatHotelCurrency(payment.amount, payment.currency)}
                        </td>
                        <td>
                          {getPaymentMethodLabel(payment.method, t)}
                        </td>
                        <td><ReferenceDetails entries={getPaymentReferences(payment)} /></td>
                        <td>
                          {Number(payment.archived) === 1 && (
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.4px', color: '#6b7280', textTransform: 'uppercase', marginTop: '4px' }}>
                              {t('payments_archived_label')}
                            </div>
                          )}
                          <span className={`gov-badge-status gov-badge-status--${payment.status}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          <div className="gov-row-actions">
                            <button
                              className="gov-btn gov-btn-ghost"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              View
                            </button>
                            {!bookingPolicy.paymentsDisabled && payment.status === 'succeeded' && (
                              <button
                                className="gov-btn gov-btn-warning"
                                onClick={() => setRefundModal(payment)}
                              >
                                Refund
                              </button>
                            )}
                            {!bookingPolicy.paymentsDisabled && Number(payment.archived) === 0 && ['succeeded', 'failed', 'refunded'].includes(payment.status) && (
                              <button
                                className="gov-btn gov-btn-ghost"
                                onClick={async () => {
                                  if (window.confirm('Archive this payment in your dashboard only? Financial history and lifetime revenue are retained.')) {
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
                            {!bookingPolicy.paymentsDisabled && payment.status === 'pending' && (
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
                                  className="gov-btn gov-btn-primary"
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
                                  className="gov-btn gov-btn-danger"
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
              {filteredPayments.length === 0 && !paymentLoadError && paymentLoadedQuery && (
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
                      <div style={{ fontWeight: 700, color: '#1B5E20', fontSize: '1.5rem' }}>{formatHotelCurrency(selectedPayment.amount, selectedPayment.currency)}</div>
                    </div>
                    <div className="gov-grid-2" style={{ display: 'grid', gap: '1rem' }}>
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
                        <div style={{ fontWeight: 700, color: '#880e4f' }}>{formatHotelCurrency(selectedPayment.refund_amount, selectedPayment.currency)}</div>
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
            {refundModal && !bookingPolicy.paymentsDisabled && (
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
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1B5E20' }}>Amount: {formatHotelCurrency(refundModal.amount, refundModal.currency)}</div>
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
              {reviewsError && <p className="owner-error" role="alert">{reviewsError} <button type="button" onClick={fetchReviews}>Retry reviews</button></p>}
              {reviews.length > 0 && (
                <div className="gov-glass-panel">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20' }}>
                        Review Summary
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                        Total Reviews: {reviews.length} | Avg Rating: {(reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0) / reviews.length).toFixed(1)}
                      </div>
                    </div>
                    <button
                      className="gov-btn-primary"
                      onClick={() => exportReport('reviews')}
                    >
                      {t('payments_export_csv')}
                    </button>
                    <ExportPdfButton className="gov-btn-ghost" getReport={() => recordReport('reviews')} />
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
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                        padding: '0.2rem 0.55rem', borderRadius: '999px',
                        background: Number(review.moderated) === 0 ? '#fef3c7' : '#e8f5e9',
                        color: Number(review.moderated) === 0 ? '#92400e' : '#1B5E20'
                      }}>
                        {Number(review.moderated) === 0 ? t('hidden') : t('visible')}
                      </span>
                      {Number(review.moderated) === 0 ? (
                        <button
                          className="gov-btn-primary"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                          onClick={() => handleModerateReview(review, true)}
                        >
                          {t('restore_review')}
                        </button>
                      ) : (
                        <button
                          className="gov-btn-ghost"
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                          onClick={() => handleModerateReview(review, false)}
                        >
                          {t('hide_review')}
                        </button>
                      )}
                    </div>
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
                  <p style={{ color: '#718096' }}>{reviewsError || 'No reviews yet'}</p>
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
                 Availability &amp; Date Limits
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
                  {hotels.length > 1 && <button
                    className="gov-btn-ghost"
                    style={{ marginBottom: '1.5rem' }}
                    onClick={() => requestLeave(() => setSelectedHotelForCalendar(null))}
                  >
                    ← Back to Hotel Selection
                  </button>}

                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem' }}>
                    Managing: {selectedHotelForCalendar.hotel_name || selectedHotelForCalendar.name}
                  </h2>
                  {availabilityError && <p role="alert" className="owner-error">{availabilityError} <button type="button" onClick={() => loadAvailabilityForMonth(selectedHotelForCalendar.hotel_id, calendarMonth)}>Retry calendar</button></p>}
                  <p>Room inventory is configured under Rooms &amp; Rates. This calendar sets property-wide capacity limits and closed dates; these numbers are not live remaining-room counts for a specific stay.</p>
                  <button type="button" className="gov-btn-ghost" onClick={() => setActiveTab('rooms')}>Manage room inventory</button>

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
                              <div><strong>Price/Night:</strong> <span style={{ fontWeight: 700, color: '#2E7D32' }}>{formatHotelCurrency(room.price_per_night, room.currency || selectedHotelForCalendar.currency)}</span></div>
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
                        <strong>Configured inventory:</strong> {roomsForHotel(rooms, selectedHotelForCalendar).reduce((sum, room) => sum + Number(room.quantity_available || 0), 0)} rooms across room types. Paused room types are not offered to guests.
                      </div>
                    </div>
                  )}

                  {/* Base Availability Settings */}
                  <details className="gov-glass-panel">
                    <summary>Property-wide capacity limits (advanced)</summary>
                    <p>The property capacity cap and each room type’s inventory both limit bookings. Existing values are retained; no automatic inventory rewrite occurs.</p>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1B5E20', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                      <Icons.Calendar size={22} style={{ marginRight: '1rem' }} /> Capacity settings
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                      <label style={{ fontSize: '0.9rem', color: '#2d3748', fontWeight: 700 }}>
                        Property-wide capacity cap
                        <input
                          type="number"
                          value={availabilityForm.rooms_total}
                          onChange={(e) => { setCapacityDirty(true); setAvailabilityForm({ ...availabilityForm, rooms_total: e.target.value }); }}
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
                        Listing availability counter (legacy)
                        <input
                          type="number"
                          value={availabilityForm.rooms_available}
                          onChange={(e) => { setCapacityDirty(true); setAvailabilityForm({ ...availabilityForm, rooms_available: e.target.value }); }}
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
                    </div>
                    <button
                      className="gov-btn-primary"
                      style={{ marginTop: '1.5rem' }}
                      onClick={handleAvailabilitySave}
                      disabled={availabilitySaving}
                    >
                      {availabilitySaving ? 'Saving...' : 'Save Capacity Limits'}
                    </button>
                    <button type="button" className="gov-btn-ghost" onClick={() => {
                      const total = roomsForHotel(rooms, selectedHotelForCalendar).filter(room => Number(room.is_active) === 1).reduce((sum, room) => sum + Number(room.quantity_available || 0), 0);
                      setAvailabilityForm({ ...availabilityForm, rooms_total: total, rooms_available: total }); setCapacityDirty(true);
                    }}>Copy active room inventory into this draft</button>
                  </details>

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
                    ) : !availabilityReady ? <p>Date limits are unavailable. Use Retry calendar above to load them.</p> : (
                      <div>
                        {/* Calendar Grid */}
                        <div className="owner-availability-grid" style={{
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
                             const isClosed = Number(entry?.is_closed) === 1;
                            const roomsAvail = entry?.rooms_available ?? availabilityForm.rooms_total;
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isPast = date < today;

                            return (
                              <div
                                key={dateKey}
                                role="button"
                                tabIndex={isPast ? -1 : 0}
                                aria-disabled={isPast}
                                aria-label={`${dateKey}: ${isClosed ? 'closed' : `capacity limit ${roomsAvail === '' ? 'not set' : roomsAvail}`}`}
                                onClick={() => !isPast && handleCalendarDateClick(dateKey)}
                                onKeyDown={event => { if (!isPast && ['Enter', ' '].includes(event.key)) { event.preventDefault(); handleCalendarDateClick(dateKey); } }}
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
                                      Limit: {roomsAvail === '' ? 'not set' : roomsAvail}
                                      {entry?.booked_rooms != null && <><br />{entry.booked_rooms} peak booked</>}
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
                                Capacity limit for these dates
                                <input
                                  type="number"
                                  value={availabilityEditForm.rooms_available}
                                  onChange={(e) => { setCalendarDirty(true); setAvailabilityEditForm({ ...availabilityEditForm, rooms_available: e.target.value }); }}
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
                                  onChange={(e) => { setCalendarDirty(true); setAvailabilityEditForm({ ...availabilityEditForm, is_closed: e.target.checked ? 1 : 0 }); }}
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
                                  setCalendarDirty(false); setAvailabilityError('');
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
            <>
              <ReportsAndAnalyticsDashboard
                data={analyticsData}
                stats={{
                  totals: {
                    bookings: stats?.bookingStats?.total_bookings || 0,
                    hotels: stats?.hotelCount || 0
                  },
                  roleDistribution: []
                }}
                loading={analyticsLoading}
                userRole="owner"
              />
              {hotels.map((hotel) => (
                <RoomRevenueReport
                  key={hotel.hotel_id}
                  hotelId={hotel.hotel_id}
                  hotelName={hotel.hotel_name || hotel.name}
                />
              ))}
            </>
          )}

          {/* Business Profile Management */}
          {activeTab === 'profile' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.User size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Business &amp; Verification
              </h1>
            
              <div className="gov-glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B5E20', margin: 0 }}>
                    Business Information
                  </h2>
                  <button
                    className={profileEditing ? 'gov-btn-ghost' : 'gov-btn-primary'}
                    onClick={() => {
                      if (profileEditing) requestLeave(() => { if (profileBaseline.current) setBusinessProfile(profileBaseline.current); setProfileEditing(false); }, 'profile');
                      else { profileBaseline.current = { ...businessProfile }; setProfileEditing(true); }
                    }}
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
                      Existing dashboard access: {isLimitedOwner ? 'limited' : 'full'}
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
                        Profile review and dashboard access are separate from credential validity. Check the recorded expiry dates and follow-up notices below.
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
                  {/* Bank Name / Bank Account Number were removed from this
                      form. Existing values stay in business_profiles: the save
                      payload still forwards the loaded bank_name unchanged, and
                      the API never stored bank_account. */}

                  <OwnerCredentialFields profile={businessProfile} onChange={setBusinessProfile} editing={profileEditing} uploading={docUploading} saving={profileSaving} onUpload={handleDocumentUpload} credentials={profileStatus.credentials} />
                </div>
              
                {profileEditing && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                    <button
                      className="gov-btn-ghost"
                      onClick={() => requestLeave(() => { if (profileBaseline.current) setBusinessProfile(profileBaseline.current); setProfileEditing(false); }, 'profile')}
                    >
                      Cancel
                    </button>
                    <button
                      className="gov-btn-primary"
                      onClick={handleSaveBusinessProfile}
                      disabled={Boolean(docUploading || profileSaving)}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Direct messages remain separate from account notifications. */}
          {activeTab === 'messages' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Email size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Messages
              </h1>

              <div className="gov-glass-panel" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="search"
                  value={messageSearch}
                  onChange={(event) => setMessageSearch(event.target.value)}
                  placeholder="Search messages"
                  aria-label="Search messages"
                  style={{ flex: '1 1 260px', minWidth: '220px', padding: '0.7rem 0.85rem', border: '1px solid #c8e6c9', borderRadius: '6px' }}
                />
                <select
                  value={messageFilter}
                  onChange={(event) => setMessageFilter(event.target.value)}
                  aria-label="Filter messages"
                  style={{ padding: '0.7rem 0.85rem', border: '1px solid #c8e6c9', borderRadius: '6px' }}
                >
                  <option value="all">All messages</option>
                  <option value="unread">Unread ({unreadMessageCount})</option>
                  <option value="received">Received messages</option>
                  <option value="sent">Sent messages</option>
                </select>
                <button className="gov-btn-ghost" onClick={markAllMessagesRead} disabled={unreadMessageCount === 0}>
                  Mark messages read
                </button>
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
                              loadMessages();
                              notificationFeed.refresh();
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
              <p>Bookings and payments here are archived in your dashboard only. View or restore them at any time; financial records cannot be permanently deleted.</p>

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
                  { id: 'payments', label: bookingPolicy.paymentsDisabled ? 'Payment History' : 'Payment Management', icon: <Icons.Money size={18} /> }
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
                          <th>Booked On</th>
                          <th>Amount</th>
                          <th>{t('payment_method_section')}</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedBookings.map((booking) => (
                          <tr key={booking.booking_id}>
                            <td>#{booking.booking_id}</td>
                            <td>{booking.hotel_name}</td>
                            <td>{getBookingGuestName(booking)}</td>
                            <td>
                              {formatBookingBoundary(booking)} → {formatBookingBoundary(booking, 'out')}
                            </td>
                            <td><BookingIssuedCell booking={booking} /></td>
                            <td style={{ padding: '1rem', fontWeight: 700, color: '#2E7D32' }}>
                              {formatHotelCurrency(booking.total_amount, booking.currency)}
                            </td>
                            <td>{getPaymentMethodLabel(getBookingPaymentMethod(booking), t)}</td>
                            <td>
                              <span className="gov-badge-status gov-badge-status--cancelled">
                                {booking.status}
                              </span>
                            </td>
                            <td>
                              <div className="gov-row-actions">
                                <button type="button" className="gov-btn gov-btn-ghost" onClick={() => setArchiveSelection({ type: 'booking', record: booking })}>View</button>
                                <button
                                  className="gov-btn gov-btn-primary"
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
                                  Restore
                                </button>
                              </div>
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
                          <th>{t('payment_method_section')}</th>
                          <th>Payment References</th>
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
                              {formatHotelCurrency(payment.amount, payment.currency)}
                            </td>
                            <td>
                              {getPaymentMethodLabel(payment.method, t)}
                            </td>
                            <td><ReferenceDetails entries={getPaymentReferences(payment)} /></td>
                            <td>
                              <span className="gov-badge-status gov-badge-status--cancelled">
                                {payment.status}
                              </span>
                            </td>
                            <td>
                              {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <div className="gov-row-actions">
                                <button type="button" className="gov-btn gov-btn-ghost" onClick={() => setArchiveSelection({ type: 'payment', record: payment })}>View</button>
                                <button
                                  className="gov-btn gov-btn-primary"
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
                                  Restore
                                </button>
                              </div>
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
          {archiveSelection && <ArchiveRecordModal {...archiveSelection} onClose={() => setArchiveSelection(null)} />}
          {activeTab === 'bookings' && messageBooking && <BookingConversation key={messageBooking.booking_id} booking={messageBooking} owner onClose={() => setMessageBooking(null)} onDirtyChange={reportConversationDirty} onBusyChange={reportConversationBusy} />}
          {selectedReservation && !pendingAction && <OwnerReservationDetails booking={selectedReservation} t={t} paymentsDisabled={bookingPolicy.paymentsDisabled} onClose={() => setSelectedReservation(null)}
            onCancel={() => handleBookingStatusChange(selectedReservation.booking_id, 'cancelled')}
            onMessage={() => { setMessageBooking(selectedReservation); setSelectedReservation(null); }}
            onPayments={() => { setSelectedReservation(null); setPaymentSearch(selectedReservation.receipt_number || ''); setActiveTab('payments'); }} />}
          {pendingAction && <OwnerDialog title={pendingAction.title} busy={actionBusy || historyRestoring} onClose={() => { if (!actionBusyRef.current && !historyRestoring) { setPendingAction(null); setActionError(''); } }} actions={<>
            <button type="button" className="gov-btn-ghost" disabled={actionBusy || historyRestoring} onClick={() => { setPendingAction(null); setActionError(''); }}>{pendingAction.kind === 'discard' ? 'Keep editing' : 'Keep current status'}</button>
            <button type="button" className={pendingAction.kind === 'discard' || pendingAction.status === 'cancelled' ? 'gov-btn-danger' : 'gov-btn-primary'} disabled={actionBusy || historyRestoring} onClick={async () => {
              if (actionBusyRef.current) return;
              actionBusyRef.current = true;
              setActionBusy(true); setActionError('');
              try { await pendingAction.run(); setPendingAction(null); }
              catch (error) { setActionError(error.response?.data?.error || 'The action could not be completed. Please retry.'); }
              finally { actionBusyRef.current = false; setActionBusy(false); }
            }}>{actionBusy ? 'Please wait…' : pendingAction.kind === 'discard' ? 'Discard changes' : pendingAction.status === 'cancelled' ? 'Yes, cancel reservation' : 'Yes, confirm reservation'}</button>
          </>}>
            {pendingAction.kind === 'discard' ? <p>Your unsaved edits will be lost. Uploaded draft photos will not be attached to the property.</p> : <>
              <p><strong>{getBookingGuestName(pendingAction.booking)}</strong> · Reservation #{pendingAction.booking.booking_id}</p>
              <p>{formatBookingBoundary(pendingAction.booking)} → {formatBookingBoundary(pendingAction.booking, 'out')}</p>
              <p>Recorded paid: {pendingAction.booking.amount_paid == null ? 'Not available' : formatHotelCurrency(pendingAction.booking.amount_paid, pendingAction.booking.currency)}. Cancelling a reservation does not automatically process a refund. Review its payment records separately.</p>
            </>}
            {actionError && <p role="alert" className="owner-error">{actionError}</p>}
          </OwnerDialog>}
        </main>
      </div>
    </div>
  );
};

export default OwnerDashboard;
