import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAttractions, fetchHotels, fetchPOIs, fetchMapMarkers } from '../api';
import { weatherService } from '../services/weatherService';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import VehicleIndicator from '../components/VehicleIndicator';
import { MapIcon, ShieldIcon, CheckIcon, UserIcon, SparklesIcon } from '../components/Icons';
import HeroSlideshow from '../components/HeroSlideshow';
import naujanGoLogo from '../assets/552820828_1195483019268738_3720769628710779316_n.png';
import 'leaflet/dist/leaflet.css';
import './InteractiveMap.css';

const getCategoryIcon = (category) => {
  const icons = {
    'attraction': 'AttractionIcon', 'market': 'HotelIcon', 'beach': 'AttractionIcon', 'mountain': 'AttractionIcon',
    'landmark': 'AttractionIcon', 'restaurant': 'HotelIcon', 'hotel': 'HotelIcon', 'hospital': 'LocationIcon',
    'school': 'LocationIcon', 'church': 'LocationIcon', 'park': 'AttractionIcon'
  };
  return icons[category?.toLowerCase()] || 'LocationIcon';
};

const resolveImageUrl = (data) => {
  if (!data || typeof data !== 'object') {
    console.log('resolveImageUrl: invalid data', typeof data, data);
    return null;
  }

  // Log the object keys to see what we're working with
  console.log('resolveImageUrl input keys:', Object.keys(data).join(', '));
  console.log('resolveImageUrl input data.image_url:', data.image_url);
  console.log('resolveImageUrl full input:', data);

  const directCandidates = [
    data.image_url,
    data.imageUrl,
    data.primary_image_url,
    data.image,
    data.thumbnail_url,
    data.thumbnail,
    data.photo_url,
    data.photo,
    data.cover_image,
    data.coverImage
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      const trimmed = candidate.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            const firstValid = parsed.find((value) => typeof value === 'string' && value.trim());
            if (firstValid) return firstValid.trim();
          }
          if (parsed && typeof parsed === 'object') {
            return resolveImageUrl(parsed);
          }
        } catch {
          // fall through to direct URL handling
        }
      }
      console.log('resolveImageUrl: returning trimmed candidate:', trimmed);
      return trimmed;
    }
  }

  const arrayCandidates = [data.image_urls, data.images, data.photos, data.gallery];
  for (const candidate of arrayCandidates) {
    if (Array.isArray(candidate)) {
      const firstValid = candidate.find((value) => typeof value === 'string' && value.trim());
      if (firstValid) return firstValid.trim();
    }
  }

  const likelyImageValue = Object.values(data).find((value) => {
    if (typeof value !== 'string') return false;
    const normalized = value.trim();
    if (!normalized) return false;
    if (normalized.startsWith('[') || normalized.startsWith('{')) {
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          const firstValid = parsed.find((entry) => typeof entry === 'string' && entry.trim());
          if (firstValid) return firstValid.trim();
        }
        if (parsed && typeof parsed === 'object') {
          const nested = resolveImageUrl(parsed);
          if (nested) return nested;
        }
      } catch {
        // ignore JSON parse failures and continue
      }
    }
    return /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(normalized) || /https?:\/\//i.test(normalized) || normalized.startsWith('/');
  });

  console.log('resolveImageUrl: returning null, likelyImageValue:', likelyImageValue);
  return typeof likelyImageValue === 'string' && likelyImageValue.trim() ? likelyImageValue.trim() : null;
};

const ATTRACTION_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80'
];

const getAttractionFallbackImage = (data) => {
  const key = `${data?.id || ''}${data?.name || ''}${data?.category || ''}${data?.location || ''}`.toLowerCase();
  const total = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ATTRACTION_FALLBACK_IMAGES[total % ATTRACTION_FALLBACK_IMAGES.length];
};

