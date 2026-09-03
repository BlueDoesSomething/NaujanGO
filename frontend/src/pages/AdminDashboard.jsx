import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LeafletMap from '../components/LeafletMap';
import naujanGoLogo from '../assets/552820828_1195483019268738_3720769628710779316_n.png';

import './Dashboard.css';
import './AdminDashboard.css';
import { saveCachedSetting } from '../utils/siteSettingsCache';
import Icons from '../components/Icons';
import {
  createDeleteAttractionHandler,
  createRestoreAttractionHandler,
  AttractionActionButtons
} from '../components/AdminDashboardAttractionHelpers.jsx';

const CHATBOT_TRAINING_LANGUAGES = [
  { value: 'all', label: 'All languages' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

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

const DEFAULT_TYPOGRAPHY = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  fontScale: 'medium',
  headingWeight: '800',
  bodyWeight: '400',
  headingLineHeight: '1.15',
  bodyLineHeight: '1.7',
  headingLetterSpacing: '-0.02',
  bodyLetterSpacing: '0',
  h1Size: '3.5rem',
  h2Size: '2.5rem',
  h3Size: '1.75rem',
  bodySize: '1rem',
  navFontSize: '0.95rem',
  buttonFontSize: '0.95rem',
  contentMaxWidth: '1200px',
  preset: 'balanced',
};

const TYPOGRAPHY_FONT_OPTIONS = ['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Raleway', 'Playfair Display', 'Merriweather'];
const TYPOGRAPHY_SCALE_OPTIONS = [
  { value: 'small', label: 'Small (90%)', factor: 0.9 },
  { value: 'medium', label: 'Medium (100%)', factor: 1 },
  { value: 'large', label: 'Large (110%)', factor: 1.1 },
  { value: 'xlarge', label: 'X-Large (120%)', factor: 1.2 },
];
const TYPOGRAPHY_WEIGHT_OPTIONS = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
];
const TYPOGRAPHY_SIZE_OPTIONS = ['0.9rem', '1rem', '1.1rem', '1.25rem', '1.5rem', '1.75rem', '2rem', '2.5rem', '3rem', '3.5rem', '4rem'];
const TYPOGRAPHY_CONTENT_WIDTH_OPTIONS = [
  { value: '1100px', label: 'Focused' },
  { value: '1200px', label: 'Balanced' },
  { value: '1320px', label: 'Spacious' },
  { value: '1440px', label: 'Wide' },
];
const TYPOGRAPHY_PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Default tourism marketing look with generous headings.',
    values: { ...DEFAULT_TYPOGRAPHY, preset: 'balanced' },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    description: 'Premium, magazine-like hierarchy for destination storytelling.',
    values: {
      ...DEFAULT_TYPOGRAPHY,
      headingFont: 'Playfair Display',
      bodyFont: 'Merriweather',
      headingWeight: '700',
      bodyWeight: '400',
      headingLineHeight: '1.08',
      bodyLineHeight: '1.8',
      headingLetterSpacing: '-0.03',
      bodyLetterSpacing: '0.01',
      h1Size: '4rem',
      h2Size: '2.5rem',
      h3Size: '2rem',
      bodySize: '1.05rem',
      navFontSize: '0.95rem',
      buttonFontSize: '0.95rem',
      contentMaxWidth: '1100px',
      preset: 'editorial',
    },
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Tighter spacing and smaller scale for denser admin-friendly pages.',
    values: {
      ...DEFAULT_TYPOGRAPHY,
      headingFont: 'Inter',
      bodyFont: 'Inter',
      fontScale: 'small',
      headingWeight: '700',
      bodyWeight: '400',
      headingLineHeight: '1.1',
      bodyLineHeight: '1.55',
      headingLetterSpacing: '-0.015',
      bodyLetterSpacing: '0',
      h1Size: '3rem',
      h2Size: '2.25rem',
      h3Size: '1.5rem',
      bodySize: '0.95rem',
      navFontSize: '0.9rem',
      buttonFontSize: '0.9rem',
      contentMaxWidth: '1320px',
      preset: 'compact',
    },
  },
  {
    id: 'accessible',
    label: 'Accessible',
    description: 'Larger text, higher rhythm, and narrower measure for readability.',
    values: {
      ...DEFAULT_TYPOGRAPHY,
      headingFont: 'Nunito',
      bodyFont: 'Open Sans',
      fontScale: 'large',
      headingWeight: '800',
      bodyWeight: '500',
      headingLineHeight: '1.2',
      bodyLineHeight: '1.85',
      headingLetterSpacing: '0',
      bodyLetterSpacing: '0.01',
      h1Size: '3.5rem',
      h2Size: '2.75rem',
      h3Size: '2rem',
      bodySize: '1.1rem',
      navFontSize: '1rem',
      buttonFontSize: '1rem',
      contentMaxWidth: '1100px',
      preset: 'accessible',
    },
  },
];
const TYPOGRAPHY_PREVIEW_DEVICES = [
  { value: 'mobile', label: 'Mobile', width: '375px' },
  { value: 'tablet', label: 'Tablet', width: '768px' },
  { value: 'desktop', label: 'Desktop', width: '100%' },
];

const scaleTypographyLength = (value, factor) => {
  const match = String(value || '').trim().match(/^(-?\d*\.?\d+)(px|rem|em)$/);
  if (!match) return value;
  const scaled = Number(match[1]) * factor;
  return `${Number(scaled.toFixed(3))}${match[2]}`;
};

