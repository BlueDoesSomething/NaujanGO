import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchAttractionHeroSettings, fetchAttractions, fetchHotels, fetchReviews, fetchUserItineraries, submitReview } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LeafletMap from '../components/LeafletMap';
import WeatherWidget from '../components/WeatherWidget';
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CloudSunIcon,
  CompassIcon,
  HeartIcon,
  HotelIcon,
  InfoIcon,
  LeafIcon,
  LightbulbIcon,
  LocationIcon,
  MapIcon,
  MapPinIcon,
  MoneyIcon,
  MountainIcon,
  PlusIcon,
  RouteIcon,
  StarIcon,
  SunIcon
} from '../components/Icons';
import { loadCachedSetting, saveCachedSetting } from '../utils/siteSettingsCache';
import './AttractionDetails.css';

const FALLBACK_IMAGE = '/placeholder-attraction.svg';
const DESCRIPTION_PREVIEW = 320;

const ShareIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.87.24-1.46 1.49-1.46H16.6V4.46A20.4 20.4 0 0014.3 4.3c-2.3 0-3.81.4-3.8 4v2.2H8v3h2.5V21z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const DEFAULT_ATTRACTION_HERO = {
  backButtonLabel: 'back',
  heroMinHeightDesktop: 480,
  heroMinHeightMobile: 420,
  overlayStart: 0.78,
  overlayMid: 0.52,
  overlayEnd: 0.64,
  addToItineraryText: 'add_to_itinerary',
  saveToFavoritesText: 'save_to_favorites',
  savedToFavoritesText: 'saved_to_favorites',
  shareText: 'share',
  viewOnMapText: 'view_on_map',
  heroTitleColor: '#f8fafc',
  heroMetaTextColor: '#ecfeff',
  heroKickerColor: '#dcfce7',
  heroBadgeTextColor: '#ecfdf5',
  backButtonTextColor: '#ffffff',
  backButtonBgColor: '#ffffff',
  backButtonTransparent: true,
  primaryButtonColor: '#10b981',
  primaryButtonTextColor: '#ffffff',
  primaryButtonTransparent: false,
  secondaryButtonColor: '#ffffff',
  secondaryButtonTextColor: '#ffffff',
  secondaryButtonTransparent: true,
  tertiaryButtonColor: '#ffffff',
  tertiaryButtonTextColor: '#ffffff',
  tertiaryButtonTransparent: true
};

const hexToRgb = (hex) => {
  const normalized = String(hex || '').trim();
  const match = normalized.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  };
};

const toRgba = (hex, alpha, fallback = `rgba(255,255,255,${alpha})`) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off' || normalized === '') return false;
  }
  return fallback;
};

const getDistanceKm = (from, to) => {
  if (!from || !to) return null;
  const lat1 = toNumber(from.lat);
  const lon1 = toNumber(from.lng);
  const lat2 = toNumber(to.lat);
  const lon2 = toNumber(to.lng);
  if ([lat1, lon1, lat2, lon2].some((n) => n === null)) return null;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};

const getTravelMinutes = (distanceKm) => {
  if (!distanceKm || distanceKm <= 0) return null;
  const averageRoadSpeed = 35;
  return Math.round((distanceKm / averageRoadSpeed) * 60);
};

const formatLabel = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  return value;
};

const AttractionDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const themeContext = useTheme();
  const isDark = themeContext?.isDark ?? false;
  const { id } = useParams();

  const [attraction, setAttraction] = useState(location.state?.attraction || null);
  const [allAttractions, setAllAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userItineraries, setUserItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', itinerary_id: null });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [heroCustomization, setHeroCustomization] = useState(() => ({
    ...DEFAULT_ATTRACTION_HERO,
    ...(loadCachedSetting('attraction-hero') || {})
  }));
  const gpsWatchIdRef = useRef(null);

  const COMPLETED_ITINERARY_STATUSES = new Set([
    'completed',
    'finished',
    'done',
    'visited',
    'closed',
  ]);

  const eligibleItineraries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return userItineraries.filter((itinerary) => {
      if (!itinerary) return false;

      if (COMPLETED_ITINERARY_STATUSES.has(String(itinerary.status || '').trim().toLowerCase())) {
        return true;
      }

      if (!itinerary.end_date) {
        return false;
      }

      const endDate = new Date(itinerary.end_date);
      if (Number.isNaN(endDate.getTime())) {
        return false;
      }

      endDate.setHours(0, 0, 0, 0);
      return endDate <= today;
    });
  }, [userItineraries]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [attrRes, hotelRes] = await Promise.all([fetchAttractions(), fetchHotels()]);
        if (!active) return;

        const attractionsList = Array.isArray(attrRes.data?.data) ? attrRes.data.data : [];
        const found = attractionsList.find((item) => String(item.id) === String(id));

        setAllAttractions(attractionsList);
        setHotels(Array.isArray(hotelRes.data?.data) ? hotelRes.data.data : []);
        if (found) {
          setAttraction(found);
        }
      } catch {
        if (!active) return;
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!attraction?.id) return;
    fetchReviews(attraction.id)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]));
  }, [attraction?.id]);

  // Fetch user's itineraries for review submission
  useEffect(() => {
    fetchUserItineraries()
      .then((res) => setUserItineraries(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setUserItineraries([]));
  }, []);

  useEffect(() => {
    if (!attraction?.id) return;
    const savedIds = JSON.parse(localStorage.getItem('favorite-attractions') || '[]');
    setIsSaved(savedIds.includes(attraction.id));
  }, [attraction?.id]);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      return undefined;
    }

    if (gpsWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(gpsWatchIdRef.current);
      gpsWatchIdRef.current = null;
    }

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      if (navigator.geolocation && gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetchAttractionHeroSettings()
      .then((res) => {
        const merged = { ...DEFAULT_ATTRACTION_HERO, ...(res.data || {}) };
        saveCachedSetting('attraction-hero', merged);
        setHeroCustomization({
          ...merged,
          backButtonTransparent: toBoolean(merged.backButtonTransparent, DEFAULT_ATTRACTION_HERO.backButtonTransparent),
          primaryButtonTransparent: toBoolean(merged.primaryButtonTransparent, DEFAULT_ATTRACTION_HERO.primaryButtonTransparent),
          secondaryButtonTransparent: toBoolean(merged.secondaryButtonTransparent, DEFAULT_ATTRACTION_HERO.secondaryButtonTransparent),
          tertiaryButtonTransparent: toBoolean(merged.tertiaryButtonTransparent, DEFAULT_ATTRACTION_HERO.tertiaryButtonTransparent)
        });
      })
      .catch(() => setHeroCustomization(DEFAULT_ATTRACTION_HERO));
  }, []);

  useEffect(() => {
    const handleSettingsUpdate = (event) => {
      const detail = event?.detail;
      if (!detail || detail.key !== 'attraction-hero') return;

      const merged = { ...DEFAULT_ATTRACTION_HERO, ...(detail.data || {}) };
      setHeroCustomization({
        ...merged,
        backButtonTransparent: toBoolean(merged.backButtonTransparent, DEFAULT_ATTRACTION_HERO.backButtonTransparent),
        primaryButtonTransparent: toBoolean(merged.primaryButtonTransparent, DEFAULT_ATTRACTION_HERO.primaryButtonTransparent),
        secondaryButtonTransparent: toBoolean(merged.secondaryButtonTransparent, DEFAULT_ATTRACTION_HERO.secondaryButtonTransparent),
        tertiaryButtonTransparent: toBoolean(merged.tertiaryButtonTransparent, DEFAULT_ATTRACTION_HERO.tertiaryButtonTransparent)
      });
    };

    window.addEventListener('naujan:settings-updated', handleSettingsUpdate);
    return () => window.removeEventListener('naujan:settings-updated', handleSettingsUpdate);
  }, []);

  const gallery = useMemo(() => {
    if (!attraction) return [FALLBACK_IMAGE];
    const list = [];
    if (Array.isArray(attraction.images)) {
      attraction.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (attraction.image_url && !list.includes(attraction.image_url)) list.unshift(attraction.image_url);
    return list.length ? list : [FALLBACK_IMAGE];
  }, [attraction]);

  const nearbyAttractions = useMemo(() => {
    if (!attraction) return [];
    const sourceCoords = { lat: attraction.latitude, lng: attraction.longitude };

    return (allAttractions || [])
      .filter((item) => item.id !== attraction.id)
      .map((item) => ({
        ...item,
        distanceKm: getDistanceKm(sourceCoords, { lat: item.latitude, lng: item.longitude })
      }))
      .sort((a, b) => {
        const aDistance = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
        const bDistance = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
        return aDistance - bDistance;
      })
      .slice(0, 4);
  }, [allAttractions, attraction]);

  const nearbyHotels = useMemo(() => {
    if (!attraction) return [];
    const sourceCoords = { lat: attraction.latitude, lng: attraction.longitude };

    return (hotels || [])
      .map((hotel) => {
        const lat = hotel.latitude ?? hotel.lat;
        const lng = hotel.longitude ?? hotel.lng;
        return {
          ...hotel,
          distanceKm: getDistanceKm(sourceCoords, { lat, lng })
        };
      })
      .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 4);
  }, [hotels, attraction]);

  const mapMarkers = useMemo(() => {
    if (!attraction) return [];
    const markers = [];

    const primaryLat = toNumber(attraction.latitude);
    const primaryLng = toNumber(attraction.longitude);
    if (primaryLat !== null && primaryLng !== null) {
      markers.push({
        lat: primaryLat,
        lng: primaryLng,
        popup: `<b>${attraction.name}</b><br/>${attraction.location || ''}`
      });
    }

    nearbyAttractions.slice(0, 3).forEach((item) => {
      const lat = toNumber(item.latitude);
      const lng = toNumber(item.longitude);
      if (lat !== null && lng !== null) {
        markers.push({ lat, lng, popup: `<b>${item.name}</b>` });
      }
    });

    return markers;
  }, [attraction, nearbyAttractions]);

  const popularityLabel = useMemo(() => {
    const totalReviews = Number(attraction?.review_count || 0);
    const rating = Number(attraction?.avg_rating || 0);
    if (totalReviews >= 35 && rating >= 4.5) return 'Most visited';
    if (totalReviews >= 15 && rating >= 4) return 'Trending';
    return 'Rising destination';
  }, [attraction?.review_count, attraction?.avg_rating]);

  const travelFromUser = useMemo(() => {
    if (!attraction || !userCoords) return null;
    const distanceKm = getDistanceKm(userCoords, { lat: attraction.latitude, lng: attraction.longitude });
    const minutes = getTravelMinutes(distanceKm);
    if (!distanceKm || !minutes) return null;
    return {
      distanceKm: distanceKm.toFixed(1),
      minutes
    };
  }, [attraction, userCoords]);

  const shortDescription = useMemo(() => {
    if (!attraction?.description) return '';
    if (attraction.description.length <= DESCRIPTION_PREVIEW) return attraction.description;
    return `${attraction.description.slice(0, DESCRIPTION_PREVIEW)}...`;
  }, [attraction?.description]);

  const ratingStats = useMemo(() => {
    const total = reviews.length;
    if (!total) return null;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((review) => {
      const value = Number(review.rating || 0);
      sum += value;
      const bucket = Math.round(value);
      if (counts[bucket] !== undefined) counts[bucket] += 1;
    });
    return { total, avg: (sum / total).toFixed(1), counts };
  }, [reviews]);

  const socialLinks = useMemo(() => {
    const settings = loadCachedSetting('footer-settings') || {};
    return {
      facebook: settings.facebook || '#',
      instagram: settings.instagram || '#'
    };
  }, []);

  const showPreviousImage = () => {
    setGalleryIndex((current) => (current - 1 + gallery.length) % gallery.length);
  };

  const showNextImage = () => {
    setGalleryIndex((current) => (current + 1) % gallery.length);
  };

  useEffect(() => {
    const handleGalleryKeys = (keyEvent) => {
      const target = keyEvent.target;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (typing || showReviewModal || fullscreenImage) return;
      if (keyEvent.key === 'ArrowLeft') showPreviousImage();
      if (keyEvent.key === 'ArrowRight') showNextImage();
    };

    window.addEventListener('keydown', handleGalleryKeys);
    return () => window.removeEventListener('keydown', handleGalleryKeys);
  });

  const handleShare = async () => {
    if (!attraction) return;
    const url = `${window.location.origin}/attractions/${attraction.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: attraction.name, text: attraction.description || attraction.name, url });
        return;
      } catch {
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const toggleFavorite = () => {
    if (!attraction) return;
    const current = JSON.parse(localStorage.getItem('favorite-attractions') || '[]');
    const next = current.includes(attraction.id)
      ? current.filter((value) => value !== attraction.id)
      : [...current, attraction.id];
    localStorage.setItem('favorite-attractions', JSON.stringify(next));
    setIsSaved(next.includes(attraction.id));
  };

  const handleAddToItinerary = () => {
    if (!attraction) return;
    try {
      localStorage.setItem('itinerary-preselected-attraction', JSON.stringify(attraction));
    } catch {
      // Ignore storage errors and continue navigation.
    }
    navigate('/itinerary', { state: { preselectedAttraction: attraction } });
  };

  const handleOpenReviewModal = () => {
    if (eligibleItineraries.length === 0) {
      setReviewError(t('review_requires_completed_itinerary'));
      return;
    }

    setShowReviewModal(true);
    setReviewError(null);
    setReviewSuccess(false);
    setReviewForm({
      rating: 5,
      comment: '',
      itinerary_id: eligibleItineraries[0]?.itinerary_id || null
    });
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewForm({ rating: 5, comment: '', itinerary_id: null });
    setReviewError(null);
    setReviewSuccess(false);
  };

  const handleSubmitReview = async () => {
    if (!attraction || !reviewForm.comment.trim()) {
      setReviewError('Please enter a comment');
      return;
    }

    if (!reviewForm.itinerary_id) {
      setReviewError(t('select_completed_trip'));
      return;
    }

    const selectedItinerary = eligibleItineraries.find(
      (itinerary) => String(itinerary.itinerary_id) === String(reviewForm.itinerary_id)
    );

    if (!selectedItinerary) {
      setReviewError(t('select_completed_trip'));
      return;
    }

    if (!reviewForm.rating || reviewForm.rating < 1 || reviewForm.rating > 5) {
      setReviewError('Please select a rating between 1 and 5');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      const response = await submitReview(attraction.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        itinerary_id: reviewForm.itinerary_id || null
      });

          if (response.status === 201 || response.data?.success) {
        setReviewSuccess(true);
        setReviewForm({ rating: 5, comment: '', itinerary_id: null });
        
        // Refresh reviews
        const res = await fetchReviews(attraction.id);
        setReviews(res.data || []);

        // Close modal after 2 seconds
        setTimeout(() => {
          handleCloseReviewModal();
        }, 2000);
      } else {
        setReviewError(response.data?.message || t('review_submit_failed'));
      }
    } catch (err) {
        setReviewError(err.response?.data?.message || t('error_submitting_review'));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-page">
        <div className="ad-loading">Loading attraction details...</div>
      </div>
    );
  }

  if (!attraction) {
    return (
      <div className="ad-page">
        <div className="ad-empty">
          <h2>Attraction not found</h2>
          <p>This destination is unavailable right now.</p>
          <button type="button" className="ad-primary-btn" onClick={() => navigate('/attractions')}>
            Back to attractions
          </button>
        </div>
      </div>
    );
  }

  const heroImage = gallery[galleryIndex] || FALLBACK_IMAGE;
  const displayRating = Number(attraction.avg_rating || 0).toFixed(1);
  const overlayStart = Math.max(0, Math.min(1, Number(heroCustomization.overlayStart ?? DEFAULT_ATTRACTION_HERO.overlayStart)));
  const overlayMid = Math.max(0, Math.min(1, Number(heroCustomization.overlayMid ?? DEFAULT_ATTRACTION_HERO.overlayMid)));
  const overlayEnd = Math.max(0, Math.min(1, Number(heroCustomization.overlayEnd ?? DEFAULT_ATTRACTION_HERO.overlayEnd)));
  const desktopHeight = Number(heroCustomization.heroMinHeightDesktop || DEFAULT_ATTRACTION_HERO.heroMinHeightDesktop);
  const mobileHeight = Number(heroCustomization.heroMinHeightMobile || DEFAULT_ATTRACTION_HERO.heroMinHeightMobile);
  const buttonStyle = (color, textColor, transparent) => ({
    background: toBoolean(transparent) ? toRgba(color, 0.22, 'rgba(15,23,42,0.35)') : color,
    color: textColor,
    borderColor: toBoolean(transparent) ? toRgba(color, 0.6, 'rgba(255,255,255,0.45)') : color
  });

  return (
    <div className="ad-page">
      <section
        className="ad-hero"
        style={{
          backgroundImage: `linear-gradient(165deg, rgba(5, 18, 14, ${overlayStart}), rgba(8, 30, 23, ${overlayMid}) 48%, rgba(4, 18, 14, ${overlayEnd})), url(${heroImage})`,
          '--ad-hero-min-height': `${desktopHeight}px`,
          '--ad-hero-min-height-mobile': `${mobileHeight}px`
        }}
      >
        <div className="ad-hero-inner">
          <Link
            to="/attractions"
            className="ad-back-link"
            style={{
              color: heroCustomization.backButtonTextColor || DEFAULT_ATTRACTION_HERO.backButtonTextColor,
              background: toBoolean(heroCustomization.backButtonTransparent)
                ? toRgba(heroCustomization.backButtonBgColor, 0.2, 'rgba(255,255,255,0.2)')
                : (heroCustomization.backButtonBgColor || DEFAULT_ATTRACTION_HERO.backButtonBgColor),
              borderColor: toBoolean(heroCustomization.backButtonTransparent)
                ? toRgba(heroCustomization.backButtonBgColor, 0.65, 'rgba(255,255,255,0.65)')
                : (heroCustomization.backButtonBgColor || DEFAULT_ATTRACTION_HERO.backButtonBgColor)
            }}
          >
            <ChevronLeftIcon size={15} />
            {heroCustomization.backButtonLabel || t('back')}
          </Link>
          <div className="ad-hero-content">
            <p className="ad-badge" style={{ color: heroCustomization.heroBadgeTextColor || DEFAULT_ATTRACTION_HERO.heroBadgeTextColor }}>
              <ArrowUpRightIcon size={14} />
              {popularityLabel}
            </p>
            <p className="ad-kicker" style={{ color: heroCustomization.heroKickerColor || DEFAULT_ATTRACTION_HERO.heroKickerColor }}>{formatLabel(attraction.category, t('tourist_destination'))} · {formatLabel(attraction.municipality, 'Naujan')}</p>
            <h1 style={{ color: heroCustomization.heroTitleColor || DEFAULT_ATTRACTION_HERO.heroTitleColor }}>{attraction.name}</h1>
            <div className="ad-hero-meta">
              <span style={{ color: heroCustomization.heroMetaTextColor || DEFAULT_ATTRACTION_HERO.heroMetaTextColor }}>
                <StarIcon size={14} filled className="ad-meta-star" />
                {t('rating')} {displayRating}/5
              </span>
              <span style={{ color: heroCustomization.heroMetaTextColor || DEFAULT_ATTRACTION_HERO.heroMetaTextColor }}>
                {Number(attraction.review_count || 0)} {t('reviews')}
              </span>
              <span style={{ color: heroCustomization.heroMetaTextColor || DEFAULT_ATTRACTION_HERO.heroMetaTextColor }}>
                <MapPinIcon size={14} className="ad-meta-pin" />
                {formatLabel(attraction.location)}
              </span>
            </div>
            <div className="ad-hero-actions">
              <button
                type="button"
                className="ad-btn ad-btn-main"
                style={buttonStyle(heroCustomization.primaryButtonColor, heroCustomization.primaryButtonTextColor, heroCustomization.primaryButtonTransparent)}
                onClick={handleAddToItinerary}
              >
                <PlusIcon size={16} />
                {heroCustomization.addToItineraryText || t('add_to_itinerary')}
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-secondary"
                style={buttonStyle(heroCustomization.secondaryButtonColor, heroCustomization.secondaryButtonTextColor, heroCustomization.secondaryButtonTransparent)}
                onClick={toggleFavorite}
              >
                <HeartIcon size={16} filled={isSaved} />
                {isSaved
                  ? (heroCustomization.savedToFavoritesText || t('saved_to_favorites'))
                  : (heroCustomization.saveToFavoritesText || t('save_to_favorites'))}
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-tertiary"
                style={buttonStyle(heroCustomization.tertiaryButtonColor, heroCustomization.tertiaryButtonTextColor, heroCustomization.tertiaryButtonTransparent)}
                onClick={handleShare}
              >
                <ShareIcon size={16} />
                {heroCustomization.shareText || t('share')}
              </button>
              <a
                className="ad-btn ad-btn-tertiary"
                style={buttonStyle(heroCustomization.tertiaryButtonColor, heroCustomization.tertiaryButtonTextColor, heroCustomization.tertiaryButtonTransparent)}
                href={`https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapIcon size={16} />
                {heroCustomization.viewOnMapText || t('view_on_map')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="ad-gallery ad-card">
        <div className="ad-gallery-main">
          <img
            src={heroImage}
            alt={attraction.name}
            onClick={() => setFullscreenImage(heroImage)}
          />
          <button
            type="button"
            className="ad-gallery-arrow is-prev"
            aria-label="Previous photo"
            onClick={showPreviousImage}
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            className="ad-gallery-arrow is-next"
            aria-label="Next photo"
            onClick={showNextImage}
          >
            <ChevronRightIcon size={18} />
          </button>
          <span className="ad-gallery-counter">
            <CameraIcon size={13} />
            {galleryIndex + 1} / {gallery.length}
          </span>
        </div>
        <div className="ad-gallery-thumbs">
          {gallery.map((img, index) => (
            <button
              type="button"
              key={`${img}-${index}`}
              className={`ad-gallery-thumb${index === galleryIndex ? ' is-active' : ''}`}
              onClick={() => setGalleryIndex(index)}
              aria-label={`Show photo ${index + 1}`}
            >
              <img src={img || FALLBACK_IMAGE} alt={`${attraction.name} ${index + 1}`} loading="lazy" />
            </button>
          ))}
        </div>
      </section>

      <main className="ad-layout">
        <section className="ad-card ad-section ad-span-2">
          <div className="ad-section-title-wrap">
            <h2>{t('about_destination')}</h2>
            {attraction.description?.length > DESCRIPTION_PREVIEW && (
              <button
                type="button"
                className="ad-link-btn"
                onClick={() => setDescriptionExpanded((prev) => !prev)}
              >
                {descriptionExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
          <p className="ad-body-text">{descriptionExpanded ? attraction.description : shortDescription}</p>
          <div className="ad-highlight-box">
            <LightbulbIcon size={18} className="ad-highlight-icon" />
            <p><strong>Travel tip:</strong> Start early in the day to avoid crowds and bring hydration, sunscreen, and cash for local fees.</p>
          </div>
        </section>

        <section className="ad-card ad-section ad-span-1 ad-quick-panel">
          <h3><InfoIcon size={18} className="ad-title-icon" />{t('quick_information')}</h3>
          <ul className="ad-info-list">
            <li>
              <span className="ad-info-icon"><MapPinIcon size={16} /></span>
              <div>
                <p className="ad-info-label">{t('municipality')}</p>
                <p className="ad-info-value">{formatLabel(attraction.municipality, t('not_available'))}</p>
              </div>
            </li>
            <li>
              <span className="ad-info-icon"><MountainIcon size={16} /></span>
              <div>
                <p className="ad-info-label">{t('category')}</p>
                <p className="ad-info-value">{formatLabel(attraction.category, t('not_available'))}</p>
              </div>
            </li>
            <li>
              <span className="ad-info-icon"><ClockIcon size={16} /></span>
              <div>
                <p className="ad-info-label">{t('opening_hours')}</p>
                <p className="ad-info-value">{formatLabel(attraction.hours || attraction.opening_hours, t('not_available'))}</p>
              </div>
            </li>
            <li>
              <span className="ad-info-icon"><MoneyIcon size={16} /></span>
              <div>
                <p className="ad-info-label">{t('entrance_fee')}</p>
                <p className="ad-info-value">{formatLabel(attraction.entrance_fee || attraction.fee ? `PHP ${attraction.entrance_fee || attraction.fee}` : '', t('not_available'))}</p>
              </div>
            </li>
            <li>
              <span className="ad-info-icon"><CalendarIcon size={16} /></span>
              <div>
                <p className="ad-info-label">{t('visit_duration')}</p>
                <p className="ad-info-value">{formatLabel(attraction.visit_duration || t('approx_2_3_hours'), t('not_available'))}</p>
              </div>
            </li>
            <li>
              <span className="ad-info-icon"><SunIcon size={16} /></span>
              <div>
                <p className="ad-info-label">{t('best_time')}</p>
                <p className="ad-info-value">{formatLabel(attraction.best_time_to_visit || t('early_morning'), t('not_available'))}</p>
              </div>
            </li>
            <li>
              <span className="ad-info-icon"><RouteIcon size={16} /></span>
              <div>
                <p className="ad-info-label">{t('difficulty')}</p>
                <p className="ad-info-value">{formatLabel(attraction.difficulty_level || t('easy_to_moderate'), t('not_available'))}</p>
              </div>
            </li>
            {travelFromUser && (
              <li>
                <span className="ad-info-icon"><LocationIcon size={16} /></span>
                <div>
                  <p className="ad-info-label">From your location</p>
                  <p className="ad-info-value">{travelFromUser.distanceKm} km (~{travelFromUser.minutes} min)</p>
                </div>
              </li>
            )}
          </ul>
        </section>

        <section className="ad-card ad-section ad-span-2">
          <div className="ad-section-title-wrap">
            <h2><CloudSunIcon size={18} className="ad-title-icon" />Weather &amp; trail conditions</h2>
          </div>
          <div className="ad-weather-wrap">
            <WeatherWidget
              attractionId={attraction.id}
              latitude={toNumber(attraction.latitude) || 13.3333}
              longitude={toNumber(attraction.longitude) || 121.3}
              locationName={attraction.name}
              showForecast
              showAlerts
              showSafetyTips
              size="large"
              theme={isDark ? 'dark' : 'light'}
            />
          </div>
        </section>

        <div className="ad-span-1 ad-stack">
          <section className="ad-eco-card ad-stack-fill">
            <h3><LeafIcon size={18} className="ad-title-icon" />Eco-friendly spot</h3>
            <p>Help preserve {attraction.name}. Carry in, carry out — leave only footprints, take only memories.</p>
            <div className="ad-eco-tags">
              <span><LeafIcon size={12} />Zero waste</span>
              <span>Low impact</span>
            </div>
          </section>

          <section className="ad-card ad-section ad-share-card">
            <h3>Share this destination</h3>
            <div className="ad-share-grid">
              <a className="is-facebook" href={socialLinks.facebook} target="_blank" rel="noreferrer">
                <FacebookIcon size={20} />
                Facebook
              </a>
              <a className="is-instagram" href={socialLinks.instagram} target="_blank" rel="noreferrer">
                <InstagramIcon size={20} />
                Instagram
              </a>
              <button type="button" className="is-copy" onClick={handleShare}>
                <ShareIcon size={20} />
                Copy link
              </button>
            </div>
          </section>
        </div>

        <section className="ad-card ad-section ad-span-3" id="map-section">
          <div className="ad-map-header">
            <h2><MapPinIcon size={18} className="ad-title-icon" />Map &amp; directions</h2>
            <a
              className="ad-link-btn"
              href={`https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`}
              target="_blank"
              rel="noreferrer"
            >
              Get Directions
            </a>
          </div>
          <LeafletMap
            center={[toNumber(attraction.latitude) || 13.3333, toNumber(attraction.longitude) || 121.3]}
            zoom={14}
            markers={mapMarkers}
            style={{ height: 340, borderRadius: 14 }}
          />
        </section>

        <section className="ad-card ad-section ad-span-2">
          <div className="ad-section-title-wrap">
            <h2>Visitor reviews</h2>
            <button
              type="button"
              className="ad-review-cta"
              onClick={handleOpenReviewModal}
              disabled={eligibleItineraries.length === 0}
              style={{
                opacity: eligibleItineraries.length === 0 ? 0.6 : 1,
                cursor: eligibleItineraries.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {eligibleItineraries.length > 0 ? 'Leave a Review' : 'Complete a Trip to Review'}
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="ad-muted">No reviews yet. Be the first to share your experience.</p>
          ) : (
            <div className="ad-review-list">
              {reviews.slice(0, 6).map((review) => (
                <article key={review.review_id} className="ad-review-card">
                  <div className="ad-review-top">
                    <div className="ad-reviewer">
                      <span className="ad-review-avatar">
                        {String(review.user_id || 'G').slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <strong>Traveler #{review.user_id || 'Guest'}</strong>
                        <time>{review.review_date ? new Date(review.review_date).toLocaleDateString() : 'Recently'}</time>
                      </div>
                    </div>
                    <span className="ad-rating-pill">{Number(review.rating || 0).toFixed(1)}/5</span>
                  </div>
                  <p>{review.comment || 'No written comment.'}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="ad-card ad-section ad-span-1 ad-rating-card">
          {ratingStats && (
            <div className="ad-rating-summary">
              <div className="ad-rating-score">
                <p className="ad-rating-avg">{ratingStats.avg}</p>
                <div className="ad-rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      size={16}
                      filled
                      className={star <= Math.round(Number(ratingStats.avg)) ? 'is-on' : ''}
                    />
                  ))}
                </div>
                <p className="ad-rating-count">Based on {ratingStats.total} {ratingStats.total === 1 ? 'review' : 'reviews'}</p>
              </div>
              <div className="ad-rating-bars">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div className="ad-rating-bar-row" key={star}>
                    <span>{star}★</span>
                    <div className="ad-rating-bar">
                      <div
                        className="ad-rating-bar-fill"
                        style={{ width: `${(ratingStats.counts[star] / ratingStats.total) * 100}%` }}
                      />
                    </div>
                    <span className="ad-rating-bar-count">{ratingStats.counts[star]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            className="ad-review-cta ad-review-cta--outline"
            onClick={handleOpenReviewModal}
            disabled={eligibleItineraries.length === 0}
          >
            {eligibleItineraries.length > 0 ? 'Write a review' : 'Complete a Trip to Review'}
          </button>
        </section>

        <section className="ad-card ad-section ad-span-3">
          <div className="ad-section-title-wrap">
            <h2><CompassIcon size={18} className="ad-title-icon" />Nearby recommendations</h2>
          </div>
          <div className="ad-nearby-grid">
            <div className="ad-nearby-col">
              <h3>Similar attractions</h3>
              <div className="ad-mini-list">
                {nearbyAttractions.length === 0 && <p className="ad-muted">No nearby attractions found.</p>}
                {nearbyAttractions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="ad-mini-card"
                    onClick={() => navigate(`/attractions/${item.id}`, { state: { attraction: item } })}
                  >
                    <img src={item.image_url || FALLBACK_IMAGE} alt={item.name} loading="lazy" />
                    <div>
                      <strong>{item.name}</strong>
                      <p>
                        <MapPinIcon size={13} />
                        {item.distanceKm ? `${item.distanceKm.toFixed(1)} km away` : formatLabel(item.location)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="ad-nearby-col">
              <h3>{t('nearby_hotels')}</h3>
              <div className="ad-mini-list">
                {nearbyHotels.length === 0 && <p className="ad-muted">{t('no_nearby_hotels')}</p>}
                {nearbyHotels.map((hotel) => (
                  <article key={hotel.hotel_id || hotel.id} className="ad-mini-card static-card">
                    <img src={hotel.image_url || FALLBACK_IMAGE} alt={hotel.name || 'Hotel'} loading="lazy" />
                    <div>
                      <strong>{hotel.name || 'Hotel'}</strong>
                      <p>
                        <HotelIcon size={13} />
                        {hotel.distanceKm ? `${hotel.distanceKm.toFixed(1)} km away` : formatLabel(hotel.address || hotel.location)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {fullscreenImage && (
        <div className="ad-lightbox" role="dialog" aria-modal="true" onClick={() => setFullscreenImage(null)}>
          <button type="button" className="ad-lightbox-close" onClick={() => setFullscreenImage(null)}>Close</button>
          <img src={fullscreenImage} alt="Attraction preview" />
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="ad-modal-overlay" onClick={handleCloseReviewModal} role="dialog" aria-modal="true">
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <h2>{t('share_your_experience_heading')}</h2>
              <button type="button" className="ad-modal-close" onClick={handleCloseReviewModal}>×</button>
            </div>

            {reviewSuccess ? (
              <div className="ad-modal-body ad-modal-body--center">
                <p className="ad-review-success">✓ Thank you! Your review has been submitted.</p>
              </div>
            ) : (
              <div className="ad-modal-body">
                {reviewError && (
                  <div className="ad-form-alert">
                    {reviewError}
                  </div>
                )}

                <div className="ad-form-field">
                  <label>{t('review_form_rating')} *</label>
                  <div className="ad-star-picker">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`ad-star-btn${star <= reviewForm.rating ? ' is-on' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {eligibleItineraries.length > 0 ? (
                  <div className="ad-form-field">
                    <label htmlFor="review-itinerary">
                      {t('select_completed_trip')} *
                    </label>
                    <select
                      id="review-itinerary"
                      className="ad-select"
                      value={reviewForm.itinerary_id || eligibleItineraries[0]?.itinerary_id || ''}
                      onChange={(e) => setReviewForm({ ...reviewForm, itinerary_id: e.target.value ? parseInt(e.target.value) : null })}
                    >
                      {eligibleItineraries.map((itinerary) => (
                        <option key={itinerary.itinerary_id} value={itinerary.itinerary_id}>
                          {itinerary.name} ({itinerary.start_date} to {itinerary.end_date})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="ad-form-note">
                    {t('review_requires_completed_itinerary')}
                  </div>
                )}

                <div className="ad-form-field">
                  <label htmlFor="review-comment">
                    {t('review_form_review')} *
                  </label>
                  <textarea
                    id="review-comment"
                    className="ad-textarea"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder={t('placeholder_review_comment')}
                  />
                </div>

                <div className="ad-modal-actions">
                  <button
                    type="button"
                    className="ad-modal-btn"
                    onClick={handleCloseReviewModal}
                  >
                    {t('button_cancel_review')}
                  </button>
                  <button
                    type="button"
                    className="ad-modal-btn is-confirm"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? t('submitting') : t('submit_review')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttractionDetails;
