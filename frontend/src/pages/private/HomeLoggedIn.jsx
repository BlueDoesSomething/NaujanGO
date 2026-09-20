import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import apiClient, { fetchAttractions, getApiBaseUrl } from '../../api';
import Icons from '../../components/Icons';
import WeatherWidget from '../../components/WeatherWidget';
import HazardAwareness from '../../components/HazardAwareness';
import { loadCachedSetting, saveCachedSetting } from '../../utils/siteSettingsCache';
import HomeStatsStrip from '../../components/HomeStatsStrip';
import './HomeLoggedIn.css';

const API_BASE_URL = getApiBaseUrl();

const hexToRgb = (hex) => {
  const match = String(hex || '').trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
};

const toRgba = (hex, alpha, fallback = `rgba(0,0,0,${alpha})`) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return fallback;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
};

const SkeletonCard = () => (
  <div className="card-skeleton" aria-hidden="true">
    <div className="skeleton skeleton-image" />
    <div className="skeleton skeleton-name" />
    <div className="skeleton skeleton-line" />
  </div>
);

const HomeLoggedIn = () => {
  const { t, language } = useLanguage();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [inspirationItems, setInspirationItems] = useState([]);
  const [inspirationLoading, setInspirationLoading] = useState(true);
  const [attractionsLoading, setAttractionsLoading] = useState(true);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [attractionsStart, setAttractionsStart] = useState(0);
  const [hotelsStart, setHotelsStart] = useState(0);
  const [visibleCarouselCount, setVisibleCarouselCount] = useState(4);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [searchDestination, setSearchDestination] = useState('');
  const [searchCheckIn, setSearchCheckIn] = useState('');
  const [searchCheckOut, setSearchCheckOut] = useState('');
  const [searchGuests, setSearchGuests] = useState('2');
  const [searchTab, setSearchTab] = useState('hotels');
  const [userId] = useState(() => authUser?.id || null);
  const [slideshowSettings, setSlideshowSettings] = useState(() => loadCachedSetting('home-slideshow', {
    overlayColor: '#000000',
    overlayOpacity: 0.4,
    tagText: t('featured_badge'),
    buttonTextUser: t('explore_now'),
    titleColor: '#ffffff',
    descriptionColor: '#e5e7eb',
    tagTextColor: '#ffffff',
    tagBgColor: '#ffffff',
    buttonColor: '#ffffff',
    buttonTextColor: '#111827',
    buttonTransparent: false,
  }));
  const [slideshowExt, setSlideshowExt] = useState(() => loadCachedSetting('home-slideshow-extended', { intervalSeconds: 4, showArrows: true, transition: 'fade' }, language));
  const [pagesections, setPageSections] = useState(() => loadCachedSetting('homepage-sections', {
    showWelcome: true, showWeather: true, showAttractions: true, showHotels: true, showDining: false,
    welcomeTitle: '', welcomeSubtitle: '', attractionsTitle: '', attractionsSubtitle: '',
    hotelsTitle: '', hotelsSubtitle: '',
  }, language));

  useEffect(() => {
    setSlideshowSettings(loadCachedSetting('home-slideshow', {
      overlayColor: '#000000',
      overlayOpacity: 0.4,
      tagText: t('featured_badge'),
      buttonTextUser: t('explore_now'),
      titleColor: '#ffffff',
      descriptionColor: '#e5e7eb',
      tagTextColor: '#ffffff',
      tagBgColor: '#ffffff',
      buttonColor: '#ffffff',
      buttonTextColor: '#111827',
      buttonTransparent: false,
    }, language));
    setSlideshowExt(loadCachedSetting('home-slideshow-extended', { intervalSeconds: 4, showArrows: true, transition: 'fade' }, language));
    setPageSections(loadCachedSetting('homepage-sections', {
      showWelcome: true, showWeather: true, showAttractions: true, showHotels: true, showDining: false,
      welcomeTitle: '', welcomeSubtitle: '', attractionsTitle: '', attractionsSubtitle: '',
      hotelsTitle: '', hotelsSubtitle: '',
    }, language));
  }, [language, t]);

  const computeVisibleCarouselCount = () => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w <= 767) return 1;
    if (w <= 900) return 2;
    if (w <= 1200) return 3;
    return 4;
  };

  useEffect(() => {
    const update = () => setVisibleCarouselCount(computeVisibleCarouselCount());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackToTop((window.scrollY || document.documentElement.scrollTop) > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const formatCurrency = (value, currency = 'PHP') => {
    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return `₱0.00`;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(numValue);
    } catch {
      return `₱0.00`;
    }
  };

  const toNumericRating = (rating) => {
    const parsed = Number.parseFloat(rating);
    if (!Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(5, parsed));
  };

  const renderStarRating = (rating) => {
    const numericRating = toNumericRating(rating);
    if (numericRating === null) return null;
    const stars = Math.round(numericRating);
    return (
      <span className="rating-stars">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`rating-star ${i < stars ? 'filled' : ''}`}>★</span>
        ))}
        <span className="rating-value">{numericRating.toFixed(1)}</span>
      </span>
    );
  };

  const getHotelBadge = (index, rating) => {
    const numericRating = toNumericRating(rating);
    if (numericRating === null) return null;
    if (index === 0 && numericRating >= 4.5) return t('top_rated');
    if (numericRating >= 4.8) return t('best_value');
    return null;
  };

  const getAttractionArea = (attraction) => {
    const location = attraction?.location ? String(attraction.location).trim() : '';
    if (location) {
      const first = location.split(',')[0].trim();
      if (first) return first;
    }
    return attraction?.municipality || '';
  };

  const getHeroTag = (attraction) => {
    const area = getAttractionArea(attraction);
    if (area) return area;
    const category = attraction?.category ? String(attraction.category).trim() : '';
    return category || t('featured_badge');
  };

  const getClampMax = (length) => Math.max(0, length - visibleCarouselCount);

  const handleSearch = () => {
    const route = searchTab === 'attractions' ? '/attractions' : searchTab === 'itineraries' ? '/itinerary' : '/hotels';
    navigate(route, {
      state: {
        destination: searchDestination,
        checkIn: searchCheckIn,
        checkOut: searchCheckOut,
        guests: searchGuests,
        filter: searchTab
      }
    });
  };

  const quickActions = [
    {
      key: 'attractions',
      title: t('all_attractions_label'),
      description: t('browse_destinations'),
      icon: Icons.Attraction,
      onClick: () => navigate('/attractions')
    },
    {
      key: 'map',
      title: t('interactive_map'),
      description: t('interactive_map_desc'),
      icon: Icons.Map,
      onClick: () => navigate('/map')
    },
    {
      key: 'itinerary',
      title: t('my_itineraries'),
      description: t('manage_travel_plans'),
      icon: Icons.Calendar,
      onClick: () => navigate('/itinerary')
    },
    {
      key: 'support',
      title: t('support_team'),
      description: t('chat_support'),
      icon: Icons.Chat,
      onClick: () => navigate('/contact')
    }
  ];

  const fallbackInspirationItems = [
    {
      id: 'fallback-1',
      name: t('beach_nature'),
      description: t('beach_nature_desc'),
      duration: '1 day',
      attractions: [1, 2, 3]
    },
    {
      id: 'fallback-2',
      name: t('cultural_adventure'),
      description: t('cultural_adventure_desc'),
      duration: '4 hours',
      attractions: [1, 2]
    },
    {
      id: 'fallback-3',
      name: t('hidden_gems'),
      description: t('hidden_gems_desc'),
      duration: '8 hours',
      attractions: [1, 2, 3, 4]
    }
  ];

  const displayedInspirationItems = inspirationItems.length > 0
    ? inspirationItems.slice(0, 3)
    : fallbackInspirationItems;

  const getInspirationLabel = (index) => {
    if (index === 0) return t('featured_badge');
    if (index === 1) return t('popular_label');
    return t('hidden_gems_label');
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/home-slideshow`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const merged = {
          overlayColor: '#000000',
          overlayOpacity: 0.4,
          tagText: t('featured_badge'),
          buttonTextUser: t('explore_now'),
          titleColor: '#ffffff',
          descriptionColor: '#e5e7eb',
          tagTextColor: '#ffffff',
          tagBgColor: '#ffffff',
          buttonColor: '#ffffff',
          buttonTextColor: '#111827',
          buttonTransparent: false,
          ...data,
        };
        saveCachedSetting('home-slideshow', merged, language);
        setSlideshowSettings(merged);
      })
      .catch(() => {});
    fetch(`${API_BASE_URL}/api/admin/home-slideshow-extended`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        saveCachedSetting('home-slideshow-extended', data, language);
        setSlideshowExt(data);
      })
      .catch(() => {});
    fetch(`${API_BASE_URL}/api/admin/homepage-sections`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        setPageSections(prev => {
          const next = { ...prev, ...data };
          saveCachedSetting('homepage-sections', next, language);
          return next;
        });
      })
      .catch(() => {});

    fetchAttractions()
      .then(res => {
        setAttractions(Array.isArray(res.data?.data) ? res.data.data : []);
      })
      .catch(err => console.error('Failed to fetch attractions:', err))
      .finally(() => setAttractionsLoading(false));

    apiClient.get('/itinerary/templates/list')
      .then((response) => {
        const templates = Array.isArray(response?.data) ? response.data : [];
        setInspirationItems(templates);
      })
      .catch((err) => {
        console.error('Failed to fetch itinerary templates:', err);
        setInspirationItems([]);
      })
      .finally(() => {
        setInspirationLoading(false);
      });
    
    // Fetch hotels
    fetch(`${API_BASE_URL}/api/hotels`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const hotelsArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setHotels(hotelsArray.slice(0, 4));
      })
      .catch(err => {
        console.error('Failed to fetch hotels:', err);
        setHotels([]);
      })
      .finally(() => setHotelsLoading(false));
  }, [language]);

  useEffect(() => {
    if (attractions.length > 0) {
      const ms = (slideshowExt.intervalSeconds || 4) * 1000;
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % attractions.length);
      }, ms);
      return () => clearInterval(timer);
    }
  }, [attractions.length, slideshowExt.intervalSeconds]);

  const handleCarouselNav = (setter, current, max, direction) => {
    const next = direction === 'next' ? current + 1 : current - 1;
    if (next >= 0 && next <= max) {
      setter(next);
    }
  };



  return (
    <div className="home-page logged-in">
      {/* Attractions Slideshow */}
      {pagesections.showHeroSlideshow !== false && attractions.length > 0 && (
        <section className="slideshow-hero">
          <div
            className="slideshow-wrapper"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {attractions.map((attraction, index) => (
              <div
                key={attraction.id}
                className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${attraction.image_url || '/placeholder-attraction.svg'})` }}
              >
                <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: toRgba(slideshowSettings.overlayColor, slideshowSettings.overlayOpacity, `rgba(0,0,0,${slideshowSettings.overlayOpacity})`), pointerEvents: 'none' }} />
                <div className="hero-content">
                  <span className="hero-tag" style={{ background: toRgba(slideshowSettings.tagBgColor, 0.24, 'rgba(255,255,255,0.24)'), color: slideshowSettings.tagTextColor || '#ffffff', border: `1px solid ${toRgba(slideshowSettings.tagBgColor, 0.62, 'rgba(255,255,255,0.62)')}` }}>{getHeroTag(attraction)}</span>
                  <h1 className="hero-title" style={{ color: slideshowSettings.titleColor || '#ffffff' }}>{attraction.name}</h1>
                  <p className="hero-description" style={{ color: slideshowSettings.descriptionColor || '#e5e7eb' }}>{attraction.description || t('experience_beauty')}</p>
                  <button
                    className="hero-btn btn-with-icon hero-primary-btn"
                    style={{
                      background: slideshowSettings.buttonTransparent ? toRgba(slideshowSettings.buttonColor, 0.24, 'rgba(255,255,255,0.24)') : (slideshowSettings.buttonColor || '#ffffff'),
                      color: slideshowSettings.buttonTextColor || '#111827',
                      border: `${slideshowSettings.buttonBorderWidth || 0}px solid ${toRgba(slideshowSettings.buttonBorderColor, slideshowSettings.buttonTransparent ? 0.62 : 1, slideshowSettings.buttonBorderColor || '#ffffff')}`,
                      borderRadius: `${slideshowSettings.buttonBorderRadius || 50}px`,
                      padding: `${slideshowSettings.buttonPaddingVertical || 1}rem ${slideshowSettings.buttonPaddingHorizontal || 2.5}rem`,
                      boxShadow: `0 ${(slideshowSettings.buttonShadowBlur || 25) * 0.5}px ${slideshowSettings.buttonShadowBlur || 25}px rgba(0, 0, 0, ${slideshowSettings.buttonShadowOpacity || 0.3})`
                    }}
                    onClick={() => navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
                  >
                    <Icons.Route size={18} className="btn-icon" />
                      {t('explore_now')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {attractions.length > 1 && slideshowExt.showArrows !== false && (
            <>
              <button className="slideshow-arrow slideshow-arrow-left" onClick={() => setCurrentSlide((prev) => (prev - 1 + attractions.length) % attractions.length)}>‹</button>
              <button className="slideshow-arrow slideshow-arrow-right" onClick={() => setCurrentSlide((prev) => (prev + 1) % attractions.length)}>›</button>
              <div className="slideshow-indicators">
                {attractions.map((_, index) => (
                  <div key={index} className={`indicator-line ${index === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(index)} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="hero-search-section">
        <div className="container">
          <div className="simple-search-bar">
            <Icons.Search size={20} className="search-icon" />
            <div className="search-tabs" role="tablist" aria-label={t('search_filter_label')}>
              <button
                type="button"
                role="tab"
                aria-selected={searchTab === 'hotels'}
                className={`search-tab ${searchTab === 'hotels' ? 'active' : ''}`}
                onClick={() => setSearchTab('hotels')}
              >
                {t('accommodation')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={searchTab === 'attractions'}
                className={`search-tab ${searchTab === 'attractions' ? 'active' : ''}`}
                onClick={() => setSearchTab('attractions')}
              >
                {t('attractions')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={searchTab === 'itineraries'}
                className={`search-tab ${searchTab === 'itineraries' ? 'active' : ''}`}
                onClick={() => setSearchTab('itineraries')}
              >
                {t('itineraries_label')}
              </button>
            </div>
            <div className="search-input-wrap">
              <input
                type="text"
                placeholder={t('search_destinations_placeholder')}
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input-simple"
              />
              {searchDestination && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchDestination('')}
                  aria-label={t('clear')}
                >
                  <Icons.X size={16} />
                </button>
              )}
            </div>
            <button className="explore-button" onClick={handleSearch}>
              {t('explore_button')}
            </button>
          </div>
        </div>
      </section>

      <HomeStatsStrip attractions={attractions.length} hotels={hotels.length} />

      <section className="home-content-layout">
        <div className="container">
          <div className="home-content-grid">
            {pagesections.showWelcome && (
              <div className="welcome-panel">
                <div className="welcome-title-row">
                  <Icons.Sparkles size={22} />
                  <h2 className="section-title">{pagesections.welcomeTitle || t('welcome_back')}</h2>
                </div>
                <p className="section-subtitle">{pagesections.welcomeSubtitle || t('continue_adventure')}</p>
                <p className="section-description">
                  {t('experience_beauty')}
                </p>

                {pagesections.showQuickActions !== false && (
                  <div className="quick-actions-compact">
                    <div className="quick-actions-title-row">
                      <Icons.Route size={18} />
                      <h3>{t('quick_actions')}</h3>
                    </div>
                    <div className="quick-actions-pill-grid">
                      {quickActions.map((action) => (
                        <button key={action.key} className="quick-action-pill" onClick={action.onClick}>
                          <action.icon size={16} />
                          <span>{action.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {(pagesections.showWeather !== false || pagesections.showHazardAwareness !== false) && (
              <div className="combined-safety-weather-panel">
                <div className="safety-weather-header">
                  <h3>Safety & Weather</h3>
                  <p>Real-time conditions and hazard alerts for your trip</p>
                </div>
                <div className="safety-weather-grid">
                  {pagesections.showWeather !== false && (
                    <div className="weather-section">
                      <div className="weather-title-row">
                        <Icons.Cloud size={20} />
                        <h4>Weather</h4>
                      </div>
                      <div className="weather-widget-container">
                        <WeatherWidget
                          latitude={13.3333}
                          longitude={121.3000}
                          locationName="Naujan, Oriental Mindoro"
                          showForecast={true}
                          showAlerts={true}
                          showSafetyTips={true}
                          size="small"
                          theme="light"
                        />
                      </div>
                    </div>
                  )}

                  {pagesections.showHazardAwareness !== false && (
                    <div className="hazard-section">
                      <div className="hazard-awareness-title-row">
                        <Icons.Shield size={20} />
                        <h4>Safety Alerts</h4>
                      </div>
                      <div className="hazard-widget-container">
                        <HazardAwareness
                          latitude={13.3333}
                          longitude={121.3000}
                          locationName="Naujan, Oriental Mindoro"
                          attractions={attractions}
                          userId={userId}
                          enableNotifications={true}
                          compact={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Attractions Section */}
      {pagesections.showAttractions !== false && (attractionsLoading || attractions.length > 0) && (
        <section className="featured-attractions-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-title-row">
                  <Icons.Attraction size={24} />
                  <h2 className="section-title">{pagesections.attractionsTitle || t('recommended_for_you')}</h2>
                </div>
                <p className="section-subtitle">{pagesections.attractionsSubtitle || t('personalized_recommendations')}</p>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/attractions')}>
                {t('view_all')} →
              </button>
            </div>
            <div className="carousel-container">
              <button
                className="carousel-arrow carousel-arrow-left"
                onClick={() => handleCarouselNav(setAttractionsStart, attractionsStart, getClampMax(attractions.length), 'prev')}
                disabled={attractionsStart === 0}
              >
                <Icons.ChevronLeft size={24} />
              </button>
              <div className="carousel-grid">
                {attractionsLoading ? (
                  <div className="attractions-grid">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : attractions.length === 0 ? (
                  <div className="home-empty-state">
                    <Icons.Info size={18} />
                    <p>{t('home_no_results')}</p>
                  </div>
                ) : (
                  <div className="attractions-grid">
                    {attractions.slice(attractionsStart, attractionsStart + visibleCarouselCount).map((attraction, idx) => (
                      <div
                        key={attraction.id}
                        className={`attraction-card ${hoveredCard === `attraction-${idx}` ? 'card-hovered' : ''}`}
                        onClick={() => navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
                        onMouseEnter={() => setHoveredCard(`attraction-${idx}`)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        <div className="attraction-image-wrapper">
                          <img src={attraction.image_url || '/placeholder-attraction.svg'} alt={attraction.name} className="attraction-image" loading="lazy" />
                          <div className="attraction-overlay"></div>
                          {hoveredCard === `attraction-${idx}` && (
                            <div className="card-quickview">
                              <Icons.Eye size={16} />
                              <span>{t('view_details')}</span>
                            </div>
                          )}
                        </div>
                        <div className="attraction-info">
                          <h3 className="attraction-name">{attraction.name}</h3>
                          <p className="attraction-type">{attraction.category || t('tourist_destination')}</p>
                          {attraction.avg_rating > 0 && (
                            <div className="attraction-rating">
                              {renderStarRating(attraction.avg_rating)}
                            </div>
                          )}
                          <p className="attraction-location">
                            <Icons.MapPin size={14} />
                            {getAttractionArea(attraction) || attraction.municipality}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="carousel-arrow carousel-arrow-right"
                onClick={() => handleCarouselNav(setAttractionsStart, attractionsStart, getClampMax(attractions.length), 'next')}
                disabled={attractionsStart >= getClampMax(attractions.length)}
              >
                <Icons.ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Accommodation Section */}
      {pagesections.showHotels !== false && (hotelsLoading || hotels.length > 0) && (
        <section className="featured-accommodation-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-title-row">
                  <Icons.Hotel size={24} />
                  <h2 className="section-title">{t('featured_accommodation')}</h2>
                </div>
                <p className="section-subtitle">{t('featured_accommodation_subtitle')}</p>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/hotels')}>
                {t('view_all')} →
              </button>
            </div>
            <div className="carousel-container">
              <button
                className="carousel-arrow carousel-arrow-left"
                onClick={() => handleCarouselNav(setHotelsStart, hotelsStart, getClampMax(hotels.length), 'prev')}
                disabled={hotelsStart === 0}
              >
                <Icons.ChevronLeft size={24} />
              </button>
              <div className="carousel-grid">
                {hotelsLoading ? (
                  <div className="accommodation-grid">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : hotels.length === 0 ? (
                  <div className="home-empty-state">
                    <Icons.Info size={18} />
                    <p>{t('home_no_results')}</p>
                  </div>
                ) : (
                  <div className="accommodation-grid">
                    {hotels.slice(hotelsStart, hotelsStart + visibleCarouselCount).map((hotel, idx) => {
                      const badge = getHotelBadge(idx, hotel.rating);
                      return (
                        <div
                          key={hotel.id}
                          className={`accommodation-card ${hoveredCard === `accommodation-${idx}` ? 'card-hovered' : ''}`}
                          onClick={() => navigate(`/hotels/${hotel.id}`)}
                          onMouseEnter={() => setHoveredCard(`accommodation-${idx}`)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          {badge && <div className="accommodation-badge">{badge}</div>}
                          <div className="accommodation-image-wrapper">
                            <img src={hotel.image || '/placeholder-hotel.svg'} alt={hotel.name} className="accommodation-image" loading="lazy" />
                            <div className="accommodation-overlay"></div>
                            {hoveredCard === `accommodation-${idx}` && (
                              <div className="card-quickview">
                                <Icons.Eye size={16} />
                                <span>{t('view_details')}</span>
                              </div>
                            )}
                          </div>
                          <div className="accommodation-info">
                            <h3 className="accommodation-name">{hotel.name}</h3>
                            <p className="accommodation-location">
                              <Icons.MapPin size={14} />
                              {hotel.location}
                            </p>
                            {hotel.rating && (
                              <div className="accommodation-rating">
                                {renderStarRating(hotel.rating)}
                              </div>
                            )}
                            <p className="accommodation-price">{t('from_label')} {formatCurrency(hotel.pricePerNight || 0, hotel.currency)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <button
                className="carousel-arrow carousel-arrow-right"
                onClick={() => handleCarouselNav(setHotelsStart, hotelsStart, getClampMax(hotels.length), 'next')}
                disabled={hotelsStart >= getClampMax(hotels.length)}
              >
                <Icons.ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      {showBackToTop && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('back_to_top')}
        >
          <Icons.ChevronUp size={22} />
        </button>
      )}
    </div>
  );
};

export default HomeLoggedIn;