const InteractiveMap = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isLoggedIn } = useAuth();
  
  // State management
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [pois, setPois] = useState([]);
  const [mapView, setMapView] = useState('street');
  const [userLocation, setUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([13.3333, 121.3000]);
  const [activeFilters, setActiveFilters] = useState({ attractions: true, hotels: true, pois: true, weather: true });
  const [loading, setLoading] = useState(true);
  const [attractionWeather, setAttractionWeather] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1025;
  });
  const [weatherOverlay, setWeatherOverlay] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [navTarget, setNavTarget] = useState(null);
  const [isRerouting, setIsRerouting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const gpsWatchIdRef = useRef(null);

  // Fetch data on mount
  useEffect(() => {
    loadData();
    startGpsTracking();
    return () => console.log('InteractiveMap unmounting');
  }, []);

  useEffect(() => {
    return () => {
      if (navigator.geolocation && gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, []);

  const toggleFullscreen = () => {
    const mapElement = document.getElementById('interactive-map-container');
    if (!document.fullscreenElement) {
      mapElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(err => console.error(err));
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const loadData = async () => {
    try {
      const [attractionsRes, hotelsRes, poisRes] = await Promise.all([
        fetchAttractions(),
        fetchHotels(),
        fetchPOIs()
      ]);

      const attractionData = Array.isArray(attractionsRes.data?.data) ? attractionsRes.data.data : [];
      const hotelData = Array.isArray(hotelsRes.data?.data) ? hotelsRes.data.data : [];
      const poiData = poisRes.data || [];

      setAttractions(attractionData);
      setHotels(hotelData);
      setPois(poiData);

      // Fetch weather for attractions
      fetchWeatherForAttractions(attractionData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherForAttractions = async (attractionsList) => {
    const weatherPromises = attractionsList
      .filter(a => a.latitude && a.longitude)
      .slice(0, 15)
      .map(async (attraction) => {
        try {
          const weather = await weatherService.getCurrentWeather(
            parseFloat(attraction.latitude),
            parseFloat(attraction.longitude),
            attraction.name
          );
          const safetyScore = weatherService.getTravelSafetyScore(weather);
          return { id: attraction.id, weather, safetyScore };
        } catch (error) {
          return { id: attraction.id, weather: null, safetyScore: null };
        }
      });
    
    const results = await Promise.all(weatherPromises);
    const weatherMap = {};
    results.forEach(({ id, weather, safetyScore }) => {
      if (weather) weatherMap[id] = { weather, safetyScore };
    });
    setAttractionWeather(weatherMap);
  };

  const startGpsTracking = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError(t('geolocation_not_supported'));
      return;
    }
    // Browsers block geolocation on plain HTTP non-localhost origins.
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setGpsError(t('gps_requires_https'));
      return;
    }

      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }

    setGpsLoading(true);
      const gpsOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
      const handleSuccess = (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        if (position.coords.heading != null) {
          setUserHeading(position.coords.heading);
        }
        setGpsLoading(false);
        setGpsError('');
      };
      const handleError = (error) => {
        setGpsLoading(false);
        const msgs = {
          1: t('gps_permission_denied'),
          2: t('gps_position_unavailable'),
          3: t('gps_timeout'),
        };
        setGpsError(msgs[error.code] || `${t('location_error_generic')}: ${error.message}`);
      };

      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, gpsOptions);
      gpsWatchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, gpsOptions);
  };

  const validAttractions = attractions.filter(a => a.latitude && a.longitude);
  const validHotels = hotels.filter(h => h.latitude && h.longitude);
  const validPois = pois.filter(p => p.latitude && p.longitude);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Naujan')}`);
      const results = await response.json();
      if (results.length > 0) {
        setMapCenter([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const getWeatherColor = (safetyScore) => {
    if (safetyScore >= 80) return '#4caf50';
    if (safetyScore >= 60) return '#ff9800';
    return '#ff5722';
  };

  const allMarkers = [
    // User location is handled separately in LeafletMap component
    ...(activeFilters.attractions ? validAttractions.map(a => {
      const weatherInfo = attractionWeather[a.id];
      const weatherBadge = weatherInfo && activeFilters.weather ? 
        `<div style="background:${getWeatherColor(weatherInfo.safetyScore)};color:white;padding:6px 10px;border-radius:20px;display:inline-block;margin-bottom:8px;font-size:0.85em;font-weight:600">
          <span style="margin-right:4px">${weatherInfo.weather.condition === 'Clear' ? '☀️' : weatherInfo.weather.condition === 'Rain' ? '🌧️' : weatherInfo.weather.condition === 'Clouds' ? '☁️' : '🌤️'}</span>
          ${weatherInfo.weather.temperature}°C · Safety ${weatherInfo.safetyScore}/100
        </div>` : '';

      const imageUrl = resolveImageUrl(a);

      return {
        lat: parseFloat(a.latitude),
        lng: parseFloat(a.longitude),
        data: a,
        type: 'attraction',
        icon: '🏞️',
        imageUrl
      };
    }) : []),
    ...(activeFilters.hotels ? validHotels.map(h => ({
      lat: parseFloat(h.latitude),
      lng: parseFloat(h.longitude),
      data: h,
      type: 'hotel',
      icon: '🏨'
    })) : []),
    ...(activeFilters.pois ? validPois.map(p => ({
      lat: parseFloat(p.latitude),
      lng: parseFloat(p.longitude),
      data: p,
      type: 'poi',
      icon: getCategoryIcon(p.category)
    })) : [])
  ];

  console.log('Total markers created:', allMarkers.length);
  console.log('Attractions:', validAttractions.length, 'Hotels:', validHotels.length, 'POIs:', validPois.length);
  console.log('Sample marker:', allMarkers[0]);

  const getTileLayerUrl = () => {
    switch (mapView) {
      case 'satellite': return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain': return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default: return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const selectedData = selectedLocation?.data;
  const selectedType = selectedLocation?.type;
  const canonicalSelectedData = selectedType === 'attraction' && selectedData?.id
    ? (attractions.find((item) => String(item.id) === String(selectedData.id)) || selectedData)
    : selectedData;
  
  // For attractions, prioritize image_url field directly
  let selectedImage = null;
  if (selectedType === 'attraction' && canonicalSelectedData?.image_url) {
    selectedImage = canonicalSelectedData.image_url;
    console.log('Using direct image_url:', selectedImage);
  } else {
    selectedImage = resolveImageUrl(canonicalSelectedData) || (selectedType === 'attraction' ? getAttractionFallbackImage(canonicalSelectedData) : null);
    console.log('Using resolveImageUrl result:', selectedImage);
  }
  
  // DEBUG: Log image resolution
  if (selectedLocation) {
    console.log('=== IMAGE DEBUG ===');
    console.log('selectedLocation:', selectedLocation);
    console.log('selectedData:', selectedData);
    console.log('selectedType:', selectedType);
    console.log('canonicalSelectedData:', canonicalSelectedData);
    console.log('canonicalSelectedData.image_url:', canonicalSelectedData?.image_url);
    console.log('selectedImage:', selectedImage);
    console.log('==================');
  }
  const selectedCategoryLabel = (() => {
    if (!selectedType) return '';
    if (selectedType === 'hotel') return '🏨 Hotel';
    const categoryText = selectedData?.category || (selectedType === 'poi' ? 'POI' : 'Attraction');
    return `${getCategoryIcon(categoryText)} ${categoryText}`;
  })();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>{t('loading_map')}</p>
      </div>
    );
  }

  return (
    <div className="imap-container">
      {/* Hero Section */}
      <HeroSlideshow 
        title={t('interactive_map_explorer')}
        subtitle={t('discover_with_weather').replace('{attractions}', validAttractions.length).replace('{hotels}', validHotels.length).replace('{pois}', validPois.length)}
        height="400px"
        showControls={false}
      />

      {/* Login Reminder for Logged-out Users */}
      {!isLoggedIn && (
        <>
          <div className="imap-login-banner">
            <div className="imap-login-content">
              <div style={styles.modernLoginIconWrapper}>
                <ShieldIcon size={56} color="white" />
              </div>
              <div style={styles.modernLoginText}>
                <h2 style={styles.modernLoginTitle}>{t('sign_in_required')}</h2>
                <p style={styles.modernLoginMessage}>
                  {t('login_required_map_msg')}
                </p>
                <ul style={styles.modernFeaturesList}>
                  <li style={styles.modernFeatureItem}>
                    <span style={styles.modernFeatureIcon}><CheckIcon size={12} /></span>
                    <span>{t('save_custom_routes')}</span>
                  </li>
                  <li style={styles.modernFeatureItem}>
                    <span style={styles.modernFeatureIcon}><CheckIcon size={12} /></span>
                    <span>{t('get_personalized')}</span>
                  </li>
                  <li style={styles.modernFeatureItem}>
                    <span style={styles.modernFeatureIcon}><CheckIcon size={12} /></span>
                    <span>{t('track_history')}</span>
                  </li>
                  <li style={styles.modernFeatureItem}>
                    <span style={styles.modernFeatureIcon}><CheckIcon size={12} /></span>
                    <span>{t('real_time_weather')}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="imap-login-buttons">
              <button 
                onClick={() => navigate('/login?redirect=/interactive-map')} 
                style={styles.modernMapLoginBtn}
                className="map-login-btn"
              >
                <span style={{fontSize: '1.1rem', marginRight: '8px'}}><UserIcon size={20} /></span>
                {t('login_button') || 'Login'}
              </button>
              <button 
                onClick={() => navigate('/register')} 
                style={styles.modernMapRegisterBtn}
                className="map-register-btn"
              >
                <span style={{fontSize: '1.1rem', marginRight: '8px'}}><SparklesIcon size={20} /></span>
                {t('register')}
              </button>
            </div>
            <button 
              onClick={() => navigate('/')} 
              style={styles.modernMapBackHomeLink}
              className="map-back-home-link"
            >
              {t('back_to_home')}
            </button>
          </div>

          {/* Map Preview Section */}
          <div style={styles.mapPreviewSection}>
            <h3 style={styles.mapPreviewTitle}>{t('preview_interactive_map_features')}</h3>
            <div style={styles.mapPreviewGrid} className="map-preview-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} style={styles.mapPreviewCard}>
                  <div style={styles.mapPreviewImageBlur}></div>
                  <div style={styles.mapPreviewCardBody}>
                    <div style={styles.mapPreviewCardTitle}>{t('map_feature')}</div>
                    <div style={styles.mapPreviewCardLocation}>🗺️ {t('interactive_navigation')}</div>
                    <div style={styles.mapPreviewCardFeature}>🏞️ {t('explore_locations')}</div>
                    <div style={styles.mapPreviewCardFeature}>🧭 {t('route_planning')}</div>
                  </div>
                  <div style={styles.mapPreviewLock}><ShieldIcon size={64} /></div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Content - Only show when logged in */}
      {isLoggedIn && (
      <div className="imap-main">
        {/* Mobile sidebar toggle */}
        <button
          className="imap-mobile-toggle"
          onClick={() => setShowSidebar(s => !s)}
          title={showSidebar ? t('hide_sidebar') : t('show_sidebar')}
        >
          {showSidebar ? '✕' : '☰'}
        </button>
        {/* Sidebar */}
        <div className={`imap-sidebar sidebar-scroll${showSidebar ? '' : ' imap-sidebar--hidden'}`}>
          <div className={`imap-sidebar-header${showSidebar ? '' : ' imap-sidebar-header--collapsed'}`}>
            {showSidebar && (
              <h2 className="imap-sidebar-title" style={{display:'flex', alignItems:'center'}}>
                <img
                  src={naujanGoLogo}
                  alt="NaujanGO"
                  style={{ width:'26px', height:'26px', borderRadius:'7px', objectFit:'cover', marginRight:'8px', boxShadow:'0 1px 4px rgba(0,0,0,0.25)' }}
                />
                <span>{t('explorer_panel')}</span>
              </h2>
            )}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="imap-sidebar-toggle"
              title={showSidebar ? t('hide_sidebar') : t('show_sidebar')}
            >
              {showSidebar ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 12h18M3 6h18M3 18h18"/>
                </svg>
              )}
            </button>
          </div>

          {showSidebar && (
          <>
          {/* Search */}
          <form onSubmit={handleSearch} style={styles.searchContainer}>
            <input
              type="text"
              placeholder={t('search_locations')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              className="search-input"
            />
            <button type="submit" style={styles.searchButton} className="search-button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              {t('search')}
            </button>
          </form>

          {/* Quick Filters */}
          <div style={styles.filterSection}>
            <h3 style={styles.filterTitle}>{t('quick_filters')}</h3>
            <div style={styles.filterGrid}>
                <label style={styles.filterLabel} className="filter-label">
                <input 
                  type="checkbox" 
                  checked={activeFilters.attractions}
                  onChange={() => setActiveFilters(prev => ({...prev, attractions: !prev.attractions}))}
                  style={styles.checkbox}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', flexShrink: 0}}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>{t('attractions')} ({validAttractions.length})</span>
              </label>
              <label style={styles.filterLabel} className="filter-label">
                <input
                  type="checkbox"
                  checked={activeFilters.hotels}
                  onChange={() => setActiveFilters(prev => ({...prev, hotels: !prev.hotels}))}
                  style={styles.checkbox}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', flexShrink: 0}}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <path d="M9 22V12h6v10"/>
                </svg>
                <span>{t('hotels')} ({validHotels.length})</span>
              </label>
              <label style={styles.filterLabel} className="filter-label">
                <input 
                  type="checkbox" 
                  checked={activeFilters.pois}
                  onChange={() => setActiveFilters(prev => ({...prev, pois: !prev.pois}))}
                  style={styles.checkbox}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', flexShrink: 0}}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{t('pois')} ({validPois.length})</span>
              </label>
              <label style={styles.filterLabel} className="filter-label">
                <input 
                  type="checkbox" 
                  checked={activeFilters.weather}
                  onChange={() => setActiveFilters(prev => ({...prev, weather: !prev.weather}))}
                  style={styles.checkbox}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px', flexShrink: 0}}>
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <span>{t('weather_data')}</span>
              </label>
            </div>
          </div>

          {/* Map View Selector */}
          <div style={styles.viewSection}>
            <h3 style={styles.filterTitle}>{t('map_style')}</h3>
            <div style={styles.viewGrid}>
              {['street', 'satellite', 'terrain'].map(view => (
                <button
                  key={view}
                  onClick={() => setMapView(view)}
                  className="view-button"
                  style={{
                    ...styles.viewButton,
                    ...(mapView === view ? styles.viewButtonActive : {})
                  }}
                >
                  {view === 'street' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                  )}
                  {view === 'satellite' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                      <path d="M2 12h20"/>
                    </svg>
                  )}
                  {view === 'terrain' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                      <polyline points="4 14 10 8 15 13 22 6"/>
                      <polyline points="22 6 22 10 18 10"/>
                    </svg>
                  )}
                  <span style={{textTransform: 'capitalize'}}>{t(view)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* GPS Status */}
          <div style={styles.gpsSection}>
            <div style={styles.gpsHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={styles.gpsHeaderText}>{t('location_services')}</span>
            </div>
            <button 
              onClick={startGpsTracking}
              disabled={gpsLoading}
              className="gps-button"
              style={{
                ...styles.gpsButton,
                ...(userLocation ? styles.gpsButtonActive : {}),
                ...(gpsLoading ? { opacity: 0.7, cursor: 'not-allowed' } : {})
              }}
            >
              {gpsLoading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight:'8px', animation:'spin 1s linear infinite'}}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <span>{t('locating')}</span>
                </>
              ) : userLocation ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>{t('gps_active')}</span>
                  <div style={styles.gpsPulse}></div>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '8px'}}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{t('enable_gps')}</span>
                </>
              )}
            </button>
            {userLocation && (
              <div style={styles.gpsCoords}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px'}}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </div>
            )}
            {gpsError && (
              <div style={{ marginTop:'0.6rem', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', padding:'0.6rem 0.75rem', fontSize:'0.78rem', color:'#991b1b', lineHeight:'1.45' }}>
                ⚠️ {gpsError}
              </div>
            )}
          </div>

          {/* Attractions List */}
          <div style={styles.attractionsList}>
            <h3 style={styles.filterTitle}>{t('top_attractions')}</h3>
            <div style={styles.attractionsScroll} className="sidebar-scroll">
              {validAttractions.slice(0, 8).map(attraction => {
                const weather = attractionWeather[attraction.id];
                return (
                  <div 
                    key={attraction.id} 
                    style={styles.attractionCard}
                    className="attraction-card"
                    onClick={() => {
                      setMapCenter([parseFloat(attraction.latitude), parseFloat(attraction.longitude)]);
                      setSelectedLocation({ type: 'attraction', data: attraction });
                    }}
                  >
                    <img src={attraction.image_url} alt={attraction.name} style={styles.attractionImage} />
                    <div style={styles.attractionInfo}>
                      <h4 style={styles.attractionName}>{attraction.name}</h4>
                      <p style={styles.attractionLocation}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px'}}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {attraction.location}
                      </p>
                      {weather && (
                        <div style={{
                          ...styles.weatherBadge,
                          background: getWeatherColor(weather.safetyScore)
                        }}>
                          {weather.weather.temperature}°C · {weather.safetyScore}/100
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Map Container */}
        <div className="imap-map-wrapper">
          {/* Map Controls */}
          <div>
            <div className="imap-stats-bar">
              <div className="imap-stat-item">
                <span className="imap-stat-number">{allMarkers.length}</span>
                <span className="imap-stat-label">{t('locations')}</span>
              </div>
              <div className="imap-stat-divider" />
              <div className="imap-stat-item">
                <span className="imap-stat-number">{validAttractions.length}</span>
                <span className="imap-stat-label">{t('attractions')}</span>
              </div>
              <div className="imap-stat-divider" />
              <div className="imap-stat-item">
                <span className="imap-stat-number">{validHotels.length}</span>
                <span className="imap-stat-label">{t('hotels')}</span>
              </div>
              <div className="imap-stat-divider" />
              <div className="imap-stat-item">
                <span className="imap-stat-number">{validPois.length}</span>
                <span className="imap-stat-label">{t('pois')}</span>
              </div>
            </div>
          </div>

          {/* Leaflet Map */}
          <div id="interactive-map-container" className="imap-map-container">
            {/* Active Route Info Banner */}
            {routeInfo && (
              <div style={{ position:'absolute', bottom:'70px', left:'50%', transform:'translateX(-50%)', zIndex:1000, background:'#fff', borderRadius:'14px', boxShadow:'0 6px 24px rgba(0,0,0,0.18)', padding:'0.85rem 1.25rem', display:'flex', flexDirection:'column', gap:'0.5rem', minWidth:'300px', maxWidth:'92%', border:'2px solid #2e7d32', pointerEvents:'all' }}>
                {/* Top row */}
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ fontSize:'1.5rem', flexShrink:0 }}>🧭</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:800, color:'#1b5e20', fontSize:'0.88rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {t('to_label')} {routeInfo.destination?.name || t('destination')}
                      </div>
                      <div style={{ color:'#2e7d32', fontSize:'0.82rem', marginTop:'3px', display:'flex', gap:'0.75rem', alignItems:'center' }}>
                        <span>📏 <strong>{routeInfo.distance} km</strong></span>
                        <span>⏱ <strong>{routeInfo.duration} min</strong></span>
                        {isRerouting && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'0.25rem', color:'#d97706', fontWeight:700 }}>
                            <span className="imap-reroute-spinner" style={{ width:'10px', height:'10px', borderRadius:'50%', border:'2px solid #fde68a', borderTopColor:'#d97706', display:'inline-block', animation:'imap-reroute-rotate 0.8s linear infinite' }} />
                          Re-routing…
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('clearNavigation'));
                        setRouteInfo(null);
                        setNavTarget(null);
                        setIsRerouting(false);
                      }}
                      style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', padding:'0.4rem 0.8rem', fontWeight:700, fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
                    >
                      ✕ {t('stop')}
                    </button>
                  </div>
                {/* Vehicle recommendations */}
                <VehicleIndicator
                  distanceKm={routeInfo.distance}
                  destination={{
                    ...routeInfo.destination,
                    type: navTarget?.type,
                    category: navTarget?.data?.category,
                  }}
                />
              </div>
            )}
            <button
              onClick={toggleFullscreen}
              style={styles.fullscreenBtn}
              className="fullscreen-btn"
              title={isFullscreen ? t('exit_fullscreen') : t('enter_fullscreen')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                  </>
                ) : (
                  <>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </>
                )}
              </svg>
            </button>
            <LeafletMap
              center={mapCenter}
              zoom={13}
              markers={allMarkers}
              routes={[]}
              pois={[]}
              userLocation={userLocation}
              userHeading={userHeading}
              navTarget={navTarget}
              tileLayerUrl={getTileLayerUrl()}
              style={styles.map}
              onMarkerClick={(marker) => {
                console.log('Marker clicked:', marker);
                if (marker.type === 'attraction') {
                  console.log('Opening modal for attraction:', marker.data);
                  setSelectedLocation({ type: 'attraction', data: marker.data });
                } else if (marker.type === 'hotel') {
                  console.log('Opening modal for hotel:', marker.data);
                  setSelectedLocation({ type: 'hotel', data: marker.data });
                } else if (marker.type === 'poi') {
                  console.log('POI clicked:', marker.data);
                  setSelectedLocation({ type: 'poi', data: marker.data });
                }
              }}
              onRoutingChange={(info) => {
                setRouteInfo(info);
              }}
              onReroutingChange={setIsRerouting}
            />
          </div>
        </div>
      </div>
      )}

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="imap-modal-overlay" onClick={() => setSelectedLocation(null)}>
          <div className="imap-modal-content" onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setSelectedLocation(null)}>✕</button>
            
            {/* Location Image */}
            <div className="imap-modal-image">
              {selectedImage ? (
                <img 
                  src={selectedImage}
                  alt={selectedData?.name || 'Location image'}
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  onError={(e) => {
                    e.target.src = selectedType === 'attraction' ? getAttractionFallbackImage(canonicalSelectedData) : 'https://via.placeholder.com/600x300/2e7d32/ffffff?text=No+Image';
                  }}
                />
              ) : (
                <div style={styles.modalImagePlaceholder}>
                  <span style={{fontSize: '4rem'}}>{selectedType === 'hotel' ? '🏨' : '🏞️'}</span>
                  <p style={{margin: '1rem 0 0', color: 'rgba(255,255,255,0.9)'}}>{t('no_image_available')}</p>
                </div>
              )}
            </div>

            {/* Location Info */}
            <div className="imap-modal-body">
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{selectedData?.name}</h2>
                <span style={styles.modalCategory}>{selectedCategoryLabel}</span>
              </div>

              <div style={styles.modalLocation}>
                <span style={{fontSize: '1.1rem'}}>📍</span>
                <span>{selectedData?.location}</span>
              </div>

              <p style={styles.modalDescription}>{selectedData?.description || t('no_description')}</p>

              {selectedType === 'attraction' && selectedData?.id && attractionWeather[selectedData.id] && (
                <div style={styles.modalWeather}>
                  <div style={styles.weatherInfo}>
                    <span style={{fontSize: '2rem'}}>{attractionWeather[selectedData.id].weather.icon}</span>
                    <div>
                      <div style={{fontSize: '1.5rem', fontWeight: '700', color: '#2e7d32'}}>
                        {attractionWeather[selectedData.id].weather.temp}°C
                      </div>
                      <div style={{fontSize: '0.9rem', color: '#666', textTransform: 'capitalize'}}>
                        {attractionWeather[selectedData.id].weather.description}
                      </div>
                    </div>
                  </div>
                  <div style={styles.safetyBadge(attractionWeather[selectedData.id].safetyScore)}>
                    {attractionWeather[selectedData.id].safetyScore >= 7 ? `✓ ${t('safe_visit')}` : 
                     attractionWeather[selectedData.id].safetyScore >= 5 ? `⚠ ${t('check_weather')}` : 
                     `✕ ${t('not_recommended')}`}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="imap-modal-actions">
                {selectedType === 'attraction' && selectedData?.id && (
                  <button 
                    style={styles.viewDetailsBtn}
                    onClick={() => navigate(`/attractions/${selectedData.id}`)}
                  >
                    📖 {t('view_full_details')}
                  </button>
                )}
                {selectedType === 'hotel' && selectedData?.id && (
                  <button 
                    style={styles.viewDetailsBtn}
                    onClick={() => navigate(`/hotels/${selectedData.id}`)}
                  >
                    🏨 {t('view_hotel_details')}
                  </button>
                )}
                <button 
                  style={styles.navigateBtn}
                  onClick={() => {
                    if (!userLocation) {
                      alert(`⚠️ ${t('enable_gps_first')}`);
                      return;
                    }
                    setNavTarget({
                      type: selectedType,
                      data: selectedData,
                      lat: Number(selectedData?.latitude),
                      lng: Number(selectedData?.longitude),
                      name: selectedData?.name
                    });
                    setSelectedLocation(null);
                  }}
                >
                  🧭 {t('navigate_here')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes imap-reroute-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar for sidebar */
        .sidebar-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(46, 125, 50, 0.4);
          border-radius: 10px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(46, 125, 50, 0.6);
        }
        
        /* Hover effects */
        .search-input:focus {
          border-color: #16a34a !important;
          background: white !important;
        }
        .search-button:hover {
          background: #15803d !important;
        }
        .fullscreen-btn:hover {
          background: #f9fafb !important;
          color: #16a34a !important;
          border-color: #16a34a !important;
        }
        .filter-label:hover {
          border-color: #16a34a !important;
          background: #f0fdf4 !important;
        }
        .view-button:hover {
          border-color: #16a34a !important;
          background: #f0fdf4 !important;
        }
        .gps-button:hover {
          background: #f9fafb !important;
          border-color: #16a34a !important;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
        .attraction-card:hover {
          border-color: #16a34a !important;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15) !important;
          transform: translateY(-2px);
        }
        .sidebar-toggle:hover {
          background: #15803d !important;
          transform: scale(1.05);
        }
        .statBadge:hover {
          background: #f0fdf4 !important;
          border-color: #16a34a !important;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
  },
  hero: {
    background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
    color: 'white',
    padding: '3rem 2rem',
    textAlign: 'center',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  heroContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: '800',
    margin: '0 0 1rem 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  heroSubtitle: {
    fontSize: '1.2rem',
    opacity: 0.95,
    margin: 0,
  },
  mainContent: {
    display: 'flex',
    height: 'calc(100vh - 180px)',
    maxWidth: '1920px',
    margin: '0 auto',
    gap: '1.5rem',
    padding: '1.5rem',
    position: 'relative',
  },
  sidebar: {
    width: '400px',
    minWidth: '400px',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  },
  sidebarHidden: {
    width: '80px',
    minWidth: '80px',
    padding: '2rem 1rem',
    overflow: 'hidden',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #f3f4f6',
    transition: 'all 0.3s ease',
  },
  sidebarTitle: {
    fontSize: '1.5rem',
    margin: 0,
    color: '#111827',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s ease',
  },
  sidebarToggle: {
    background: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    width: '44px',
    height: '44px',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    padding: '0',
    flexShrink: '0',
  },
  searchContainer: {
    marginBottom: '1.5rem',
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1.25rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '0.95rem',
    marginBottom: '0.75rem',
    outline: 'none',
    transition: 'all 0.3s ease',
    background: '#f9fafb',
    boxShadow: 'none',
  },
  searchButton: {
    width: '100%',
    padding: '0.875rem 1rem',
    background: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  filterSection: {
    marginBottom: '2rem',
    padding: '1.25rem',
    background: 'rgba(249, 250, 251, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(229, 231, 235, 0.5)',
  },
  filterTitle: {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '1rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  filterGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  filterLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '0.875rem 1rem',
    background: 'white',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    border: '1px solid #e5e7eb',
    boxShadow: 'none',
  },
  checkbox: {
    marginRight: '0.75rem',
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#16a34a',
  },
  viewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '0.6rem',
  },
  viewButton: {
    padding: '0.875rem',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    boxShadow: 'none',
    color: '#6b7280',
  },
  viewButtonActive: {
    background: '#16a34a',
    color: 'white',
    borderColor: '#16a34a',
    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
  },
  gpsSection: {
    marginBottom: '2rem',
    padding: '1.25rem',
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(229, 231, 235, 0.5)',
  },
  gpsHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
    color: '#6b7280',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  gpsHeaderText: {
    fontSize: '0.75rem',
  },
  gpsButton: {
    width: '100%',
    padding: '0.875rem 1rem',
    background: 'white',
    color: '#6b7280',
    border: '2px solid #e5e7eb',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  gpsButtonActive: {
    background: '#dcfce7',
    color: '#16a34a',
    borderColor: '#16a34a',
  },
  gpsPulse: {
    position: 'absolute',
    right: '12px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#16a34a',
    animation: 'pulse 2s infinite',
  },
  gpsCoords: {
    marginTop: '0.75rem',
    padding: '0.625rem 0.75rem',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '0.75rem',
    color: '#6b7280',
    fontWeight: '600',
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attractionsScroll: {
    maxHeight: '450px',
    overflowY: 'auto',
    paddingRight: '0.5rem',
  },
  attractionCard: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '12px',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(229, 231, 235, 0.5)',
    boxShadow: 'none',
  },
  attractionsList: {
    marginTop: '1rem',
  },
  attractionImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    flexShrink: 0,
  },
  attractionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  attractionName: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 0.4rem 0',
    lineHeight: '1.3',
  },
  attractionLocation: {
    fontSize: '0.8rem',
    color: '#6b7280',
    margin: '0 0 0.5rem 0',
  },
  weatherBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '6px',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  mapControls: {
    background: 'transparent',
    marginBottom: '1rem',
  },
  statsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '0',
    background: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  },
  fullscreenBtn: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    padding: '0.75rem',
    background: 'white',
    color: '#6b7280',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 1.25rem',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    background: '#e5e7eb',
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#16a34a',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #f0f4f8, #ffffff)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #2e7d32',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  loadingText: {
    fontSize: '1.2rem',
    color: '#666',
    fontWeight: '500',
  },
  // Modern Login Required Styles for Map
  modernLoginBanner: {
    maxWidth: '900px',
    margin: '3rem auto',
    padding: '0 1.5rem'
  },
  modernLoginContent: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderRadius: '24px',
    padding: '3rem',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
    border: '3px solid #2e7d32',
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start',
    marginBottom: '2rem'
  },
  modernLoginIconWrapper: {
    background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
    borderRadius: '20px',
    padding: '1.5rem',
    boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modernLoginIcon: {
    fontSize: '3.5rem',
    display: 'block',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
  },
  modernLoginText: {
    flex: 1
  },
  modernLoginTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#1b5e20',
    margin: '0 0 1rem 0'
  },
  modernLoginMessage: {
    fontSize: '1.1rem',
    color: '#555',
    lineHeight: '1.7',
    marginBottom: '1.5rem'
  },
  modernFeaturesList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  modernFeatureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1rem',
    color: '#333'
  },
  modernFeatureIcon: {
    background: '#4caf50',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    flexShrink: 0
  },
  modernLoginButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap'
  },
  modernMapLoginBtn: {
    background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
    color: 'white',
    padding: '1rem 2.5rem',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '1.1rem',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.3)'
  },
  modernMapRegisterBtn: {
    background: 'white',
    color: '#2e7d32',
    padding: '1rem 2.5rem',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '1.1rem',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    border: '3px solid #2e7d32',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(46, 125, 50, 0.15)'
  },
  modernMapBackHomeLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '1rem',
    display: 'block',
    textAlign: 'center',
    transition: 'color 0.3s ease',
    fontWeight: '600',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  mapPreviewSection: {
    maxWidth: '1200px',
    margin: '4rem auto',
    padding: '0 1.5rem'
  },
  mapPreviewTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#15803d',
    marginBottom: '2rem',
    textAlign: 'center'
  },
  mapPreviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    opacity: 0.6
  },
  mapPreviewCard: {
    background: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    position: 'relative',
    filter: 'blur(3px)'
  },
  mapPreviewImageBlur: {
    background: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)',
    height: '200px'
  },
  mapPreviewCardBody: {
    padding: '1.5rem'
  },
  mapPreviewCardTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    color: '#333'
  },
  mapPreviewCardLocation: {
    fontSize: '0.95rem',
    color: '#666',
    marginBottom: '0.5rem'
  },
  mapPreviewCardFeature: {
    fontSize: '0.9rem',
    color: '#16a34a',
    marginBottom: '0.3rem',
    fontWeight: '600'
  },
  mapPreviewLock: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '4rem',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem',
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    background: 'white',
    borderRadius: '24px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    position: 'relative',
    animation: 'slideUp 0.3s ease-out',
  },
  modalClose: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    fontSize: '1.5rem',
    cursor: 'pointer',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)',
  },
  modalImage: {
    width: '100%',
    height: '300px',
    background: 'linear-gradient(135deg, #2e7d32, #4caf50)',
    position: 'relative',
    overflow: 'hidden',
  },
  modalImagePlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'white',
  },
  modalBody: {
    padding: '2rem',
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 300px)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '1rem',
  },
  modalTitle: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1b5e20',
    flex: 1,
  },
  modalCategory: {
    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
    color: '#2e7d32',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  modalLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#666',
    fontSize: '1rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f0f0f0',
  },
  modalDescription: {
    fontSize: '1.05rem',
    lineHeight: '1.7',
    color: '#444',
    marginBottom: '1.5rem',
  },
  modalWeather: {
    background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  weatherInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  safetyBadge: (score) => ({
    background: score >= 7 ? 'linear-gradient(135deg, #4caf50, #66bb6a)' : 
                score >= 5 ? 'linear-gradient(135deg, #ff9800, #ffa726)' : 
                'linear-gradient(135deg, #f44336, #ef5350)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'inline-block',
  }),
  modalActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
  },
  viewDetailsBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #2e7d32, #43a047)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
  },
  navigateBtn: {
    flex: 1,
    background: 'linear-gradient(135deg, #1976d2, #2196f3)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
  },
};

// Add styles for animations and hover effects
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .login-reminder-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.25) !important;
    background: #f5f5f5 !important;
  }
  
  .login-reminder-btn:hover,
  .map-login-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(46, 125, 50, 0.4) !important;
  }
  
  .register-reminder-btn:hover,
  .map-register-btn:hover {
    transform: translateY(-3px);
    background: #f1f8f4 !important;
    box-shadow: 0 8px 25px rgba(46, 125, 50, 0.25) !important;
  }

  .map-back-home-link:hover {
    color: #2e7d32 !important;
  }

  @media (max-width: 768px) {
    div[style*="modernLoginContent"] {
      flex-direction: column;
      padding: 2rem !important;
    }
    
    div[style*="modernLoginTitle"] h2 {
      font-size: 1.5rem !important;
    }
  }
`;
if (!document.head.querySelector('style[data-interactive-map]')) {
  styleSheet.setAttribute('data-interactive-map', 'true');
  document.head.appendChild(styleSheet);
}

export default InteractiveMap;
