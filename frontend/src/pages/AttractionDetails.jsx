import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { fetchAttractionHeroSettings, fetchAttractions, fetchHotels, fetchReviews, fetchUserItineraries, submitReview } from '../api';
import { useLanguage } from '../context/LanguageContext';
import LeafletMap from '../components/LeafletMap';
import WeatherWidget from '../components/WeatherWidget';
import { loadCachedSetting, saveCachedSetting } from '../utils/siteSettingsCache';
import './AttractionDetails.css';

const FALLBACK_IMAGE = '/placeholder.jpg';
const DESCRIPTION_PREVIEW = 320;
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
            {heroCustomization.backButtonLabel || t('back')}
          </Link>
          <div className="ad-hero-content">
            <p className="ad-badge" style={{ color: heroCustomization.heroBadgeTextColor || DEFAULT_ATTRACTION_HERO.heroBadgeTextColor }}>{popularityLabel}</p>
            <p className="ad-kicker" style={{ color: heroCustomization.heroKickerColor || DEFAULT_ATTRACTION_HERO.heroKickerColor }}>{formatLabel(attraction.category, t('tourist_destination'))} • {formatLabel(attraction.municipality, 'Naujan')}</p>
            <h1 style={{ color: heroCustomization.heroTitleColor || DEFAULT_ATTRACTION_HERO.heroTitleColor }}>{attraction.name}</h1>
            <div className="ad-hero-meta">
              <span style={{ color: heroCustomization.heroMetaTextColor || DEFAULT_ATTRACTION_HERO.heroMetaTextColor }}>{t('rating')} {displayRating}/5</span>
              <span style={{ color: heroCustomization.heroMetaTextColor || DEFAULT_ATTRACTION_HERO.heroMetaTextColor }}>{Number(attraction.review_count || 0)} {t('reviews')}</span>
              <span style={{ color: heroCustomization.heroMetaTextColor || DEFAULT_ATTRACTION_HERO.heroMetaTextColor }}>{formatLabel(attraction.location)}</span>
            </div>
            <div className="ad-hero-actions">
              <button
                type="button"
                className="ad-btn ad-btn-main"
                style={buttonStyle(heroCustomization.primaryButtonColor, heroCustomization.primaryButtonTextColor, heroCustomization.primaryButtonTransparent)}
                onClick={handleAddToItinerary}
              >
                {heroCustomization.addToItineraryText || t('add_to_itinerary')}
              </button>
              <button
                type="button"
                className="ad-btn ad-btn-secondary"
                style={buttonStyle(heroCustomization.secondaryButtonColor, heroCustomization.secondaryButtonTextColor, heroCustomization.secondaryButtonTransparent)}
                onClick={toggleFavorite}
              >
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
                {heroCustomization.shareText || t('share')}
              </button>
              <a
                className="ad-btn ad-btn-tertiary"
                style={buttonStyle(heroCustomization.tertiaryButtonColor, heroCustomization.tertiaryButtonTextColor, heroCustomization.tertiaryButtonTransparent)}
                href={`https://www.google.com/maps/search/?api=1&query=${attraction.latitude},${attraction.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                {heroCustomization.viewOnMapText || t('view_on_map')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="ad-gallery-strip ad-card">
        {gallery.map((img, index) => (
          <button
            type="button"
            key={`${img}-${index}`}
            className={`ad-gallery-thumb${index === galleryIndex ? ' is-active' : ''}`}
            onClick={() => {
              setGalleryIndex(index);
              setFullscreenImage(img);
            }}
          >
            <img src={img || FALLBACK_IMAGE} alt={`${attraction.name} ${index + 1}`} loading="lazy" />
          </button>
        ))}
      </section>

      <main className="ad-layout">
        <div className="ad-main-column">
          <section className="ad-card ad-section">
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
              <strong>Travel tip:</strong> Start early in the day to avoid crowds and bring hydration, sunscreen, and cash for local fees.
            </div>
          </section>

          <section className="ad-card ad-section">
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
                theme="light"
              />
            </div>
          </section>

          <section className="ad-card ad-section" id="map-section">
            <div className="ad-map-header">
              <h2>Map and directions</h2>
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
              style={{ height: 390, borderRadius: 14 }}
            />
          </section>

          <section className="ad-card ad-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Visitor reviews</h2>
              <button
                type="button"
                className="ad-primary-btn"
                onClick={handleOpenReviewModal}
                disabled={eligibleItineraries.length === 0}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
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
              <div className="ad-reviews-grid">
                {reviews.slice(0, 6).map((review) => (
                  <article key={review.review_id} className="ad-review-card">
                    <div className="ad-review-top">
                      <strong>Traveler #{review.user_id || 'Guest'}</strong>
                      <span className="ad-rating-pill">{Number(review.rating || 0).toFixed(1)}/5</span>
                    </div>
                    <p>{review.comment || 'No written comment.'}</p>
                    <time>{review.review_date ? new Date(review.review_date).toLocaleDateString() : 'Recently'}</time>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="ad-card ad-section">
            <h2>Nearby recommendations</h2>
            <div className="ad-nearby-grid">
              <div>
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
                        <p>{item.distanceKm ? `${item.distanceKm.toFixed(1)} km away` : formatLabel(item.location)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3>{t('nearby_hotels')}</h3>
                <div className="ad-mini-list">
                  {nearbyHotels.length === 0 && <p className="ad-muted">{t('no_nearby_hotels')}</p>}
                  {nearbyHotels.map((hotel) => (
                    <article key={hotel.hotel_id || hotel.id} className="ad-mini-card static-card">
                      <img src={hotel.image_url || FALLBACK_IMAGE} alt={hotel.name || 'Hotel'} loading="lazy" />
                      <div>
                        <strong>{hotel.name || 'Hotel'}</strong>
                        <p>{hotel.distanceKm ? `${hotel.distanceKm.toFixed(1)} km away` : formatLabel(hotel.address || hotel.location)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="ad-sidebar-column">
          <section className="ad-card ad-quick-panel">
            <h3>{t('quick_information')}</h3>
            <div className="ad-info-grid">
              <div><span>{t('municipality')}</span><strong>{formatLabel(attraction.municipality, t('not_available'))}</strong></div>
              <div><span>{t('category')}</span><strong>{formatLabel(attraction.category, t('not_available'))}</strong></div>
              <div><span>{t('opening_hours')}</span><strong>{formatLabel(attraction.hours || attraction.opening_hours, t('not_available'))}</strong></div>
              <div><span>{t('entrance_fee')}</span><strong>{formatLabel(attraction.entrance_fee || attraction.fee ? `PHP ${attraction.entrance_fee || attraction.fee}` : '', t('not_available'))}</strong></div>
              <div><span>{t('visit_duration')}</span><strong>{formatLabel(attraction.visit_duration || t('approx_2_3_hours'), t('not_available'))}</strong></div>
              <div><span>{t('best_time')}</span><strong>{formatLabel(attraction.best_time_to_visit || t('early_morning'), t('not_available'))}</strong></div>
              <div><span>{t('difficulty')}</span><strong>{formatLabel(attraction.difficulty_level || t('easy_to_moderate'), t('not_available'))}</strong></div>
              {travelFromUser && (
                <div><span>From your location</span><strong>{travelFromUser.distanceKm} km (~{travelFromUser.minutes} min)</strong></div>
              )}
            </div>
          </section>
        </aside>
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
              <div className="ad-modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ fontSize: '1.1rem', color: '#16a34a' }}>✓ Thank you! Your review has been submitted.</p>
              </div>
            ) : (
              <div className="ad-modal-body">
                {reviewError && (
                  <div style={{ padding: '0.75rem', marginBottom: '1rem', backgroundColor: '#fee', borderRadius: '8px', color: '#c00' }}>
                    {reviewError}
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('review_form_rating')} *</label>
                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: star <= reviewForm.rating ? '#fbbf24' : '#d1d5db',
                          fontSize: '1.5rem'
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                {eligibleItineraries.length > 0 ? (
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="review-itinerary" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {t('select_completed_trip')} *
                    </label>
                    <select
                      id="review-itinerary"
                      value={reviewForm.itinerary_id || eligibleItineraries[0]?.itinerary_id || ''}
                      onChange={(e) => setReviewForm({ ...reviewForm, itinerary_id: e.target.value ? parseInt(e.target.value) : null })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem'
                      }}
                    >
                      {eligibleItineraries.map((itinerary) => (
                        <option key={itinerary.itinerary_id} value={itinerary.itinerary_id}>
                          {itinerary.name} ({itinerary.start_date} to {itinerary.end_date})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '8px', backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                    {t('review_requires_completed_itinerary')}
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label htmlFor="review-comment" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    {t('review_form_review')} *
                  </label>
                  <textarea
                    id="review-comment"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder={t('placeholder_review_comment')}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleCloseReviewModal}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      fontSize: '1rem'
                    }}
                  >
                    {t('button_cancel_review')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      cursor: submittingReview ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      opacity: submittingReview ? 0.6 : 1
                    }}
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