const toBooleanSetting = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off' || normalized === '') return false;
  }
  return fallback;
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
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
    map_url: '',
    contact_phone: '',
    contact_email: '',
    is_active: 1
  };
  const emptyAttractionForm = {
    name: '',
    description: '',
    location: '',
    image_url: '',
    latitude: '',
    longitude: ''
  };

  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [hotelSearch, setHotelSearch] = useState('');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [attractionSearch, setAttractionSearch] = useState('');
  const [editingHotel, setEditingHotel] = useState(null);
  const [creatingHotel, setCreatingHotel] = useState(false);
  const [hotelForm, setHotelForm] = useState(emptyHotelForm);
  const [hotelSaving, setHotelSaving] = useState(false);
  const [chatbotData, setChatbotData] = useState(null);
  const [chatbotConvSearch, setChatbotConvSearch] = useState('');
  const [viewingConversation, setViewingConversation] = useState(null);
  const [convMessages, setConvMessages] = useState([]);
  const [convMessagesLoading, setConvMessagesLoading] = useState(false);
  const [chatbotConvsLoading, setChatbotConvsLoading] = useState(false);
  const [chatbotTrainingLanguage, setChatbotTrainingLanguage] = useState('all');
  const [chatbotTrainingJob, setChatbotTrainingJob] = useState(null);
  const [chatbotTrainingLoading, setChatbotTrainingLoading] = useState(false);
  const [chatbotTrainingError, setChatbotTrainingError] = useState('');
  const [userActionLoading, setUserActionLoading] = useState({});
  const [bookingActionLoading, setBookingActionLoading] = useState({});
  const [editingAttraction, setEditingAttraction] = useState(null);
  const [creatingAttraction, setCreatingAttraction] = useState(false);
  const [attractionForm, setAttractionForm] = useState(emptyAttractionForm);
  const openedConversationIdRef = useRef(null);
  const [attractionSaving, setAttractionSaving] = useState(false);
  const [attractionActionLoading, setAttractionActionLoading] = useState({});
  const [itineraries, setItineraries] = useState([]);
  const [itineraryTemplates, setItineraryTemplates] = useState([]);
  const [itinerarySearch, setItinerarySearch] = useState('');
  const [itineraryActionLoading, setItineraryActionLoading] = useState({});
  const [editingItinerary, setEditingItinerary] = useState(null);
  const [itineraryForm, setItineraryForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning'
  });
  const [itinerarySaving, setItinerarySaving] = useState(false);
  const [viewingItinerary, setViewingItinerary] = useState(null);
  const [ownerAssignments, setOwnerAssignments] = useState({});
  const [ownerAssigning, setOwnerAssigning] = useState({});
  const [activeReport, setActiveReport] = useState('booking-trends');
  const [reportsLoading, setReportsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({ dailyTrends: [], monthlyTrends: [], hotelPerformance: [] });
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user',
    password: ''
  });
  const [userSaving, setUserSaving] = useState(false);
  const [mapMode, setMapMode] = useState('hotels');
  const [mapSelection, setMapSelection] = useState(null);
  const [mapForm, setMapForm] = useState({
    type: 'hotel',
    id: null,
    name: '',
    location: '',
    description: '',
    image_url: '',
    latitude: '',
    longitude: ''
  });
  const [mapDraftPositions, setMapDraftPositions] = useState({});
  const [mapSaving, setMapSaving] = useState(false);
  const [mapAutoSaveStatus, setMapAutoSaveStatus] = useState({ state: 'idle', message: '' });
  const [mapDragCoords, setMapDragCoords] = useState(null);
  const mapAutoSaveTimers = useRef({});

  const getMapImageUrl = (item) => {
    if (!item) return '';
    if (item.image_url) return item.image_url;
    if (Array.isArray(item.image_urls) && item.image_urls.length > 0) return item.image_urls[0] || '';
    if (typeof item.primary_image_url === 'string' && item.primary_image_url.trim()) return item.primary_image_url.trim();
    return '';
  };

  const loadAnalytics = async () => {
    try {
      setReportsLoading(true);
      const res = await api.get('/owner/analytics');
      if (res && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setReportsLoading(false);
    }
  };

  // ── Hero Settings ───────────────────────────────────────────────────────
  const defaultHeroSettings = {
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&q=80',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1920&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
    ],
    overlayColor: '#16a34a',
    overlayOpacity: 0.5,
  };
  const [heroSettings, setHeroSettings] = useState(defaultHeroSettings);
  const [heroLoading, setHeroLoading] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroSaveMsg, setHeroSaveMsg] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [heroPreviewIndex, setHeroPreviewIndex] = useState(0);

  // ── Customization Tab ───────────────────────────────────────────────────
  const [customTab, setCustomTab] = useState('hero'); // hero | homeSlideshow | theme | typography | announcement | footer | sections | branding | about | auth

  // ── About Settings Management ───────────────────────────────────────────
  const [aboutData, setAboutData] = useState(null);
  const [aboutLoading, setAboutLoading] = useState(true);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutEditingSection, setAboutEditingSection] = useState('overview');
  const [aboutSaveMsg, setAboutSaveMsg] = useState({ type: '', text: '' });

  // About Media Gallery Management
  const [aboutMedia, setAboutMedia] = useState([]);
  const [aboutMediaLoading, setAboutMediaLoading] = useState(false);
  const [aboutMediaUploading, setAboutMediaUploading] = useState(false);
  const [aboutMediaMsg, setAboutMediaMsg] = useState({ type: '', text: '' });
  const [selectedMediaSection, setSelectedMediaSection] = useState('overview');

  // Load about data when tab opens
  useEffect(() => {
    if (customTab === 'about' && !aboutData) {
      loadAboutData();
      loadAboutMedia();
    }
  }, [customTab]);

  useEffect(() => {
    if (customTab === 'auth' || customTab === 'about') {
      loadCustomizationSettings();
    }
  }, [customTab]);

  const loadAboutData = async () => {
    try {
      const response = await api.get('/about-settings');
      setAboutData(response.data);
    } catch (err) {
      console.error('Error loading about data:', err);
      setAboutSaveMsg({ type: 'error', text: 'Failed to load about settings' });
    } finally {
      setAboutLoading(false);
    }
  };

  const handleAboutInputChange = (field, value) => {
    setAboutData(prev => ({ ...prev, [field]: value }));
  };

  const handleAboutMissionPointChange = (index, value) => {
    setAboutData(prev => ({
      ...prev,
      mission_text: {
        ...prev.mission_text,
        points: prev.mission_text.points.map((point, i) => i === index ? value : point)
      }
    }));
  };

  const addAboutMissionPoint = () => {
    setAboutData(prev => ({
      ...prev,
      mission_text: {
        ...prev.mission_text,
        points: [...prev.mission_text.points, '']
      }
    }));
  };

  const removeAboutMissionPoint = (index) => {
    setAboutData(prev => ({
      ...prev,
      mission_text: {
        ...prev.mission_text,
        points: prev.mission_text.points.filter((_, i) => i !== index)
      }
    }));
  };

  const saveAboutData = async () => {
    setAboutSaving(true);
    try {
      await api.put('/admin/about-settings', aboutData);
      setAboutSaveMsg({ type: 'success', text: 'About settings saved successfully!' });
      setTimeout(() => setAboutSaveMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error saving about data:', err);
      setAboutSaveMsg({ type: 'error', text: 'Failed to save about settings' });
    } finally {
      setAboutSaving(false);
    }
  };

  const handleLeadershipPhotoUpload = async (e, photoType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', photoType);

    try {
      setAboutMediaMsg({ type: 'info', text: 'Uploading leadership photo...' });
      const response = await api.post('/admin/about/leader-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const photoField = photoType === 'mayorPhoto' ? 'current_mayor_photo_url' : 'current_vice_mayor_photo_url';
        setAboutData(prev => ({
          ...prev,
          [photoField]: response.data.photoUrl
        }));
        setAboutMediaMsg({ type: 'success', text: 'Leadership photo uploaded successfully!' });
        setTimeout(() => setAboutMediaMsg({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      console.error('Error uploading leadership photo:', err);
      setAboutMediaMsg({ type: 'error', text: 'Failed to upload leadership photo' });
    }
  };

  // ── About Media Gallery Management ──────────────────────────────────────
  const loadAboutMedia = async () => {
    setAboutMediaLoading(true);
    try {
      const response = await api.get('/admin/about-media');
      setAboutMedia(response.data || []);
    } catch (err) {
      console.error('Error loading about media:', err);
      setAboutMediaMsg({ type: 'error', text: 'Failed to load media gallery' });
    } finally {
      setAboutMediaLoading(false);
    }
  };

  const handleAboutMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAboutMediaUploading(true);
    const formData = new FormData();
    
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('section', selectedMediaSection);

    try {
      const response = await api.post('/admin/about-media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data) {
        setAboutMedia(prev => [...prev, ...response.data]);
        setAboutMediaMsg({ type: 'success', text: `${files.length} file(s) uploaded successfully!` });
        e.target.value = ''; // Reset file input
        setTimeout(() => setAboutMediaMsg({ type: '', text: '' }), 3000);
      }
    } catch (err) {
      console.error('Error uploading media:', err);
      setAboutMediaMsg({ type: 'error', text: 'Failed to upload media files' });
    } finally {
      setAboutMediaUploading(false);
    }
  };

  const deleteAboutMedia = async (mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media?')) return;

    try {
      await api.delete(`/admin/about-media/${mediaId}`);
      setAboutMedia(prev => prev.filter(m => m.id !== mediaId));
      setAboutMediaMsg({ type: 'success', text: 'Media deleted successfully' });
      setTimeout(() => setAboutMediaMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error deleting media:', err);
      setAboutMediaMsg({ type: 'error', text: 'Failed to delete media' });
    }
  };

  // ── Custom Sections Management ──────────────────────────────────────────
  const [customSections, setCustomSections] = useState([]);
  const [customSectionsLoading, setCustomSectionsLoading] = useState(false);
  const [editingCustomSection, setEditingCustomSection] = useState(null);
  const [customSectionForm, setCustomSectionForm] = useState({
    section_key: '',
    section_name: '',
    section_type: 'html',
    content: ''
  });
  const [customSectionSaving, setCustomSectionSaving] = useState(false);
  const [customSectionMsg, setCustomSectionMsg] = useState({ type: '', text: '' });

  const loadCustomSections = async () => {
    setCustomSectionsLoading(true);
    try {
      const response = await api.get('/admin/sections');
      setCustomSections(response.data || []);
    } catch (err) {
      console.error('Error loading custom sections:', err);
      setCustomSectionMsg({ type: 'error', text: 'Failed to load sections' });
    } finally {
      setCustomSectionsLoading(false);
    }
  };

  const handleCreateCustomSection = () => {
    setEditingCustomSection(null);
    setCustomSectionForm({
      section_key: '',
      section_name: '',
      section_type: 'html',
      content: ''
    });
  };

  const handleEditCustomSection = (section) => {
    setEditingCustomSection(section.id);
    setCustomSectionForm({
      section_key: section.section_key,
      section_name: section.section_name,
      section_type: section.section_type,
      content: section.content || ''
    });
  };

  const handleSaveCustomSection = async () => {
    setCustomSectionSaving(true);
    try {
      if (editingCustomSection) {
        await api.put(`/admin/sections/${editingCustomSection}`, customSectionForm);
        setCustomSectionMsg({ type: 'success', text: 'Section updated successfully!' });
      } else {
        await api.post('/admin/sections', customSectionForm);
        setCustomSectionMsg({ type: 'success', text: 'Section created successfully!' });
      }
      setTimeout( () => setCustomSectionMsg({ type: '', text: '' }), 3000);
      loadCustomSections();
      setEditingCustomSection(null);
    } catch (err) {
      console.error('Error saving section:', err);
      setCustomSectionMsg({ type: 'error', text: 'Failed to save section' });
    } finally {
      setCustomSectionSaving(false);
    }
  };

  const handleDeleteCustomSection = async (sectionId) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        await api.delete(`/admin/sections/${sectionId}`);
        setCustomSectionMsg({ type: 'success', text: 'Section deleted successfully!' });
        setTimeout(() => setCustomSectionMsg({ type: '', text: '' }), 3000);
        loadCustomSections();
      } catch (err) {
        console.error('Error deleting section:', err);
        setCustomSectionMsg({ type: 'error', text: 'Failed to delete section' });
      }
    }
  };

  // Load sections when customTab changes to 'sections'
  useEffect(() => {
    if (customTab === 'sections') {
      loadCustomSections();
    }
  }, [customTab]);

  // ── Home Slideshow Settings ─────────────────────────────────────────────
  const defaultHomeSlideshowSettings = {
    overlayColor: '#000000',
    overlayOpacity: 0.4,
    tagText: t('featured_badge'),
    buttonTextGuest: t('start_your_journey'),
    buttonTextUser: t('explore_now'),
    titleColor: '#ffffff',
    descriptionColor: '#e5e7eb',
    tagTextColor: '#ffffff',
    tagBgColor: '#ffffff',
    buttonColor: '#ffffff',
    buttonTextColor: '#111827',
    buttonTransparent: false,
    // New button styling options
    buttonBorderRadius: 50,
    buttonBorderColor: '#ffffff',
    buttonBorderWidth: 0,
    buttonPaddingVertical: 1,
    buttonPaddingHorizontal: 2.5,
    buttonShadowBlur: 25,
    buttonShadowOpacity: 0.3,
    buttonHoverAnimation: 'lift', // lift, scale, glow, slide
    buttonHoverColor: '#ffffff',
    buttonHoverShadowBlur: 40,
    buttonHoverShadowOpacity: 0.4,
  };
  const [homeSlideshowSettings, setHomeSlideshowSettings] = useState(defaultHomeSlideshowSettings);
  const [homeSlideshowSaving, setHomeSlideshowSaving] = useState(false);
  const [homeSlideshowMsg, setHomeSlideshowMsg] = useState(null);

  // ── Site Theme Settings ─────────────────────────────────────────────────
  const defaultSiteTheme = {
    primary: '#16a34a',
    primaryDark: '#15803d',
    primaryLight: '#22c55e',
    secondary: '#0891b2',
    secondaryDark: '#0e7490',
    navBg: '#15803d',
  };
  const [siteTheme, setSiteTheme] = useState(defaultSiteTheme);
  const [siteThemeSaving, setSiteThemeSaving] = useState(false);
  const [siteThemeMsg, setSiteThemeMsg] = useState(null);

  // ── Hero Extended ───────────────────────────────────────────────────────
  const [heroExtended, setHeroExtended] = useState({ title: 'Discover Naujan', subtitle: 'Oriental Mindoro, Philippines', autoplay: true, intervalSeconds: 5 });
  const [heroExtSaving, setHeroExtSaving] = useState(false);
  const [heroExtMsg, setHeroExtMsg] = useState(null);

  // ── Attraction Details Hero ────────────────────────────────────────────
  const defaultAttractionHeroSettings = {
    backButtonLabel: 'Back',
    heroMinHeightDesktop: 480,
    heroMinHeightMobile: 420,
    overlayStart: 0.78,
    overlayMid: 0.52,
    overlayEnd: 0.64,
    addToItineraryText: 'Add to Itinerary',
    saveToFavoritesText: 'Save to Favorites',
    savedToFavoritesText: 'Saved to Favorites',
    shareText: 'Share',
    viewOnMapText: 'View on Map',
    heroTitleColor: '#f8fafc',
    heroMetaTextColor: '#ecfeff',
    heroKickerColor: '#dcfce7',
    heroBadgeTextColor: '#ecfdf5',
    backButtonTextColor: '#0f172a',
    backButtonBgColor: '#ffffff',
    backButtonTransparent: false,
    primaryButtonColor: '#16a34a',
    primaryButtonTextColor: '#ffffff',
    primaryButtonTransparent: false,
    secondaryButtonColor: '#ffffff',
    secondaryButtonTextColor: '#111827',
    secondaryButtonTransparent: false,
    tertiaryButtonColor: '#0f172a',
    tertiaryButtonTextColor: '#ecfeff',
    tertiaryButtonTransparent: true,
  };
  const [attractionHeroSettings, setAttractionHeroSettings] = useState(defaultAttractionHeroSettings);
  const [attractionHeroSaving, setAttractionHeroSaving] = useState(false);
  const [attractionHeroMsg, setAttractionHeroMsg] = useState(null);

  // ── Home Slideshow Extended ─────────────────────────────────────────────
  const [homeSlideshowExt, setHomeSlideshowExt] = useState({ intervalSeconds: 4, showArrows: true, transition: 'fade' });
  const [homeSlideshowExtSaving, setHomeSlideshowExtSaving] = useState(false);
  const [homeSlideshowExtMsg, setHomeSlideshowExtMsg] = useState(null);

  // ── Typography ──────────────────────────────────────────────────────────
  const [typography, setTypography] = useState(DEFAULT_TYPOGRAPHY);
  const [typographySaving, setTypographySaving] = useState(false);
  const [typographyMsg, setTypographyMsg] = useState(null);
  const [typographyPreviewDevice, setTypographyPreviewDevice] = useState('desktop');

  // ── Announcement Bar ────────────────────────────────────────────────────
  const [announcement, setAnnouncement] = useState({ enabled: false, message: 'Welcome to NaujanGO!', bgColor: '#16a34a', textColor: '#ffffff', linkUrl: '', linkLabel: '', dismissible: true });
  const [announcementSaving, setAnnouncementSaving] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState(null);

  // ── Footer Settings ─────────────────────────────────────────────────────
  const [footerSettings, setFooterSettings] = useState({ tagline: 'Your gateway to the beauty of Naujan, Oriental Mindoro.', copyright: 'NaujanGO. All rights reserved.', contactEmail: 'info@naujango.ph', contactPhone: '+63 43 XXX-XXXX', contactAddress: 'Naujan, Oriental Mindoro', facebook: 'https://facebook.com/naujantourism', instagram: 'https://instagram.com/naujantourism', twitter: '', youtube: '' });
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerMsg, setFooterMsg] = useState(null);

  // ── About Page Settings ─────────────────────────────────────────────────
  const defaultAboutPageData = {
    overview_text: 'Naujan is a 1st class municipality in Oriental Mindoro with 70 barangays.',
    vision_text: 'By 2030, Naujan envisions to be the leading agricultural municipality in MIMAROPA.',
    mission_text: { points: ['Recognition and promotion of indigenous cultural communities', 'Conservation and protection of natural resources', 'Accountability and competency of people-centered governance', 'Promotion of eco-tourism and sustainable agricultural production'] },
    population: 109122,
    land_area_sq_km: 503.10,
    density_per_sq_km: 216.50,
    num_barangays: 70,
    municipal_rank: '2nd most populous in Oriental Mindoro',
    current_mayor_name: 'Henry Joel C. Teves',
    current_mayor_term: '2022-Present',
    current_vice_mayor_name: 'Candido J. Melgar Jr.',
    current_vice_mayor_term: '2025-Present',
    visitor_arrivals_2022: 15605,
    visitor_arrivals_2023: 42561,
    visitor_arrivals_2024: 62788,
    visitor_arrivals_2025: 36074,
    tourism_total_employment: 580,
    tourism_attractions_count: 475,
    tourism_accommodation_count: 105,
    tourism_female_employed: 338,
    tourism_male_employed: 242
  };
  const [aboutPageData, setAboutPageData] = useState(defaultAboutPageData);
  const [aboutPageSaving, setAboutPageSaving] = useState(false);
  const [aboutPageMsg, setAboutPageMsg] = useState(null);
  const [leadershipPhotos, setLeadershipPhotos] = useState({});
  const [leadershipPhotoMsg, setLeadershipPhotoMsg] = useState(null);

  const leadershipRosterDefaults = [
    { role: 'mayor', label: 'Mayor', name: 'Henry Joel C. Teves', term: '2022–Present' },
    { role: 'vice-mayor', label: 'Vice Mayor', name: 'Candido J. Melgar Jr.', term: '2025–Present' },
    { role: 'mayor', label: 'Mayor', name: 'Carlos Basa Sr.', term: '1903' },
    { role: 'mayor', label: 'Mayor', name: 'Bonifacio Evora', term: '1903' },
    { role: 'mayor', label: 'Mayor', name: 'Leon Garong', term: '1903–1916' },
    { role: 'mayor', label: 'Mayor', name: 'Agustin Garong', term: '1916–1922' },
    { role: 'mayor', label: 'Mayor', name: 'Jose L. Basa', term: '1922–1927' },
    { role: 'mayor', label: 'Mayor', name: 'Santiago Garong', term: '1928–1934' },
    { role: 'mayor', label: 'Mayor', name: 'Porfirio Comia', term: '1935–1940' },
    { role: 'mayor', label: 'Mayor', name: 'Cirilo S. Gaba', term: '1941–1942' },
    { role: 'mayor', label: 'Mayor', name: 'Agustin Garong Sr.', term: '1942–1945' },
    { role: 'mayor', label: 'Mayor', name: 'Felicisimo Garing', term: '1942–1945' },
    { role: 'mayor', label: 'Mayor', name: 'Marciano Roldan', term: '1946, 1948–1951' },
    { role: 'mayor', label: 'Mayor', name: 'Ambrocio L. Salva', term: '1946' },
    { role: 'mayor', label: 'Mayor', name: 'Amando G. Melgar', term: '1952–1959' },
    { role: 'mayor', label: 'Mayor', name: 'Porfirio Comia', term: '1950–1962' },
    { role: 'mayor', label: 'Mayor', name: 'Manuel R. Marcos', term: '1962–1967' },
    { role: 'mayor', label: 'Mayor', name: 'Armando Melgar Sr.', term: '1968–1975' },
    { role: 'mayor', label: 'Mayor', name: 'Manuel Marcos', term: '1975–1986' },
    { role: 'mayor', label: 'Mayor', name: 'Dr. Rolando R. Mendoza', term: '1986–1987' },
    { role: 'mayor', label: 'Mayor', name: 'Arnulfo Bautista', term: '1987' },
    { role: 'mayor', label: 'Mayor', name: 'Audel Arago', term: '1987–1988' },
    { role: 'mayor', label: 'Mayor', name: 'Nelson Melgar', term: '1988–1997' },
    { role: 'mayor', label: 'Mayor', name: 'Norberto M. Mendoza', term: '1997–2007' },
    { role: 'mayor', label: 'Mayor', name: 'Romar G. Marcos', term: '2007–2010' },
    { role: 'mayor', label: 'Mayor', name: 'Wilson A. Viray', term: '2010' },
    { role: 'mayor', label: 'Mayor', name: 'Maria Angeles C. Casubuan', term: '2010–2013' },
    { role: 'mayor', label: 'Mayor', name: 'Dein Z. Arago', term: '2010–2013' },
    { role: 'mayor', label: 'Mayor', name: 'Mark N. Marcos', term: '2013–2022' },
    { role: 'vice-mayor', label: 'Vice Mayor', name: 'Henry Joel C. Teves', term: '2013–2016' },
    { role: 'vice-mayor', label: 'Vice Mayor', name: 'Sheryl Bacay Morales', term: '2016–2019' },
    { role: 'vice-mayor', label: 'Vice Mayor', name: 'Sheryl Bacay Morales', term: '2019–2022' },
    { role: 'vice-mayor', label: 'Vice Mayor', name: 'Great Mangubat Delos Reyes', term: '2022–2025' }
  ];
  const defaultLeadershipRoster = leadershipRosterDefaults.map((person, index) => ({
    id: `leader-${index}`,
    role: person.role,
    name: person.name,
    term: person.term,
    current: (person.role === 'mayor' && person.name === 'Henry Joel C. Teves') || (person.role === 'vice-mayor' && person.name === 'Candido J. Melgar Jr.'),
    order: index
  }));
  const [leadershipRoster, setLeadershipRoster] = useState(defaultLeadershipRoster);
  const [leadershipRosterSaving, setLeadershipRosterSaving] = useState(false);
  const [leadershipRosterMsg, setLeadershipRosterMsg] = useState(null);
  const [leadershipRosterPage, setLeadershipRosterPage] = useState(1);
  const leadershipRosterPageSize = 8;
  const [leadershipPhotoPage, setLeadershipPhotoPage] = useState(1);
  const leadershipPhotoPageSize = 8;
  const defaultAccomplishments = [
    { id: 'accomplishment-1', date: 'February 5, 2025', category: 'COMMUNITY SERVICE', title: 'Solar lights provided through DSWD', description: 'Solar lights were provided to help improve access and safety in Naujan communities.', imageUrl: '' },
    { id: 'accomplishment-2', date: 'February 9, 2025', category: 'LIVELIHOOD', title: 'Support for the Melgar B Duluhan cottage project', description: 'Materials and support were provided for the community floating balsa project.', imageUrl: '' },
    { id: 'accomplishment-3', date: 'March 8, 2025', category: 'INFRASTRUCTURE', title: 'Opening of Rio del Sierra at Metolza', description: 'A new community destination opened in Metolza.', imageUrl: '' },
    { id: 'accomplishment-4', date: 'April 4, 2025', category: 'TOURISM', title: 'New floating balsa at Melgar B Duluhan Cottages', description: 'A new floating balsa added another way to experience Naujan waters.', imageUrl: '' },
    { id: 'accomplishment-5', date: 'July 7, 2025', category: 'CULTURE', title: 'Cinoong Naujan 2025', description: 'Naujan celebrated local identity, talent, and community participation.', imageUrl: '' },
    { id: 'accomplishment-6', date: 'September 10, 2025', category: 'FESTIVAL', title: 'Dabalistihit Festival', description: 'A major cultural celebration brought together food, music, dance, and local pride.', imageUrl: '' }
  ];
  const [accomplishments, setAccomplishments] = useState(defaultAccomplishments);
  const [accomplishmentsSaving, setAccomplishmentsSaving] = useState(false);
  const [accomplishmentsMsg, setAccomplishmentsMsg] = useState(null);
  const [accomplishmentsPage, setAccomplishmentsPage] = useState(1);
  const accomplishmentsPageSize = 6;

  const defaultPageantQueens = [
    { id: 'queen-1', year: 2025, name: 'Merry Leveliet Ocampo', photo: null },
    { id: 'queen-2', year: 2024, name: 'Ronnete C. Castillo', photo: null },
    { id: 'queen-3', year: 2023, name: 'Myrea Manely V. Caccam', photo: null },
    { id: 'queen-4', year: 2022, name: 'Cribari Brandy M. Motol', photo: null },
  ];
  const [pageantQueens, setPageantQueens] = useState(defaultPageantQueens);
  const [pageantQueensSaving, setPageantQueensSaving] = useState(false);
  const [pageantQueensMsg, setPageantQueensMsg] = useState(null);

  // ── Homepage Sections ───────────────────────────────────────────────────
  const [homepageSections, setHomepageSections] = useState({ showHeroSlideshow: true, showWelcome: true, showWeather: true, showAttractions: true, showHotels: true, showQuickActions: true, showCta: true, showBenefits: true, showInspiration: true, welcomeTitle: 'Welcome to Naujan', welcomeSubtitle: 'Discover Paradise', attractionsTitle: 'Featured Attractions', attractionsSubtitle: 'Explore our top destinations', hotelsTitle: 'Recommended Hotels', hotelsSubtitle: 'Find your perfect stay' });
  const [sectionsSaving, setSectionsSaving] = useState(false);
  const [sectionsMsg, setSectionsMsg] = useState(null);

  // ── Branding ────────────────────────────────────────────────────────────
  const [branding, setBranding] = useState({ siteName: 'NaujanGO', logoUrl: '', faviconUrl: '', tagline: 'Your Official Tourism Guide' });
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingMsg, setBrandingMsg] = useState(null);

  // ── Auth Pages Settings ──────────────────────────────────────────────────
  const defaultAuthPageSettings = {
    loginBgType: 'gradient', // 'solid' | 'gradient' | 'image'
    loginSolidColor: '#f5f7fa',
    loginGradient: { color1: '#f5f7fa', color2: '#c3cfe2', angle: 135 },
    loginImage: '',
    loginOverlayOpacity: 0.5,
    registerBgType: 'gradient',
    registerSolidColor: '#f5f7fa',
    registerGradient: { color1: '#f5f7fa', color2: '#c3cfe2', angle: 135 },
    registerImage: '',
    registerOverlayOpacity: 0.5,
  };
  const [authPageSettings, setAuthPageSettings] = useState(defaultAuthPageSettings);
  const [authPagesSaving, setAuthPagesSaving] = useState(false);
  const [authPagesMsg, setAuthPagesMsg] = useState(null);

  const [archivedBookings, setArchivedBookings] = useState([]);
  const [archivedItineraries, setArchivedItineraries] = useState([]);
  const [archiveSubSection, setArchiveSubSection] = useState('bookings');

  // ── Pagination ─────────────────────────────────────────────────────────
  const ADMIN_TABLE_SIZE = 10;
  const ADMIN_CARD_SIZE  = 8;
  const [usersPage,       setUsersPage]       = useState(1);
  const [bookingsPage,    setBookingsPage]    = useState(1);
  const [hotelsPage,      setHotelsPage]      = useState(1);
  const [itinerariesPage, setItinerariesPage] = useState(1);
  const [attractionsPage, setAttractionsPage] = useState(1);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAdminData();
    loadAnalytics();
  }, [user, navigate]);

  useEffect(() => {
    return () => {
      Object.values(mapAutoSaveTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // Reset pagination when search/filter changes
  useEffect(() => { setBookingsPage(1);    }, [bookingSearch, bookingStatusFilter]);
  useEffect(() => { setHotelsPage(1);      }, [hotelSearch]);
  useEffect(() => { setItinerariesPage(1); }, [itinerarySearch]);
  useEffect(() => { setAttractionsPage(1); }, [attractionSearch]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/bookings')
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const startUserEdit = (selectedUser) => {
    setEditingUser(selectedUser);
    setUserForm({
      username: selectedUser.username || '',
      email: selectedUser.email || '',
      first_name: selectedUser.first_name || '',
      last_name: selectedUser.last_name || '',
      phone: selectedUser.phone || '',
      role: selectedUser.role || 'user',
      password: ''
    });
  };

  const handleUserSave = async () => {
    if (!editingUser) return;

    try {
      setUserSaving(true);
      const payload = {
        username: userForm.username,
        email: userForm.email,
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        phone: userForm.phone,
        role: userForm.role
      };

      if (userForm.password) {
        payload.password = userForm.password;
      }

      await api.put(`/admin/users/${editingUser.user_id}`, payload);
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'user',
        password: ''
      });
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.error || 'Failed to update user.');
    } finally {
      setUserSaving(false);
    }
  };

  const loadHeroSettings = async () => {
    setHeroLoading(true);
    try {
      const response = await api.get('/admin/hero-settings');
      setHeroSettings(response.data);
      setHeroPreviewIndex(0);
    } catch (error) {
      console.error('Error loading hero settings:', error);
    } finally {
      setHeroLoading(false);
    }
  };

  const saveHeroSettings = async () => {
    setHeroSaving(true);
    setHeroSaveMsg(null);
    try {
      const response = await api.put('/admin/hero-settings', heroSettings);
      if (response.data.success) {
        saveCachedSetting('hero-settings', response.data.settings || heroSettings);
        setHeroSaveMsg({ type: 'success', text: 'Hero settings saved successfully!' });
      } else {
        setHeroSaveMsg({ type: 'error', text: response.data.error || 'Save failed' });
      }
    } catch (error) {
      setHeroSaveMsg({ type: 'error', text: 'Failed to save hero settings' });
    } finally {
      setHeroSaving(false);
      setTimeout(() => setHeroSaveMsg(null), 4000);
    }
  };

  const addHeroImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setHeroSettings(prev => ({ ...prev, images: [...prev.images, url] }));
    setNewImageUrl('');
  };

  const removeHeroImage = (idx) => {
    setHeroSettings(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx)
    }));
    setHeroPreviewIndex(0);
  };

  const moveHeroImage = (idx, dir) => {
    setHeroSettings(prev => {
      const imgs = [...prev.images];
      const target = idx + dir;
      if (target < 0 || target >= imgs.length) return prev;
      [imgs[idx], imgs[target]] = [imgs[target], imgs[idx]];
      return { ...prev, images: imgs };
    });
  };

  const loadCustomizationSettings = async () => {
    loadHeroSettings();
    try {
      const [slideshowRes, themeRes, heroExtRes, attractionHeroRes, slideshowExtRes, typographyRes, announcementRes, footerRes, sectionsRes, brandingRes, aboutRes, authPagesRes, leadershipPhotosRes, leadershipRosterRes, accomplishmentsRes] = await Promise.all([
        api.get('/admin/home-slideshow'),
        api.get('/admin/site-theme'),
        api.get('/admin/hero-extended'),
        api.get('/admin/attraction-hero'),
        api.get('/admin/home-slideshow-extended'),
        api.get('/admin/typography'),
        api.get('/admin/announcement'),
        api.get('/admin/footer-settings'),
        api.get('/admin/homepage-sections'),
        api.get('/admin/branding'),
        api.get('/about-settings'),
        api.get('/admin/auth-pages'),
        api.get('/about-leadership-photos'),
        api.get('/about-leadership-roster'),
        api.get('/about-accomplishments'),
      ]);
      setHomeSlideshowSettings({ ...defaultHomeSlideshowSettings, ...(slideshowRes.data || {}) });
      setSiteTheme(themeRes.data);
      setHeroExtended(heroExtRes.data);
      const mergedAttractionHero = { ...defaultAttractionHeroSettings, ...(attractionHeroRes.data || {}) };
      setAttractionHeroSettings({
        ...mergedAttractionHero,
        backButtonTransparent: toBooleanSetting(mergedAttractionHero.backButtonTransparent, defaultAttractionHeroSettings.backButtonTransparent),
        primaryButtonTransparent: toBooleanSetting(mergedAttractionHero.primaryButtonTransparent, defaultAttractionHeroSettings.primaryButtonTransparent),
        secondaryButtonTransparent: toBooleanSetting(mergedAttractionHero.secondaryButtonTransparent, defaultAttractionHeroSettings.secondaryButtonTransparent),
        tertiaryButtonTransparent: toBooleanSetting(mergedAttractionHero.tertiaryButtonTransparent, defaultAttractionHeroSettings.tertiaryButtonTransparent),
      });
      setHomeSlideshowExt(slideshowExtRes.data);
      setTypography({ ...DEFAULT_TYPOGRAPHY, ...typographyRes.data });
      setAnnouncement(announcementRes.data);
      setFooterSettings(footerRes.data);
      setHomepageSections(sectionsRes.data);
      setBranding(brandingRes.data);
      setAboutPageData({ ...defaultAboutPageData, ...aboutRes.data });
      setLeadershipPhotos(leadershipPhotosRes.data || {});
      if (Array.isArray(leadershipRosterRes.data) && leadershipRosterRes.data.length) {
        setLeadershipRoster(leadershipRosterRes.data);
      }
      if (Array.isArray(accomplishmentsRes.data) && accomplishmentsRes.data.length) {
        setAccomplishments(accomplishmentsRes.data);
      }
      try {
        const queensRes = await api.get('/about-pageant-queens');
        if (Array.isArray(queensRes.data) && queensRes.data.length) setPageantQueens(queensRes.data);
      } catch (_) {}
      setAuthPageSettings({ ...defaultAuthPageSettings, ...(authPagesRes.data || {}) });
      console.log('[ADMIN] Auth pages loaded:', authPagesRes.data);
    } catch (error) {
      console.error('Error loading customization settings:', error);
    }
  };

  // Generic save helper
  const makeSaver = (endpoint, getData, setSaving, setMsg) => async () => {
    setSaving(true); setMsg(null);
    try {
      const payload = getData();
      const res = await api.put(endpoint, payload);
      if (res.data.success) {
        saveCachedSetting(endpoint.replace('/admin/', ''), res.data.settings || payload);
        setMsg({ type: 'success', text: 'Saved successfully!' });
        window.dispatchEvent(new CustomEvent('naujan:settings-updated', {
          detail: { key: endpoint.replace('/admin/', ''), data: payload }
        }));
      } else {
        setMsg({ type: 'error', text: res.data.error || 'Save failed' });
      }
    } catch { setMsg({ type: 'error', text: 'Failed to save' }); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 4000); }
  };

  const getNormalizedAttractionHeroSettings = () => ({
    ...attractionHeroSettings,
    backButtonTransparent: toBooleanSetting(attractionHeroSettings.backButtonTransparent, false),
    primaryButtonTransparent: toBooleanSetting(attractionHeroSettings.primaryButtonTransparent, false),
    secondaryButtonTransparent: toBooleanSetting(attractionHeroSettings.secondaryButtonTransparent, false),
    tertiaryButtonTransparent: toBooleanSetting(attractionHeroSettings.tertiaryButtonTransparent, false),
  });

  const saveHomeSlideshowSettings = makeSaver('/admin/home-slideshow', () => homeSlideshowSettings, setHomeSlideshowSaving, setHomeSlideshowMsg);
  const saveHeroExtended         = makeSaver('/admin/hero-extended', () => heroExtended, setHeroExtSaving, setHeroExtMsg);
  const saveAttractionHeroSettings = makeSaver('/admin/attraction-hero', getNormalizedAttractionHeroSettings, setAttractionHeroSaving, setAttractionHeroMsg);
  const saveHomeSlideshowExt     = makeSaver('/admin/home-slideshow-extended', () => homeSlideshowExt, setHomeSlideshowExtSaving, setHomeSlideshowExtMsg);
  const saveTypography           = makeSaver('/admin/typography', () => typography, setTypographySaving, setTypographyMsg);
  const saveAnnouncement         = makeSaver('/admin/announcement', () => announcement, setAnnouncementSaving, setAnnouncementMsg);
  const saveFooterSettings       = makeSaver('/admin/footer-settings', () => footerSettings, setFooterSaving, setFooterMsg);
  const saveHomepageSections     = makeSaver('/admin/homepage-sections', () => homepageSections, setSectionsSaving, setSectionsMsg);
  const saveBranding             = makeSaver('/admin/branding', () => branding, setBrandingSaving, setBrandingMsg);
  const saveAuthPages            = makeSaver('/admin/auth-pages', () => authPageSettings, setAuthPagesSaving, setAuthPagesMsg);

  const saveAboutPageData = async () => {
    setAboutPageSaving(true);
    setAboutPageMsg(null);
    try {
      const response = await api.put('/admin/about-settings', aboutPageData);
      if (response.data.success || response.status === 200) {
        saveCachedSetting('about-settings', aboutPageData);
        setAboutPageMsg({ type: 'success', text: 'About page settings saved successfully!' });
        window.dispatchEvent(new CustomEvent('naujan:settings-updated', {
          detail: { key: 'about-settings', data: aboutPageData }
        }));
      } else {
        setAboutPageMsg({ type: 'error', text: response.data.error || 'Save failed' });
      }
    } catch (error) {
      console.error('Error saving about settings:', error);
      setAboutPageMsg({ type: 'error', text: 'Failed to save about page settings' });
    } finally {
      setAboutPageSaving(false);
      setTimeout(() => setAboutPageMsg(null), 4000);
    }
  };

  const uploadLeadershipPhoto = async (leader, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('leaderKey', `${leader.role}:${leader.name}:${leader.term}`);
    try {
      const response = await api.post('/admin/leader-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = response.data?.photoUrl;
      if (photoUrl) {
        setLeadershipPhotos((current) => ({
          ...current,
          [`${leader.role}:${leader.name}:${leader.term}`]: photoUrl
        }));
        setLeadershipPhotoMsg({ type: 'success', text: `${leader.name}'s photo updated.` });
      }
    } catch (error) {
      const serverMessage = error.response?.data?.error;
      setLeadershipPhotoMsg({
        type: 'error',
        text: serverMessage || `Could not upload ${leader.name}'s photo.`
      });
    }
  };

  const saveLeadershipRoster = async () => {
    setLeadershipRosterSaving(true);
    setLeadershipRosterMsg(null);
    try {
      const response = await api.put('/admin/about-leadership-roster', leadershipRoster);
      const savedRoster = response.data?.roster || leadershipRoster;
      setLeadershipRoster(savedRoster);
      setLeadershipRosterPage(1);
      setLeadershipPhotoPage(1);
      setLeadershipRosterMsg({ type: 'success', text: 'Leadership order saved.' });
    } catch (error) {
      setLeadershipRosterMsg({ type: 'error', text: error.response?.data?.error || 'Could not save leadership order.' });
    } finally {
      setLeadershipRosterSaving(false);
    }
  };

  const savePageantQueens = async () => {
    setPageantQueensSaving(true);
    setPageantQueensMsg(null);
    try {
      const res = await api.put('/admin/about-pageant-queens', pageantQueens);
      setPageantQueens(res.data?.queens || pageantQueens);
      setPageantQueensMsg({ type: 'success', text: 'Miss Naujan roster saved.' });
    } catch (error) {
      setPageantQueensMsg({ type: 'error', text: error.response?.data?.error || 'Could not save.' });
    } finally {
      setPageantQueensSaving(false);
    }
  };

  const uploadPageantPhoto = async (queen, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('queenId', queen.id);
    try {
      const res = await api.post('/admin/about/pageant-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPageantQueens(items => items.map(q => q.id === queen.id ? { ...q, photo: res.data.photoUrl } : q));
      setPageantQueensMsg({ type: 'success', text: `${queen.name}'s photo updated. Save to keep it.` });
    } catch (error) {
      setPageantQueensMsg({ type: 'error', text: error.response?.data?.error || 'Could not upload photo.' });
    }
  };

  const saveAccomplishments = async () => {
    setAccomplishmentsSaving(true);
    setAccomplishmentsMsg(null);
    try {
      const response = await api.put('/admin/about-accomplishments', accomplishments);
      setAccomplishments(response.data?.entries || accomplishments);
      setAccomplishmentsPage(1);
      setAccomplishmentsMsg({ type: 'success', text: 'Accomplishments saved.' });
    } catch (error) {
      setAccomplishmentsMsg({ type: 'error', text: error.response?.data?.error || 'Could not save accomplishments.' });
    } finally {
      setAccomplishmentsSaving(false);
    }
  };

  const uploadAccomplishmentImage = async (entry, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('section', 'accomplishments');
    formData.append('entryId', entry.id);
    try {
      const response = await api.post('/admin/about/accomplishment-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAccomplishments((items) => items.map((item) => item.id === entry.id ? { ...item, imageUrl: response.data.imageUrl } : item));
      setAccomplishmentsMsg({ type: 'success', text: 'Accomplishment image uploaded. Save accomplishments to keep it.' });
    } catch (error) {
      setAccomplishmentsMsg({ type: 'error', text: error.response?.data?.error || 'Could not upload accomplishment image.' });
    }
  };

  const leadershipRosterPageCount = Math.max(1, Math.ceil(leadershipRoster.length / leadershipRosterPageSize));
  const leadershipPhotoLeaders = leadershipRoster.map((person) => ({
    ...person,
    label: person.role === 'vice-mayor' ? 'Vice Mayor' : 'Mayor'
  }));
  const visibleLeadershipRoster = leadershipRoster.slice(
    (leadershipRosterPage - 1) * leadershipRosterPageSize,
    leadershipRosterPage * leadershipRosterPageSize
  );
  const leadershipPhotoPageCount = Math.max(1, Math.ceil(leadershipRoster.length / leadershipPhotoPageSize));
  const visibleLeadershipPhotos = leadershipPhotoLeaders.slice(
    (leadershipPhotoPage - 1) * leadershipPhotoPageSize,
    leadershipPhotoPage * leadershipPhotoPageSize
  );
  const accomplishmentsPageCount = Math.max(1, Math.ceil(accomplishments.length / accomplishmentsPageSize));
  const visibleAccomplishments = accomplishments.slice(
    (accomplishmentsPage - 1) * accomplishmentsPageSize,
    accomplishmentsPage * accomplishmentsPageSize
  );

  useEffect(() => {
    setLeadershipRosterPage((page) => Math.min(page, leadershipRosterPageCount));
    setLeadershipPhotoPage((page) => Math.min(page, leadershipPhotoPageCount));
    setAccomplishmentsPage((page) => Math.min(page, accomplishmentsPageCount));
  }, [leadershipRoster.length, leadershipRosterPageCount, leadershipPhotoPageCount, accomplishments.length, accomplishmentsPageCount]);

  const updateTypography = (patch, options = {}) => {
    setTypography(prev => ({
      ...prev,
      ...patch,
      preset: options.keepPreset ? (patch.preset || prev.preset) : (patch.preset || 'custom')
    }));
  };

  const saveSiteTheme = async () => {
    setSiteThemeSaving(true);
    setSiteThemeMsg(null);
    try {
      const response = await api.put('/admin/site-theme', siteTheme);
      if (response.data.success) {
        saveCachedSetting('site-theme', response.data.settings || siteTheme);
        // Apply immediately to the current page
        const root = document.documentElement;
        root.style.setProperty('--primary', siteTheme.primary);
        root.style.setProperty('--primary-dark', siteTheme.primaryDark);
        root.style.setProperty('--primary-light', siteTheme.primaryLight);
        root.style.setProperty('--primary-color', siteTheme.primary);
        root.style.setProperty('--secondary', siteTheme.secondary);
        root.style.setProperty('--secondary-dark', siteTheme.secondaryDark);
        root.style.setProperty('--nav-bg', siteTheme.navBg);
        window.dispatchEvent(new CustomEvent('naujan:settings-updated', {
          detail: { key: 'site-theme', data: siteTheme }
        }));
        setSiteThemeMsg({ type: 'success', text: 'Website colors saved and applied!' });
      } else {
        setSiteThemeMsg({ type: 'error', text: response.data.error || 'Save failed' });
      }
    } catch (error) {
      setSiteThemeMsg({ type: 'error', text: 'Failed to save site theme' });
    } finally {
      setSiteThemeSaving(false);
      setTimeout(() => setSiteThemeMsg(null), 4000);
    }
  };

  const loadAttractions = async () => {
    try {
      const response = await api.get('/admin/attractions');
      setAttractions(response.data);
    } catch (error) {
      console.error('Error loading attractions:', error);
    }
  };

  const loadHotels = async () => {
    try {
      const response = await api.get('/admin/hotels');
      setHotels(response.data);
    } catch (error) {
      console.error('Error loading hotels:', error);
    }
  };

  const loadItineraries = async () => {
    try {
      const response = await api.get('/admin/itineraries');
      setItineraries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading itineraries:', error);
    }
  };

  const loadItineraryTemplates = async () => {
    try {
      const response = await api.get('/itinerary/templates/list');
      setItineraryTemplates(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading itinerary templates:', error);
    }
  };

  const handleHotelOwnerAssign = async (hotelId) => {
    const selectedOwner = ownerAssignments[hotelId];
    if (!selectedOwner) {
      alert('Please select an owner to assign.');
      return;
    }

    try {
      setOwnerAssigning((prev) => ({ ...prev, [hotelId]: true }));
      await api.post('/owner/assign-hotel', {
        userId: Number(selectedOwner),
        hotelId
      });
      await loadHotels();
      alert('Owner assigned successfully.');
    } catch (error) {
      console.error('Error assigning owner:', error);
      alert(error.response?.data?.error || 'Failed to assign owner.');
    } finally {
      setOwnerAssigning((prev) => ({ ...prev, [hotelId]: false }));
    }
  };

  const startMapEdit = (type, item) => {
    const id = type === 'hotel' ? item.hotel_id : item.id;
    setMapSelection({ type, id });
    setMapForm({
      type,
      id,
      name: item.name || '',
      location: item.location || '',
      description: item.description || '',
      image_url: getMapImageUrl(item),
      latitude: item.latitude ?? '',
      longitude: item.longitude ?? ''
    });
  };

  const updateDraftPosition = (type, id, lat, lng) => {
    const key = `${type}:${id}`;
    setMapDraftPositions((prev) => ({
      ...prev,
      [key]: { lat, lng }
    }));
  };

  const autoSaveMapPosition = (type, id, lat, lng, sourceData) => {
    if (!type || !id) return;
    const key = `${type}:${id}`;

    if (mapAutoSaveTimers.current[key]) {
      clearTimeout(mapAutoSaveTimers.current[key]);
    }

    mapAutoSaveTimers.current[key] = setTimeout(async () => {
      setMapAutoSaveStatus({ state: 'saving', message: 'Saving pin...' });
      try {
        const currentImageUrl = mapSelection && mapSelection.type === type && mapSelection.id === id
          ? mapForm.image_url
          : getMapImageUrl(sourceData);

        if (type === 'hotel') {
          await api.put(`/admin/hotels/${id}`, { latitude: lat, longitude: lng, image_url: currentImageUrl });
          await loadHotels();
        } else {
          const base = sourceData || attractions.find((item) => item.id === id) || {};
          await api.put(`/admin/attractions/${id}`, {
            name: base.name || '',
            description: base.description || '',
            location: base.location || '',
            image_url: currentImageUrl,
            latitude: lat,
            longitude: lng
          });
          await loadAttractions();
        }

        setMapAutoSaveStatus({ state: 'saved', message: 'Pin saved.' });
        setTimeout(() => {
          setMapAutoSaveStatus({ state: 'idle', message: '' });
        }, 1500);
      } catch (error) {
        console.error('Error auto-saving map pin:', error);
        setMapAutoSaveStatus({ state: 'error', message: 'Failed to save pin.' });
      }
    }, 400);
  };

  const handleMapMarkerDrag = (marker, position) => {
    if (!marker?.type || !marker?.data) return;
    updateDraftPosition(marker.type, marker.data.id, position.lat, position.lng);
    autoSaveMapPosition(marker.type, marker.data.id, position.lat, position.lng, marker.data);

    if (mapSelection && mapSelection.type === marker.type && mapSelection.id === marker.data.id) {
      setMapForm((prev) => ({
        ...prev,
        latitude: position.lat,
        longitude: position.lng
      }));
    }
  };

  const handleMapClick = (latlng) => {
    if (!mapSelection) return;
    updateDraftPosition(mapSelection.type, mapSelection.id, latlng.lat, latlng.lng);
    setMapForm((prev) => ({
      ...prev,
      latitude: latlng.lat,
      longitude: latlng.lng
    }));
    autoSaveMapPosition(mapSelection.type, mapSelection.id, latlng.lat, latlng.lng, mapForm);
    const name = mapForm.name || mapSelection.type;
    setMapDragCoords({ lat: latlng.lat, lng: latlng.lng, name });
    setTimeout(() => setMapDragCoords(null), 2000);
  };

  const handleMapSave = async () => {
    if (!mapSelection) return;
    const payload = {
      name: mapForm.name,
      location: mapForm.location,
      image_url: mapForm.image_url.trim(),
      latitude: mapForm.latitude === '' ? null : Number(mapForm.latitude),
      longitude: mapForm.longitude === '' ? null : Number(mapForm.longitude)
    };

    try {
      setMapSaving(true);
      if (mapSelection.type === 'hotel') {
        await api.put(`/admin/hotels/${mapSelection.id}`, payload);
        await loadHotels();
      } else {
        await api.put(`/admin/attractions/${mapSelection.id}`, {
          ...payload,
          description: mapForm.description
        });
        await loadAttractions();
      }

      setMapDraftPositions((prev) => {
        const next = { ...prev };
        delete next[`${mapSelection.type}:${mapSelection.id}`];
        return next;
      });
    } catch (error) {
      console.error('Error saving map changes:', error);
      alert(error.response?.data?.error || 'Failed to save map changes.');
    } finally {
      setMapSaving(false);
    }
  };

  const startHotelEdit = (hotel) => {
    setCreatingHotel(false);
    setEditingHotel(hotel);
    if (users.length === 0) {
      loadUsers();
    }
    setOwnerAssignments((prev) => ({
      ...prev,
      [hotel.hotel_id]: hotel.owner_ids && hotel.owner_ids.length > 0 ? String(hotel.owner_ids[0]) : ''
    }));
    setHotelForm({
      name: hotel.name || '',
      location: hotel.location || '',
      description: hotel.description || '',
      price_per_night: hotel.price_per_night ?? '',
      currency: hotel.currency || 'PHP',
      rating: hotel.rating ?? '',
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : '',
      image_url: hotel.image_url || '',
      map_url: hotel.map_url || '',
      contact_phone: hotel.contact_phone || '',
      contact_email: hotel.contact_email || '',
      is_active: hotel.is_active ? 1 : 0
    });
  };

  const handleHotelSave = async () => {
    if (!editingHotel) return;

    try {
      setHotelSaving(true);
      const payload = {
        name: hotelForm.name,
        location: hotelForm.location,
        description: hotelForm.description,
        price_per_night: hotelForm.price_per_night === '' ? null : Number(hotelForm.price_per_night),
        currency: hotelForm.currency || 'PHP',
        rating: hotelForm.rating === '' ? null : Number(hotelForm.rating),
        amenities: hotelForm.amenities,
        image_url: hotelForm.image_url,
        map_url: hotelForm.map_url,
        contact_phone: hotelForm.contact_phone,
        contact_email: hotelForm.contact_email,
        is_active: hotelForm.is_active ? 1 : 0
      };

      await api.put(`/admin/hotels/${editingHotel.hotel_id}`, payload);
      setEditingHotel(null);
      setHotelForm(emptyHotelForm);
      await loadHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
    } finally {
      setHotelSaving(false);
    }
  };

  const startHotelCreate = () => {
    setEditingHotel(null);
    setCreatingHotel(true);
    setHotelForm(emptyHotelForm);
  };

  const handleHotelCreate = async () => {
    try {
      setHotelSaving(true);
      const payload = {
        name: hotelForm.name,
        location: hotelForm.location,
        description: hotelForm.description,
        price_per_night: hotelForm.price_per_night === '' ? null : Number(hotelForm.price_per_night),
        currency: hotelForm.currency || 'PHP',
        rating: hotelForm.rating === '' ? null : Number(hotelForm.rating),
        amenities: hotelForm.amenities,
        image_url: hotelForm.image_url,
        map_url: hotelForm.map_url,
        contact_phone: hotelForm.contact_phone,
        contact_email: hotelForm.contact_email,
        is_active: hotelForm.is_active ? 1 : 0
      };

      await api.post('/admin/hotels', payload);
      setCreatingHotel(false);
      setHotelForm(emptyHotelForm);
      await loadHotels();
    } catch (error) {
      console.error('Error creating hotel:', error);
      alert('Failed to create hotel. Please check required fields.');
    } finally {
      setHotelSaving(false);
    }
  };

  const startAttractionCreate = () => {
    setEditingAttraction(null);
    setCreatingAttraction(true);
    setAttractionForm(emptyAttractionForm);
  };

  const startAttractionEdit = (attraction) => {
    setCreatingAttraction(false);
    setEditingAttraction(attraction);
    setAttractionForm({
      name: attraction.name || '',
      description: attraction.description || '',
      location: attraction.location || '',
      image_url: attraction.image_url || '',
      latitude: attraction.latitude ?? '',
      longitude: attraction.longitude ?? ''
    });
  };

  const handleAttractionSave = async () => {
    const payload = {
      name: attractionForm.name,
      description: attractionForm.description,
      location: attractionForm.location,
      image_url: attractionForm.image_url || null,
      latitude: attractionForm.latitude === '' ? null : Number(attractionForm.latitude),
      longitude: attractionForm.longitude === '' ? null : Number(attractionForm.longitude)
    };

    try {
      setAttractionSaving(true);
      if (creatingAttraction) {
        await api.post('/admin/attractions', payload);
      } else if (editingAttraction) {
        await api.put(`/admin/attractions/${editingAttraction.id}`, payload);
      }
      await loadAttractions();
      setEditingAttraction(null);
      setCreatingAttraction(false);
      setAttractionForm(emptyAttractionForm);
    } catch (error) {
      console.error('Error saving attraction:', error);
      alert('Failed to save attraction.');
    } finally {
      setAttractionSaving(false);
    }
  };

  const handleAttractionDelete = async (attractionId) => {
    const confirmed = window.confirm(t('confirm_delete_attraction'));
    if (!confirmed) return;

    const key = `${attractionId}:delete`;
    try {
      setActionLoading(setAttractionActionLoading, key, true);
      await api.delete(`/admin/attractions/${attractionId}`);
      await loadAttractions();
    } catch (error) {
      console.error('Error deleting attraction:', error);
      alert('Failed to delete attraction.');
    } finally {
      setActionLoading(setAttractionActionLoading, key, false);
    }
  };

  const handleHotelStatusToggle = async (hotel) => {
    try {
      const nextStatus = hotel.is_active ? 0 : 1;
      await api.patch(`/admin/hotels/${hotel.hotel_id}/status`, { is_active: nextStatus });
      await loadHotels();
    } catch (error) {
      console.error('Error updating hotel status:', error);
    }
  };

  const handleHotelDelete = async (hotel) => {
    const confirmed = window.confirm(`Delete ${hotel.name}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await api.delete(`/admin/hotels/${hotel.hotel_id}`);
      await loadHotels();
    } catch (error) {
      console.error('Error deleting hotel:', error);
    }
  };

  const loadChatbotData = async () => {
    try {
      const [statsRes, convsRes] = await Promise.all([
        api.get('/admin/chatbot/stats'),
        api.get('/admin/chatbot/conversations')
      ]);
      setChatbotData({ ...statsRes.data, conversations: convsRes.data });
    } catch (error) {
      console.error('Error loading chatbot data:', error);
      setChatbotData({ totalConversations: 0, totalMessages: 0, avgMessagesPerConvo: 0, todayConversations: 0, activeUsers: 0, languageDistribution: [], weeklyTrend: [], conversations: [] });
    }
  };

  useEffect(() => {
    if (location.pathname.endsWith('/chatbot') && activeModule !== 'chatbot') {
      setActiveModule('chatbot');
    }
  }, [location.pathname, activeModule]);

  useEffect(() => {
    if (activeModule !== 'chatbot' || chatbotData) return;
    loadChatbotData();
  }, [activeModule, chatbotData]);

  useEffect(() => {
    const openConversationId = location.state?.openConversationId;
    if (activeModule !== 'chatbot' || !openConversationId || !chatbotData?.conversations?.length) return;
    if (openedConversationIdRef.current === openConversationId) return;

    const conv = chatbotData.conversations.find((conversation) => conversation.conversation_id === openConversationId);
    if (!conv) return;

    openedConversationIdRef.current = openConversationId;
    openConversation(conv);
  }, [activeModule, chatbotData, location.state]);

  const openConversation = async (conv) => {
    setViewingConversation(conv);
    setConvMessages([]);
    setConvMessagesLoading(true);
    try {
      const res = await api.get(`/admin/chatbot/conversations/${conv.conversation_id}/messages`);
      setConvMessages(res.data);
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setConvMessagesLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation permanently?')) return;
    try {
      await api.delete(`/admin/chatbot/conversations/${conversationId}`);
      setChatbotData((prev) => ({ ...prev, conversations: prev.conversations.filter((c) => c.conversation_id !== conversationId) }));
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const handleStartChatbotRetrain = async () => {
    setChatbotTrainingError('');
    setChatbotTrainingLoading(true);
    try {
      const response = await api.post('/admin/chatbot/retrain', {
        language: chatbotTrainingLanguage,
      });
      setChatbotTrainingJob(response.data?.job || null);
    } catch (error) {
      console.error('Failed to start chatbot retraining:', error);
      setChatbotTrainingError(error.response?.data?.error || error.message || 'Failed to start retraining');
    } finally {
      setChatbotTrainingLoading(false);
    }
  };

  useEffect(() => {
    if (!chatbotTrainingJob?.jobId || chatbotTrainingJob.status !== 'running') return undefined;

    const poller = setInterval(async () => {
      try {
        const response = await api.get(`/admin/chatbot/retrain/${chatbotTrainingJob.jobId}`);
        setChatbotTrainingJob(response.data);
        if (response.data?.status !== 'running') {
          setChatbotTrainingLoading(false);
          if (!response.data?.error) {
            setChatbotTrainingError('');
          }
          clearInterval(poller);
        }
      } catch (error) {
        console.error('Failed to poll chatbot retraining status:', error);
        setChatbotTrainingError(error.response?.data?.error || error.message || 'Failed to fetch training status');
      }
    }, 4000);

    return () => clearInterval(poller);
  }, [chatbotTrainingJob?.jobId, chatbotTrainingJob?.status]);

  const loadArchivedBookings = async () => {
    try {
      const response = await api.get('/admin/bookings/archived');
      setArchivedBookings(response.data);
    } catch (error) {
      console.error('Error loading archived bookings:', error);
    }
  };

  const loadArchivedHotels = async () => {
    try {
      const response = await api.get('/admin/hotels?archived=true');
      return response.data;
    } catch (error) {
      console.error('Error loading archived hotels:', error);
      return [];
    }
  };

  const loadArchivedItineraries = async () => {
    try {
      const response = await api.get('/admin/itineraries/archived');
      setArchivedItineraries(response.data);
    } catch (error) {
      console.error('Error loading archived itineraries:', error);
      setArchivedItineraries([]);
    }
  };

  const loadArchivedAttractions = async () => {
    try {
      const response = await api.get('/admin/attractions?archived=true');
      return response.data;
    } catch (error) {
      console.error('Error loading archived attractions:', error);
      return [];
    }
  };

  const handleItineraryView = async (itinerary) => {
    try {
      const response = await api.get(`/admin/itineraries/${itinerary.itinerary_id}`);
      setViewingItinerary(response.data);
      setEditingItinerary(null);
    } catch (error) {
      console.error('Error loading itinerary:', error);
      alert('Failed to load itinerary details.');
    }
  };

  const handleItineraryEdit = async (itinerary) => {
    try {
      const response = await api.get(`/admin/itineraries/${itinerary.itinerary_id}`);
      setEditingItinerary(response.data);
      setViewingItinerary(null);
      setItineraryForm({
        name: response.data.name || '',
        description: response.data.description || '',
        start_date: response.data.start_date ? response.data.start_date.split('T')[0] : '',
        end_date: response.data.end_date ? response.data.end_date.split('T')[0] : '',
        status: response.data.status || 'planning'
      });
    } catch (error) {
      console.error('Error loading itinerary:', error);
      alert('Failed to load itinerary details.');
    }
  };

  const handleItinerarySave = async () => {
    if (!editingItinerary) return;

    try {
      setItinerarySaving(true);
      await api.put(`/admin/itineraries/${editingItinerary.itinerary_id}`, itineraryForm);
      setEditingItinerary(null);
      setItineraryForm({ name: '', description: '', start_date: '', end_date: '', status: 'planning' });
      await loadItineraries();
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary.');
    } finally {
      setItinerarySaving(false);
    }
  };

  const handleItineraryDelete = async (itineraryId) => {
    const confirmed = window.confirm(t('confirm_delete_itinerary'));
    if (!confirmed) return;

    const key = `${itineraryId}:delete`;
    try {
      setActionLoading(setItineraryActionLoading, key, true);
      await api.delete(`/admin/itineraries/${itineraryId}`);
      await loadItineraries();
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      alert('Failed to delete itinerary.');
    } finally {
      setActionLoading(setItineraryActionLoading, key, false);
    }
  };

  const setActionLoading = (setter, key, isLoading) => {
    setter((prev) => ({ ...prev, [key]: isLoading }));
  };

  const handleUserRoleChange = async (userId, role) => {
    const key = `${userId}:role`;
    try {
      setActionLoading(setUserActionLoading, key, true);
      await api.put(`/admin/users/${userId}/role`, { role });
      await loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role.');
    } finally {
      setActionLoading(setUserActionLoading, key, false);
    }
  };

  const handleUserDelete = async (userId) => {
    const confirmed = window.confirm(t('confirm_delete_user'));
    if (!confirmed) return;

    const key = `${userId}:delete`;
    try {
      setActionLoading(setUserActionLoading, key, true);
      await api.delete(`/admin/users/${userId}`);
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user.');
    } finally {
      setActionLoading(setUserActionLoading, key, false);
    }
  };

  const handleBookingStatusChange = async (bookingId, status) => {
    const key = `${bookingId}:${status}`;
    try {
      setActionLoading(setBookingActionLoading, key, true);
      await api.put(`/admin/bookings/${bookingId}/status`, { status });
      await loadAdminData();
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status.');
    } finally {
      setActionLoading(setBookingActionLoading, key, false);
    }
  };

  const handleBookingDelete = async (bookingId) => {
    const confirmed = window.confirm(t('confirm_delete_booking'));
    if (!confirmed) return;

    const key = `${bookingId}:delete`;
    try {
      setActionLoading(setBookingActionLoading, key, true);
      await api.delete(`/admin/bookings/${bookingId}`);
      await loadAdminData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking.');
    } finally {
      setActionLoading(setBookingActionLoading, key, false);
    }
  };

  const buildMonthlyTotals = (rows, amountField) => {
    const totals = new Map();
    rows.forEach((row) => {
      const dateValue = row.booking_date || row.created_at || row.check_in_date;
      if (!dateValue) return;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = totals.get(monthKey) || { month: monthKey, count: 0, total: 0 };
      current.count += 1;
      if (amountField) {
        current.total += Number(row[amountField] || 0);
      }
      totals.set(monthKey, current);
    });
    return Array.from(totals.values()).sort((a, b) => a.month.localeCompare(b.month));
  };

  const buildDailyTotals = (rows, amountField) => {
    const totals = new Map();
    rows.forEach((row) => {
      const dateValue = row.booking_date || row.created_at || row.check_in_date;
      if (!dateValue) return;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      const dayKey = date.toISOString().split('T')[0];
      const current = totals.get(dayKey) || { day: dayKey, count: 0, total: 0 };
      current.count += 1;
      if (amountField) {
        current.total += Number(row[amountField] || 0);
      }
      totals.set(dayKey, current);
    });
    return Array.from(totals.values()).sort((a, b) => a.day.localeCompare(b.day));
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((key) => JSON.stringify(row[key] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    try {
      console.log('🔓 Logout initiated from AdminDashboard...');
      await logout();
      console.log('✅ Logout completed, redirecting to login...');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('❌ Logout error:', error);
      navigate('/login', { replace: true });
    }
  };

  const modules = [
    { id: 'overview', label: 'Overview', icon: <Icons.ChartPie size={22} /> },
    { id: 'users', label: 'Users', icon: <Icons.User size={22} /> },
    { id: 'bookings', label: 'Bookings', icon: <Icons.Calendar size={22} /> },
    { id: 'hotels', label: 'Hotels', icon: <Icons.Hotel size={22} /> },
    { id: 'itineraries', label: 'Itineraries', icon: <Icons.Route size={22} /> },
    { id: 'attractions', label: 'Attractions', icon: <Icons.Attraction size={22} /> },
    { id: 'maps', label: 'Maps', icon: <Icons.Map size={22} /> },
    { id: 'hero', label: 'Customization', icon: <Icons.Sun size={22} /> },
    { id: 'chatbot', label: 'Chatbot', icon: <Icons.Chat size={22} /> },
    { id: 'moderation', label: 'Moderation', icon: <Icons.Chat size={22} /> },
    { id: 'reports', label: 'Reports', icon: <Icons.ChartLineUp size={22} /> },
    { id: 'archive', label: 'Archive', icon: <Icons.Archive size={22} /> },
  ];

  const filteredHotels = hotels.filter((hotel) => {
    const query = hotelSearch.trim().toLowerCase();
    if (!query) return true;
    const ownerText = `${hotel.owner_names || ''} ${hotel.owner_emails || ''}`;
    return `${hotel.name || ''} ${hotel.location || ''} ${ownerText}`.toLowerCase().includes(query);
  });

  const filteredBookings = bookings.filter((booking) => {
    const query = bookingSearch.trim().toLowerCase();
    const statusMatch = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
    if (!statusMatch) return false;
    if (!query) return true;
    const dateText = `${booking.check_in || ''} ${booking.check_out || ''}`;
    return `${booking.booking_id} ${booking.hotel_name || ''} ${booking.username || ''} ${booking.email || ''} ${dateText}`
      .toLowerCase()
      .includes(query);
  });

  const filteredAttractions = attractions.filter((attraction) => {
    const query = attractionSearch.trim().toLowerCase();
    if (!query) return true;
    return `${attraction.name || ''} ${attraction.location || ''} ${attraction.description || ''}`
      .toLowerCase()
      .includes(query);
  });

  const filteredItineraries = itineraries.filter((itinerary) => {
    const query = itinerarySearch.trim().toLowerCase();
    if (!query) return true;
    return `${itinerary.name || ''} ${itinerary.description || ''} ${itinerary.status || ''} ${itinerary.username || ''} ${itinerary.email || ''} ${itinerary.first_name || ''} ${itinerary.last_name || ''}`
      .toLowerCase()
      .includes(query);
  });

  const ownerOptions = users.filter((optionUser) => ['owner', 'admin'].includes(optionUser.role));

  if (loading) {
    return (
      <div className="gov-splash-screen">
        <div className="gov-splash-inner">
          <div className="gov-splash-logo">
            <img src={naujanGoLogo} alt="NaujanGO" style={{ width: '72px', height: '72px', borderRadius: '18px', objectFit: 'cover', boxShadow: '0 8px 32px rgba(46,125,50,0.3)' }} />
          </div>
          <div className="gov-splash-title">{t('brand')}</div>
          <div className="gov-splash-subtitle">{t('admin_portal')}</div>
          <div className="gov-splash-bar-wrap">
            <div className="gov-splash-bar" />
          </div>
          <div className="gov-splash-skeleton">
            <div className="gov-splash-skel-sidebar">
              {[40,60,50,70,45,55,65].map((w, i) => (
                <div key={i} className="gov-skel-line" style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
            <div className="gov-splash-skel-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[0,1,2,3].map((i) => (
                  <div key={i} className="gov-skel-card" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              {[80,65,75].map((w, i) => (
                <div key={i} className="gov-skel-line" style={{ width: `${w}%`, height: '14px', marginBottom: '0.75rem', animationDelay: `${i * 0.12}s` }} />
              ))}
            </div>
          </div>
          <div className="gov-splash-dots"><span /><span /><span /></div>
          <div className="gov-splash-hint">{t('initializing')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gov-dashboard gov-dashboard--admin">
      <div className="gov-shell">
        <aside className="gov-sidebar">
          {/* Sidebar Brand */}
          <div className="gov-sidebar-brand">
            <Link to="/admin" className="gov-brand">
              <img
                className="gov-logo-image"
                src={naujanGoLogo}
                alt="NaujanGo logo"
              />
              <div>
                <div className="gov-brand__title">{t('municipality_naujan')}</div>
                <div className="gov-brand__subtitle">{t('tourism_hospitality')}</div>
              </div>
            </Link>
          </div>
          {/* Sidebar User Info */}
          <div className="gov-sidebar-user">
            <div className="gov-user__info">
              <div className="gov-user__name">{user?.first_name || user?.username}</div>
              <div className="gov-user__role">{t('administrator')}</div>
            </div>
            <button className="gov-logout" onClick={handleLogout}>
              {t('logout')}
            </button>
          </div>
          <nav className="gov-nav">
            {modules.map((mod, i) => (
              <button
                key={mod.id}
                style={{ '--i': i }}
                className={`gov-nav-btn${activeModule === mod.id ? ' is-active' : ''}`}
                onClick={() => {
                  setActiveModule(mod.id);
                  if (mod.id === 'users') loadUsers();
                  if (mod.id === 'hotels') { loadHotels(); loadUsers(); }
                  if (mod.id === 'itineraries') { loadItineraries(); loadItineraryTemplates(); }
                  if (mod.id === 'attractions') loadAttractions();
                  if (mod.id === 'maps') { loadHotels(); loadAttractions(); }
                  if (mod.id === 'about') loadCustomizationSettings();
                  if (mod.id === 'hero') loadCustomizationSettings();
                  if (mod.id === 'chatbot') loadChatbotData();
                  if (mod.id === 'moderation') navigate('/admin/moderation');
                  if (mod.id === 'archive') { loadArchivedBookings(); loadArchivedItineraries(); }
                }}
              >
                <span className="gov-nav-btn__icon">{mod.icon}</span>
                <span className="gov-nav-btn__label">{mod.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="gov-main">
          {/* Overview — loading / error fallback */}
          {activeModule === 'overview' && !stats && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
              <div className="gov-loader" />
              <p style={{ color: '#6b7280', fontWeight: 600 }}>{t('loading_overview')}</p>
              <button className="gov-btn gov-btn--primary" style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}
                onClick={loadAdminData}>{t('retry')}</button>
            </div>
          )}
          {/* Overview */}
          {activeModule === 'overview' && stats && (() => {
            const total = stats.bookingStats?.total_bookings || 0;
            const confirmed = stats.bookingStats?.confirmed || 0;
            const pending = stats.bookingStats?.pending || 0;
            const cancelled = stats.bookingStats?.cancelled || 0;
            const confPct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
            const pendPct = total > 0 ? Math.round((pending / total) * 100) : 0;
            const cancPct = total > 0 ? Math.round((cancelled / total) * 100) : 0;
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            return (
              <div>
                {/* Page Header */}
                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{today}</p>
                  <h1 style={{ margin: '0.25rem 0 0.35rem', fontSize: '1.8rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                    Welcome back, {user?.first_name || user?.username}
                  </h1>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>{t('dashboard_snapshot')}</p>
                </div>

                {/* Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: t('admin_stat_users'), value: stats.totals?.users ?? 0, accent: '#16a34a', sub: t('all_roles') || 'All roles' },
                    { label: t('admin_stat_hotels'), value: stats.totals?.hotels ?? 0, accent: '#2563eb', sub: t('active_properties') || 'Active properties' },
                    { label: t('admin_stat_bookings'), value: stats.totals?.bookings ?? 0, accent: '#7c3aed', sub: `${confirmed} ${t('confirmed') || 'confirmed'}` },
                    { label: t('admin_stat_attractions'), value: stats.totals?.attractions ?? 0, accent: '#d97706', sub: t('registered_sites') || 'Registered sites' },
                  ].map(({ label, value, accent, sub }) => (
                    <div key={label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderTop: `3px solid ${accent}`, borderRadius: '10px', padding: '1.25rem 1.5rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', lineHeight: 1, marginBottom: '0.35rem' }}>{value.toLocaleString()}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>{label}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.2rem' }}>{sub}</div>
                    </div>
                  ))}
                </div>

                {/* Second Row: Booking Breakdown + Recent Users */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>

                  {/* Booking Status */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
                      <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{t('booking_breakdown')}</h2>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{total.toLocaleString()} total</span>
                    </div>
                    {/* Progress bar */}
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

                  {/* Role Distribution */}
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>User Roles</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(stats.roleDistribution || []).map((row) => {
                        const roleTotal = stats.totals?.users || 1;
                        const pct = Math.round((row.count / roleTotal) * 100);
                        const roleColors = { admin: '#7c3aed', owner: '#2563eb', user: '#16a34a' };
                        const c = roleColors[row.role] || '#6b7280';
                        return (
                          <div key={row.role}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>{t(`${row.role}_role`) || row.role}</span>
                              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{row.count} · {pct}%</span>
                            </div>
                            <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: c, borderRadius: 99, transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{t('recent_registrations')}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                        {(stats.recentUsers || []).slice(0, 5).map((u) => (
                          <span key={u.user_id} style={{ fontSize: '0.75rem', background: '#f3f4f6', color: '#374151', borderRadius: 99, padding: '0.2rem 0.65rem', fontWeight: 600 }}>
                            {u.first_name || u.username}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>{t('recent_bookings')}</h2>
                    <button className="gov-btn gov-btn-ghost" style={{ fontSize: '0.8rem', padding: '0.3rem 0.9rem' }}
                      onClick={() => setActiveModule('bookings')}>{t('view_all')}</button>
                  </div>
                  <div className="gov-table-wrap">
                    <table className="gov-table" style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th style={{ width: 70 }}>{t('id')}</th>
                          <th>{t('hotel')}</th>
                          <th>{t('guest')}</th>
                          <th>{t('check_in')}</th>
                          <th style={{ width: 110 }}>{t('status')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 8).map((booking) => (
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
                        {bookings.length === 0 && (
                          <tr><td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>{t('no_bookings_yet')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Users */}
          {activeModule === 'users' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.User size={32} style={{ verticalAlign: 'middle' }} /> {t('user_management')}
              </h1>
              {editingUser && (
                <div
                  style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
                  onClick={(e) => { if (e.target === e.currentTarget) setEditingUser(null); }}
                >
                  <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'580px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>
                    {/* Header */}
                    <div style={{ background:'linear-gradient(135deg,#1565c0 0%,#42a5f5 100%)', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.5rem', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                        {/* Avatar */}
                        <div style={{ position:'relative', flexShrink:0 }}>
                          {editingUser.profile_picture ? (
                            <img
                              src={editingUser.profile_picture}
                              alt={editingUser.username}
                              style={{ width:'60px', height:'60px', borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,255,255,0.5)' }}
                              onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                            />
                          ) : null}
                          <div style={{
                            width:'60px', height:'60px', borderRadius:'50%',
                            background:'rgba(255,255,255,0.25)', border:'3px solid rgba(255,255,255,0.5)',
                            color:'#fff', fontWeight:800, fontSize:'1.4rem',
                            display: editingUser.profile_picture ? 'none' : 'flex',
                            alignItems:'center', justifyContent:'center', textTransform:'uppercase'
                          }}>
                            {((editingUser.first_name?.[0] || '') + (editingUser.last_name?.[0] || '')) || editingUser.username?.[0] || '?'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize:'0.72rem', fontWeight:700, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>Editing User</div>
                          <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{editingUser.username}</div>
                          <div style={{ fontSize:'0.82rem', opacity:0.8, marginTop:'2px' }}>{editingUser.email}</div>
                          <div style={{ fontSize:'0.75rem', opacity:0.7, marginTop:'2px', textTransform:'capitalize' }}>
                            {t('role')}: {t(`${editingUser.role}_role`) || editingUser.role} &nbsp;·&nbsp; Joined {editingUser.created_at ? new Date(editingUser.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setEditingUser(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'#fff', fontSize:'1.1rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                    </div>
                    {/* Body */}
                    <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                      {/* Identity */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>{t('identity')}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('username')}</span>
                            <input type="text" value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Email</span>
                            <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('first_name')}</span>
                            <input type="text" value={userForm.first_name} onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('last_name')}</span>
                            <input type="text" value={userForm.last_name} onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Phone</span>
                            <input type="text" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                        </div>
                      </div>
                      {/* Role */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>{t('role_access')}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('role')}</span>
                            <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="gov-input" style={{ borderRadius:'8px', cursor:'pointer' }}>
                              <option value="user">{t('user_role')}</option>
                              <option value="owner">{t('owner_role')}</option>
                              <option value="admin">{t('admin_role')}</option>
                              <option value="agent">{t('agent_role') || 'Agent'}</option>
                            </select>
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>{t('new_password_optional')} <span style={{ color:'#9ca3af', fontWeight:400 }}>({t('optional')})</span></span>
                            <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder={t('leave_blank_keep')} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                        </div>
                      </div>
                    </div>
                    {/* Footer */}
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', justifyContent:'flex-end', background:'#f9fafb', borderRadius:'0 0 16px 16px' }}>
                      <button className="gov-btn gov-btn-ghost" onClick={() => setEditingUser(null)}>{t('cancel')}</button>
                      <button className="gov-btn gov-btn-primary" onClick={handleUserSave} disabled={userSaving} style={{ minWidth:'130px' }}>
                        {userSaving ? t('saving') : t('button_save')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="gov-glass-panel">
                <div className="gov-table-wrap">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th style={{ width: '44px' }}></th>
                        <th>User</th>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Joined</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.slice((usersPage - 1) * ADMIN_TABLE_SIZE, usersPage * ADMIN_TABLE_SIZE).map((user) => {
                        const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')) || user.username?.[0] || '?';
                        const roleColors = { admin: '#d32f2f', owner: '#1565c0', user: '#2e7d32' };
                        return (
                          <tr key={user.user_id}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              {user.profile_picture ? (
                                <img
                                  src={user.profile_picture}
                                  alt={user.username}
                                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', display: 'block' }}
                                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                              ) : null}
                              <div
                                style={{
                                  width: '38px', height: '38px', borderRadius: '50%',
                                  background: `linear-gradient(135deg, ${roleColors[user.role] || '#1565c0'}, ${roleColors[user.role] || '#42a5f5'}88)`,
                                  color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                                  display: user.profile_picture ? 'none' : 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  border: '2px solid #e5e7eb', flexShrink: 0, textTransform: 'uppercase'
                                }}
                              >
                                {initials.toUpperCase()}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>#{user.user_id} {user.username}</div>
                              {user.phone && <div style={{ fontSize: '0.77rem', color: '#718096' }}>{user.phone}</div>}
                            </td>
                            <td style={{ fontSize: '0.88rem' }}>{user.email}</td>
                            <td style={{ fontSize: '0.88rem', color: '#374151' }}>
                              {[user.first_name, user.last_name].filter(Boolean).join(' ') || <span style={{ color: '#9ca3af' }}>—</span>}
                            </td>
                            <td style={{ fontSize: '0.82rem', color: '#718096', whiteSpace: 'nowrap' }}>
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td>
                              <select
                                value={user.role}
                                onChange={(e) => handleUserRoleChange(user.user_id, e.target.value)}
                                disabled={userActionLoading[`${user.user_id}:role`]}
                                className="gov-role-select"
                              >
                                <option value="user">USER</option>
                                <option value="owner">OWNER</option>
                                <option value="admin">ADMIN</option>
                                <option value="agent">AGENT</option>
                              </select>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="gov-btn gov-btn-danger"
                                  onClick={() => handleUserDelete(user.user_id)}
                                  disabled={userActionLoading[`${user.user_id}:delete`]}
                                >
                                  {userActionLoading[`${user.user_id}:delete`] ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                  className="gov-btn gov-btn-primary"
                                  onClick={() => startUserEdit(user)}
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={usersPage} totalPages={Math.ceil(users.length / ADMIN_TABLE_SIZE)} onPageChange={setUsersPage} totalItems={users.length} pageSize={ADMIN_TABLE_SIZE} label="users" />
                {users.length === 0 && (
                  <div className="gov-empty">
                    <p>{t('msg_no_users')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bookings */}
          {activeModule === 'bookings' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Calendar size={32} style={{ verticalAlign: 'middle' }} /> {t('all_bookings')}
              </h1>
              <div className="gov-glass-panel">
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Search bookings by hotel, guest, or ID..."
                    className="gov-input" style={{ flex: '1 1 280px' }}
                  />
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                    className="gov-select" style={{ minWidth: '200px' }}
                  >
                    <option value="all">{t('all_statuses')}</option>
                    <option value="confirmed">{t('confirmed')}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                  </select>
                </div>
                <div className="gov-table-wrap">
                  <table className="gov-table">
                    <thead>
                      <tr>
                        <th>{t('id')}</th>
                        <th>{t('hotel')}</th>
                        <th>Room Type</th>
                        <th>{t('guest')}</th>
                        <th>{t('dates')}</th>
                        <th>{t('amount')}</th>
                        <th>{t('status')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.slice((bookingsPage - 1) * ADMIN_TABLE_SIZE, bookingsPage * ADMIN_TABLE_SIZE).map((booking) => (
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
                              <span style={{ color: '#9ca3af' }}>-</span>
                            )}
                          </td>
                          <td>{booking.username}</td>
                          <td>
                            {new Date(booking.check_in).toLocaleDateString()} → {new Date(booking.check_out).toLocaleDateString()}
                          </td>
                          <td>
                            ₱{parseFloat(booking.total_amount || 0).toLocaleString()}
                          </td>
                          <td>
                            <span className={`gov-badge-status gov-badge-status--${booking.status}`}>
                              {t(booking.status) || booking.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {booking.status === 'pending' && (
                                <>
                                  <button
                                    className="gov-btn gov-btn-primary"
                                    onClick={() => handleBookingStatusChange(booking.booking_id, 'confirmed')}
                                    disabled={bookingActionLoading[`${booking.booking_id}:confirmed`]}
                                  >
                                    {bookingActionLoading[`${booking.booking_id}:confirmed`] ? t('saving') : t('confirm_action')}
                                  </button>
                                  <button
                                    className="gov-btn gov-btn-danger"
                                    onClick={() => handleBookingStatusChange(booking.booking_id, 'cancelled')}
                                    disabled={bookingActionLoading[`${booking.booking_id}:cancelled`]}
                                  >
                                    {bookingActionLoading[`${booking.booking_id}:cancelled`] ? 'Saving...' : 'Cancel'}
                                  </button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <button
                                  className="gov-btn gov-btn-warning"
                                  onClick={() => handleBookingStatusChange(booking.booking_id, 'cancelled')}
                                  disabled={bookingActionLoading[`${booking.booking_id}:cancelled`]}
                                >
                                  {bookingActionLoading[`${booking.booking_id}:cancelled`] ? t('saving') : t('cancel')}
                                </button>
                              )}
                              <button
                                className="gov-btn gov-btn-warning"
                                onClick={() => handleBookingDelete(booking.booking_id)}
                                disabled={bookingActionLoading[`${booking.booking_id}:delete`]}
                              >
                                {bookingActionLoading[`${booking.booking_id}:delete`] ? 'Archiving...' : 'Archive'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={bookingsPage} totalPages={Math.ceil(filteredBookings.length / ADMIN_TABLE_SIZE)} onPageChange={setBookingsPage} totalItems={filteredBookings.length} pageSize={ADMIN_TABLE_SIZE} label="bookings" />
                {filteredBookings.length === 0 && (
                  <div className="gov-empty">
                    <p>{t('msg_no_bookings')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hotels */}
          {activeModule === 'hotels' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Hotel size={32} style={{ verticalAlign: 'middle' }} /> {t('hotel_management')}
              </h1>

              <div className="gov-glass-panel" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={hotelSearch}
                    onChange={(e) => setHotelSearch(e.target.value)}
                    placeholder="Search hotels or owners..."
                    style={{
                      flex: '1 1 300px',
                      padding: '0.75rem 1rem',
                      border: '1px solid #c8e6c9',
                      borderRadius: '8px',
                      fontSize: '0.95rem'
                    }}
                  />
                  <div style={{ fontSize: '0.9rem', color: '#718096', fontWeight: 700 }}>
                    Showing {filteredHotels.length} hotels
                  </div>
                  <button
                    onClick={startHotelCreate}
                    className="gov-btn gov-btn-primary"
                  >
                    Add Hotel
                  </button>
                </div>
              </div>

              {(editingHotel || creatingHotel) && (
                <div
                  style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
                  onClick={(e) => { if (e.target === e.currentTarget) { setEditingHotel(null); setCreatingHotel(false); setHotelForm(emptyHotelForm); } }}
                >
                  <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'660px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>
                    {/* Header */}
                    <div style={{ background:'linear-gradient(135deg,#2E7D32 0%,#66bb6a 100%)', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.5rem', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>{creatingHotel ? 'New Hotel' : 'Editing Hotel'}</div>
                        <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{creatingHotel ? t('admin_add_new_hotel_btn') : editingHotel.name}</div>
                        {editingHotel && <div style={{ fontSize:'0.82rem', opacity:0.8, marginTop:'2px' }}>{editingHotel.location}</div>}
                      </div>
                      <button onClick={() => { setEditingHotel(null); setCreatingHotel(false); setHotelForm(emptyHotelForm); }} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'#fff', fontSize:'1.1rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                    </div>
                    {/* Image preview */}
                    {hotelForm.image_url && (
                      <div style={{ height:'140px', background:`url(${hotelForm.image_url}) center/cover no-repeat`, borderBottom:'1px solid #e5e7eb' }} />
                    )}
                    {/* Body */}
                    <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                      {/* Basic Info */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Basic Info</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Hotel Name</span>
                            <input type="text" value={hotelForm.name} onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Location</span>
                            <input type="text" value={hotelForm.location} onChange={(e) => setHotelForm({ ...hotelForm, location: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <div style={{ gridColumn:'1 / -1', padding:'0.75rem 1rem', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'8px', fontSize:'0.8rem', color:'#92400e' }}>
                            💡 <strong>Room Pricing:</strong> Set per-room-type prices in the rooms manager, not at the hotel level.
                          </div>
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
                            <input type="text" value={hotelForm.amenities} onChange={(e) => setHotelForm({ ...hotelForm, amenities: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="WiFi, Pool, Parking..." />
                          </label>
                        </div>
                      </div>
                      {/* Contact */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>{t('contact')}</div>
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
                      {/* Media */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Media &amp; Links</div>
                        <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Image URL</span>
                            <input type="text" value={hotelForm.image_url} onChange={(e) => setHotelForm({ ...hotelForm, image_url: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="https://..." />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Map URL</span>
                            <input type="text" value={hotelForm.map_url} onChange={(e) => setHotelForm({ ...hotelForm, map_url: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="https://maps.google.com/..." />
                          </label>
                        </div>
                      </div>
                      {/* Settings */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>{t('settings')}</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Status</span>
                            <select value={hotelForm.is_active} onChange={(e) => setHotelForm({ ...hotelForm, is_active: Number(e.target.value) })} className="gov-input" style={{ borderRadius:'8px', cursor:'pointer' }}>
                              <option value={1}>Active</option>
                              <option value={0}>Inactive</option>
                            </select>
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Currency</span>
                            <input type="text" value={hotelForm.currency} onChange={(e) => setHotelForm({ ...hotelForm, currency: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          {editingHotel && (
                            <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                              <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Assign Owner</span>
                              <div style={{ display:'flex', gap:'0.5rem' }}>
                                <select
                                  value={ownerAssignments[editingHotel.hotel_id] ?? ''}
                                  onChange={(e) => setOwnerAssignments((prev) => ({ ...prev, [editingHotel.hotel_id]: e.target.value }))}
                                  className="gov-input" style={{ borderRadius:'8px', cursor:'pointer', flex:1 }}
                                >
                                  <option value="">Select owner</option>
                                  {ownerOptions.map((optionUser) => (
                                    <option key={optionUser.user_id} value={optionUser.user_id}>
                                      {optionUser.first_name || optionUser.last_name ? `${optionUser.first_name || ''} ${optionUser.last_name || ''}`.trim() : optionUser.username} ({optionUser.email})
                                    </option>
                                  ))}
                                </select>
                                <button onClick={() => handleHotelOwnerAssign(editingHotel.hotel_id)} disabled={ownerAssigning[editingHotel.hotel_id] || !ownerAssignments[editingHotel.hotel_id]} className="gov-btn gov-btn-primary" style={{ whiteSpace:'nowrap' }}>
                                  {ownerAssigning[editingHotel.hotel_id] ? t('saving') : t('assign')}
                                </button>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Footer */}
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', justifyContent:'flex-end', background:'#f9fafb', borderRadius:'0 0 16px 16px' }}>
                      <button className="gov-btn gov-btn-ghost" onClick={() => { setEditingHotel(null); setCreatingHotel(false); setHotelForm(emptyHotelForm); }}>{t('cancel')}</button>
                      <button onClick={creatingHotel ? handleHotelCreate : handleHotelSave} disabled={hotelSaving} className="gov-btn gov-btn-primary" style={{ minWidth:'140px' }}>
                        {hotelSaving ? t('saving') : creatingHotel ? t('create_hotel') : t('button_save')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="gov-glass-panel">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {filteredHotels.slice((hotelsPage - 1) * ADMIN_CARD_SIZE, hotelsPage * ADMIN_CARD_SIZE).map((hotel) => {
                    const hotelImage = hotel.image_url || (Array.isArray(hotel.image_urls) ? hotel.image_urls[0] : null);
                    const selectedOwnerId = ownerAssignments[hotel.hotel_id]
                      ?? (hotel.owner_ids && hotel.owner_ids.length > 0 ? String(hotel.owner_ids[0]) : '');
                    const selectedOwner = selectedOwnerId
                      ? ownerOptions.find((optionUser) => String(optionUser.user_id) === String(selectedOwnerId))
                      : null;
                    const selectedOwnerLabel = selectedOwner
                      ? ((selectedOwner.first_name || selectedOwner.last_name)
                        ? `${selectedOwner.first_name || ''} ${selectedOwner.last_name || ''}`.trim()
                        : (selectedOwner.username || selectedOwner.email || '')
                      )
                      : '';
                    const ownerLabel = selectedOwnerLabel
                      || (hotel.owner_names || '').trim()
                      || (hotel.owner_emails || '').trim()
                      || 'Unassigned';
                    return (
                      <div
                        key={hotel.hotel_id}
                        className="gov-glass-panel" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}
                      >
                        <div style={{
                          height: '160px',
                          background: hotelImage
                            ? `url(${hotelImage}) center/cover no-repeat`
                            : 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '3.2rem',
                          color: 'white'
                        }}>

                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                            {hotel.name}
                          </h3>
                          <p style={{ margin: '0 0 0.75rem 0', color: '#718096', fontSize: '0.9rem' }}>
                            {hotel.location}
                          </p>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                            Owner: {ownerLabel}
                          </div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                          }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                              ₱{parseFloat(hotel.price_per_night || 0).toLocaleString()}
                            </div>
                            <span className={`gov-badge-status gov-badge-status--${hotel.is_active ? 'active' : 'inactive'}`}>
                              {hotel.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <button
                              onClick={() => startHotelEdit(hotel)}
                              className="gov-btn gov-btn-primary" style={{ flex: 1 }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleHotelStatusToggle(hotel)}
                              className="gov-btn gov-btn-warning" style={{ flex: 1 }}
                            >
                              {hotel.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleHotelDelete(hotel)}
                              className="gov-btn gov-btn-warning" style={{ flex: 1 }}
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination page={hotelsPage} totalPages={Math.ceil(filteredHotels.length / ADMIN_CARD_SIZE)} onPageChange={setHotelsPage} totalItems={filteredHotels.length} pageSize={ADMIN_CARD_SIZE} label="hotels" />
                {filteredHotels.length === 0 && (
                  <div className="gov-empty">
                    <p>{t('msg_no_hotels')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Itineraries */}
          {activeModule === 'itineraries' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Route size={32} style={{ verticalAlign: 'middle' }} /> Itinerary Builder Management
              </h1>

              <div className="gov-glass-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={itinerarySearch}
                  onChange={(e) => setItinerarySearch(e.target.value)}
                  placeholder="Search by name, status, or username..."
                  className="gov-input" style={{ flex: '1 1 280px' }}
                />
              </div>

              {editingItinerary && (
                <div
                  style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
                  onClick={(e) => { if (e.target === e.currentTarget) setEditingItinerary(null); }}
                >
                  <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'600px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>
                    {/* Header */}
                    <div style={{ background:'linear-gradient(135deg,#1a7a4a 0%,#2ecc71 100%)', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.5rem', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>Editing Itinerary</div>
                        <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{editingItinerary.name || 'Untitled'}</div>
                        {editingItinerary.username && (
                          <div style={{ fontSize:'0.82rem', opacity:0.8, marginTop:'2px' }}>
                            Owner: {editingItinerary.first_name || editingItinerary.last_name ? `${editingItinerary.first_name || ''} ${editingItinerary.last_name || ''}`.trim() : editingItinerary.username} &nbsp;·&nbsp; {editingItinerary.email}
                          </div>
                        )}
                      </div>
                      <button onClick={() => setEditingItinerary(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'#fff', fontSize:'1.1rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                    </div>
                    {/* Body */}
                    <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                      {/* Details */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Details</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Itinerary Name</span>
                            <input type="text" value={itineraryForm.name} onChange={(e) => setItineraryForm({ ...itineraryForm, name: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Status</span>
                            <select value={itineraryForm.status} onChange={(e) => setItineraryForm({ ...itineraryForm, status: e.target.value })} className="gov-input" style={{ borderRadius:'8px', cursor:'pointer' }}>
                              <option value="planning">Planning</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </label>
                          <div />
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Start Date</span>
                            <input type="date" value={itineraryForm.start_date} onChange={(e) => setItineraryForm({ ...itineraryForm, start_date: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>End Date</span>
                            <input type="date" value={itineraryForm.end_date} onChange={(e) => setItineraryForm({ ...itineraryForm, end_date: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Description</span>
                            <textarea value={itineraryForm.description} onChange={(e) => setItineraryForm({ ...itineraryForm, description: e.target.value })} rows={3} className="gov-input" style={{ borderRadius:'8px', resize:'vertical' }} />
                          </label>
                        </div>
                      </div>
                      {/* Stops preview */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Stops Preview</div>
                        {editingItinerary.items && editingItinerary.items.length > 0 ? (
                          <div style={{ display:'flex', flexDirection:'column', gap:'0.45rem' }}>
                            {editingItinerary.items.map((item, idx) => (
                              <div key={idx} style={{ display:'flex', alignItems:'center', gap:'0.65rem', padding:'0.6rem 0.85rem', background:'#f0faf4', border:'1px solid #d1fae5', borderRadius:'8px' }}>
                                <span style={{ width:'22px', height:'22px', borderRadius:'50%', background:'linear-gradient(135deg,#1a7a4a,#2ecc71)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.68rem', fontWeight:800, flexShrink:0 }}>{idx + 1}</span>
                                <span style={{ fontSize:'0.875rem', fontWeight:600, color:'#1a202c' }}>{item.attraction_name || item.custom_name || 'Unnamed Stop'}</span>
                                {item.attraction_location && <span style={{ fontSize:'0.78rem', color:'#6b7280', marginLeft:'auto' }}>{item.attraction_location}</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding:'1rem', background:'#f9fafb', borderRadius:'8px', border:'1px dashed #d1d5db', color:'#9ca3af', fontSize:'0.875rem', textAlign:'center' }}>No stops added yet</div>
                        )}
                      </div>
                    </div>
                    {/* Footer */}
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', justifyContent:'flex-end', background:'#f9fafb', borderRadius:'0 0 16px 16px' }}>
                      <button className="gov-btn gov-btn-ghost" onClick={() => setEditingItinerary(null)}>{t('cancel')}</button>
                      <button onClick={handleItinerarySave} disabled={itinerarySaving} className="gov-btn gov-btn-primary" style={{ minWidth:'140px' }}>
                        {itinerarySaving ? t('saving') : t('button_save')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Itinerary View Modal */}
              {viewingItinerary && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.55)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem'
                  }}
                  onClick={(e) => { if (e.target === e.currentTarget) setViewingItinerary(null); }}
                >
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      width: '100%',
                      maxWidth: '700px',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Modal Header */}
                    <div style={{
                      background: 'linear-gradient(135deg, #1a7a4a 0%, #2ecc71 100%)',
                      borderRadius: '16px 16px 0 0',
                      padding: '1.5rem',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                          <Icons.Route size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                          Itinerary Details
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, wordBreak: 'break-word' }}>
                          {viewingItinerary.name || 'Untitled Itinerary'}
                        </h2>
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{
                            display: 'inline-block',
                            background: 'rgba(255,255,255,0.25)',
                            borderRadius: '20px',
                            padding: '0.2rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                            letterSpacing: '0.04em'
                          }}>
                            {viewingItinerary.status || 'planning'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingItinerary(null)}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '34px',
                          height: '34px',
                          cursor: 'pointer',
                          color: '#fff',
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Owner Info */}
                    <div style={{
                      padding: '1rem 1.5rem',
                      background: '#f0faf4',
                      borderBottom: '1px solid #d1fae5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1a7a4a, #2ecc71)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {(viewingItinerary.first_name || viewingItinerary.username || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Owner
                        </div>
                        <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.95rem' }}>
                          {viewingItinerary.first_name || viewingItinerary.last_name
                            ? `${viewingItinerary.first_name || ''} ${viewingItinerary.last_name || ''}`.trim()
                            : viewingItinerary.username}
                          {viewingItinerary.first_name && (
                            <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '6px' }}>
                              (@{viewingItinerary.username})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '1px' }}>
                          {viewingItinerary.email}
                        </div>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
                      gap: '0',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      {[
                        { label: 'Distance', value: `${viewingItinerary.total_distance || 0} km` },
                        { label: 'Duration', value: `${viewingItinerary.total_time || 0} min` },
                        { label: 'Budget', value: `₱${(parseFloat(viewingItinerary.total_budget) || 0).toFixed(2)}` },
                        { label: 'Stops', value: viewingItinerary.items ? viewingItinerary.items.length : 0 }
                      ].map((stat, i) => (
                        <div key={i} style={{
                          padding: '1rem',
                          textAlign: 'center',
                          borderRight: i < 3 ? '1px solid #e5e7eb' : 'none'
                        }}>
                          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1a7a4a' }}>{stat.value}</div>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '2px' }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                      {/* Date range */}
                      {(viewingItinerary.start_date || viewingItinerary.end_date) && (
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {viewingItinerary.start_date && (
                            <div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '0.6rem 1rem' }}>
                              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</div>
                              <div style={{ fontWeight: 700, color: '#1a202c', marginTop: '2px' }}>
                                {new Date(viewingItinerary.start_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          )}
                          {viewingItinerary.end_date && (
                            <div style={{ background: '#f3f4f6', borderRadius: '8px', padding: '0.6rem 1rem' }}>
                              <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</div>
                              <div style={{ fontWeight: 700, color: '#1a202c', marginTop: '2px' }}>
                                {new Date(viewingItinerary.end_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {viewingItinerary.description && (
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Description</div>
                          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6, fontSize: '0.92rem' }}>
                            {viewingItinerary.description}
                          </p>
                        </div>
                      )}

                      {/* Itinerary Items */}
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
                          Stops / Attractions
                        </div>
                        {viewingItinerary.items && viewingItinerary.items.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {viewingItinerary.items.map((item, idx) => (
                              <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.75rem',
                                background: '#f8fdf7',
                                border: '1px solid #d1fae5',
                                borderRadius: '10px',
                                padding: '0.75rem 1rem'
                              }}>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #1a7a4a, #2ecc71)',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  flexShrink: 0
                                }}>
                                  {idx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '0.9rem' }}>
                                    {item.attraction_name || item.custom_name || 'Unnamed Stop'}
                                  </div>
                                  {item.attraction_location && (
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                                      {item.attraction_location}
                                    </div>
                                  )}
                                  {(item.visit_duration || item.estimated_cost) && (
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '4px', flexWrap: 'wrap' }}>
                                      {item.visit_duration && (
                                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                                          {item.visit_duration} min
                                        </span>
                                      )}
                                      {item.estimated_cost && (
                                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                                          ₱{parseFloat(item.estimated_cost).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                                      {item.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{
                            textAlign: 'center',
                            padding: '2rem',
                            color: '#9ca3af',
                            background: '#f9fafb',
                            borderRadius: '10px',
                            border: '1px dashed #d1d5db',
                            fontSize: '0.875rem'
                          }}>
                            No stops have been added to this itinerary yet.
                          </div>
                        )}
                      </div>

                      {/* Created at */}
                      {viewingItinerary.created_at && (
                        <div style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'right' }}>
                          Created: {new Date(viewingItinerary.created_at).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: '1rem 1.5rem',
                      borderTop: '1px solid #e5e7eb',
                      display: 'flex',
                      gap: '0.75rem',
                      justifyContent: 'flex-end',
                      background: '#f9fafb',
                      borderRadius: '0 0 16px 16px'
                    }}>
                      <button
                        onClick={() => { setViewingItinerary(null); handleItineraryEdit(viewingItinerary); }}
                        className="gov-btn gov-btn-primary"
                      >
                        Edit Itinerary
                      </button>
                      <button
                        onClick={() => setViewingItinerary(null)}
                        className="gov-btn gov-btn-ghost"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="gov-glass-panel" style={{ marginBottom: '1.5rem' }}>
                <h2 className="gov-glass-panel__title">
                  Saved Itineraries
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', alignItems: 'stretch' }}>
                  {filteredItineraries.slice((itinerariesPage - 1) * ADMIN_CARD_SIZE, itinerariesPage * ADMIN_CARD_SIZE).map((itinerary) => (
                    <div
                      key={itinerary.itinerary_id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        background: '#f8fdf7',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ fontWeight: 800, marginBottom: '0.4rem' }}>
                        {itinerary.name || 'Untitled itinerary'}
                      </div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: '#e8f5e9',
                        color: '#1a7a4a',
                        borderRadius: '20px',
                        padding: '0.2rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        alignSelf: 'flex-start'
                      }}>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1a7a4a, #2ecc71)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {(itinerary.first_name || itinerary.username || '?')[0].toUpperCase()}
                        </span>
                        {itinerary.first_name || itinerary.last_name
                          ? `${itinerary.first_name || ''} ${itinerary.last_name || ''}`.trim()
                          : itinerary.username}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem' }}>
                        Status: {itinerary.status || 'planning'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                        {itinerary.start_date ? new Date(itinerary.start_date).toLocaleDateString() : 'N/A'}
                        {itinerary.end_date ? ` → ${new Date(itinerary.end_date).toLocaleDateString()}` : ''}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.4rem' }}>
                        {itinerary.total_distance || 0} km · {itinerary.total_time || 0} min · ₱{(parseFloat(itinerary.total_budget) || 0).toFixed(2)} · {itinerary.item_count || 0} stop{itinerary.item_count !== 1 ? 's' : ''}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.8rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleItineraryView(itinerary)}
                          className="gov-btn gov-btn-primary"
                          style={{ flex: 1 }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleItineraryEdit(itinerary)}
                          className="gov-btn gov-btn-primary"
                          style={{ flex: 1 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleItineraryDelete(itinerary.itinerary_id)}
                          disabled={itineraryActionLoading[`${itinerary.itinerary_id}:delete`]}
                          className="gov-btn gov-btn-warning"
                          style={{ flex: 1 }}
                        >
                          {itineraryActionLoading[`${itinerary.itinerary_id}:delete`] ? 'Archiving...' : 'Archive'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={itinerariesPage} totalPages={Math.ceil(filteredItineraries.length / ADMIN_CARD_SIZE)} onPageChange={setItinerariesPage} totalItems={filteredItineraries.length} pageSize={ADMIN_CARD_SIZE} label="itineraries" />
                {filteredItineraries.length === 0 && (
                  <div className="gov-empty">
                    <p>{t('msg_no_itineraries')}</p>
                  </div>
                )}
              </div>

              <div className="gov-glass-panel">
                <h2 className="gov-glass-panel__title">
                  Itinerary Templates
                </h2>
                <div className="gov-form-grid">
                  {itineraryTemplates.map((template) => (
                    <div
                      key={template.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '1rem',
                        background: '#f8fdf7'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: 'var(--g400)', marginBottom: '0.35rem' }}>
                        {template.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '0.5rem' }}>
                        {template.description}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#718096' }}>
                        {template.duration} · Stops: {Array.isArray(template.attractions) ? template.attractions.length : 0}
                      </div>
                    </div>
                  ))}
                </div>
                {itineraryTemplates.length === 0 && (
                  <div className="gov-empty">
                    <p>No templates available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attractions */}
          {activeModule === 'attractions' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Attraction size={32} style={{ verticalAlign: 'middle' }} /> {t('attractions_management')}
              </h1>
              <div className="gov-glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={attractionSearch}
                  onChange={(e) => setAttractionSearch(e.target.value)}
                  placeholder="Search attractions by name or location..."
                  style={{
                    flex: '1 1 260px',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #c8e6c9'
                  }}
                />
                <button
                  onClick={startAttractionCreate}
                  className="gov-btn gov-btn-primary"
                >
                  Add Attraction
                </button>
              </div>

              {(creatingAttraction || editingAttraction) && (
                <div
                  style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
                  onClick={(e) => { if (e.target === e.currentTarget) { setEditingAttraction(null); setCreatingAttraction(false); setAttractionForm(emptyAttractionForm); } }}
                >
                  <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'580px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>
                    {/* Header */}
                    <div style={{ background:'linear-gradient(135deg,#7b1fa2 0%,#ba68c8 100%)', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.5rem', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
                      <div>
                        <div style={{ fontSize:'0.72rem', fontWeight:700, opacity:0.8, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>{creatingAttraction ? 'New Attraction' : 'Editing Attraction'}</div>
                        <div style={{ fontSize:'1.25rem', fontWeight:800 }}>{creatingAttraction ? t('admin_add_new_attraction_btn') : editingAttraction.name}</div>
                        {editingAttraction && editingAttraction.location && <div style={{ fontSize:'0.82rem', opacity:0.8, marginTop:'2px' }}>{editingAttraction.location}</div>}
                      </div>
                      <button onClick={() => { setEditingAttraction(null); setCreatingAttraction(false); setAttractionForm(emptyAttractionForm); }} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'#fff', fontSize:'1.1rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                    </div>
                    {/* Image preview */}
                    {attractionForm.image_url && (
                      <div style={{ height:'140px', background:`url(${attractionForm.image_url}) center/cover no-repeat`, borderBottom:'1px solid #e5e7eb' }} />
                    )}
                    {/* Body */}
                    <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                      {/* Basic Info */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Basic Info</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Attraction Name</span>
                            <input type="text" value={attractionForm.name} onChange={(e) => setAttractionForm({ ...attractionForm, name: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Location</span>
                            <input type="text" value={attractionForm.location} onChange={(e) => setAttractionForm({ ...attractionForm, location: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem', gridColumn:'1 / -1' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Description</span>
                            <textarea value={attractionForm.description} onChange={(e) => setAttractionForm({ ...attractionForm, description: e.target.value })} rows={3} className="gov-input" style={{ borderRadius:'8px', resize:'vertical' }} />
                          </label>
                        </div>
                      </div>
                      {/* Coordinates */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Coordinates</div>
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Latitude</span>
                            <input type="number" step="any" value={attractionForm.latitude} onChange={(e) => setAttractionForm({ ...attractionForm, latitude: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="e.g. 13.4125" />
                          </label>
                          <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                            <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Longitude</span>
                            <input type="number" step="any" value={attractionForm.longitude} onChange={(e) => setAttractionForm({ ...attractionForm, longitude: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="e.g. 121.0355" />
                          </label>
                        </div>
                      </div>
                      {/* Media */}
                      <div>
                        <div style={{ fontSize:'0.7rem', fontWeight:800, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem', paddingBottom:'0.4rem', borderBottom:'2px solid #e5e7eb' }}>Media</div>
                        <label style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151' }}>Image URL</span>
                          <input type="text" value={attractionForm.image_url} onChange={(e) => setAttractionForm({ ...attractionForm, image_url: e.target.value })} className="gov-input" style={{ borderRadius:'8px' }} placeholder="https://..." />
                        </label>
                      </div>
                    </div>
                    {/* Footer */}
                    <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #e5e7eb', display:'flex', gap:'0.75rem', justifyContent:'flex-end', background:'#f9fafb', borderRadius:'0 0 16px 16px' }}>
                      <button className="gov-btn gov-btn-ghost" onClick={() => { setEditingAttraction(null); setCreatingAttraction(false); setAttractionForm(emptyAttractionForm); }}>{t('cancel')}</button>
                      <button onClick={handleAttractionSave} disabled={attractionSaving} className="gov-btn gov-btn-primary" style={{ minWidth:'150px' }}>
                        {attractionSaving ? t('saving') : creatingAttraction ? t('create_attraction') : t('button_save')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {filteredAttractions.slice((attractionsPage - 1) * ADMIN_CARD_SIZE, attractionsPage * ADMIN_CARD_SIZE).map(attraction => {
                  const attractionImage = attraction.image_url || null;
                  return (
                  <div key={attraction.id} className="gov-glass-panel" style={{ overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                      background: attractionImage
                        ? `url(${attractionImage}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #2E7D32 0%, #388E3C 100%)',
                      height: '160px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3.5rem',
                      color: 'white'
                    }}>

                    </div>
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--g400)', fontSize: '1.1rem', fontWeight: 800 }}>
                        {attraction.name}
                      </h3>
                      <p style={{ margin: '0 0 1rem 0', color: '#718096', fontSize: '0.9rem', maxHeight: '2.7em', overflow: 'hidden' }}>
                        {attraction.description}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button
                          onClick={() => startAttractionEdit(attraction)}
                          className="gov-btn gov-btn-primary"
                          style={{ flex: 1 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleAttractionDelete(attraction.id)}
                          disabled={attractionActionLoading[`${attraction.id}:delete`]}
                          className="gov-btn gov-btn-warning"
                          style={{ flex: 1 }}
                        >
                          {attractionActionLoading[`${attraction.id}:delete`] ? 'Archiving...' : 'Archive'}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
              <Pagination page={attractionsPage} totalPages={Math.ceil(filteredAttractions.length / ADMIN_CARD_SIZE)} onPageChange={setAttractionsPage} totalItems={filteredAttractions.length} pageSize={ADMIN_CARD_SIZE} label="attractions" />
              {filteredAttractions.length === 0 && (
                <div className="gov-glass-panel gov-empty">
                  <p style={{ color: '#718096' }}>{t('msg_no_attractions')}</p>
                </div>
              )}
            </div>
          )}

          {/* Maps */}
          {activeModule === 'maps' && (() => {
            const hotelMarkers = hotels
              .map((hotel) => {
                const key = `hotel:${hotel.hotel_id}`;
                const draft = mapDraftPositions[key];
                const lat = draft?.lat ?? parseFloat(hotel.latitude);
                const lng = draft?.lng ?? parseFloat(hotel.longitude);
                if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
                return {
                  lat,
                  lng,
                  type: 'hotel',
                  draggable: true,
                  data: { ...hotel, id: hotel.hotel_id },
                  popup: `<strong>${hotel.name}</strong><br/>${hotel.location || ''}`
                };
              })
              .filter(Boolean);

            const attractionMarkers = attractions
              .map((attraction) => {
                const key = `attraction:${attraction.id}`;
                const draft = mapDraftPositions[key];
                const lat = draft?.lat ?? parseFloat(attraction.latitude);
                const lng = draft?.lng ?? parseFloat(attraction.longitude);
                if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
                return {
                  lat,
                  lng,
                  type: 'attraction',
                  draggable: true,
                  data: { ...attraction, id: attraction.id },
                  popup: `<strong>${attraction.name}</strong><br/>${attraction.location || ''}`
                };
              })
              .filter(Boolean);

            const mapMarkers = mapMode === 'hotels'
              ? hotelMarkers
              : mapMode === 'attractions'
                ? attractionMarkers
                : [...hotelMarkers, ...attractionMarkers];

            const mapCenter = mapMarkers.length > 0
              ? [
                  mapMarkers.reduce((sum, m) => sum + m.lat, 0) / mapMarkers.length,
                  mapMarkers.reduce((sum, m) => sum + m.lng, 0) / mapMarkers.length
                ]
              : [13.3333, 121.3000];

            const listItems = mapMode === 'hotels'
              ? hotels.map((hotel) => ({
                  type: 'hotel',
                  id: hotel.hotel_id,
                  name: hotel.name,
                  location: hotel.location,
                  latitude: hotel.latitude,
                  longitude: hotel.longitude,
                  raw: hotel
                }))
              : mapMode === 'attractions'
                ? attractions.map((attraction) => ({
                    type: 'attraction',
                    id: attraction.id,
                    name: attraction.name,
                    location: attraction.location,
                    latitude: attraction.latitude,
                    longitude: attraction.longitude,
                    raw: attraction
                  }))
                : [
                    ...hotels.map((hotel) => ({
                      type: 'hotel',
                      id: hotel.hotel_id,
                      name: hotel.name,
                      location: hotel.location,
                      latitude: hotel.latitude,
                      longitude: hotel.longitude,
                      raw: hotel
                    })),
                    ...attractions.map((attraction) => ({
                      type: 'attraction',
                      id: attraction.id,
                      name: attraction.name,
                      location: attraction.location,
                      latitude: attraction.latitude,
                      longitude: attraction.longitude,
                      raw: attraction
                    }))
                  ];

            return (
              <div>
                <h1 className="gov-page-title">
                  <Icons.Map size={32} style={{ verticalAlign: 'middle' }} /> Interactive Map Management
                </h1>
                {mapAutoSaveStatus.message && (
                  <div
                    style={{
                      position: 'fixed',
                      top: '1.5rem',
                      right: '1.5rem',
                      zIndex: 2000,
                      padding: '0.75rem 1.1rem',
                      borderRadius: '10px',
                      fontWeight: 700,
                      color: 'white',
                      background:
                        mapAutoSaveStatus.state === 'error'
                          ? '#c62828'
                          : mapAutoSaveStatus.state === 'saved'
                            ? '#2e7d32'
                            : '#1565c0',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                    }}
                  >
                    {mapAutoSaveStatus.message}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="gov-glass-panel" style={{ flex: '1 1 320px', minWidth: '280px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      {['hotels', 'attractions', 'both'].map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setMapMode(mode)}
                          className={`gov-btn ${mapMode === mode ? 'gov-btn-primary' : 'gov-btn-ghost'}`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize: '0.9rem', color: '#718096', marginBottom: '0.75rem' }}>
                      Select a place to edit its pin, then drag the marker or click on the map.
                    </div>

                    <div style={{
                      maxHeight: '380px',
                      overflowY: 'auto',
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '0.75rem'
                    }}>
                      {listItems.map((item) => {
                        const isSelected = mapSelection && mapSelection.type === item.type && mapSelection.id === item.id;
                        const hasCoords = !Number.isNaN(parseFloat(item.latitude)) && !Number.isNaN(parseFloat(item.longitude));
                        const isArchived = item.raw?.archived === 1;
                        
                        return (
                          <button
                            key={`${item.type}:${item.id}`}
                            onClick={() => startMapEdit(item.type, item.raw)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              borderRadius: '8px',
                              border: `2px solid ${isSelected ? '#2E7D32' : '#e2e8f0'}`,
                              background: isArchived ? '#f5f5f5' : (isSelected ? '#e8f5e9' : '#ffffff'),
                              cursor: 'pointer',
                              fontWeight: 'inherit',
                              opacity: isArchived ? 0.6 : 1
                            }}
                          >
                            <div style={{ fontWeight: 700, color: isArchived ? '#999' : '#1B5E20', textDecoration: isArchived ? 'line-through' : 'none' }}>
                              {item.name}
                              {isArchived && <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic' }}>[Archived]</span>}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#718096' }}>{item.location || 'No location'}</div>
                            <div style={{ fontSize: '0.8rem', color: hasCoords ? '#2E7D32' : '#c62828' }}>
                              {hasCoords ? 'Pinned' : 'No coordinates'}
                            </div>
                          </button>
                        );
                      })}
                      {listItems.length === 0 && (
                        <div style={{ padding: '1rem', color: '#718096' }}>No items to display.</div>
                      )}
                    </div>
                  </div>

                  <div className="gov-glass-panel" style={{ flex: '2 1 560px', minWidth: '320px' }}>
                    <div style={{ height: '420px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                      {mapDragCoords && (
                        <div style={{
                          position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                          zIndex: 1000, background: 'rgba(255,255,255,0.92)', color: '#1a202c',
                          borderRadius: '8px', padding: '0.45rem 0.9rem',
                          fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.12)', pointerEvents: 'none',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <span style={{ color: '#16a34a' }}>📍 {mapDragCoords.name}</span>
                          <span style={{ color: '#d1d5db' }}>|</span>
                          <span style={{ color: '#374151' }}>{mapDragCoords.lat.toFixed(6)}, {mapDragCoords.lng.toFixed(6)}</span>
                        </div>
                      )}
                      <LeafletMap
                        center={mapCenter}
                        zoom={mapMarkers.length > 0 ? 12 : 11}
                        markers={mapMarkers}
                        onMarkerClick={(marker) => {
                          if (marker.type === 'hotel') {
                            const selected = hotels.find((item) => item.hotel_id === marker.data.id);
                            if (selected) startMapEdit('hotel', selected);
                          }
                          if (marker.type === 'attraction') {
                            const selected = attractions.find((item) => item.id === marker.data.id);
                            if (selected) startMapEdit('attraction', selected);
                          }
                        }}
                        onMarkerDrag={handleMapMarkerDrag}
                        onMarkerDragMove={(info) => setMapDragCoords(info ? { lat: info.position.lat, lng: info.position.lng, name: info.marker?.data?.name } : null)}
                        onMapClick={handleMapClick}
                        style={{ height: '100%', width: '100%' }}
                      />
                    </div>

                    <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#718096' }}>
                      Pins save automatically when you drag or click the map.
                    </div>

                    {mapSelection ? (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h3>
                          {mapSelection.type === 'hotel' ? 'Hotel Pin' : 'Attraction Pin'} Details
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                          <label className="gov-label">
                            Name
                            <input
                              type="text"
                              value={mapForm.name}
                              onChange={(e) => setMapForm({ ...mapForm, name: e.target.value })}
                              className="gov-input" style={{ marginTop: '0.4rem' }}
                            />
                          </label>
                          <label className="gov-label">
                            Location
                            <input
                              type="text"
                              value={mapForm.location}
                              onChange={(e) => setMapForm({ ...mapForm, location: e.target.value })}
                              className="gov-input" style={{ marginTop: '0.4rem' }}
                            />
                          </label>
                          {mapSelection.type === 'attraction' && (
                            <label className="gov-label" style={{ gridColumn: '1 / -1' }}>
                              Description
                              <textarea
                                value={mapForm.description}
                                onChange={(e) => setMapForm({ ...mapForm, description: e.target.value })}
                                rows={3}
                                className="gov-input" style={{ marginTop: '0.4rem' }}
                              />
                            </label>
                          )}
                          <label className="gov-label" style={{ gridColumn: '1 / -1' }}>
                            Image URL
                            <input
                              type="text"
                              value={mapForm.image_url}
                              onChange={(e) => setMapForm({ ...mapForm, image_url: e.target.value })}
                              className="gov-input" style={{ marginTop: '0.4rem' }}
                            />
                            <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#718096', lineHeight: 1.5 }}>
                              Works best with a direct hosted image link, Cloudinary URL, or uploaded file path such as <code>/uploads/maps/...jpg</code>.
                              If you need multiple images, use a gallery field or media upload workflow instead of a single URL.
                            </div>
                          </label>
                          <label className="gov-label">
                            Latitude
                            <input
                              type="number"
                              value={mapForm.latitude}
                              onChange={(e) => {
                                const lat = e.target.value;
                                setMapForm((prev) => ({ ...prev, latitude: lat }));
                                const latNum = parseFloat(lat);
                                const lngNum = parseFloat(mapForm.longitude);
                                if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
                                  updateDraftPosition(mapSelection.type, mapSelection.id, latNum, lngNum);
                                  autoSaveMapPosition(mapSelection.type, mapSelection.id, latNum, lngNum, mapForm);
                                  setMapDragCoords({ lat: latNum, lng: lngNum, name: mapForm.name });
                                  setTimeout(() => setMapDragCoords(null), 2000);
                                }
                              }}
                              className="gov-input" style={{ marginTop: '0.4rem' }}
                            />
                          </label>
                          <label className="gov-label">
                            Longitude
                            <input
                              type="number"
                              value={mapForm.longitude}
                              onChange={(e) => {
                                const lng = e.target.value;
                                setMapForm((prev) => ({ ...prev, longitude: lng }));
                                const latNum = parseFloat(mapForm.latitude);
                                const lngNum = parseFloat(lng);
                                if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
                                  updateDraftPosition(mapSelection.type, mapSelection.id, latNum, lngNum);
                                  autoSaveMapPosition(mapSelection.type, mapSelection.id, latNum, lngNum, mapForm);
                                  setMapDragCoords({ lat: latNum, lng: lngNum, name: mapForm.name });
                                  setTimeout(() => setMapDragCoords(null), 2000);
                                }
                              }}
                              className="gov-input" style={{ marginTop: '0.4rem' }}
                            />
                          </label>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setMapSelection(null)}
                            className="gov-btn gov-btn-ghost"
                          >
                            Clear Selection
                          </button>
                          
                          {/* Delete/Restore buttons for attractions */}
                          {mapSelection && mapSelection.type === 'attraction' && (() => {
                            // Create handlers for this attraction
                            const handleDelete = async (attractionId, hardDelete = false) => {
                              if (!window.confirm(hardDelete 
                                ? 'This will permanently delete the attraction. This action cannot be undone. Continue?' 
                                : 'Archive this attraction? Users will no longer see it on the map.')) {
                                return;
                              }

                              setAttractionActionLoading(prev => ({ ...prev, [attractionId]: true }));
                              try {
                                await api.delete(`/attractions/${attractionId}`, { data: { hardDelete } });
                                
                                if (hardDelete) {
                                  setAttractions(attractions.filter(a => a.id !== attractionId));
                                  setMapSelection(null);
                                } else {
                                  setAttractions(attractions.map(a => 
                                    a.id === attractionId ? { ...a, archived: 1, archived_at: new Date().toISOString() } : a
                                  ));
                                  setMapSelection(prev => ({ ...prev, archived: 1 }));
                                }
                              } catch (error) {
                                console.error('Error deleting attraction:', error);
                                alert('Failed to delete attraction: ' + (error.response?.data?.message || error.message));
                              } finally {
                                setAttractionActionLoading(prev => ({ ...prev, [attractionId]: false }));
                              }
                            };

                            const handleRestore = async (attractionId) => {
                              if (!window.confirm('Restore this attraction? It will be visible on the map again.')) {
                                return;
                              }

                              setAttractionActionLoading(prev => ({ ...prev, [attractionId]: true }));
                              try {
                                await api.post(`/attractions/${attractionId}/restore`);
                                
                                setAttractions(attractions.map(a => 
                                  a.id === attractionId ? { ...a, archived: 0, archived_at: null } : a
                                ));
                                setMapSelection(prev => ({ ...prev, archived: 0 }));
                              } catch (error) {
                                console.error('Error restoring attraction:', error);
                                alert('Failed to restore attraction: ' + (error.response?.data?.message || error.message));
                              } finally {
                                setAttractionActionLoading(prev => ({ ...prev, [attractionId]: false }));
                              }
                            };

                            return (
                              <AttractionActionButtons
                                attraction={mapSelection}
                                isLoading={attractionActionLoading[mapSelection.id] ?? false}
                                onDelete={handleDelete}
                                onRestore={handleRestore}
                              />
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '1rem', color: '#718096' }}>
                        Select a hotel or attraction to edit its pin.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Customization Panel */}
          {activeModule === 'hero' && (() => {
            const hexMatch = (heroSettings.overlayColor || '#16a34a').match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            const overlayRgb = hexMatch
              ? `${parseInt(hexMatch[1], 16)}, ${parseInt(hexMatch[2], 16)}, ${parseInt(hexMatch[3], 16)}`
              : '22, 163, 74';
            const previewImg = heroSettings.images[heroPreviewIndex] || heroSettings.images[0] || '';

            const hsMatch = (homeSlideshowSettings.overlayColor || '#000000').match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
            const hsRgb = hsMatch
              ? `${parseInt(hsMatch[1], 16)}, ${parseInt(hsMatch[2], 16)}, ${parseInt(hsMatch[3], 16)}`
              : '0, 0, 0';

            const colorFieldStyle = { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' };
            const colorSwatchBtn = (color, current, setter, field) => (
              <button key={color} title={color} onClick={() => setter(prev => ({ ...prev, [field]: color }))}
                style={{ width: 30, height: 30, borderRadius: 7, background: color, border: 'none', cursor: 'pointer',
                  boxShadow: current === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : '0 1px 4px rgba(0,0,0,0.25)',
                  transition: 'all 0.15s', transform: current === color ? 'scale(1.15)' : 'scale(1)' }} />
            );
            const colorPresets = ['#16a34a','#15803d','#1d4ed8','#9333ea','#dc2626','#d97706','#0891b2','#1e293b','#000000','#ffffff'];

            const msgBadge = (msg) => msg ? (
              <span style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600,
                background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: msg.type === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}` }}>
                {msg.text}
              </span>
            ) : null;

            return (
              <div>
                {/* Header */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h1 className="gov-page-title" style={{ margin: 0 }}>
                    <Icons.Sun size={32} style={{ verticalAlign: 'middle' }} /> Customization
                  </h1>
                  <p style={{ margin: '0.4rem 0 0', color: '#6b7280', fontSize: '0.95rem' }}>
                    Manage hero banner, home slideshow, colors, fonts, announcement bar, footer, and more.
                  </p>
                  <p style={{ margin: '0.55rem 0 0', color: '#166534', fontSize: '0.84rem', fontWeight: 700, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.55rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Eye size={14} /> Live Preview updates instantly while you edit.
                  </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0', marginBottom: '1.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: 0, flexWrap: 'wrap' }}>
                  {[
                    { id: 'hero',         label: t('admin_tab_hero'),    icon: <Icons.Photo size={15} /> },
                    { id: 'attractionHero', label: t('admin_tab_attraction_hero'), icon: <Icons.Location size={15} /> },
                    { id: 'homeSlideshow',label: t('admin_tab_slideshow'), icon: <Icons.Film size={15} /> },
                    { id: 'theme',        label: t('admin_tab_colors'),         icon: <Icons.Palette size={15} /> },
                    { id: 'typography',   label: t('admin_tab_typography'),     icon: <Icons.Type size={15} /> },
                    { id: 'announcement', label: t('admin_tab_announcement'),   icon: <Icons.Bell size={15} /> },
                    { id: 'footer',       label: t('admin_tab_footer'),         icon: <Icons.Document size={15} /> },
                    { id: 'sections',     label: t('admin_tab_sections'),  icon: <Icons.Layout size={15} /> },
                    { id: 'branding',     label: t('admin_tab_branding'),       icon: <Icons.Pencil size={15} /> },
                    { id: 'auth',         label: 'Auth Pages',                  icon: <Icons.Shield size={15} /> },
                    { id: 'about',        label: t('admin_tab_about'),     icon: <Icons.Globe size={15} /> },
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setCustomTab(tab.id)}
                      style={{ padding: '0.6rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                        fontWeight: customTab === tab.id ? 800 : 500, fontSize: '0.83rem',
                        color: customTab === tab.id ? '#16a34a' : '#6b7280',
                        borderBottom: customTab === tab.id ? '3px solid #16a34a' : '3px solid transparent',
                        marginBottom: -2, transition: 'all 0.15s', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 1: Hero Banner */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'hero' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setCustomTab('attractionHero')}
                        className="gov-btn"
                        style={{ padding: '0.6rem 1rem', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        Open Attraction Hero Settings
                      </button>
                      {msgBadge(heroSaveMsg)}
                      <button onClick={saveHeroSettings} disabled={heroSaving || heroSettings.images.length === 0}
                        className="gov-btn gov-btn--primary"
                        style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                        {heroSaving ? 'Saving…' : 'Save Hero Banner'}
                      </button>
                    </div>

                    {heroLoading ? (
                      <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
                        <div className="gov-loader" style={{ margin: '0 auto 1rem' }} />
                        Loading hero settings…
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'flex-start' }}>
                        {/* Left: Image Management */}
                        <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                          <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Slideshow Images</h2>
                          <p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                            These images rotate in the hero banner on Attractions, Hotels, About, and other pages. Use ↑ ↓ to reorder.
                          </p>
                          {heroSettings.images.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', background: '#f9fafb', borderRadius: 12, border: '2px dashed #e5e7eb', color: '#9ca3af' }}>
                              No images yet. Add at least one image URL below.
                            </div>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                              {heroSettings.images.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9', background: '#e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', border: idx === heroPreviewIndex ? '3px solid #16a34a' : '3px solid transparent', transition: 'border-color 0.2s' }}
                                  onClick={() => setHeroPreviewIndex(idx)}>
                                  <img src={url} alt={`Hero ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.opacity = '0.3'; }} />
                                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)', opacity: 0, transition: 'opacity 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                                    <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                                      <button onClick={e => { e.stopPropagation(); moveHeroImage(idx, -1); }} disabled={idx === 0}
                                        style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.85)', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.8rem', opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                                      <button onClick={e => { e.stopPropagation(); moveHeroImage(idx, 1); }} disabled={idx === heroSettings.images.length - 1}
                                        style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.85)', cursor: idx === heroSettings.images.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.8rem', opacity: idx === heroSettings.images.length - 1 ? 0.4 : 1 }}>↓</button>
                                      <button onClick={e => { e.stopPropagation(); removeHeroImage(idx); }}
                                        style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(239,68,68,0.9)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>×</button>
                                    </div>
                                  </div>
                                  <div style={{ position: 'absolute', bottom: 6, left: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 6, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>#{idx + 1}</div>
                                  {idx === heroPreviewIndex && (
                                    <div style={{ position: 'absolute', top: 6, left: 8, background: '#16a34a', color: '#fff', borderRadius: 6, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>Live</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>Add Image by URL</label>
                            <div style={{ display: 'flex', gap: '0.65rem' }}>
                              <input type="url" placeholder="https://example.com/image.jpg" value={newImageUrl}
                                onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addHeroImage()}
                                className="gov-input" style={{ flex: 1, marginTop: 0 }} />
                              <button onClick={addHeroImage} disabled={!newImageUrl.trim()} className="gov-btn gov-btn--primary"
                                style={{ padding: '0.6rem 1.25rem', fontWeight: 700, whiteSpace: 'nowrap', opacity: !newImageUrl.trim() ? 0.5 : 1 }}>+ Add</button>
                            </div>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#9ca3af' }}>Recommended size: 1920×1080 or wider (JPG, PNG, WebP).</p>
                          </div>
                        </div>

                        {/* Right: Preview + Overlay */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Live Preview</h2>
                            <div style={{ position: 'relative', height: 190, borderRadius: 12, overflow: 'hidden', background: '#e5e7eb', marginBottom: '0.75rem' }}>
                              {previewImg && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${previewImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
                              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(${overlayRgb}, ${(heroSettings.overlayOpacity * 0.9).toFixed(2)}) 0%, rgba(${overlayRgb}, ${heroSettings.overlayOpacity.toFixed(2)}) 100%)` }} />
                              <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white', textAlign: 'center', padding: '1rem' }}>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>Discover Naujan</div>
                                <div style={{ fontSize: '0.82rem', marginTop: '0.4rem', opacity: 0.9 }}>Oriental Mindoro, Philippines</div>
                              </div>
                            </div>
                            {heroSettings.images.length > 1 && (
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                {heroSettings.images.map((_, i) => (
                                  <button key={i} onClick={() => setHeroPreviewIndex(i)}
                                    style={{ width: i === heroPreviewIndex ? 22 : 10, height: 10, borderRadius: 99, background: i === heroPreviewIndex ? '#16a34a' : '#d1d5db', border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0 }} />
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Overlay Color</h2>
                            <div style={colorFieldStyle}>
                              <input type="color" value={heroSettings.overlayColor} onChange={e => setHeroSettings(prev => ({ ...prev, overlayColor: e.target.value }))}
                                style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
                              <input type="text" value={heroSettings.overlayColor}
                                onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setHeroSettings(prev => ({ ...prev, overlayColor: e.target.value }))}
                                className="gov-input" style={{ flex: 1, marginTop: 0, fontFamily: 'monospace', fontSize: '0.9rem' }} maxLength={7} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                              {[{ color: '#16a34a', label: 'Green' },{ color: '#1d4ed8', label: 'Blue' },{ color: '#9333ea', label: 'Purple' },{ color: '#dc2626', label: 'Red' },{ color: '#d97706', label: 'Amber' },{ color: '#0891b2', label: 'Cyan' },{ color: '#1e293b', label: 'Dark' },{ color: '#000000', label: 'Black' }].map(({ color, label }) => (
                                <button key={color} title={label} onClick={() => setHeroSettings(prev => ({ ...prev, overlayColor: color }))}
                                  style={{ width: 32, height: 32, borderRadius: 8, background: color, border: 'none', cursor: 'pointer',
                                    boxShadow: heroSettings.overlayColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : '0 1px 4px rgba(0,0,0,0.25)',
                                    transition: 'all 0.15s', transform: heroSettings.overlayColor === color ? 'scale(1.15)' : 'scale(1)' }} />
                              ))}
                            </div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                              Opacity — {Math.round(heroSettings.overlayOpacity * 100)}%
                            </label>
                            <input type="range" min="0" max="1" step="0.05" value={heroSettings.overlayOpacity}
                              onChange={e => setHeroSettings(prev => ({ ...prev, overlayOpacity: parseFloat(e.target.value) }))}
                              style={{ width: '100%', accentColor: '#16a34a' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                              <span>0% (none)</span><span>100% (solid)</span>
                            </div>
                          </div>

                          {/* Hero Extended: title / autoplay / speed */}
                          <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Banner Text & Playback</h2>
                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {msgBadge(heroExtMsg)}
                                <button onClick={saveHeroExtended} disabled={heroExtSaving} className="gov-btn gov-btn--primary" style={{ padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.82rem' }}>{heroExtSaving ? 'Saving…' : 'Save'}</button>
                              </div>
                            </div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>Headline</label>
                            <input type="text" value={heroExtended.title} maxLength={80}
                              onChange={e => setHeroExtended(p => ({ ...p, title: e.target.value }))}
                              className="gov-input" style={{ marginBottom: '1rem', marginTop: 0 }} placeholder="Discover Naujan" />
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>Subtitle</label>
                            <input type="text" value={heroExtended.subtitle} maxLength={120}
                              onChange={e => setHeroExtended(p => ({ ...p, subtitle: e.target.value }))}
                              className="gov-input" style={{ marginBottom: '1rem', marginTop: 0 }} placeholder="Oriental Mindoro, Philippines" />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: '#374151' }}>
                                <input type="checkbox" checked={heroExtended.autoplay}
                                  onChange={e => setHeroExtended(p => ({ ...p, autoplay: e.target.checked }))}
                                  style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                                Autoplay
                              </label>
                            </div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                              Slide Speed — {heroExtended.intervalSeconds}s
                            </label>
                            <input type="range" min="2" max="15" step="1" value={heroExtended.intervalSeconds}
                              onChange={e => setHeroExtended(p => ({ ...p, intervalSeconds: Number(e.target.value) }))}
                              disabled={!heroExtended.autoplay}
                              style={{ width: '100%', accentColor: '#16a34a', opacity: heroExtended.autoplay ? 1 : 0.4 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                              <span>2s</span><span>15s</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 1.5: Attraction Hero */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'attractionHero' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {msgBadge(attractionHeroMsg)}
                      <button onClick={saveAttractionHeroSettings} disabled={attractionHeroSaving}
                        className="gov-btn gov-btn--primary"
                        style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                        {attractionHeroSaving ? 'Saving…' : 'Save Attraction Hero'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'flex-start' }}>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Attraction Page Hero Controls</h2>
                        <p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          Customize the hero for attraction details pages like /attractions/1.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Back Button Label</label>
                            <input type="text" maxLength={24} value={attractionHeroSettings.backButtonLabel}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, backButtonLabel: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} placeholder="Back" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Add Itinerary Label</label>
                            <input type="text" maxLength={36} value={attractionHeroSettings.addToItineraryText}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, addToItineraryText: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Save Label</label>
                            <input type="text" maxLength={36} value={attractionHeroSettings.saveToFavoritesText}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, saveToFavoritesText: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Saved Label</label>
                            <input type="text" maxLength={36} value={attractionHeroSettings.savedToFavoritesText}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, savedToFavoritesText: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Share Label</label>
                            <input type="text" maxLength={24} value={attractionHeroSettings.shareText}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, shareText: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Map Label</label>
                            <input type="text" maxLength={24} value={attractionHeroSettings.viewOnMapText}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, viewOnMapText: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Hero Height Desktop (px)</label>
                            <input type="number" min={360} max={760} value={attractionHeroSettings.heroMinHeightDesktop}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, heroMinHeightDesktop: Number(e.target.value) || 480 }))}
                              className="gov-input" style={{ marginTop: 0 }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#374151', marginBottom: '0.35rem' }}>Hero Height Mobile (px)</label>
                            <input type="number" min={300} max={620} value={attractionHeroSettings.heroMinHeightMobile}
                              onChange={e => setAttractionHeroSettings(prev => ({ ...prev, heroMinHeightMobile: Number(e.target.value) || 420 }))}
                              className="gov-input" style={{ marginTop: 0 }} />
                          </div>
                        </div>

                        <h3 style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.95rem', color: '#111827' }}>Hero Font Colors</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                          {[
                            { key: 'heroTitleColor', label: 'Title' },
                            { key: 'heroMetaTextColor', label: 'Metadata' },
                            { key: 'heroKickerColor', label: 'Kicker' },
                            { key: 'heroBadgeTextColor', label: 'Badge' },
                            { key: 'backButtonTextColor', label: 'Back Text' },
                            { key: 'backButtonBgColor', label: 'Back Background' },
                          ].map(item => (
                            <div key={item.key}>
                              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#374151', marginBottom: '0.35rem' }}>{item.label}</label>
                              <input
                                type="color"
                                value={attractionHeroSettings[item.key] || '#ffffff'}
                                onChange={e => setAttractionHeroSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                                style={{ width: '100%', height: 34, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
                              />
                            </div>
                          ))}
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.83rem', fontWeight: 700, color: '#374151' }}>
                          <input
                            type="checkbox"
                            checked={toBooleanSetting(attractionHeroSettings.backButtonTransparent, false)}
                            onChange={e => setAttractionHeroSettings(prev => ({ ...prev, backButtonTransparent: e.target.checked }))}
                            style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                          />
                          Back button transparent style
                        </label>

                        <h3 style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.95rem', color: '#111827' }}>Hero Button Colors & Style</h3>
                        <div style={{ display: 'grid', gap: '0.65rem', marginBottom: '1rem' }}>
                          {[
                            { key: 'primary', label: 'Primary (Add to Itinerary)' },
                            { key: 'secondary', label: 'Secondary (Save to Favorites)' },
                            { key: 'tertiary', label: 'Tertiary (Share / Map)' },
                          ].map(item => (
                            <div key={item.key} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.6rem' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#374151', marginBottom: '0.5rem' }}>{item.label}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={attractionHeroSettings[`${item.key}ButtonColor`] || '#ffffff'}
                                  onChange={e => setAttractionHeroSettings(prev => ({ ...prev, [`${item.key}ButtonColor`]: e.target.value }))}
                                  style={{ width: '100%', height: 34, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
                                />
                                <input
                                  type="color"
                                  value={attractionHeroSettings[`${item.key}ButtonTextColor`] || '#111827'}
                                  onChange={e => setAttractionHeroSettings(prev => ({ ...prev, [`${item.key}ButtonTextColor`]: e.target.value }))}
                                  style={{ width: '100%', height: 34, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
                                />
                                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                                  <input
                                    type="checkbox"
                                    checked={toBooleanSetting(attractionHeroSettings[`${item.key}ButtonTransparent`], false)}
                                    onChange={e => setAttractionHeroSettings(prev => ({ ...prev, [`${item.key}ButtonTransparent`]: e.target.checked }))}
                                    style={{ width: 15, height: 15, accentColor: '#16a34a' }}
                                  />
                                  Transparent
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>

                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.35rem' }}>
                          Overlay Strength
                        </label>
                        <div style={{ display: 'grid', gap: '0.65rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Start: {Number(attractionHeroSettings.overlayStart).toFixed(2)}</label>
                          <input type="range" min="0.25" max="0.95" step="0.01" value={attractionHeroSettings.overlayStart}
                            onChange={e => setAttractionHeroSettings(prev => ({ ...prev, overlayStart: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: '#16a34a' }} />
                          <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>Middle: {Number(attractionHeroSettings.overlayMid).toFixed(2)}</label>
                          <input type="range" min="0.2" max="0.9" step="0.01" value={attractionHeroSettings.overlayMid}
                            onChange={e => setAttractionHeroSettings(prev => ({ ...prev, overlayMid: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: '#16a34a' }} />
                          <label style={{ fontSize: '0.8rem', color: '#6b7280' }}>End: {Number(attractionHeroSettings.overlayEnd).toFixed(2)}</label>
                          <input type="range" min="0.25" max="0.95" step="0.01" value={attractionHeroSettings.overlayEnd}
                            onChange={e => setAttractionHeroSettings(prev => ({ ...prev, overlayEnd: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: '#16a34a' }} />
                        </div>
                      </div>

                      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Live Preview</h2>
                        <p style={{ margin: '0 0 0.8rem', fontSize: '0.78rem', color: '#6b7280' }}>Updates instantly as you edit labels, colors, and transparency.</p>
                        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                          <div style={{ minHeight: 220, background: `linear-gradient(165deg, rgba(5,18,14,${Number(attractionHeroSettings.overlayStart).toFixed(2)}), rgba(8,30,23,${Number(attractionHeroSettings.overlayMid).toFixed(2)}) 48%, rgba(4,18,14,${Number(attractionHeroSettings.overlayEnd).toFixed(2)})), url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=900&q=70)`, backgroundSize: 'cover', backgroundPosition: 'center', padding: '0.9rem', color: '#fff' }}>
                            <div style={{ display: 'inline-flex', borderRadius: 999, background: toBooleanSetting(attractionHeroSettings.backButtonTransparent, false) ? 'rgba(255,255,255,0.25)' : attractionHeroSettings.backButtonBgColor, color: attractionHeroSettings.backButtonTextColor, border: `1px solid ${attractionHeroSettings.backButtonBgColor}`, padding: '0.32rem 0.68rem', fontWeight: 700, fontSize: '0.75rem' }}>
                              {attractionHeroSettings.backButtonLabel || 'Back'}
                            </div>
                            <div style={{ marginTop: '4.2rem' }}>
                              <div style={{ fontSize: '1.3rem', fontWeight: 900, textShadow: '0 2px 6px rgba(0,0,0,0.5)', color: attractionHeroSettings.heroTitleColor }}>333 Steps</div>
                              <div style={{ marginTop: '0.55rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                                {[
                                  { label: attractionHeroSettings.addToItineraryText, key: 'primary' },
                                  { label: attractionHeroSettings.saveToFavoritesText, key: 'secondary' },
                                  { label: attractionHeroSettings.shareText, key: 'tertiary' },
                                  { label: attractionHeroSettings.viewOnMapText, key: 'tertiary' },
                                ].map((item, i) => (
                                  <div key={i} style={{ borderRadius: 8, border: `1px solid ${attractionHeroSettings[`${item.key}ButtonColor`]}`, background: toBooleanSetting(attractionHeroSettings[`${item.key}ButtonTransparent`], false) ? 'rgba(255,255,255,0.22)' : attractionHeroSettings[`${item.key}ButtonColor`], color: attractionHeroSettings[`${item.key}ButtonTextColor`], fontSize: '0.68rem', textAlign: 'center', fontWeight: 700, padding: '0.35rem 0.4rem' }}>
                                    {item.label || 'Action'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p style={{ margin: '0.65rem 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                          Applies to attraction details hero section.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 2: Home Page Slideshow */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'homeSlideshow' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {msgBadge(homeSlideshowMsg)}
                      <button onClick={saveHomeSlideshowSettings} disabled={homeSlideshowSaving}
                        className="gov-btn gov-btn--primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                        {homeSlideshowSaving ? 'Saving…' : 'Save Slideshow Settings'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'flex-start' }}>
                      {/* Left: Text Labels */}
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Slideshow Text Labels</h2>
                        <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                          Customize the text displayed over attraction slides on the home page. Images come from your attractions database.
                        </p>

                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>Tag Label</label>
                        <input type="text" value={homeSlideshowSettings.tagText} maxLength={60}
                          onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, tagText: e.target.value }))}
                          className="gov-input" style={{ marginBottom: '1.25rem', marginTop: 0 }}
                          placeholder="e.g. Featured Destination" />

                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                          Button Text — Guest (not logged in)
                        </label>
                        <input type="text" value={homeSlideshowSettings.buttonTextGuest} maxLength={60}
                          onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonTextGuest: e.target.value }))}
                          className="gov-input" style={{ marginBottom: '1.25rem', marginTop: 0 }}
                          placeholder="e.g. Start Your Journey" />

                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                          Button Text — Logged-in User
                        </label>
                        <input type="text" value={homeSlideshowSettings.buttonTextUser} maxLength={60}
                          onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonTextUser: e.target.value }))}
                          className="gov-input" style={{ marginBottom: 0, marginTop: 0 }}
                          placeholder="e.g. Explore Now" />

                        <div style={{ marginTop: '1.1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#111827' }}>Slideshow Font & Button Colors</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.7rem', marginBottom: '0.75rem' }}>
                            {[
                              { key: 'titleColor', label: 'Title' },
                              { key: 'descriptionColor', label: 'Description' },
                              { key: 'tagTextColor', label: 'Tag Text' },
                              { key: 'tagBgColor', label: 'Tag Background' },
                              { key: 'buttonColor', label: 'Button Background' },
                              { key: 'buttonTextColor', label: 'Button Text' },
                            ].map(item => (
                              <div key={item.key}>
                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.78rem', color: '#374151', marginBottom: '0.35rem' }}>{item.label}</label>
                                <input
                                  type="color"
                                  value={homeSlideshowSettings[item.key] || '#ffffff'}
                                  onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                                  style={{ width: '100%', height: 34, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
                                />
                              </div>
                            ))}
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#374151', fontWeight: 700 }}>
                            <input
                              type="checkbox"
                              checked={Boolean(homeSlideshowSettings.buttonTransparent)}
                              onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonTransparent: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }}
                            />
                            Use transparent button style
                          </label>

                          <div style={{ marginTop: '1.1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: '#111827' }}>Button Styling & Effects</h3>
                            
                            {/* Button Border Radius */}
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                              Button Border Radius — {homeSlideshowSettings.buttonBorderRadius}px
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="50"
                              step="1"
                              value={homeSlideshowSettings.buttonBorderRadius || 50}
                              onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonBorderRadius: Number(e.target.value) }))}
                              style={{ width: '100%', accentColor: '#16a34a', marginBottom: '0.75rem' }}
                            />

                            {/* Button Border */}
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>Border Color</label>
                            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' }}>
                              <input
                                type="color"
                                value={homeSlideshowSettings.buttonBorderColor || '#ffffff'}
                                onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonBorderColor: e.target.value }))}
                                style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
                              />
                              <input
                                type="range"
                                min="0"
                                max="5"
                                step="0.5"
                                value={homeSlideshowSettings.buttonBorderWidth || 0}
                                onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonBorderWidth: Number(e.target.value) }))}
                                style={{ flex: 1, accentColor: '#16a34a' }}
                              />
                              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: 600 }}>{homeSlideshowSettings.buttonBorderWidth || 0}px</span>
                            </div>

                            {/* Button Padding */}
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                              Button Size (Padding)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                              <div>
                                <small style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>Vertical: {homeSlideshowSettings.buttonPaddingVertical}rem</small>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2"
                                  step="0.1"
                                  value={homeSlideshowSettings.buttonPaddingVertical || 1}
                                  onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonPaddingVertical: Number(e.target.value) }))}
                                  style={{ width: '100%', accentColor: '#16a34a' }}
                                />
                              </div>
                              <div>
                                <small style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>Horizontal: {homeSlideshowSettings.buttonPaddingHorizontal}rem</small>
                                <input
                                  type="range"
                                  min="1"
                                  max="4"
                                  step="0.1"
                                  value={homeSlideshowSettings.buttonPaddingHorizontal || 2.5}
                                  onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonPaddingHorizontal: Number(e.target.value) }))}
                                  style={{ width: '100%', accentColor: '#16a34a' }}
                                />
                              </div>
                            </div>

                            {/* Button Shadow */}
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                              Shadow — Blur {homeSlideshowSettings.buttonShadowBlur}px, Opacity {Math.round((homeSlideshowSettings.buttonShadowOpacity || 0.3) * 100)}%
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
                              <input
                                type="range"
                                min="0"
                                max="50"
                                step="1"
                                value={homeSlideshowSettings.buttonShadowBlur || 25}
                                onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonShadowBlur: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#16a34a' }}
                              />
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={homeSlideshowSettings.buttonShadowOpacity || 0.3}
                                onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonShadowOpacity: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#16a34a' }}
                              />
                            </div>

                            {/* Hover Animation */}
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>Hover Animation</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              {['lift', 'scale', 'glow', 'slide'].map(anim => (
                                <button
                                  key={anim}
                                  onClick={() => setHomeSlideshowSettings(prev => ({ ...prev, buttonHoverAnimation: anim }))}
                                  style={{
                                    padding: '0.45rem 0.75rem',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    border: '2px solid',
                                    cursor: 'pointer',
                                    background: homeSlideshowSettings.buttonHoverAnimation === anim ? '#16a34a' : 'white',
                                    color: homeSlideshowSettings.buttonHoverAnimation === anim ? 'white' : '#374151',
                                    borderColor: homeSlideshowSettings.buttonHoverAnimation === anim ? '#16a34a' : '#e5e7eb',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {anim.charAt(0).toUpperCase() + anim.slice(1)}
                                </button>
                              ))}
                            </div>

                            {/* Hover Shadow */}
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                              Hover Shadow — Blur {homeSlideshowSettings.buttonHoverShadowBlur}px
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="60"
                              step="1"
                              value={homeSlideshowSettings.buttonHoverShadowBlur || 40}
                              onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, buttonHoverShadowBlur: Number(e.target.value) }))}
                              style={{ width: '100%', accentColor: '#16a34a', marginBottom: '0.75rem' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Overlay + Live Preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Live Preview */}
                        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                          <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Live Preview</h2>
                          <p style={{ margin: '0 0 0.8rem', fontSize: '0.78rem', color: '#6b7280' }}>Updates instantly for the guest home slideshow style.</p>
                          <div style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', background: '#1a1a2e', marginBottom: '0.5rem' }}>
                            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=70)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div style={{ position: 'absolute', inset: 0, background: `rgba(${hsRgb}, ${homeSlideshowSettings.overlayOpacity.toFixed(2)})` }} />
                            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', height: '100%', padding: '1.25rem' }}>
                              <span style={{ background: homeSlideshowSettings.tagBgColor || '#ffffff', color: homeSlideshowSettings.tagTextColor || '#ffffff', borderRadius: 20, padding: '3px 12px', fontSize: '0.74rem', fontWeight: 700, marginBottom: '0.4rem', backdropFilter: 'blur(4px)' }}>
                                {homeSlideshowSettings.tagText || 'Featured Destination'}
                              </span>
                              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: homeSlideshowSettings.titleColor || '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.5)', marginBottom: '0.4rem' }}>Attraction Name</div>
                              <div style={{ fontSize: '0.78rem', color: homeSlideshowSettings.descriptionColor || '#e5e7eb', marginBottom: '0.65rem' }}>Short description of this amazing place…</div>
                              <button style={{
                                background: homeSlideshowSettings.buttonTransparent ? 'rgba(255,255,255,0.2)' : (homeSlideshowSettings.buttonColor || '#ffffff'),
                                color: homeSlideshowSettings.buttonTextColor || '#111',
                                border: `${homeSlideshowSettings.buttonBorderWidth || 0}px solid ${homeSlideshowSettings.buttonBorderColor || '#ffffff'}`,
                                borderRadius: `${homeSlideshowSettings.buttonBorderRadius || 50}px`,
                                padding: `${homeSlideshowSettings.buttonPaddingVertical || 1}rem ${homeSlideshowSettings.buttonPaddingHorizontal || 2.5}rem`,
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'default',
                                transition: 'all 0.3s ease',
                                boxShadow: `0 ${(homeSlideshowSettings.buttonShadowBlur || 25) * 0.5}px ${homeSlideshowSettings.buttonShadowBlur || 25}px rgba(0, 0, 0, ${homeSlideshowSettings.buttonShadowOpacity || 0.3})`
                              }}>
                                {homeSlideshowSettings.buttonTextGuest || 'Start Your Journey'}
                              </button>
                            </div>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af' }}>Showing guest version in Live Preview. Attraction images are loaded from your database.</p>
                        </div>

                        {/* Button Preview Panel */}
                        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Button Preview</h2>
                          <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '2rem', textAlign: 'center', marginBottom: '1.25rem' }}>
                            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Normal State</p>
                            <button style={{
                              background: homeSlideshowSettings.buttonTransparent ? 'rgba(255,255,255,0.2)' : (homeSlideshowSettings.buttonColor || '#ffffff'),
                              color: homeSlideshowSettings.buttonTextColor || '#111',
                              border: `${homeSlideshowSettings.buttonBorderWidth || 0}px solid ${homeSlideshowSettings.buttonBorderColor || '#ffffff'}`,
                              borderRadius: `${homeSlideshowSettings.buttonBorderRadius || 50}px`,
                              padding: `${homeSlideshowSettings.buttonPaddingVertical || 1}rem ${homeSlideshowSettings.buttonPaddingHorizontal || 2.5}rem`,
                              fontWeight: 700,
                              fontSize: '1rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              boxShadow: `0 ${(homeSlideshowSettings.buttonShadowBlur || 25) * 0.5}px ${homeSlideshowSettings.buttonShadowBlur || 25}px rgba(0, 0, 0, ${homeSlideshowSettings.buttonShadowOpacity || 0.3})`
                            }}>
                              {homeSlideshowSettings.buttonTextGuest || 'Start Your Journey'}
                            </button>
                          </div>
                          <div style={{ background: '#f8f9fa', borderRadius: 12, padding: '2rem', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>Hover State ({homeSlideshowSettings.buttonHoverAnimation})</p>
                            <button style={{
                              background: homeSlideshowSettings.buttonTransparent ? 'rgba(255,255,255,0.1)' : (homeSlideshowSettings.buttonColor || '#ffffff'),
                              color: homeSlideshowSettings.buttonTextColor || '#111',
                              border: `${homeSlideshowSettings.buttonBorderWidth || 0}px solid ${homeSlideshowSettings.buttonBorderColor || '#ffffff'}`,
                              borderRadius: `${homeSlideshowSettings.buttonBorderRadius || 50}px`,
                              padding: `${homeSlideshowSettings.buttonPaddingVertical || 1}rem ${homeSlideshowSettings.buttonPaddingHorizontal || 2.5}rem`,
                              fontWeight: 700,
                              fontSize: '1rem',
                              cursor: 'default',
                              boxShadow: `0 ${(homeSlideshowSettings.buttonHoverShadowBlur || 40) * 0.5}px ${homeSlideshowSettings.buttonHoverShadowBlur || 40}px rgba(0, 0, 0, ${homeSlideshowSettings.buttonShadowOpacity || 0.3})`,
                              transform: homeSlideshowSettings.buttonHoverAnimation === 'lift' ? 'translateY(-4px)' :
                                        homeSlideshowSettings.buttonHoverAnimation === 'scale' ? 'scale(1.08)' :
                                        homeSlideshowSettings.buttonHoverAnimation === 'glow' ? 'scale(1.02)' :
                                        homeSlideshowSettings.buttonHoverAnimation === 'slide' ? 'translateX(4px)' : 'none',
                              filter: homeSlideshowSettings.buttonHoverAnimation === 'glow' ? 'drop-shadow(0 0 10px rgba(46, 125, 50, 0.4))' : 'none',
                              transition: 'all 0.3s ease'
                            }}>
                              {homeSlideshowSettings.buttonTextGuest || 'Start Your Journey'}
                            </button>
                          </div>
                        </div>

                        {/* Overlay Settings */}
                        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Slide Overlay</h2>
                          <div style={colorFieldStyle}>
                            <input type="color" value={homeSlideshowSettings.overlayColor}
                              onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, overlayColor: e.target.value }))}
                              style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
                            <input type="text" value={homeSlideshowSettings.overlayColor}
                              onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setHomeSlideshowSettings(prev => ({ ...prev, overlayColor: e.target.value }))}
                              className="gov-input" style={{ flex: 1, marginTop: 0, fontFamily: 'monospace', fontSize: '0.9rem' }} maxLength={7} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                            {colorPresets.map(c => colorSwatchBtn(c, homeSlideshowSettings.overlayColor, setHomeSlideshowSettings, 'overlayColor'))}
                          </div>
                          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>
                            Opacity — {Math.round(homeSlideshowSettings.overlayOpacity * 100)}%
                          </label>
                          <input type="range" min="0" max="0.9" step="0.05" value={homeSlideshowSettings.overlayOpacity}
                            onChange={e => setHomeSlideshowSettings(prev => ({ ...prev, overlayOpacity: parseFloat(e.target.value) }))}
                            style={{ width: '100%', accentColor: '#16a34a' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                            <span>0% (none)</span><span>90% (dark)</span>
                          </div>
                        </div>

                        {/* Home Slideshow Extended */}
                        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Playback Settings</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {msgBadge(homeSlideshowExtMsg)}
                              <button onClick={saveHomeSlideshowExt} disabled={homeSlideshowExtSaving} className="gov-btn gov-btn--primary" style={{ padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.82rem' }}>{homeSlideshowExtSaving ? 'Saving…' : 'Save'}</button>
                            </div>
                          </div>
                          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                            Slide Speed — {homeSlideshowExt.intervalSeconds}s
                          </label>
                          <input type="range" min="2" max="12" step="1" value={homeSlideshowExt.intervalSeconds}
                            onChange={e => setHomeSlideshowExt(p => ({ ...p, intervalSeconds: Number(e.target.value) }))}
                            style={{ width: '100%', accentColor: '#16a34a', marginBottom: '1.25rem' }} />
                          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>Transition Style</label>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            {['fade', 'slide'].map(t => (
                              <button key={t} onClick={() => setHomeSlideshowExt(p => ({ ...p, transition: t }))}
                                style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: '2px solid', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                                  background: homeSlideshowExt.transition === t ? '#16a34a' : 'white',
                                  color: homeSlideshowExt.transition === t ? '#fff' : '#374151',
                                  borderColor: homeSlideshowExt.transition === t ? '#16a34a' : '#e5e7eb' }}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                              </button>
                            ))}
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: '#374151' }}>
                            <input type="checkbox" checked={homeSlideshowExt.showArrows}
                              onChange={e => setHomeSlideshowExt(p => ({ ...p, showArrows: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                            Show navigation arrows
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 3: Website Colors */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'theme' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                      {msgBadge(siteThemeMsg)}
                      <button onClick={saveSiteTheme} disabled={siteThemeSaving}
                        className="gov-btn gov-btn--primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                        {siteThemeSaving ? 'Saving…' : 'Save & Apply Colors'}
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      {/* Color editors */}
                      {[
                        { key: 'primary', label: 'Primary Color', desc: 'Main brand color used for buttons, links, and accents.' },
                        { key: 'primaryDark', label: 'Primary Dark', desc: 'Darker variant used for hover states and gradients.' },
                        { key: 'primaryLight', label: 'Primary Light', desc: 'Light variant used for backgrounds and badges.' },
                        { key: 'secondary', label: 'Secondary Color', desc: 'Accent color for secondary elements and badges.' },
                        { key: 'secondaryDark', label: 'Secondary Dark', desc: 'Darker secondary for hover and gradients.' },
                        { key: 'navBg', label: 'Navigation Background', desc: 'Background color of the top navigation bar.' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: siteTheme[key], boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#111827' }}>{label}</div>
                              <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{desc}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            <input type="color" value={siteTheme[key]} onChange={e => setSiteTheme(prev => ({ ...prev, [key]: e.target.value }))}
                              style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 2, flexShrink: 0 }} />
                            <input type="text" value={siteTheme[key]}
                              onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setSiteTheme(prev => ({ ...prev, [key]: e.target.value }))}
                              className="gov-input" style={{ flex: 1, marginTop: 0, fontFamily: 'monospace', fontSize: '0.875rem' }} maxLength={7} />
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {colorPresets.map(c => colorSwatchBtn(c, siteTheme[key], setSiteTheme, key))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Preview bar */}
                    <div style={{ marginTop: '1.5rem', background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                      <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>Live Preview</h2>
                      <p style={{ margin: '0 0 0.8rem', fontSize: '0.78rem', color: '#6b7280' }}>Updates instantly as you pick website colors.</p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {Object.entries(siteTheme).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: v, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                            <span style={{ fontSize: '0.65rem', color: '#6b7280', fontFamily: 'monospace' }}>{v}</span>
                            <span style={{ fontSize: '0.62rem', color: '#9ca3af' }}>{k}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button style={{ background: siteTheme.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'default' }}>Primary Button</button>
                        <button style={{ background: 'white', color: siteTheme.primary, border: `2px solid ${siteTheme.primary}`, borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'default' }}>Outline Button</button>
                        <button style={{ background: siteTheme.secondary, color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'default' }}>Secondary Button</button>
                        <div style={{ background: siteTheme.navBg, color: '#fff', borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.875rem' }}>Nav Bar</div>
                      </div>
                      <p style={{ margin: '1rem 0 0', fontSize: '0.8rem', color: '#9ca3af' }}>
                        Colors are saved to the database and applied as CSS variables across the entire site on next page load.
                      </p>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 4: Typography */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'typography' && (() => {
                  const selectStyle = { padding: '0.6rem 0.85rem', borderRadius: 10, border: '2px solid #e5e7eb', fontSize: '0.9rem', fontWeight: 600, background: 'white', cursor: 'pointer', width: '100%' };
                  const cardStyle = { background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' };
                  const scaleFactor = TYPOGRAPHY_SCALE_OPTIONS.find(option => option.value === typography.fontScale)?.factor || 1;
                  const previewDevice = TYPOGRAPHY_PREVIEW_DEVICES.find(device => device.value === typographyPreviewDevice) || TYPOGRAPHY_PREVIEW_DEVICES[2];
                  const previewHeadingStyle = {
                    margin: 0,
                    fontFamily: typography.headingFont,
                    fontWeight: Number(typography.headingWeight),
                    lineHeight: typography.headingLineHeight,
                    letterSpacing: `${typography.headingLetterSpacing}em`,
                    fontSize: scaleTypographyLength(typography.h1Size, scaleFactor),
                    color: '#0f172a',
                  };
                  const previewSubheadingStyle = {
                    margin: 0,
                    fontFamily: typography.headingFont,
                    fontWeight: Number(typography.headingWeight),
                    lineHeight: typography.headingLineHeight,
                    letterSpacing: `${typography.headingLetterSpacing}em`,
                    fontSize: scaleTypographyLength(typography.h3Size, scaleFactor),
                    color: '#1f2937',
                  };
                  const previewBodyStyle = {
                    margin: 0,
                    fontFamily: typography.bodyFont,
                    fontWeight: Number(typography.bodyWeight),
                    lineHeight: typography.bodyLineHeight,
                    letterSpacing: `${typography.bodyLetterSpacing}em`,
                    fontSize: scaleTypographyLength(typography.bodySize, scaleFactor),
                    color: '#4b5563',
                  };
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {msgBadge(typographyMsg)}
                        <button onClick={() => setTypography(DEFAULT_TYPOGRAPHY)} className="gov-btn gov-btn-ghost" style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}>Reset Defaults</button>
                        <button onClick={saveTypography} disabled={typographySaving} className="gov-btn gov-btn--primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>{typographySaving ? 'Saving…' : 'Save Typography'}</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                          <h2 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Typography Presets</h2>
                          <p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.92rem', lineHeight: 1.6 }}>Choose a preset to establish a visual direction, then fine-tune the individual controls below.</p>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.9rem' }}>
                            {TYPOGRAPHY_PRESETS.map(preset => {
                              const isActive = typography.preset === preset.id;
                              return (
                                <button
                                  key={preset.id}
                                  onClick={() => setTypography({ ...preset.values })}
                                  style={{
                                    textAlign: 'left',
                                    padding: '1rem',
                                    borderRadius: 14,
                                    border: `2px solid ${isActive ? '#16a34a' : '#d1d5db'}`,
                                    background: isActive ? 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(34,197,94,0.12))' : '#ffffff',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '0.45rem' }}>
                                    <strong style={{ color: '#111827', fontSize: '0.96rem' }}>{preset.label}</strong>
                                    {isActive && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>ACTIVE</span>}
                                  </div>
                                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.82rem', lineHeight: 1.55 }}>{preset.description}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div style={cardStyle}>
                          <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Font Families</h2>
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>Heading Font</label>
                              <select value={typography.headingFont} onChange={e => updateTypography({ headingFont: e.target.value })} style={selectStyle}>
                                {TYPOGRAPHY_FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>Body Font</label>
                              <select value={typography.bodyFont} onChange={e => updateTypography({ bodyFont: e.target.value })} style={selectStyle}>
                                {TYPOGRAPHY_FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>Heading Weight</label>
                                <select value={typography.headingWeight} onChange={e => updateTypography({ headingWeight: e.target.value })} style={selectStyle}>
                                  {TYPOGRAPHY_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>Body Weight</label>
                                <select value={typography.bodyWeight} onChange={e => updateTypography({ bodyWeight: e.target.value })} style={selectStyle}>
                                  {TYPOGRAPHY_WEIGHT_OPTIONS.map(weight => <option key={weight.value} value={weight.value}>{weight.label}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div style={cardStyle}>
                          <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Rhythm and Spacing</h2>
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>
                                <span>Heading Line Height</span>
                                <span>{typography.headingLineHeight}</span>
                              </label>
                              <input type="range" min="1" max="1.5" step="0.05" value={typography.headingLineHeight} onChange={e => updateTypography({ headingLineHeight: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>
                                <span>Body Line Height</span>
                                <span>{typography.bodyLineHeight}</span>
                              </label>
                              <input type="range" min="1.3" max="2" step="0.05" value={typography.bodyLineHeight} onChange={e => updateTypography({ bodyLineHeight: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>
                                <span>Heading Letter Spacing</span>
                                <span>{typography.headingLetterSpacing}em</span>
                              </label>
                              <input type="range" min="-0.06" max="0.08" step="0.01" value={typography.headingLetterSpacing} onChange={e => updateTypography({ headingLetterSpacing: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>
                                <span>Body Letter Spacing</span>
                                <span>{typography.bodyLetterSpacing}em</span>
                              </label>
                              <input type="range" min="-0.02" max="0.08" step="0.01" value={typography.bodyLetterSpacing} onChange={e => updateTypography({ bodyLetterSpacing: e.target.value })} style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>

                        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                          <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Scale and Sizing</h2>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {TYPOGRAPHY_SCALE_OPTIONS.map(option => (
                              <button key={option.value} onClick={() => updateTypography({ fontScale: option.value })}
                                style={{ padding: '0.7rem 1.5rem', borderRadius: 10, border: '2px solid', fontWeight: 700, fontSize: `calc(0.9rem * ${option.factor})`, cursor: 'pointer',
                                  background: typography.fontScale === option.value ? '#16a34a' : 'white',
                                  color: typography.fontScale === option.value ? '#fff' : '#374151',
                                  borderColor: typography.fontScale === option.value ? '#16a34a' : '#e5e7eb' }}>
                                {option.label}
                              </button>
                            ))}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.9rem', marginTop: '1.25rem' }}>
                            {[
                              ['H1 Size', 'h1Size'],
                              ['H2 Size', 'h2Size'],
                              ['H3 Size', 'h3Size'],
                              ['Body Size', 'bodySize'],
                              ['Nav Size', 'navFontSize'],
                              ['Button Size', 'buttonFontSize'],
                            ].map(([label, key]) => (
                              <div key={key}>
                                <label style={{ display: 'block', marginBottom: '0.45rem', fontWeight: 700, color: '#374151' }}>{label}</label>
                                <select value={typography[key]} onChange={e => updateTypography({ [key]: e.target.value })} style={selectStyle}>
                                  {TYPOGRAPHY_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '1.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: 700, color: '#374151' }}>Content Width</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                              {TYPOGRAPHY_CONTENT_WIDTH_OPTIONS.map(option => (
                                <button
                                  key={option.value}
                                  onClick={() => updateTypography({ contentMaxWidth: option.value })}
                                  style={{
                                    padding: '0.65rem 1rem',
                                    borderRadius: 10,
                                    border: '2px solid',
                                    borderColor: typography.contentMaxWidth === option.value ? '#16a34a' : '#e5e7eb',
                                    background: typography.contentMaxWidth === option.value ? '#f0fdf4' : '#ffffff',
                                    color: '#374151',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {option.label} · {option.value}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            <div>
                              <h2 style={{ margin: '0 0 0.4rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Live Preview</h2>
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>Preview headings, body copy, navigation, buttons, and reading width before saving.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                              {TYPOGRAPHY_PREVIEW_DEVICES.map(device => (
                                <button
                                  key={device.value}
                                  onClick={() => setTypographyPreviewDevice(device.value)}
                                  style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: 10,
                                    border: '2px solid',
                                    borderColor: typographyPreviewDevice === device.value ? '#16a34a' : '#d1d5db',
                                    background: typographyPreviewDevice === device.value ? '#f0fdf4' : '#ffffff',
                                    color: '#374151',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {device.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div style={{ background: '#f8fafc', borderRadius: 18, padding: '1rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ width: previewDevice.width, maxWidth: '100%', margin: '0 auto', background: '#ffffff', borderRadius: 18, border: '1px solid #dbeafe', overflow: 'hidden', boxShadow: '0 8px 28px rgba(15, 23, 42, 0.08)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #e5e7eb' }}>
                                <div>
                                  <p style={{ margin: 0, fontFamily: typography.headingFont, fontSize: scaleTypographyLength(typography.h3Size, scaleFactor), fontWeight: Number(typography.headingWeight), lineHeight: typography.headingLineHeight, letterSpacing: `${typography.headingLetterSpacing}em`, color: '#0f172a' }}>NaujanGO</p>
                                  <p style={{ ...previewBodyStyle, fontSize: scaleTypographyLength(typography.navFontSize, scaleFactor), color: '#64748b' }}>Discover Naujan</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  {['Home', 'Attractions', 'Hotels'].map(item => (
                                    <span key={item} style={{ fontFamily: typography.bodyFont, fontSize: scaleTypographyLength(typography.navFontSize, scaleFactor), fontWeight: Number(typography.bodyWeight), lineHeight: typography.bodyLineHeight, letterSpacing: `${typography.bodyLetterSpacing}em`, color: '#334155' }}>{item}</span>
                                  ))}
                                </div>
                              </div>

                              <div style={{ maxWidth: typography.contentMaxWidth, margin: '0 auto', padding: '1.5rem 1.25rem 1.75rem' }}>
                                <p style={{ ...previewBodyStyle, marginBottom: '0.75rem', color: '#16a34a', fontWeight: 700 }}>Featured Destination</p>
                                <h1 style={{ ...previewHeadingStyle, marginBottom: '0.75rem' }}>Discover Naujan</h1>
                                <h3 style={{ ...previewSubheadingStyle, marginBottom: '0.75rem' }}>Oriental Mindoro, Philippines</h3>
                                <p style={{ ...previewBodyStyle, maxWidth: '62ch', marginBottom: '1.25rem' }}>Explore waterfalls, lakes, eco-parks, and local stays with a typography system that improves hierarchy, readability, and trust across the site.</p>
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                  <button style={{ padding: '0.8rem 1.25rem', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 12, fontFamily: typography.bodyFont, fontWeight: 700, fontSize: scaleTypographyLength(typography.buttonFontSize, scaleFactor), letterSpacing: `${typography.bodyLetterSpacing}em`, cursor: 'default' }}>Start Your Journey</button>
                                  <button style={{ padding: '0.8rem 1.25rem', background: '#ffffff', color: '#166534', border: '2px solid #16a34a', borderRadius: 12, fontFamily: typography.bodyFont, fontWeight: 700, fontSize: scaleTypographyLength(typography.buttonFontSize, scaleFactor), letterSpacing: `${typography.bodyLetterSpacing}em`, cursor: 'default' }}>View Hotels</button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: previewDevice.value === 'mobile' ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '1rem' }}>
                                  {[1, 2].map(card => (
                                    <div key={card} style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '1rem' }}>
                                      <h3 style={{ ...previewSubheadingStyle, marginBottom: '0.5rem' }}>Curated Stay {card}</h3>
                                      <p style={previewBodyStyle}>Readable body copy, controlled measure, and consistent typography create a stronger booking and discovery experience.</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 5: Announcement Bar */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'announcement' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {msgBadge(announcementMsg)}
                      <button onClick={saveAnnouncement} disabled={announcementSaving} className="gov-btn gov-btn--primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>{announcementSaving ? 'Saving…' : 'Save Announcement'}</button>
                    </div>

                    {/* Live preview */}
                    {announcement.enabled && (
                      <div style={{ marginBottom: '1.25rem', borderRadius: 10, padding: '0.7rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: announcement.bgColor, color: announcement.textColor, fontSize: '0.9rem', fontWeight: 600 }}>
                        <span>{announcement.message}{announcement.linkUrl && announcement.linkLabel && <> — <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>{announcement.linkLabel}</span></>}</span>
                        {announcement.dismissible && <span style={{ cursor: 'pointer', fontSize: '1.1rem', opacity: 0.7 }}>✕</span>}
                      </div>
                    )}
                    {!announcement.enabled && (
                      <div style={{ marginBottom: '1.25rem', background: '#f9fafb', borderRadius: 10, padding: '0.75rem 1.25rem', color: '#9ca3af', fontSize: '0.875rem', border: '2px dashed #e5e7eb', textAlign: 'center' }}>
                        Announcement bar is disabled — enable it below to show it on the site.
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb', gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', color: '#111827', marginBottom: '1.25rem' }}>
                          <input type="checkbox" checked={announcement.enabled}
                            onChange={e => setAnnouncement(p => ({ ...p, enabled: e.target.checked }))}
                            style={{ width: 18, height: 18, accentColor: '#16a34a' }} />
                          Enable Announcement Bar
                        </label>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>Message</label>
                        <input type="text" value={announcement.message} maxLength={200}
                          onChange={e => setAnnouncement(p => ({ ...p, message: e.target.value }))}
                          className="gov-input" style={{ marginBottom: '1.25rem', marginTop: 0 }} placeholder="Enter your announcement message…" />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>Link Label <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                            <input type="text" value={announcement.linkLabel} maxLength={60}
                              onChange={e => setAnnouncement(p => ({ ...p, linkLabel: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} placeholder="Learn More" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>Link URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span></label>
                            <input type="url" value={announcement.linkUrl}
                              onChange={e => setAnnouncement(p => ({ ...p, linkUrl: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} placeholder="https://…" />
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', color: '#374151' }}>
                          <input type="checkbox" checked={announcement.dismissible}
                            onChange={e => setAnnouncement(p => ({ ...p, dismissible: e.target.checked }))}
                            style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                          Allow users to dismiss the bar
                        </label>
                      </div>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Background Color</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <input type="color" value={announcement.bgColor} onChange={e => setAnnouncement(p => ({ ...p, bgColor: e.target.value }))}
                            style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
                          <input type="text" value={announcement.bgColor}
                            onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setAnnouncement(p => ({ ...p, bgColor: e.target.value }))}
                            className="gov-input" style={{ flex: 1, marginTop: 0, fontFamily: 'monospace' }} maxLength={7} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {['#16a34a','#1d4ed8','#9333ea','#dc2626','#d97706','#0891b2','#1e293b','#000000'].map(c => (
                            <button key={c} onClick={() => setAnnouncement(p => ({ ...p, bgColor: c }))}
                              style={{ width: 28, height: 28, borderRadius: 6, background: c, border: 'none', cursor: 'pointer',
                                boxShadow: announcement.bgColor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : '0 1px 4px rgba(0,0,0,0.25)',
                                transform: announcement.bgColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800, color: '#111827' }}>Text Color</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                          <input type="color" value={announcement.textColor} onChange={e => setAnnouncement(p => ({ ...p, textColor: e.target.value }))}
                            style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #e5e7eb', cursor: 'pointer', padding: 2 }} />
                          <input type="text" value={announcement.textColor}
                            onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && setAnnouncement(p => ({ ...p, textColor: e.target.value }))}
                            className="gov-input" style={{ flex: 1, marginTop: 0, fontFamily: 'monospace' }} maxLength={7} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {['#ffffff','#f9fafb','#111827','#1f2937','#fef9c3','#fce7f3'].map(c => (
                            <button key={c} onClick={() => setAnnouncement(p => ({ ...p, textColor: c }))}
                              style={{ width: 28, height: 28, borderRadius: 6, background: c, border: '1px solid #e5e7eb', cursor: 'pointer',
                                boxShadow: announcement.textColor === c ? `0 0 0 3px white, 0 0 0 5px #374151` : '0 1px 4px rgba(0,0,0,0.1)',
                                transform: announcement.textColor === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s' }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 6: Footer */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'footer' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {msgBadge(footerMsg)}
                      <button onClick={saveFooterSettings} disabled={footerSaving} className="gov-btn gov-btn--primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>{footerSaving ? 'Saving…' : 'Save Footer'}</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Text Content</h2>
                        {[
                          { key: 'tagline', label: 'Tagline / About blurb', placeholder: 'Your gateway to the beauty of Naujan…' },
                          { key: 'copyright', label: 'Copyright text', placeholder: 'NaujanGO. All rights reserved.' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} style={{ marginBottom: '1.1rem' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>{label}</label>
                            <input type="text" value={footerSettings[key]} maxLength={200}
                              onChange={e => setFooterSettings(p => ({ ...p, [key]: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} placeholder={placeholder} />
                          </div>
                        ))}
                      </div>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Contact Info</h2>
                        {[
                          { key: 'contactEmail', label: 'Email', placeholder: 'info@naujango.ph' },
                          { key: 'contactPhone', label: 'Phone', placeholder: '+63 43 XXX-XXXX' },
                          { key: 'contactAddress', label: 'Address', placeholder: 'Naujan, Oriental Mindoro' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} style={{ marginBottom: '1.1rem' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>{label}</label>
                            <input type="text" value={footerSettings[key]} maxLength={150}
                              onChange={e => setFooterSettings(p => ({ ...p, [key]: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} placeholder={placeholder} />
                          </div>
                        ))}
                      </div>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb', gridColumn: '1 / -1' }}>
                        <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Social Media Links</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          {[
                            { key: 'facebook', label: '🔵 Facebook URL' },
                            { key: 'instagram', label: '📸 Instagram URL' },
                            { key: 'twitter', label: '🐦 Twitter/X URL' },
                            { key: 'youtube', label: '▶️ YouTube URL' },
                          ].map(({ key, label }) => (
                            <div key={key}>
                              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>{label}</label>
                              <input type="url" value={footerSettings[key]}
                                onChange={e => setFooterSettings(p => ({ ...p, [key]: e.target.value }))}
                                className="gov-input" style={{ marginTop: 0 }} placeholder="https://…" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 7: Page Sections */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'sections' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {msgBadge(sectionsMsg)}
                      <button onClick={saveHomepageSections} disabled={sectionsSaving} className="gov-btn gov-btn--primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>{sectionsSaving ? 'Saving…' : 'Save Sections'}</button>
                    </div>

                    <p style={{ margin: '0 0 1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      Toggle each section on or off for the homepage. Sections marked <strong>(Guest)</strong> appear only to visitors not logged in;
                      sections marked <strong>(Logged-in)</strong> appear only to authenticated users.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                      {/* Hero Slideshow */}
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${homepageSections.showHeroSlideshow !== false ? '#16a34a' : '#e5e7eb'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.Film size={16} /> Hero Slideshow</h2>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={homepageSections.showHeroSlideshow !== false}
                              onChange={e => setHomepageSections(p => ({ ...p, showHeroSlideshow: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: homepageSections.showHeroSlideshow !== false ? '#16a34a' : '#9ca3af' }}>
                              {homepageSections.showHeroSlideshow !== false ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>The full-screen attractions slideshow at the very top of the homepage.</p>
                      </div>

                      {/* Welcome Section */}
                      {[
                        { key: 'Welcome',     showKey: 'showWelcome',     titleKey: 'welcomeTitle',      subKey: 'welcomeSubtitle',      icon: <Icons.Sparkles size={16} /> },
                        { key: 'Attractions', showKey: 'showAttractions', titleKey: 'attractionsTitle',  subKey: 'attractionsSubtitle',  icon: <Icons.Attraction size={16} /> },
                        { key: 'Hotels',      showKey: 'showHotels',      titleKey: 'hotelsTitle',        subKey: 'hotelsSubtitle',        icon: <Icons.Hotel size={16} /> },
                      ].map(({ key, showKey, titleKey, subKey, icon }) => (
                        <div key={key} style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${homepageSections[showKey] ? '#16a34a' : '#e5e7eb'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{icon} {key} Section</h2>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input type="checkbox" checked={homepageSections[showKey]}
                                onChange={e => setHomepageSections(p => ({ ...p, [showKey]: e.target.checked }))}
                                style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: homepageSections[showKey] ? '#16a34a' : '#9ca3af' }}>
                                {homepageSections[showKey] ? 'Visible' : 'Hidden'}
                              </span>
                            </label>
                          </div>
                          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.3rem' }}>Section Title</label>
                          <input type="text" value={homepageSections[titleKey]} maxLength={80}
                            onChange={e => setHomepageSections(p => ({ ...p, [titleKey]: e.target.value }))}
                            className="gov-input" style={{ marginBottom: '0.85rem', marginTop: 0 }} disabled={!homepageSections[showKey]} />
                          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', color: '#374151', marginBottom: '0.3rem' }}>Subtitle</label>
                          <input type="text" value={homepageSections[subKey]} maxLength={120}
                            onChange={e => setHomepageSections(p => ({ ...p, [subKey]: e.target.value }))}
                            className="gov-input" style={{ marginTop: 0 }} disabled={!homepageSections[showKey]} />
                        </div>
                      ))}

                      {/* Weather Widget */}
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${homepageSections.showWeather ? '#16a34a' : '#e5e7eb'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.Cloud size={16} /> Weather Widget</h2>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={homepageSections.showWeather}
                              onChange={e => setHomepageSections(p => ({ ...p, showWeather: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: homepageSections.showWeather ? '#16a34a' : '#9ca3af' }}>
                              {homepageSections.showWeather ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>Shows the current weather for Naujan inside the Welcome section.</p>
                      </div>

                      {/* Quick Actions */}
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${homepageSections.showQuickActions !== false ? '#16a34a' : '#e5e7eb'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.Sparkles size={16} /> Quick Actions</h2>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={homepageSections.showQuickActions !== false}
                              onChange={e => setHomepageSections(p => ({ ...p, showQuickActions: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: homepageSections.showQuickActions !== false ? '#16a34a' : '#9ca3af' }}>
                              {homepageSections.showQuickActions !== false ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>Grid of shortcut buttons — Attractions, Map, Itinerary, Contact.</p>
                      </div>

                      {/* CTA Section — guest only */}
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${homepageSections.showCta !== false ? '#16a34a' : '#e5e7eb'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.Megaphone size={16} /> Call-to-Action <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#9ca3af' }}>(Guest)</span></h2>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={homepageSections.showCta !== false}
                              onChange={e => setHomepageSections(p => ({ ...p, showCta: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: homepageSections.showCta !== false ? '#16a34a' : '#9ca3af' }}>
                              {homepageSections.showCta !== false ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>The "Ready for an Adventure?" banner with Register / Learn More buttons. Shown to guest visitors only.</p>
                      </div>

                      {/* Benefits Section — guest only */}
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${homepageSections.showBenefits !== false ? '#16a34a' : '#e5e7eb'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.Check size={16} /> Benefits / Why Choose Us <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#9ca3af' }}>(Guest)</span></h2>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={homepageSections.showBenefits !== false}
                              onChange={e => setHomepageSections(p => ({ ...p, showBenefits: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: homepageSections.showBenefits !== false ? '#16a34a' : '#9ca3af' }}>
                              {homepageSections.showBenefits !== false ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>The 6-point "Why Choose Us" benefits grid at the bottom of the guest homepage.</p>
                      </div>

                      {/* Inspiration Section — logged-in only */}
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: `2px solid ${homepageSections.showInspiration !== false ? '#16a34a' : '#e5e7eb'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icons.Sparkles size={16} /> Inspiration / Itineraries <span style={{ fontWeight: 400, fontSize: '0.72rem', color: '#9ca3af' }}>(Logged-in)</span></h2>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={homepageSections.showInspiration !== false}
                              onChange={e => setHomepageSections(p => ({ ...p, showInspiration: e.target.checked }))}
                              style={{ width: 16, height: 16, accentColor: '#16a34a' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: homepageSections.showInspiration !== false ? '#16a34a' : '#9ca3af' }}>
                              {homepageSections.showInspiration !== false ? 'Visible' : 'Hidden'}
                            </span>
                          </label>
                        </div>
                        <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#9ca3af' }}>Featured itinerary cards — Beach &amp; Nature, Cultural Adventure, Hidden Gems. Shown to logged-in users only.</p>
                      </div>

                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB 8: Branding */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'branding' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {msgBadge(brandingMsg)}
                      <button onClick={saveBranding} disabled={brandingSaving} className="gov-btn gov-btn--primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 700 }}>{brandingSaving ? 'Saving…' : 'Save Branding'}</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Site Identity</h2>
                        {[
                          { key: 'siteName', label: 'Site Name', placeholder: 'NaujanGO' },
                          { key: 'tagline', label: 'Tagline', placeholder: 'Your Official Tourism Guide' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} style={{ marginBottom: '1.1rem' }}>
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>{label}</label>
                            <input type="text" value={branding[key]} maxLength={80}
                              onChange={e => setBranding(p => ({ ...p, [key]: e.target.value }))}
                              className="gov-input" style={{ marginTop: 0 }} placeholder={placeholder} />
                          </div>
                        ))}
                        {/* Preview */}
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.4rem', color: '#16a34a' }}>{branding.siteName || 'NaujanGO'}</div>
                          <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '0.25rem' }}>{branding.tagline || 'Your Official Tourism Guide'}</div>
                        </div>
                      </div>
                      <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e5e7eb' }}>
                        <h2 style={{ margin: '0 0 1.25rem', fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Logo & Favicon</h2>
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                          Logo Image URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(replaces nav logo)</span>
                        </label>
                        <input type="url" value={branding.logoUrl}
                          onChange={e => setBranding(p => ({ ...p, logoUrl: e.target.value }))}
                          className="gov-input" style={{ marginBottom: '1.25rem', marginTop: 0 }} placeholder="https://example.com/logo.png" />
                        {branding.logoUrl && (
                          <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img src={branding.logoUrl} alt="Logo preview" style={{ height: 48, objectFit: 'contain', borderRadius: 6, background: '#e5e7eb', padding: 4 }} onError={e => { e.target.style.display = 'none'; }} />
                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Logo live preview</span>
                          </div>
                        )}
                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: '0.4rem' }}>
                          Favicon URL <span style={{ fontWeight: 400, color: '#9ca3af' }}>(browser tab icon, 32×32 recommended)</span>
                        </label>
                        <input type="url" value={branding.faviconUrl}
                          onChange={e => setBranding(p => ({ ...p, faviconUrl: e.target.value }))}
                          className="gov-input" style={{ marginTop: 0 }} placeholder="https://example.com/favicon.ico" />
                      </div>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB: Auth Pages (Login & Register) */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'auth' && (
                  <div>
                    <h1 className="gov-page-title">
                      <Icons.Shield size={32} style={{ verticalAlign: 'middle' }} /> Login & Register Pages
                    </h1>

                    {authPagesMsg && msgBadge(authPagesMsg)}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                      {/* Login Page Settings */}
                      <div className="gov-glass-panel">
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.15rem', fontWeight: 800 }}>Login Page Background</h2>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                          {['solid', 'gradient', 'image'].map(type => (
                            <button
                              key={type}
                              onClick={() => setAuthPageSettings({ ...authPageSettings, loginBgType: type })}
                              style={{
                                padding: '0.6rem 1rem',
                                border: authPageSettings.loginBgType === type ? '2px solid #16a34a' : '2px solid #ddd',
                                borderRadius: '8px',
                                background: authPageSettings.loginBgType === type ? '#f0fdf4' : '#fff',
                                color: authPageSettings.loginBgType === type ? '#16a34a' : '#666',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                              }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>

                        {authPageSettings.loginBgType === 'solid' && (
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Background Color</span>
                            <input
                              type="color"
                              value={authPageSettings.loginSolidColor}
                              onChange={(e) => setAuthPageSettings({ ...authPageSettings, loginSolidColor: e.target.value })}
                              style={{ height: '50px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                            />
                          </label>
                        )}

                        {authPageSettings.loginBgType === 'gradient' && (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Color 1</span>
                              <input
                                type="color"
                                value={authPageSettings.loginGradient.color1}
                                onChange={(e) => setAuthPageSettings({
                                  ...authPageSettings,
                                  loginGradient: { ...authPageSettings.loginGradient, color1: e.target.value }
                                })}
                                style={{ height: '50px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Color 2</span>
                              <input
                                type="color"
                                value={authPageSettings.loginGradient.color2}
                                onChange={(e) => setAuthPageSettings({
                                  ...authPageSettings,
                                  loginGradient: { ...authPageSettings.loginGradient, color2: e.target.value }
                                })}
                                style={{ height: '50px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Angle (degrees)</span>
                              <input
                                type="number"
                                min="0"
                                max="360"
                                value={authPageSettings.loginGradient.angle}
                                onChange={(e) => setAuthPageSettings({
                                  ...authPageSettings,
                                  loginGradient: { ...authPageSettings.loginGradient, angle: Number(e.target.value) }
                                })}
                                className="gov-input"
                              />
                            </label>
                          </div>
                        )}

                        {authPageSettings.loginBgType === 'image' && (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Image URL</span>
                              <input
                                type="text"
                                value={authPageSettings.loginImage}
                                onChange={(e) => setAuthPageSettings({ ...authPageSettings, loginImage: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="gov-input"
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Overlay Opacity (0-1)</span>
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={authPageSettings.loginOverlayOpacity}
                                onChange={(e) => setAuthPageSettings({ ...authPageSettings, loginOverlayOpacity: Number(e.target.value) })}
                                className="gov-input"
                              />
                            </label>
                          </div>
                        )}

                        {/* Preview */}
                        <div style={{
                          marginTop: '1.5rem',
                          height: '200px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid #ddd',
                          background: authPageSettings.loginBgType === 'solid'
                            ? authPageSettings.loginSolidColor
                            : authPageSettings.loginBgType === 'gradient'
                            ? `linear-gradient(${authPageSettings.loginGradient.angle}deg, ${authPageSettings.loginGradient.color1}, ${authPageSettings.loginGradient.color2})`
                            : `linear-gradient(rgba(0,0,0,${authPageSettings.loginOverlayOpacity}), rgba(0,0,0,${authPageSettings.loginOverlayOpacity})), url("${authPageSettings.loginImage}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}>
                        </div>
                      </div>

                      {/* Register Page Settings */}
                      <div className="gov-glass-panel">
                        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.15rem', fontWeight: 800 }}>Register Page Background</h2>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                          {['solid', 'gradient', 'image'].map(type => (
                            <button
                              key={type}
                              onClick={() => setAuthPageSettings({ ...authPageSettings, registerBgType: type })}
                              style={{
                                padding: '0.6rem 1rem',
                                border: authPageSettings.registerBgType === type ? '2px solid #16a34a' : '2px solid #ddd',
                                borderRadius: '8px',
                                background: authPageSettings.registerBgType === type ? '#f0fdf4' : '#fff',
                                color: authPageSettings.registerBgType === type ? '#16a34a' : '#666',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textTransform: 'capitalize'
                              }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>

                        {authPageSettings.registerBgType === 'solid' && (
                          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Background Color</span>
                            <input
                              type="color"
                              value={authPageSettings.registerSolidColor}
                              onChange={(e) => setAuthPageSettings({ ...authPageSettings, registerSolidColor: e.target.value })}
                              style={{ height: '50px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                            />
                          </label>
                        )}

                        {authPageSettings.registerBgType === 'gradient' && (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Color 1</span>
                              <input
                                type="color"
                                value={authPageSettings.registerGradient.color1}
                                onChange={(e) => setAuthPageSettings({
                                  ...authPageSettings,
                                  registerGradient: { ...authPageSettings.registerGradient, color1: e.target.value }
                                })}
                                style={{ height: '50px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Color 2</span>
                              <input
                                type="color"
                                value={authPageSettings.registerGradient.color2}
                                onChange={(e) => setAuthPageSettings({
                                  ...authPageSettings,
                                  registerGradient: { ...authPageSettings.registerGradient, color2: e.target.value }
                                })}
                                style={{ height: '50px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Angle (degrees)</span>
                              <input
                                type="number"
                                min="0"
                                max="360"
                                value={authPageSettings.registerGradient.angle}
                                onChange={(e) => setAuthPageSettings({
                                  ...authPageSettings,
                                  registerGradient: { ...authPageSettings.registerGradient, angle: Number(e.target.value) }
                                })}
                                className="gov-input"
                              />
                            </label>
                          </div>
                        )}

                        {authPageSettings.registerBgType === 'image' && (
                          <div style={{ display: 'grid', gap: '1rem' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Image URL</span>
                              <input
                                type="text"
                                value={authPageSettings.registerImage}
                                onChange={(e) => setAuthPageSettings({ ...authPageSettings, registerImage: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="gov-input"
                              />
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Overlay Opacity (0-1)</span>
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={authPageSettings.registerOverlayOpacity}
                                onChange={(e) => setAuthPageSettings({ ...authPageSettings, registerOverlayOpacity: Number(e.target.value) })}
                                className="gov-input"
                              />
                            </label>
                          </div>
                        )}

                        {/* Preview */}
                        <div style={{
                          marginTop: '1.5rem',
                          height: '200px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid #ddd',
                          background: authPageSettings.registerBgType === 'solid'
                            ? authPageSettings.registerSolidColor
                            : authPageSettings.registerBgType === 'gradient'
                            ? `linear-gradient(${authPageSettings.registerGradient.angle}deg, ${authPageSettings.registerGradient.color1}, ${authPageSettings.registerGradient.color2})`
                            : `linear-gradient(rgba(0,0,0,${authPageSettings.registerOverlayOpacity}), rgba(0,0,0,${authPageSettings.registerOverlayOpacity})), url("${authPageSettings.registerImage}")`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button
                        onClick={saveAuthPages}
                        disabled={authPagesSaving}
                        className="gov-btn gov-btn--primary"
                        style={{ padding: '0.75rem 2rem', fontWeight: 700, fontSize: '1rem' }}
                      >
                        {authPagesSaving ? 'Saving...' : 'Save Auth Pages Settings'}
                      </button>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* TAB: About Page Settings */}
                {/* ══════════════════════════════════════════════════════════ */}
                {customTab === 'about' && (
                  <div>
                    <h1 className="gov-page-title">
                      <Icons.Info size={32} style={{ verticalAlign: 'middle' }} /> About Page Management
                    </h1>

                    <div className="gov-glass-panel leadership-photo-panel" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Leadership photo library</h2>
                          <p style={{ margin: '0.35rem 0 0', color: '#718096', fontSize: '0.85rem' }}>
                            Upload a portrait for any current or historical mayor and vice mayor shown on the About page.
                          </p>
                        </div>
                        {leadershipPhotoMsg && <span style={{ color: leadershipPhotoMsg.type === 'error' ? '#b91c1c' : '#047857', fontWeight: 700, fontSize: '0.85rem' }}>{leadershipPhotoMsg.text}</span>}
                      </div>
                      <div className="leadership-photo-grid">
                        {visibleLeadershipPhotos.map((leader) => {
                          const key = `${leader.role}:${leader.name}:${leader.term}`;
                          const label = leader.role === 'vice-mayor' ? 'Vice Mayor' : 'Mayor';
                          return (
                            <label key={key} className="leadership-photo-tile">
                              {leadershipPhotos[key] ? (
                                <img src={leadershipPhotos[key]} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} />
                              ) : (
                                <span style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', borderRadius: 8, background: '#ecfdf5', color: '#047857', fontWeight: 800 }}>{leader.name.charAt(0)}</span>
                              )}
                              <span style={{ minWidth: 0, flex: 1 }}>
                                <strong style={{ display: 'block', fontSize: '0.8rem', color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leader.name}</strong>
                                <small style={{ display: 'block', color: '#718096' }}>{label} · {leader.term}</small>
                              </span>
                              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(event) => uploadLeadershipPhoto(leader, event.target.files?.[0])} />
                              <Icons.Upload size={16} color="#16a34a" />
                            </label>
                          );
                        })}
                      </div>
                      <div className="leadership-roster-pagination">
                        <span>Showing {leadershipRoster.length ? ((leadershipPhotoPage - 1) * leadershipPhotoPageSize) + 1 : 0}-{Math.min(leadershipPhotoPage * leadershipPhotoPageSize, leadershipRoster.length)} of {leadershipRoster.length}</span>
                        <div>
                          <button type="button" className="gov-btn" disabled={leadershipPhotoPage === 1} onClick={() => setLeadershipPhotoPage((page) => Math.max(1, page - 1))}>Previous</button>
                          <strong>Page {leadershipPhotoPage} of {leadershipPhotoPageCount}</strong>
                          <button type="button" className="gov-btn" disabled={leadershipPhotoPage === leadershipPhotoPageCount} onClick={() => setLeadershipPhotoPage((page) => Math.min(leadershipPhotoPageCount, page + 1))}>Next</button>
                        </div>
                      </div>
                    </div>

                    {aboutPageMsg && (
                      <div style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '10px',
                        background: aboutPageMsg.type === 'error' ? '#fee2e2' : '#ecfdf5',
                        border: `1px solid ${aboutPageMsg.type === 'error' ? '#fecaca' : '#d1fae5'}`,
                        color: aboutPageMsg.type === 'error' ? '#991b1b' : '#065f46',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        {aboutPageMsg.type === 'error' ? <Icons.X size={20} /> : <Icons.Check size={20} />}
                        <span style={{ fontWeight: 600 }}>{aboutPageMsg.text}</span>
                      </div>
                    )}

                    <div className="gov-glass-panel leadership-roster-panel" style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <div>
                          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Leadership roster and order</h2>
                          <p style={{ margin: '0.35rem 0 0', color: '#718096', fontSize: '0.85rem' }}>Organize leaders, mark current officials, and add future elected people.</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {leadershipRosterMsg && <span style={{ color: leadershipRosterMsg.type === 'error' ? '#b91c1c' : '#047857', fontWeight: 700, fontSize: '0.85rem' }}>{leadershipRosterMsg.text}</span>}
                          <button onClick={saveLeadershipRoster} disabled={leadershipRosterSaving} className="gov-btn gov-btn--primary">{leadershipRosterSaving ? 'Saving...' : 'Save roster'}</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: '0.6rem' }}>
                        {visibleLeadershipRoster.map((person, pageIndex) => {
                          const index = (leadershipRosterPage - 1) * leadershipRosterPageSize + pageIndex;
                          return (
                          <div key={person.id} className="leadership-roster-row">
                            <select className="gov-input" value={person.role} onChange={(event) => setLeadershipRoster((items) => items.map((item, i) => i === index ? { ...item, role: event.target.value } : item))}>
                              <option value="mayor">Mayor</option>
                              <option value="vice-mayor">Vice Mayor</option>
                            </select>
                            <input className="gov-input" value={person.name} placeholder="Full name" onChange={(event) => setLeadershipRoster((items) => items.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
                            <input className="gov-input" value={person.term} placeholder="Term" onChange={(event) => setLeadershipRoster((items) => items.map((item, i) => i === index ? { ...item, term: event.target.value } : item))} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#4b5563' }}><input type="checkbox" checked={person.current} onChange={(event) => setLeadershipRoster((items) => items.map((item, i) => i === index ? { ...item, current: event.target.checked } : { ...item, current: event.target.checked ? false : item.current }))} /> Current</label>
                            <div className="leadership-roster-actions">
                              <button type="button" className="gov-btn" disabled={index === 0} onClick={() => setLeadershipRoster((items) => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} title="Move up">↑</button>
                              <button type="button" className="gov-btn" disabled={index === leadershipRoster.length - 1} onClick={() => setLeadershipRoster((items) => { const next = [...items]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next; })} title="Move down">↓</button>
                              <button type="button" className="gov-btn" onClick={() => setLeadershipRoster((items) => items.filter((_, i) => i !== index))} title="Remove">×</button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                      <div className="leadership-roster-pagination">
                        <span>Showing {leadershipRoster.length ? ((leadershipRosterPage - 1) * leadershipRosterPageSize) + 1 : 0}-{Math.min(leadershipRosterPage * leadershipRosterPageSize, leadershipRoster.length)} of {leadershipRoster.length}</span>
                        <div>
                          <button type="button" className="gov-btn" disabled={leadershipRosterPage === 1} onClick={() => setLeadershipRosterPage((page) => Math.max(1, page - 1))}>Previous</button>
                          <strong>Page {leadershipRosterPage} of {leadershipRosterPageCount}</strong>
                          <button type="button" className="gov-btn" disabled={leadershipRosterPage === leadershipRosterPageCount} onClick={() => setLeadershipRosterPage((page) => Math.min(leadershipRosterPageCount, page + 1))}>Next</button>
                        </div>
                      </div>
                      <button type="button" className="gov-btn" style={{ marginTop: '0.8rem' }} onClick={() => setLeadershipRoster((items) => [...items, { id: `leader-${Date.now()}`, role: 'mayor', name: '', term: '', current: false, order: items.length }])}>+ Add leader</button>
                    </div>

                    <div className="gov-glass-panel accomplishments-manager-panel" style={{ marginBottom: '1.5rem' }}>
                      <div className="accomplishments-manager-header">
                        <div>
                          <h2>Accomplishments &amp; Milestones</h2>
                          <p>Add the real activities, projects, awards, and community work shown on the About page. Images are optional and never replaced with placeholders.</p>
                        </div>
                        <div className="accomplishments-manager-save">
                          {accomplishmentsMsg && <span className={accomplishmentsMsg.type === 'error' ? 'manager-error' : 'manager-success'}>{accomplishmentsMsg.text}</span>}
                          <button onClick={saveAccomplishments} disabled={accomplishmentsSaving} className="gov-btn gov-btn--primary">{accomplishmentsSaving ? 'Saving...' : 'Save accomplishments'}</button>
                        </div>
                      </div>
                      <div className="accomplishments-admin-list">
                        {visibleAccomplishments.map((entry, pageIndex) => {
                          const index = (accomplishmentsPage - 1) * accomplishmentsPageSize + pageIndex;
                          const update = (patch) => setAccomplishments((items) => items.map((item, i) => i === index ? { ...item, ...patch } : item));
                          return (
                            <div key={entry.id} className="accomplishment-admin-row">
                              <div className="accomplishment-admin-fields">
                                <input className="gov-input" value={entry.date} placeholder="Date" onChange={(event) => update({ date: event.target.value })} />
                                <input className="gov-input" value={entry.category} placeholder="Category" onChange={(event) => update({ category: event.target.value })} />
                                <input className="gov-input accomplishment-admin-title" value={entry.title} placeholder="Accomplishment title" onChange={(event) => update({ title: event.target.value })} />
                                <textarea className="gov-input accomplishment-admin-description" value={entry.description} placeholder="Describe the accomplishment" rows="2" onChange={(event) => update({ description: event.target.value })} />
                              </div>
                              <div className="accomplishment-admin-actions">
                                {entry.imageUrl && <img src={entry.imageUrl} alt="" />}
                                <label className="gov-btn accomplishment-upload-button">{entry.imageUrl ? 'Replace image' : 'Add image'}<input type="file" accept="image/*" onChange={(event) => uploadAccomplishmentImage(entry, event.target.files?.[0])} /></label>
                                <button type="button" className="gov-btn gov-btn-danger" onClick={() => setAccomplishments((items) => items.filter((_, i) => i !== index))}>Remove</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="leadership-roster-pagination">
                        <span>Showing {accomplishments.length ? ((accomplishmentsPage - 1) * accomplishmentsPageSize) + 1 : 0}-{Math.min(accomplishmentsPage * accomplishmentsPageSize, accomplishments.length)} of {accomplishments.length}</span>
                        <div>
                          <button type="button" className="gov-btn" disabled={accomplishmentsPage === 1} onClick={() => setAccomplishmentsPage((page) => Math.max(1, page - 1))}>Previous</button>
                          <strong>Page {accomplishmentsPage} of {accomplishmentsPageCount}</strong>
                          <button type="button" className="gov-btn" disabled={accomplishmentsPage === accomplishmentsPageCount} onClick={() => setAccomplishmentsPage((page) => Math.min(accomplishmentsPageCount, page + 1))}>Next</button>
                        </div>
                      </div>
                      <button type="button" className="gov-btn" style={{ marginTop: '0.8rem' }} onClick={() => setAccomplishments((items) => [...items, { id: `accomplishment-${Date.now()}`, date: '', category: 'COMMUNITY', title: '', description: '', imageUrl: '' }])}>+ Add accomplishment</button>
                    </div>

                    {/* Miss Naujan Pageant Management */}
                    <div className="gov-glass-panel">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Miss Naujan Roster</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {pageantQueensMsg && <span style={{ color: pageantQueensMsg.type === 'error' ? '#b91c1c' : '#047857', fontWeight: 700, fontSize: '0.85rem' }}>{pageantQueensMsg.text}</span>}
                          <button type="button" className="gov-btn gov-btn-primary" disabled={pageantQueensSaving} onClick={savePageantQueens}>
                            {pageantQueensSaving ? 'Saving...' : 'Save Roster'}
                          </button>
                          <button type="button" className="gov-btn" onClick={() => setPageantQueens(items => [...items, { id: `queen-${Date.now()}`, year: new Date().getFullYear(), name: '', photo: null }])}>+ Add Queen</button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {pageantQueens.map((queen, index) => (
                          <div key={queen.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', background: '#fafafa' }}>
                            {/* Photo preview */}
                            <div style={{ position: 'relative', height: '160px', background: queen.photo ? `url(${queen.photo}) center/cover no-repeat` : '#dce9df', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {!queen.photo && <span style={{ color: '#64736d', fontSize: '0.8rem', fontWeight: 600 }}>No photo</span>}
                              <label style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(24,51,45,0.85)', color: '#f8f4e9', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', cursor: 'pointer', borderRadius: '4px' }}>
                                Upload
                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadPageantPhoto(queen, f); e.target.value = ''; }} />
                              </label>
                            </div>
                            <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '0.5rem' }}>
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Year</div>
                                  <input type="number" className="gov-input" value={queen.year} onChange={e => setPageantQueens(items => items.map((q, i) => i === index ? { ...q, year: Number(e.target.value) } : q))} style={{ borderRadius: '6px' }} />
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Name</div>
                                  <input type="text" className="gov-input" value={queen.name} placeholder="Full name" onChange={e => setPageantQueens(items => items.map((q, i) => i === index ? { ...q, name: e.target.value } : q))} style={{ borderRadius: '6px' }} />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                                <button type="button" className="gov-btn" disabled={index === 0} onClick={() => setPageantQueens(items => { const n = [...items]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n; })} title="Move up">↑</button>
                                <button type="button" className="gov-btn" disabled={index === pageantQueens.length - 1} onClick={() => setPageantQueens(items => { const n = [...items]; [n[index], n[index + 1]] = [n[index + 1], n[index]]; return n; })} title="Move down">↓</button>
                                <button type="button" className="gov-btn gov-btn-danger" onClick={() => setPageantQueens(items => items.filter((_, i) => i !== index))}>Remove</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="gov-glass-panel">
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Population</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{aboutPageData.population?.toLocaleString() || 0}</div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem' }}>Total residents</div>
                      </div>
                      <div className="gov-glass-panel">
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Land Area</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb' }}>{Number(aboutPageData.land_area_sq_km || 0).toFixed(1)} km²</div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem' }}>Square kilometers</div>
                      </div>
                      <div className="gov-glass-panel">
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Barangays</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed' }}>{aboutPageData.num_barangays || 0}</div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem' }}>Subdivisions</div>
                      </div>
                      <div className="gov-glass-panel">
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Tourism Jobs</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>{aboutPageData.tourism_total_employment || 0}</div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.5rem' }}>Employment opportunities</div>
                      </div>
                    </div>

                    <div className="gov-glass-panel">
                      <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                        <Icons.Globe size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Overview
                      </h2>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Overview Text</span>
                        <textarea
                          value={aboutPageData.overview_text}
                          onChange={(e) => setAboutPageData({ ...aboutPageData, overview_text: e.target.value })}
                          rows={4}
                          className="gov-input"
                          style={{ borderRadius: '8px', resize: 'vertical' }}
                        />
                        <span style={{ fontSize: '0.78rem', color: '#718096' }}>{aboutPageData.overview_text?.length || 0} / 500 characters</span>
                      </label>
                    </div>

                    <div className="gov-glass-panel">
                      <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                        <Icons.Sparkles size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Vision & Mission
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Vision Text</span>
                          <textarea
                            value={aboutPageData.vision_text}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, vision_text: e.target.value })}
                            rows={4}
                            className="gov-input"
                            style={{ borderRadius: '8px', resize: 'vertical' }}
                          />
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mission Points</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                            {aboutPageData.mission_text?.points?.map((point, idx) => (
                              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                <input
                                  type="text"
                                  value={point}
                                  onChange={(e) => {
                                    const newPoints = [...aboutPageData.mission_text.points];
                                    newPoints[idx] = e.target.value;
                                    setAboutPageData({
                                      ...aboutPageData,
                                      mission_text: { ...aboutPageData.mission_text, points: newPoints }
                                    });
                                  }}
                                  className="gov-input"
                                  style={{ borderRadius: '8px', fontSize: '0.85rem', flex: 1 }}
                                  placeholder={`Point ${idx + 1}`}
                                />
                                <button
                                  onClick={() => {
                                    const newPoints = aboutPageData.mission_text.points.filter((_, i) => i !== idx);
                                    setAboutPageData({
                                      ...aboutPageData,
                                      mission_text: { ...aboutPageData.mission_text, points: newPoints }
                                    });
                                  }}
                                  className="gov-btn gov-btn-danger"
                                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                setAboutPageData({
                                  ...aboutPageData,
                                  mission_text: {
                                    ...aboutPageData.mission_text,
                                    points: [...(aboutPageData.mission_text?.points || []), '']
                                  }
                                });
                              }}
                              className="gov-btn gov-btn-primary"
                              style={{ marginTop: '0.5rem' }}
                            >
                              + Add Point
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="gov-glass-panel">
                      <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                        <Icons.Users size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Leadership
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mayor Name</span>
                          <input
                            type="text"
                            value={aboutPageData.current_mayor_name}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, current_mayor_name: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mayor Term</span>
                          <input
                            type="text"
                            value={aboutPageData.current_mayor_term}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, current_mayor_term: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                            placeholder="e.g., 2022-2029"
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Vice Mayor Name</span>
                          <input
                            type="text"
                            value={aboutPageData.current_vice_mayor_name}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, current_vice_mayor_name: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Vice Mayor Term</span>
                          <input
                            type="text"
                            value={aboutPageData.current_vice_mayor_term}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, current_vice_mayor_term: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                            placeholder="e.g., 2022-2029"
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Municipal Rank</span>
                          <input
                            type="text"
                            value={aboutPageData.municipal_rank}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, municipal_rank: e.target.value })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="gov-glass-panel">
                      <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                        <Icons.ChartLineUp size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Demographics
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Population</span>
                          <input
                            type="number"
                            value={aboutPageData.population}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, population: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Land Area (km²)</span>
                          <input
                            type="number"
                            step="0.01"
                            value={aboutPageData.land_area_sq_km}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, land_area_sq_km: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Density (per km²)</span>
                          <input
                            type="number"
                            step="0.01"
                            value={aboutPageData.density_per_sq_km}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, density_per_sq_km: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Number of Barangays</span>
                          <input
                            type="number"
                            value={aboutPageData.num_barangays}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, num_barangays: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="gov-glass-panel">
                      <h2 style={{ marginTop: 0, fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                        <Icons.Route size={22} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Tourism Statistics
                      </h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Visitor Arrivals 2022</span>
                          <input
                            type="number"
                            value={aboutPageData.visitor_arrivals_2022}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, visitor_arrivals_2022: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Visitor Arrivals 2023</span>
                          <input
                            type="number"
                            value={aboutPageData.visitor_arrivals_2023}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, visitor_arrivals_2023: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Visitor Arrivals 2024</span>
                          <input
                            type="number"
                            value={aboutPageData.visitor_arrivals_2024}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, visitor_arrivals_2024: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Visitor Arrivals 2025</span>
                          <input
                            type="number"
                            value={aboutPageData.visitor_arrivals_2025}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, visitor_arrivals_2025: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total Tourism Employment</span>
                          <input
                            type="number"
                            value={aboutPageData.tourism_total_employment}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, tourism_total_employment: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Female Employed</span>
                          <input
                            type="number"
                            value={aboutPageData.tourism_female_employed}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, tourism_female_employed: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Male Employed</span>
                          <input
                            type="number"
                            value={aboutPageData.tourism_male_employed}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, tourism_male_employed: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Attractions Count</span>
                          <input
                            type="number"
                            value={aboutPageData.tourism_attractions_count}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, tourism_attractions_count: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Accommodations Count</span>
                          <input
                            type="number"
                            value={aboutPageData.tourism_accommodation_count}
                            onChange={(e) => setAboutPageData({ ...aboutPageData, tourism_accommodation_count: Number(e.target.value) })}
                            className="gov-input"
                            style={{ borderRadius: '8px' }}
                          />
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                      <button
                        onClick={saveAboutPageData}
                        disabled={aboutPageSaving}
                        className="gov-btn gov-btn-primary"
                        style={{ minWidth: '180px', fontSize: '1rem', padding: '0.75rem 1.5rem' }}
                      >
                        {aboutPageSaving ? t('saving') : t('button_save')}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}


          {/* Chatbot */}
          {activeModule === 'chatbot' && (
            <div>
              <h1 className="gov-page-title">
                <Icons.Chat size={32} style={{ verticalAlign: 'middle' }} /> Chatbot Monitoring
              </h1>

              <div className="gov-glass-panel" style={{ marginBottom:'1.5rem' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
                  <div>
                    <h2 className="gov-edit-panel__title" style={{ margin:'0 0 0.5rem 0' }}>Retrain NLP Model</h2>
                    <p style={{ margin:0, color:'#6b7280', fontSize:'0.92rem', maxWidth:'70ch' }}>
                      Rebuild the multilingual chatbot model from the datasets in <strong>MULTILINGUAL_CHATBOT/intents</strong> using the enhanced training script.
                    </p>
                  </div>
                  <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
                    <select
                      className="gov-input"
                      value={chatbotTrainingLanguage}
                      onChange={(e) => setChatbotTrainingLanguage(e.target.value)}
                      style={{ minWidth:'180px', borderRadius:'10px', fontSize:'0.9rem' }}
                    >
                      {CHATBOT_TRAINING_LANGUAGES.map((language) => (
                        <option key={language.value} value={language.value}>{language.label}</option>
                      ))}
                    </select>
                    <button
                      className="gov-btn gov-btn-primary"
                      onClick={handleStartChatbotRetrain}
                      disabled={chatbotTrainingLoading || chatbotTrainingJob?.status === 'running'}
                    >
                      {chatbotTrainingLoading || chatbotTrainingJob?.status === 'running' ? 'Retraining...' : 'Start Retraining'}
                    </button>
                  </div>
                </div>


              {/* Moderation shortcut */}
              {activeModule === 'moderation' && (
                <div className="gov-glass-panel" style={{ padding:'1.5rem', display:'grid', gap:'1rem' }}>
                  <div>
                    <h1 className="gov-page-title" style={{ marginBottom:'0.5rem' }}>
                      <Icons.Chat size={32} style={{ verticalAlign: 'middle' }} /> Agent Moderation
                    </h1>
                    <p style={{ margin:0, color:'#6b7280', fontSize:'0.95rem', maxWidth:'72ch' }}>
                      Open the moderation workspace to review flagged chats and send human replies back to users.
                    </p>
                  </div>

                  <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
                    <button className="gov-btn gov-btn-primary" onClick={() => navigate('/admin/moderation')}>
                      Open Moderation Workspace
                    </button>
                    <button className="gov-btn gov-btn-secondary" onClick={() => setActiveModule('chatbot')}>
                      Back to Chatbot Monitoring
                    </button>
                  </div>
                </div>
              )}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'0.9rem', marginTop:'1rem' }}>
                  <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'0.9rem 1rem' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Dataset</div>
                    <div style={{ fontWeight:700, color:'#111827', marginTop:'0.2rem' }}>MULTILINGUAL_CHATBOT</div>
                  </div>
                  <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'0.9rem 1rem' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Status</div>
                    <div style={{ fontWeight:700, color: chatbotTrainingJob?.status === 'completed' ? '#2e7d32' : chatbotTrainingJob?.status === 'failed' ? '#c62828' : chatbotTrainingJob?.status === 'running' ? '#1565c0' : '#6b7280', marginTop:'0.2rem' }}>
                      {chatbotTrainingJob?.status ? chatbotTrainingJob.status.toUpperCase() : 'Idle'}
                    </div>
                  </div>
                  <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'12px', padding:'0.9rem 1rem' }}>
                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>Selected</div>
                    <div style={{ fontWeight:700, color:'#111827', marginTop:'0.2rem' }}>
                      {CHATBOT_TRAINING_LANGUAGES.find((language) => language.value === chatbotTrainingLanguage)?.label || 'All languages'}
                    </div>
                  </div>
                </div>

                {chatbotTrainingError && (
                  <div style={{ marginTop:'1rem', padding:'0.85rem 1rem', borderRadius:'12px', background:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca', fontSize:'0.9rem' }}>
                    {chatbotTrainingError}
                  </div>
                )}

                {chatbotTrainingJob?.logs?.length > 0 && (
                  <div style={{ marginTop:'1rem', background:'#0f172a', color:'#e2e8f0', borderRadius:'12px', padding:'1rem', fontSize:'0.85rem', fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', maxHeight:'220px', overflowY:'auto', whiteSpace:'pre-wrap' }}>
                    {chatbotTrainingJob.logs.slice(-12).join('\n')}
                  </div>
                )}
              </div>

              {/* Conversation Detail Modal */}
              {viewingConversation && (
                <div
                  style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
                  onClick={(e) => { if (e.target === e.currentTarget) setViewingConversation(null); }}
                >
                  <div style={{ background:'#fff', borderRadius:'16px', width:'100%', maxWidth:'640px', maxHeight:'88vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 64px rgba(0,0,0,0.22)' }}>
                    {/* Modal Header */}
                    <div style={{ background:'linear-gradient(135deg,#1a237e 0%,#3949ab 100%)', borderRadius:'16px 16px 0 0', padding:'1.2rem 1.5rem', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexShrink:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                        {viewingConversation.profile_picture ? (
                          <img src={viewingConversation.profile_picture} alt="" style={{ width:'40px', height:'40px', borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,0.5)' }} />
                        ) : (
                          <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'2px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'1rem', textTransform:'uppercase' }}>
                            {(viewingConversation.username || 'G')[0]}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{viewingConversation.username || 'Guest'}</div>
                          <div style={{ fontSize:'0.78rem', opacity:0.8 }}>
                            Conv #{viewingConversation.conversation_id} &nbsp;·&nbsp; {viewingConversation.message_count} messages
                            {viewingConversation.language && <span style={{ marginLeft:'0.5rem', background:'rgba(255,255,255,0.2)', padding:'1px 8px', borderRadius:'10px', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase' }}>{viewingConversation.language}</span>}
                          </div>
                          <div style={{ fontSize:'0.73rem', opacity:0.65, marginTop:'2px' }}>{new Date(viewingConversation.started_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <button onClick={() => setViewingConversation(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'#fff', fontSize:'1.1rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
                    </div>
                    {/* Messages */}
                    <div style={{ flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                      {convMessagesLoading ? (
                        <div style={{ textAlign:'center', color:'#718096', padding:'2rem' }}>Loading messages...</div>
                      ) : convMessages.length === 0 ? (
                        <div style={{ textAlign:'center', color:'#9ca3af', padding:'2rem' }}>No messages in this conversation</div>
                      ) : convMessages.map((msg) => (
                        <div key={msg.message_id}>
                          {/* User message */}
                          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'0.5rem' }}>
                            <div style={{ maxWidth:'80%', background:'linear-gradient(135deg,#1565c0,#42a5f5)', color:'#fff', borderRadius:'16px 16px 4px 16px', padding:'0.7rem 1rem', fontSize:'0.88rem', boxShadow:'0 2px 8px rgba(21,101,192,0.2)' }}>
                              <div>{msg.message_text}</div>
                              <div style={{ fontSize:'0.7rem', opacity:0.7, marginTop:'4px', textAlign:'right' }}>
                                {new Date(msg.sent_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                                {msg.language && <span style={{ marginLeft:'0.5rem', opacity:0.8 }}>{'[' + msg.language + ']'}</span>}
                              </div>
                            </div>
                          </div>
                          {/* Bot response */}
                          {msg.response_text && (
                            <div style={{ display:'flex', justifyContent:'flex-start' }}>
                              <div style={{ display:'flex', gap:'0.6rem', alignItems:'flex-start', maxWidth:'80%' }}>
                                <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#2e7d32,#66bb6a)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icons.Chat size={14} /></div>
                                <div style={{ background:'#f3f4f6', borderRadius:'4px 16px 16px 16px', padding:'0.7rem 1rem', fontSize:'0.88rem', color:'#1f2937', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                                  {msg.response_text}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:'0.75rem 1.5rem', borderTop:'1px solid #e5e7eb', background:'#f9fafb', borderRadius:'0 0 16px 16px', display:'flex', justifyContent:'flex-end', gap:'0.75rem', flexShrink:0 }}>
                      <button className="gov-btn gov-btn-danger" onClick={(e) => { handleDeleteConversation(viewingConversation.conversation_id, e); setViewingConversation(null); }}>Delete Conversation</button>
                      <button className="gov-btn gov-btn-ghost" onClick={() => setViewingConversation(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {chatbotData ? (
                <>
                  {/* Stats Row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
                    {[
                      { title: 'Total Conversations', value: chatbotData.totalConversations, icon: <Icons.Chat size={22} />, color: '#1565c0', bg: '#e3f2fd' },
                      { title: 'Total Messages', value: chatbotData.totalMessages, icon: <Icons.Document size={22} />, color: '#2e7d32', bg: '#e8f5e9' },
                      { title: 'Avg / Convo', value: Number(chatbotData.avgMessagesPerConvo || 0).toFixed(1), icon: <Icons.ChartLineUp size={22} />, color: '#e65100', bg: '#fff3e0' },
                      { title: "Today's Convos", value: chatbotData.todayConversations, icon: <Icons.Calendar size={22} />, color: '#6a1b9a', bg: '#f3e5f5' },
                      { title: 'Registered Users', value: chatbotData.activeUsers, icon: <Icons.User size={22} />, color: '#00695c', bg: '#e0f2f1' }
                    ].map((stat, idx) => (
                      <div key={idx} style={{ background:'#fff', borderRadius:'14px', padding:'1.2rem 1.4rem', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', border:'1px solid #f0f0f0', display:'flex', alignItems:'center', gap:'1rem' }}>
                        <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:stat.bg, color:stat.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{stat.icon}</div>
                        <div>
                          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>{stat.title}</div>
                          <div style={{ fontSize:'1.8rem', fontWeight:900, color:stat.color, lineHeight:1.2 }}>{stat.value ?? 0}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom row: Language Distribution + Weekly Trend */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'2rem' }}>
                    {/* Language Distribution */}
                    <div className="gov-glass-panel" style={{ padding:'1.25rem' }}>
                      <h3 style={{ margin:'0 0 1rem 0', fontSize:'1rem', fontWeight:800, color:'#1f2937' }}>Language Distribution</h3>
                      {chatbotData.languageDistribution && chatbotData.languageDistribution.length > 0 ? (
                        <div style={{ height: '240px' }}>
                          <Pie
                            data={{
                              labels: chatbotData.languageDistribution.map((lang) => (lang.language || 'unknown').toUpperCase()),
                              datasets: [{
                                data: chatbotData.languageDistribution.map((lang) => Number(lang.count) || 0),
                                backgroundColor: ['#1565c0', '#d32f2f', '#e65100', '#2e7d32', '#6b7280'],
                                borderColor: '#ffffff',
                                borderWidth: 2
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                  labels: { padding: 12, font: { size: 12, weight: '600' }, usePointStyle: true }
                                },
                                tooltip: {
                                  callbacks: {
                                    label: (context) => {
                                      const value = context.parsed || 0;
                                      const total = context.dataset.data.reduce((sum, val) => sum + Number(val || 0), 0);
                                      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                                      return `${context.label}: ${value} (${pct}%)`;
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      ) : <div style={{ color:'#9ca3af', fontSize:'0.88rem' }}>No language data available</div>}
                    </div>

                    {/* Weekly Trend */}
                    <div className="gov-glass-panel" style={{ padding:'1.25rem' }}>
                      <h3 style={{ margin:'0 0 1rem 0', fontSize:'1rem', fontWeight:800, color:'#1f2937' }}>Last 7 Days</h3>
                      {chatbotData.weeklyTrend && chatbotData.weeklyTrend.length > 0 ? (
                        <div style={{ height: '240px' }}>
                          <Bar
                            data={{
                              labels: chatbotData.weeklyTrend.map((day) =>
                                new Date(day.day).toLocaleDateString(undefined, { weekday: 'short' })
                              ),
                              datasets: [{
                                label: 'Messages',
                                data: chatbotData.weeklyTrend.map((day) => Number(day.count) || 0),
                                backgroundColor: 'rgba(21, 101, 192, 0.82)',
                                borderColor: '#1565c0',
                                borderWidth: 2,
                                borderRadius: 6,
                                maxBarThickness: 36
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: { display: false },
                                tooltip: {
                                  callbacks: {
                                    label: (context) => `Messages: ${context.parsed.y}`
                                  }
                                }
                              },
                              scales: {
                                x: { grid: { display: false } },
                                y: {
                                  beginAtZero: true,
                                  ticks: { precision: 0 },
                                  grid: { color: 'rgba(148, 163, 184, 0.2)' }
                                }
                              }
                            }}
                          />
                        </div>
                      ) : <div style={{ color:'#9ca3af', fontSize:'0.88rem' }}>No activity in the last 7 days</div>}
                    </div>
                  </div>

                  {/* Conversations Table */}
                  <div className="gov-glass-panel">
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                      <h2 className="gov-edit-panel__title" style={{ margin:0 }}>Recent Conversations</h2>
                      <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
                        <input
                          type="text"
                          placeholder="Search by username..."
                          value={chatbotConvSearch}
                          onChange={(e) => setChatbotConvSearch(e.target.value)}
                          className="gov-input"
                          style={{ width:'220px', borderRadius:'8px', fontSize:'0.88rem' }}
                        />
                        <button
                          className="gov-btn gov-btn-primary"
                          onClick={async () => {
                            setChatbotConvsLoading(true);
                            try {
                              const [statsRes, convsRes] = await Promise.all([
                                api.get('/admin/chatbot/stats'),
                                api.get('/admin/chatbot/conversations')
                              ]);
                              setChatbotData({ ...statsRes.data, conversations: convsRes.data });
                            } catch (e) { console.error(e); } finally { setChatbotConvsLoading(false); }
                          }}
                          disabled={chatbotConvsLoading}
                        >
                          {chatbotConvsLoading ? 'Refreshing...' : '↻ Refresh'}
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const filtered = (chatbotData.conversations || []).filter((c) =>
                        !chatbotConvSearch || (c.username || 'guest').toLowerCase().includes(chatbotConvSearch.toLowerCase())
                      );
                      return filtered.length > 0 ? (
                        <div className="gov-table-wrap">
                          <table className="gov-table">
                            <thead>
                              <tr>
                                <th style={{ width:'44px' }}></th>
                                <th>User</th>
                                <th>Messages</th>
                                <th>Language</th>
                                <th>First Message</th>
                                <th>Started</th>
                                <th>Last Activity</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.slice(0, 50).map((conv) => {
                                const initials = (conv.username || 'G')[0].toUpperCase();
                                const langTag = conv.language;
                                const langColors = { en:'#1565c0', fil:'#c62828', ceb:'#e65100', tl:'#c62828' };
                                const lc = langColors[langTag] || '#2e7d32';
                                return (
                                  <tr key={conv.conversation_id} onClick={() => openConversation(conv)} style={{ cursor:'pointer' }} title="Click to view conversation">
                                    <td style={{ padding:'0.5rem 0.75rem' }}>
                                      {conv.profile_picture ? (
                                        <img src={conv.profile_picture} alt="" style={{ width:'34px', height:'34px', borderRadius:'50%', objectFit:'cover', border:'2px solid #e5e7eb', display:'block' }}
                                          onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                                      ) : null}
                                      <div style={{
                                        width:'34px', height:'34px', borderRadius:'50%',
                                        background:'linear-gradient(135deg,#1a237e,#3949ab)',
                                        color:'#fff', fontWeight:800, fontSize:'0.82rem',
                                        display: conv.profile_picture ? 'none' : 'flex',
                                        alignItems:'center', justifyContent:'center'
                                      }}>{initials}</div>
                                    </td>
                                    <td>
                                      <div style={{ fontWeight:700 }}>{conv.username || <span style={{ color:'#9ca3af' }}>Guest</span>}</div>
                                      {conv.user_id && <div style={{ fontSize:'0.75rem', color:'#718096' }}>ID #{conv.user_id}</div>}
                                    </td>
                                    <td style={{ textAlign:'center', fontWeight:700 }}>{conv.message_count}</td>
                                    <td>
                                      {langTag ? (
                                        <span style={{ background:`${lc}18`, color:lc, border:`1px solid ${lc}44`, borderRadius:'99px', padding:'2px 10px', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase' }}>{langTag}</span>
                                      ) : <span style={{ color:'#9ca3af', fontSize:'0.82rem' }}>—</span>}
                                    </td>
                                    <td style={{ maxWidth:'200px' }}>
                                      <div style={{ fontSize:'0.82rem', color:'#4b5563', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'180px' }}>
                                        {conv.first_message || <span style={{ color:'#9ca3af' }}>—</span>}
                                      </div>
                                    </td>
                                    <td style={{ fontSize:'0.82rem', color:'#6b7280', whiteSpace:'nowrap' }}>{new Date(conv.started_at).toLocaleString()}</td>
                                    <td style={{ fontSize:'0.82rem', color:'#6b7280', whiteSpace:'nowrap' }}>{conv.last_message_at ? new Date(conv.last_message_at).toLocaleString() : '—'}</td>
                                    <td onClick={(e) => e.stopPropagation()}>
                                      <button className="gov-btn gov-btn-danger" style={{ fontSize:'0.78rem', padding:'0.3rem 0.65rem' }} onClick={(e) => handleDeleteConversation(conv.conversation_id, e)}>Delete</button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {filtered.length > 50 && <div style={{ textAlign:'center', padding:'0.75rem', color:'#6b7280', fontSize:'0.85rem' }}>Showing 50 of {filtered.length} conversations</div>}
                        </div>
                      ) : (
                        <div className="gov-empty">
                          {chatbotConvSearch ? `No conversations matching "${chatbotConvSearch}"` : 'No conversations found'}
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="gov-glass-panel gov-empty">
                  Loading chatbot data...
                </div>
              )}
            </div>
          )}

          {/* Reports */}
          {activeModule === 'reports' && (
            <ReportsAndAnalyticsDashboard
              data={analyticsData}
              stats={stats}
              loading={reportsLoading}
              userRole="admin"
              onExport={(type, series) => {
                // export the currently visible series (daily or monthly)
                const rows = series || analyticsData.monthlyTrends || [];
                downloadCSV(rows, `${type}-report.csv`);
              }}
            />
          )}

          {/* Archive */}
          {activeModule === 'archive' && (
            <div>
              <h1 className="gov-page-title">
                <i className="fi fi-rr-archive" style={{ fontSize: '2rem' }}></i> Archive
              </h1>

              {/* Archive Sub-Navigation */}
              <div className="gov-glass-panel" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '1rem' }}>
                {[
                  { id: 'bookings', label: 'Bookings', icon: 'fi fi-rr-calendar' },
                  { id: 'hotels', label: 'Hotels', icon: 'fi fi-rr-building' },
                  { id: 'itineraries', label: 'Itineraries', icon: 'fi fi-rr-route' },
                  { id: 'attractions', label: 'Attractions', icon: 'fi fi-rr-marker' }
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setArchiveSubSection(sub.id)}
                    className={`gov-btn ${archiveSubSection === sub.id ? 'gov-btn-primary' : 'gov-btn-ghost'}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <i className={sub.icon}></i> {sub.label}
                  </button>
                ))}
              </div>

              {/* Archived Bookings */}
              {archiveSubSection === 'bookings' && (
                <div className="gov-glass-panel">
                  <h2 className="gov-glass-panel__title">
                    Archived Bookings
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
                              {new Date(booking.check_in_date).toLocaleDateString()} → {new Date(booking.check_out_date).toLocaleDateString()}
                            </td>
                            <td>
                              ₱{parseFloat(booking.total_amount || 0).toLocaleString()}
                            </td>
                            <td>
                              <span className="gov-badge-status gov-badge-status--cancelled">
                                {t(booking.status) || booking.status}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.put(`/admin/bookings/${booking.booking_id}/restore`);
                                    loadArchivedBookings();
                                    loadAdminData();
                                  } catch (error) {
                                    console.error('Restore error:', error);
                                    alert(error.response?.data?.error || 'Failed to restore booking');
                                  }
                                }}
                                className="gov-btn gov-btn-primary"
                              >
                                Restore
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

              {/* Archived Hotels */}
              {archiveSubSection === 'hotels' && (
                <div className="gov-glass-panel">
                  <h2 className="gov-glass-panel__title">
                    Archived Hotels
                  </h2>
                  <div className="gov-empty">
                    <p>No archived hotels found</p>
                  </div>
                </div>
              )}

              {/* Archived Itineraries */}
              {archiveSubSection === 'itineraries' && (
                <div className="gov-glass-panel">
                  <h2 className="gov-glass-panel__title">
                    Archived Itineraries ({archivedItineraries.length})
                  </h2>
                  {archivedItineraries.length > 0 ? (
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem'}}>
                      {archivedItineraries.map((itinerary) => (
                        <div key={itinerary.itinerary_id} style={{border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', backgroundColor: '#f9f9f9'}}>
                          <div style={{fontWeight: 700, marginBottom: '0.5rem'}}>{itinerary.name}</div>
                          <div style={{fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem'}}>
                            Budget: ₱{(parseFloat(itinerary.total_budget) || 0).toFixed(2)}
                          </div>
                          <div style={{fontSize: '0.85rem', color: '#999', marginBottom: '0.5rem'}}>
                            Archived: {new Date(itinerary.archived_at).toLocaleDateString()}
                          </div>
                          <button 
                            onClick={async () => {
                              try {
                                const resp = await api.post(`/admin/itineraries/${itinerary.itinerary_id}/restore`);
                                if (resp.data.success) {
                                  alert('Itinerary restored successfully');
                                  loadArchivedItineraries();
                                }
                              } catch (error) {
                                alert('Failed to restore itinerary');
                              }
                            }}
                            style={{padding: '0.5rem 1rem', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="gov-empty">
                      <p>No archived itineraries found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Archived Attractions */}
              {archiveSubSection === 'attractions' && (
                <div className="gov-glass-panel">
                  <h2 className="gov-glass-panel__title">
                    Archived Attractions
                  </h2>
                  <div className="gov-empty">
                    <p>No archived attractions found</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
