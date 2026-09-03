import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import apiClient, { fetchAttractions, getApiBaseUrl } from '../../api';
import Icons from '../../components/Icons';
import WeatherWidget from '../../components/WeatherWidget';
import HazardAwareness from '../../components/HazardAwareness';
import { loadCachedSetting, saveCachedSetting } from '../../utils/siteSettingsCache';
import './Home.css';

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

const Home = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [inspirationItems, setInspirationItems] = useState([]);
  const [inspirationLoading, setInspirationLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [attractionsStart, setAttractionsStart] = useState(0);
  const [restaurantsStart, setRestaurantsStart] = useState(0);
  const [hotelsStart, setHotelsStart] = useState(0);
  const [searchDestination, setSearchDestination] = useState('');
  const [searchCheckIn, setSearchCheckIn] = useState('');
  const [searchCheckOut, setSearchCheckOut] = useState('');
  const [searchGuests, setSearchGuests] = useState('2');
  const [searchTab, setSearchTab] = useState('hotels');
  const [userId, setUserId] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user)?.id : null;
    } catch {
      return null;
    }
  });
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
    showWelcome: true, showWeather: true, showAttractions: true, showHotels: true,
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
      showWelcome: true, showWeather: true, showAttractions: true, showHotels: true,
      welcomeTitle: '', welcomeSubtitle: '', attractionsTitle: '', attractionsSubtitle: '',
      hotelsTitle: '', hotelsSubtitle: '',
    }, language));
  }, [language, t]);

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
        console.log('Attractions fetched:', res.data);
        setAttractions(Array.isArray(res.data?.data) ? res.data.data.slice(0, 5) : []);
      })
      .catch(err => console.error('Failed to fetch attractions:', err));

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
        console.log('Hotels fetched:', data);
        const hotelsArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setHotels(hotelsArray.slice(0, 4));
      })
      .catch(err => {
        console.error('Failed to fetch hotels:', err);
        setHotels([]);
      });
    
    // Fetch restaurants
    fetch(`${API_BASE_URL}/api/restaurants/featured?limit=4`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Restaurants fetched:', data);
        const restaurantsArray = Array.isArray(data) ? data : [];
        setRestaurants(restaurantsArray.slice(0, 4));
      })
      .catch(err => {
        console.error('Failed to fetch restaurants:', err);
        setRestaurants([]);
      });
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
    <div className="home-page">
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
                style={{ backgroundImage: `url(${attraction.image_url})` }}
              >
                <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: toRgba(slideshowSettings.overlayColor, slideshowSettings.overlayOpacity, `rgba(0,0,0,${slideshowSettings.overlayOpacity})`), pointerEvents: 'none' }} />
                <div className="hero-content">
                  <span className="hero-tag" style={{ background: toRgba(slideshowSettings.tagBgColor, 0.24, 'rgba(255,255,255,0.24)'), color: slideshowSettings.tagTextColor || '#ffffff', border: `1px solid ${toRgba(slideshowSettings.tagBgColor, 0.62, 'rgba(255,255,255,0.62)')}` }}>{t('featured_badge')}</span>
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
            <select
              className="search-filter-select"
              value={searchTab}
              onChange={(e) => setSearchTab(e.target.value)}
              aria-label={t('search_filter_label')}
            >
              <option value="hotels">{t('accommodation')}</option>
              <option value="attractions">{t('attractions')}</option>
              <option value="itineraries">{t('itineraries_label')}</option>
            </select>
            <input
              type="text"
              placeholder={t('search_destinations_placeholder')}
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input-simple"
            />
            <button className="explore-button" onClick={handleSearch}>
              {t('explore_button')}
            </button>
          </div>
        </div>
      </section>

      <section className="home-content-layout">
        <div className="container">
          <div className="home-content-grid">
            {pagesections.showWelcome && (
              <div className="welcome-panel">
                <div className="welcome-title-row">
                  <Icons.Sparkles size={22} />
                  <h2 className="section-title">{pagesections.welcomeTitle || t('welcome_to_naujan')}</h2>
                </div>
                <p className="section-subtitle">{pagesections.welcomeSubtitle || t('discover_paradise')}</p>
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
                  <h3>{t('weather_safety')}</h3>
                  <p>{t('real_time_updates_desc')}</p>
                </div>
                <div className="safety-weather-grid">
                  {pagesections.showWeather !== false && (
                    <div className="weather-section">
                      <div className="weather-title-row">
                        <Icons.Cloud size={20} />
                        <h4>{t('weather_safety')}</h4>
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
                        <h4>{t('safety')}</h4>
                      </div>
                      <div className="hazard-widget-container">
                        <HazardAwareness
                          latitude={13.3333}
                          longitude={121.3000}
                          locationName="Naujan, Oriental Mindoro"
                          attractions={attractions}
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
      {pagesections.showAttractions !== false && attractions.length > 0 && (
        <section className="featured-attractions-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-left">
                <div className="section-title-row">
                  <Icons.Attraction size={24} />
                  <h2 className="section-title">{pagesections.attractionsTitle || t('explore_top_attractions')}</h2>
                </div>
                <p className="section-subtitle">{pagesections.attractionsSubtitle || t('handpicked_destinations')}</p>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/attractions')}>
                {t('learn_more')}
              </button>
            </div>
            <div className="carousel-container">
              <button
                className="carousel-arrow carousel-arrow-left"
                onClick={() => handleCarouselNav(setAttractionsStart, attractionsStart, attractions.length - 4, 'prev')}
                disabled={attractionsStart === 0}
              >
                <Icons.ChevronLeft size={24} />
              </button>
              <div className="carousel-grid">
                <div className="attractions-grid">
                  {attractions.slice(attractionsStart, attractionsStart + 4).map((attraction, idx) => (
                    <div
                      key={attraction.id}
                      className="attraction-card"
                      onClick={() => navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
                      onMouseEnter={() => setHoveredCard(`attraction-${idx}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="attraction-image-wrapper">
                        <img src={attraction.image_url} alt={attraction.name} className="attraction-image" loading="lazy" />
                        <div className="attraction-overlay"></div>
                      </div>
                      <div className="attraction-info">
                        <h3 className="attraction-name">{attraction.name}</h3>
                        <p className="attraction-type">{t('tourist_destination')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="carousel-arrow carousel-arrow-right"
                onClick={() => handleCarouselNav(setAttractionsStart, attractionsStart, attractions.length - 4, 'next')}
                disabled={attractionsStart >= attractions.length - 4}
              >
                <Icons.ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Dining Section */}
      {restaurants.length > 0 && (
        <section className="featured-dining-section">
          <div className="container">
            <div className="section-header">
              <div className="section-header-left">
                    <div className="section-title-row">
                      <Icons.Utensils size={24} />
                      <h2 className="section-title">{t('featured_dining')}</h2>
                    </div>
                    <p className="section-subtitle">{t('featured_dining_subtitle')}</p>
              </div>
              <button className="view-all-btn" onClick={() => navigate('/restaurants')}>
                {t('view_all')} →
              </button>
            </div>
            <div className="carousel-container">
              <button
                className="carousel-arrow carousel-arrow-left"
                onClick={() => handleCarouselNav(setRestaurantsStart, restaurantsStart, restaurants.length - 4, 'prev')}
                disabled={restaurantsStart === 0}
              >
                <Icons.ChevronLeft size={24} />
              </button>
              <div className="carousel-grid">
                <div className="restaurants-grid">
                  {restaurants.slice(restaurantsStart, restaurantsStart + 4).map((restaurant, idx) => (
                    <div
                      key={restaurant.restaurant_id}
                      className="restaurant-card"
                      onClick={() => navigate(`/restaurants/${restaurant.restaurant_id}`)}
                      onMouseEnter={() => setHoveredCard(`restaurant-${idx}`)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                        {'featured' in restaurant && restaurant.featured && (
                        <div className="featured-badge">
                          <Icons.Star size={14} />
                          {t('featured_short')}
                        </div>
                      )}
                      <div className="restaurant-image-wrapper">
                        <img src={restaurant.image_url || '/placeholder-restaurant.svg'} alt={restaurant.name} className="restaurant-image" loading="lazy" />
                        <div className="restaurant-overlay"></div>
                      </div>
                      <div className="restaurant-info">
                        <h3 className="restaurant-name">{restaurant.name}</h3>
                        <p className="restaurant-cuisine">{restaurant.cuisine_type}</p>
                        {restaurant.rating && (
                          <div className="restaurant-rating">
                            {renderStarRating(restaurant.rating)}
                          </div>
                        )}
                        <p className="restaurant-location">
                          <Icons.MapPin size={14} />
                          {restaurant.municipality}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="carousel-arrow carousel-arrow-right"
                onClick={() => handleCarouselNav(setRestaurantsStart, restaurantsStart, restaurants.length - 4, 'next')}
                disabled={restaurantsStart >= restaurants.length - 4}
              >
                <Icons.ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Accommodation Section */}
      {pagesections.showHotels !== false && hotels.length > 0 && (
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
                onClick={() => handleCarouselNav(setHotelsStart, hotelsStart, hotels.length - 4, 'prev')}
                disabled={hotelsStart === 0}
              >
                <Icons.ChevronLeft size={24} />
              </button>
              <div className="carousel-grid">
                <div className="accommodation-grid">
                  {hotels.slice(hotelsStart, hotelsStart + 4).map((hotel, idx) => {
                    const badge = getHotelBadge(idx, hotel.rating);
                    return (
                      <div
                        key={hotel.id}
                        className="accommodation-card"
                        onClick={() => navigate(`/hotels/${hotel.id}`)}
                        onMouseEnter={() => setHoveredCard(`accommodation-${idx}`)}
                        onMouseLeave={() => setHoveredCard(null)}
                      >
                        {badge && <div className="accommodation-badge">{badge}</div>}
                        <div className="accommodation-image-wrapper">
                          <img src={hotel.image || '/placeholder-hotel.svg'} alt={hotel.name} className="accommodation-image" loading="lazy" />
                          <div className="accommodation-overlay"></div>
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
              </div>
              <button
                className="carousel-arrow carousel-arrow-right"
                onClick={() => handleCarouselNav(setHotelsStart, hotelsStart, hotels.length - 4, 'next')}
                disabled={hotelsStart >= hotels.length - 4}
              >
                <Icons.ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
