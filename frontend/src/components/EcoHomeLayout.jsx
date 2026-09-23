import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAttractions, getApiBaseUrl } from '../api';
import Icons from './Icons';
import { weatherService } from '../services/weatherService';
import { loadCachedSetting, saveCachedSetting } from '../utils/siteSettingsCache';
import '../styles/home-eco.css';

const API_BASE_URL = getApiBaseUrl();

const NAUJAN_COORDS = { lat: 13.3333, lon: 121.3 };

const categoryLabelKey = (category) => {
  const key = `category_${String(category || '').trim().toLowerCase().replace(/[\s-]+/g, '_')}`;
  return key;
};

const getAttractionArea = (attraction) => {
  const location = attraction?.location ? String(attraction.location).trim() : '';
  if (location) {
    const first = location.split(',')[0].trim();
    if (first) return first;
  }
  return attraction?.municipality || '';
};

const getCategoryChip = (attraction, t) => {
  const raw = attraction?.category ? String(attraction.category).trim() : '';
  if (!raw) return t('featured_badge');
  const mapped = t(categoryLabelKey(raw));
  if (mapped && mapped !== categoryLabelKey(raw)) return mapped;
  return raw;
};

const toNumericRating = (rating) => {
  const parsed = Number.parseFloat(rating);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(5, parsed));
};

const pad2 = (n) => String(n).padStart(2, '0');

const getEcoWeatherEmoji = (condition = '') => {
  const cond = String(condition).toLowerCase();
  const map = {
    clear: '🌞', clouds: '☁️', rain: '🌧️', drizzle: '🌦️',
    thunderstorm: '⛈️', snow: '❄️', mist: '🌫️', fog: '🌫️',
    haze: '🌫️', smoke: '💨'
  };
  return map[cond] || '🌤️';
};

const formatTime = (d, language = 'en') => {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : language, { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatCurrency = (value, currency = 'PHP') => {
  try {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return `₱0.00`;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(numValue);
  } catch {
    return `₱0.00`;
  }
};

const EcoHomeLayout = ({ variant = 'guest', userId = null }) => {
  const { t, language, supportedLanguages } = useLanguage();
  const { user: authUser } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [attractionsLoading, setAttractionsLoading] = useState(true);
  const [hotelsLoading, setHotelsLoading] = useState(true);

  const [pagesections, setPageSections] = useState(() => loadCachedSetting('homepage-sections', {
    showWelcome: true, showWeather: true, showAttractions: true, showHotels: true, showDining: false,
    showGallery: true, showBento: true, showTestimonials: true,
    welcomeTitle: '', welcomeSubtitle: '', attractionsTitle: '', attractionsSubtitle: '',
    hotelsTitle: '', hotelsSubtitle: '',
  }, language));

  // Misc UI
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  // Now / hourly + current conditions
  const [nowForecast, setNowForecast] = useState(null);
  const [nowLoading, setNowLoading] = useState(true);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [clock, setClock] = useState(new Date());

  const featured = useMemo(() => attractions.slice(0, 6), [attractions]);

  useEffect(() => {
    setPageSections(loadCachedSetting('homepage-sections', {
      showWelcome: true, showWeather: true, showAttractions: true, showHotels: true, showDining: false,
      showGallery: true, showBento: true, showTestimonials: true,
      welcomeTitle: '', welcomeSubtitle: '', attractionsTitle: '', attractionsSubtitle: '',
      hotelsTitle: '', hotelsSubtitle: '',
    }, language));
  }, [language]);

  // Data fetching
  useEffect(() => {
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
      .then(res => setAttractions(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(err => console.error('Failed to fetch attractions:', err))
      .finally(() => setAttractionsLoading(false));

    fetch(`${API_BASE_URL}/api/hotels`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const hotelsArray = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        setHotels(hotelsArray.slice(0, 4));
      })
      .catch(err => { console.error('Failed to fetch hotels:', err); setHotels([]); })
      .finally(() => setHotelsLoading(false));

    weatherService.getWeatherForecast(NAUJAN_COORDS.lat, NAUJAN_COORDS.lon)
      .then(raw => {
        const payload = raw && (Array.isArray(raw.hourlyToday) || (raw.data && Array.isArray(raw.data.hourlyToday)))
          ? (raw.data && Array.isArray(raw.data.hourlyToday) ? raw.data : raw)
          : null;
        setNowForecast(payload && Array.isArray(payload.hourlyToday) && payload.hourlyToday.length > 0 ? payload : null);
      })
      .catch(err => console.error('Failed to fetch now forecast:', err))
      .finally(() => setNowLoading(false));

    weatherService.getCurrentWeather(NAUJAN_COORDS.lat, NAUJAN_COORDS.lon, 'Naujan')
      .then(setCurrentWeather)
      .catch(err => console.error('Failed to fetch current weather:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Live clock for the hero "Now" card
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  // Scroll: progress bar + back-to-top + reveal on scroll
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 600);
      const max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      setScrollProgress(Math.min(100, Math.max(0, (scrollTop / max) * 100)));
      if (window.__ecoRevealObserver_rAF) return;
      window.__ecoRevealObserver_rAF = true;
      requestAnimationFrame(() => {
        window.__ecoRevealObserver_rAF = false;
        document.querySelectorAll('.eco-reveal:not(.is-visible), .eco-stagger:not(.is-visible)').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.88) el.classList.add('is-visible');
        });
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = () => {
    const route = searchTab === 'attractions' ? '/attractions' : searchTab === 'itineraries' ? '/itinerary' : '/hotels';
    navigate(route, {
      state: {
        destination: searchDestination,
        checkIn: '', checkOut: '', guests: '2',
        filter: searchTab
      }
    });
  };

  const [searchDestination, setSearchDestination] = useState('');
  const [searchTab, setSearchTab] = useState('hotels');

  const safetyScorePct = useMemo(() => {
    if (attractions.length === 0) return 80;
    const avg = attractions.reduce((sum, a) => sum + (toNumericRating(a.avg_rating) || 4.5), 0) / attractions.length;
    return Math.round(Math.min(100, Math.max(40, avg * 19)));
  }, [attractions]);

  const heroStats = useMemo(() => {
    const ratings = attractions.map(a => toNumericRating(a.avg_rating)).filter(r => r !== null);
    const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 4.9;
    return {
      ecoSites: attractions.length,
      languages: supportedLanguages?.length || 8,
      ecoRating: avg.toFixed(1),
    };
  }, [attractions, supportedLanguages]);

  const nowCard = useMemo(() => {
    const hourly = nowForecast?.hourlyToday;
    if (!Array.isArray(hourly) || hourly.length === 0) return null;
    const currentHour = new Date().getHours();
    const paddedNow = `${String(currentHour).padStart(2, '0')}:00`;
    let idx = hourly.findIndex(h => h.time === paddedNow);
    if (idx === -1) idx = hourly.findIndex(h => parseInt(h.time, 10) > currentHour);
    if (idx === -1) idx = 0;
    const current = hourly[idx] || hourly[0];
    const upcoming = hourly.slice(idx + 1, idx + 4);
    return { current, upcoming };
  }, [nowForecast]);

  const galleryItems = useMemo(() => {
    const imgs = [];
    attractions.forEach(a => {
      if (a.image_url && imgs.length < 6) imgs.push({ src: a.image_url, caption: a.name });
    });
    hotels.forEach(h => {
      if (h.image && imgs.length < 8) imgs.push({ src: h.image, caption: h.name });
    });
    return imgs;
  }, [attractions, hotels]);

  const isGuest = variant === 'guest';

  const testimonialData = [
    { quote: t('testimonial_1_quote'), name: t('testimonial_1_name'), loc: t('testimonial_1_loc') },
    { quote: t('testimonial_2_quote'), name: t('testimonial_2_name'), loc: t('testimonial_2_loc') },
    { quote: t('testimonial_3_quote'), name: t('testimonial_3_name'), loc: t('testimonial_3_loc') },
  ];

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

  const mobileNavItems = [
    { key: 'home', label: t('mobile_home'), icon: Icons.MapPin, onClick: () => navigate('/') },
    { key: 'attraction', label: t('mobile_attraction'), icon: Icons.Attraction, onClick: () => navigate('/attractions') },
    { key: 'stay', label: t('mobile_stay'), icon: Icons.Hotel, onClick: () => navigate('/hotels') },
    { key: 'explore', label: t('mobile_explore'), icon: Icons.Compass, onClick: () => navigate('/map') },
    { key: 'about', label: t('mobile_about'), icon: Icons.Info, onClick: () => navigate('/about') },
  ];

  const places = attractions.slice(0, 8);

  const renderNowCell = (label, value) => (
    <div className="hero-now-cell">
      <span className="tag">{label}</span>
      <b className="num">{value}</b>
    </div>
  );

  return (
    <div className="eco-home">
      <div className="eco-scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ============ HERO — Editorial ============ */}
      <section className="hero-editorial" id="home">
        <div className="hero-editorial-inner">
          {/* meta row */}
          <div className="hero-meta eco-reveal">
            <div className="hero-meta-left">
              <span className="num">N° 001</span>
              <span className="hero-meta-line" aria-hidden="true" />
              <span className="uppercase">{t('hero_location_badge')}</span>
            </div>
            <div className="hero-meta-live">
              <span className="ring-pulse" aria-hidden="true" />
              <span>Live · {heroStats.ecoSites} {t('hero_stat_eco_sites')}</span>
            </div>
          </div>

          <div className="hero-grid">
            {/* left big type */}
            <div className="hero-type eco-reveal">
              <h1 className="hero-headline">
                {t('hero_title_pre')}
                <br />
                <span className="hero-headline-accent">{t('hero_title_accent')}<i className="hero-period">.</i></span>
              </h1>
              <p className="hero-sub">{pagesections.welcomeSubtitle || t('discover_paradise')}</p>
            </div>

            {/* right Now info card */}
            <div className="hero-now-card eco-reveal">
              <div className="hero-now-top">
                <span className="tag">{t('current_label')}</span>
                <span className="num">{pad2(clock.getHours())}:{pad2(clock.getMinutes())} · {pad2(clock.getSeconds())}</span>
              </div>
              <div className="hero-now-temp-row">
                <span className="hero-now-temp-big num">{currentWeather?.temperature ?? nowCard?.current?.temperature ?? '—'}°</span>
                <div className="hero-now-cond">
                  <div className="num">{currentWeather?.description || nowCard?.current?.description || t('weather_data_unavailable')}</div>
                  <div className="hero-now-feels num">Feels {currentWeather?.feelsLike !== null && currentWeather?.feelsLike !== undefined ? `${currentWeather.feelsLike}°` : '—'}</div>
                </div>
              </div>
              <div className="hero-now-divider" aria-hidden="true" />
              <div className="hero-now-grid">
                {renderNowCell(t('wind'), currentWeather?.windSpeed != null ? `${currentWeather.windSpeed} km/h` : '—')}
                {renderNowCell(t('humidity'), currentWeather?.humidity != null ? `${currentWeather.humidity}%` : '—')}
                {renderNowCell('UV', currentWeather?.uvIndex != null ? currentWeather.uvIndex : '—')}
              </div>
              <div className="hero-now-safety">
                <Icons.ShieldCheck size={14} />
                <span>{t('safety')} · {safetyScorePct >= 70 ? t('safety_good') : t('exercise_caution')}</span>
              </div>
            </div>
          </div>

          {/* hero image strip */}
          <div className="hero-collage eco-reveal">
            {featured[0] && (
              <button
                className="hero-tile-large bento-card"
                onClick={() => navigate(`/attractions/${featured[0].id}`, { state: { attraction: featured[0] } })}
                aria-label={featured[0].name}
              >
                <img className="bento-img" src={featured[0].image_url || '/placeholder-attraction.svg'} alt={featured[0].name} loading="eager" />
                <span className="hero-tile-overlay" />
                <span className="hero-tile-meta">
                  <span className="tag">{getCategoryChip(featured[0], t)}</span>
                  <b className="serif hero-tile-title">{featured[0].name}</b>
                  <span className="hero-tile-sub">{getAttractionArea(featured[0]) || featured[0].municipality}</span>
                </span>
                <span className="hero-tile-num serif italic num">01</span>
              </button>
            )}
            <div className="hero-col-side">
              {featured[1] && (
                <button
                  className="hero-tile bento-card"
                  onClick={() => navigate(`/attractions/${featured[1].id}`, { state: { attraction: featured[1] } })}
                  aria-label={featured[1].name}
                >
                  <img className="bento-img" src={featured[1].image_url || '/placeholder-attraction.svg'} alt={featured[1].name} loading="lazy" />
                  <span className="hero-tile-overlay" />
                  <span className="hero-tile-meta">
                    <span className="tag">{getCategoryChip(featured[1], t)}</span>
                    <b className="serif hero-tile-title">{featured[1].name}</b>
                  </span>
                </button>
              )}
              <div className="hero-tile-terra">
                <span className="tag">{t('eco_tip')}</span>
                <span className="serif hero-tile-quest italic">{t('travel_sustainably')}</span>
                <span className="hero-tile-terra-sub">{t('tip_respect_wildlife')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEARCH ============ */}
      <div className="eco-search-wrap">
        <div className="eco-search-bar">
          <div className="eco-search-tabs" role="tablist">
            {[
              { key: 'hotels', label: t('search_tab_stay') },
              { key: 'attractions', label: t('search_tab_explore') },
              { key: 'itineraries', label: t('search_tab_plan') },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={searchTab === tab.key}
                className={`eco-search-tab ${searchTab === tab.key ? 'tab-active' : 'tab-inactive'}`}
                onClick={() => setSearchTab(tab.key)}
              >
                {tab.key === 'hotels' ? <Icons.Hotel size={14} /> : tab.key === 'attractions' ? <Icons.Compass size={14} /> : <Icons.Calendar size={14} />}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="eco-search-input">
            <Icons.Search size={18} />
            <input
              type="text"
              placeholder={t('search_eco_placeholder')}
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              aria-label={t('search_eco_placeholder')}
            />
            {searchDestination && (
              <button type="button" onClick={() => setSearchDestination('')} aria-label={t('clear')} style={{ background: 'none', border: 'none', color: 'var(--eco-text-faint)', cursor: 'pointer' }}>
                <Icons.X size={16} />
              </button>
            )}
          </div>
          <button className="eco-search-submit" onClick={handleSearch}>
            {t('explore_button')}
            <Icons.ArrowUpRight size={15} />
          </button>
        </div>
      </div>

      {/* ============ WELCOME / QUICK ACTIONS ============ */}
      {pagesections.showWelcome !== false && (
        <section className="eco-welcome eco-reveal">
          <span className="eco-eyebrow">{t('welcome_eyebrow')}</span>
          <h2>{pagesections.welcomeTitle || (isGuest ? t('welcome_to_naujan') : t('welcome_back'))}</h2>
          <p>{pagesections.welcomeSubtitle || (isGuest ? t('discover_paradise') : t('continue_adventure'))}</p>
          <div className="eco-quick-actions eco-stagger">
            {quickActions.map(action => (
              <button key={action.key} className="eco-quick-action" onClick={action.onClick}>
                <div className="qa-icon"><action.icon size={20} /></div>
                <div>
                  <b>{action.title}</b>
                  <span>{action.description}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============ CLIMATE / SAFETY — prototype 3-col ============ */}
      {(pagesections.showWeather !== false || pagesections.showHazardAwareness !== false) && (
        <section className="proto-climate eco-reveal" id="climate">
          <div className="eco-section-header">
            <div className="esh-left">
              <span className="eco-eyebrow">{t('live_conditions')}</span>
              <h3>{t('weather_safety_heading')}</h3>
              <p>{t('weather_safety_subtitle')}</p>
            </div>
          </div>
          <div className="proto-climate-grid">
            {/* big weather card */}
            <div className="climate-big">
              <div className="grain" aria-hidden="true" />
              <div className="climate-big-top">
                <span className="tag">Today · {nowForecast?.location || 'Naujan'}</span>
                <Icons.Cloud size={28} />
              </div>
              <div className="climate-big-temp-row">
                <b className="serif num climate-big-temp">{currentWeather?.temperature ?? nowCard?.current?.temperature ?? '--'}°C</b>
                <span className="climate-big-cond num">
                  {currentWeather?.description || nowCard?.current?.description || t('weather_data_unavailable')}
                </span>
              </div>
              <div className="climate-big-grid">
                <div className="climate-big-cell">
                  <span className="tag">{t('sunrise')}</span>
                  <b className="num">{formatTime(currentWeather?.location?.sunrise, language)}</b>
                </div>
                <div className="climate-big-cell">
                  <span className="tag">{t('sunset')}</span>
                  <b className="num">{formatTime(currentWeather?.location?.sunset, language)}</b>
                </div>
                <div className="climate-big-cell">
                  <span className="tag">{t('wind')}</span>
                  <b className="num">{currentWeather?.windSpeed != null ? `${currentWeather.windSpeed} km/h` : '—'}</b>
                </div>
                <div className="climate-big-cell">
                  <span className="tag">{t('humidity')}</span>
                  <b className="num">{currentWeather?.humidity != null ? `${currentWeather.humidity}%` : '—'}</b>
                </div>
              </div>
            </div>

            {/* 7-day outlook */}
            <div className="climate-7day">
              <div className="tag climate-7day-tag">{t('forecast_heading')}</div>
              <div className="climate-7day-list">
                {nowLoading ? (
                  <div className="eco-skeleton" style={{ height: 180 }} />
                ) : Array.isArray(nowForecast?.forecast) && nowForecast.forecast.length > 0 ? (
                  nowForecast.forecast.slice(0, 7).map((day, i) => {
                    const date = day.datetime instanceof Date ? day.datetime : new Date(day.datetime);
                    let dayLabel = '';
                    try {
                      dayLabel = date.toLocaleDateString(language === 'zh' ? 'zh-CN' : language, { weekday: 'short' }).toUpperCase();
                    } catch {
                      dayLabel = t('forecast_heading').slice(0, 3).toUpperCase();
                    }
                    return (
                      <div className="climate-7day-row" key={i}>
                        <span className="num">{dayLabel}</span>
                        <div className="climate-7day-ico">{getEcoWeatherEmoji(day.condition)}</div>
                        <b className="num">{day.temperature}°</b>
                      </div>
                    );
                  })
                ) : (
                  <div className="climate-7day-empty">{t('no_forecast_data')}</div>
                )}
              </div>
            </div>

            {/* safety advisory */}
            <div className="climate-advisory">
              <div className="climate-advisory-head">
                <span className="tag">{t('safety')}</span>
                <span className="ring-pulse" aria-hidden="true" />
              </div>
              <div className="climate-advisory-status serif">{safetyScorePct >= 70 ? t('safety_good') : t('exercise_caution')}</div>
              <p className="climate-advisory-text">{t('weather_safety_subtitle')}</p>
              <div className="climate-advisory-list">
                <span className="climate-advisory-item">
                  <i className="terra-dot" aria-hidden="true" />
                  <span>{t('tip_check_hazards')}</span>
                </span>
                <span className="climate-advisory-item">
                  <i className="terra-dot" aria-hidden="true" />
                  <span>{t('tip_reusable_bottle')}</span>
                </span>
                <span className="climate-advisory-item">
                  <i className="terra-dot" aria-hidden="true" />
                  <span>{t('tip_respect_wildlife')}</span>
                </span>
              </div>
              <button className="climate-advisory-link" onClick={() => navigate('/map')}>
                {t('interactive_map')} →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ PLACES — Prototype bento ============ */}
      {pagesections.showAttractions !== false && (attractionsLoading || attractions.length > 0) && (
        <section className="proto-places" id="places">
          <div className="proto-places-inner">
            <div className="eco-section-header light">
              <div className="esh-left">
                <span className="eco-eyebrow">{t('featured_section_eyebrow')}</span>
                <h3>{pagesections.attractionsTitle || t('explore_top_attractions')}</h3>
                <p>{pagesections.attractionsSubtitle || t('handpicked_destinations')}</p>
              </div>
            </div>
            {attractionsLoading ? (
              <div className="place-grid">
                {[...Array(4)].map((_, i) => <div key={i} className="eco-skeleton" style={{ height: 220 }} />)}
              </div>
            ) : places.length === 0 ? (
              <div className="place-grid">
                <div className="place-empty">{t('home_no_results')}</div>
              </div>
            ) : (
              <div className="place-grid">
                {places.map((attraction, i) => {
                  const cls = i === 0 ? 'place-lg' : i === 1 ? 'place-5' : i === 2 ? 'place-terra' : i === 3 ? 'place-3' : i === 4 ? 'place-4' : i === 5 ? 'place-text' : i === 6 ? 'place-3' : 'place-banner';
                  return (
                    <div
                      key={attraction.id}
                      className={`place-tile ${cls} ${i === 0 || i === 1 || i === 3 || i === 4 || i === 6 || i === 7 ? 'bento-card' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
                    >
                      {i === 5 ? (
                        <div className="place-text-body">
                          <div className="place-text-head">
                            <span className="tag">N° {pad2(i + 1)} · {getCategoryChip(attraction, t)}</span>
                            <Icons.ArrowUpRight size={18} />
                          </div>
                          <b className="serif place-text-title italic">{attraction.name}</b>
                          <p className="place-text-desc">
                            {attraction.description
                              ? (String(attraction.description).length > 90 ? String(attraction.description).slice(0, 90) + '…' : attraction.description)
                              : t('experience_beauty')}
                          </p>
                          {toNumericRating(attraction.avg_rating) !== null && (
                            <span className="place-text-rating num">★ {Number(attraction.avg_rating).toFixed(1)}</span>
                          )}
                        </div>
                      ) : i === 2 ? (
                        <div className="place-terra-body">
                          <span className="tag">N° {pad2(i + 1)}</span>
                          <b className="serif place-terra-title">{attraction.name}</b>
                          <span className="place-terra-sub">{getCategoryChip(attraction, t)}</span>
                        </div>
                      ) : (
                        <>
                          <img className="bento-img" src={attraction.image_url || '/placeholder-attraction.svg'} alt={attraction.name} loading="lazy" />
                          <span className="place-tile-overlay" />
                          <span className="place-tile-meta">
                            <span className="tag">N° {pad2(i + 1)}{i === 0 || i === 1 || i === 3 ? ` · ${getCategoryChip(attraction, t)}` : ''}</span>
                            <b className="serif place-tile-title">{attraction.name}</b>
                            <span className="place-tile-sub">
                              {i === 0 || i === 1
                                ? (getAttractionArea(attraction) || attraction.municipality)
                                : (getAttractionArea(attraction) || getCategoryChip(attraction, t) || '')}
                            </span>
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="proto-places-foot">
              <button className="btn-ghost-light" onClick={() => navigate('/attractions')}>
                {t('view_all')} {places.length} {t('hero_stat_eco_sites')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ============ GALLERY ============ */}
      {galleryItems.length > 0 && (
        <section className="eco-gallery eco-reveal" id="explore">
          <div className="eco-section-header">
            <div className="esh-left">
              <span className="eco-eyebrow">{t('gallery_eyebrow')}</span>
              <h3>{t('captured_moments')}</h3>
              <p>{t('gallery_subtitle')}</p>
            </div>
          </div>
          <div className="eco-gallery-grid">
            {galleryItems.slice(0, 8).map((item, i) => (
              <button key={i} className="eco-gallery-tile" onClick={() => setLightbox(item)} aria-label={item.caption}>
                <img src={item.src} alt={item.caption} loading="lazy" />
                <div className="tile-shade" />
                <span className="tile-cap"><Icons.Camera size={12} /> {item.caption}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============ TESTIMONIALS ============ */}
      {pagesections.showTestimonials !== false && (
        <section className="eco-testimonials eco-reveal">
          <div className="eco-section-header">
            <div className="esh-left">
              <span className="eco-eyebrow">{t('testimonials_eyebrow')}</span>
              <h3>{t('traveler_stories')}</h3>
              <p>{t('testimonials_subtitle')}</p>
            </div>
          </div>
          <div className="eco-testimonial-grid eco-stagger">
            {testimonialData.map((item, i) => (
              <div key={i} className="eco-testimonial-card">
                <div className="quote-mark"><Icons.Quote size={18} /></div>
                <div className="ts-stars">★★★★★</div>
                <blockquote>"{item.quote}"</blockquote>
                <div className="ts-author">
                  <div className="ts-avatar">{item.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                  <div>
                    <b>{item.name}</b>
                    <span>{item.loc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ STAY — Prototype horizontal cards ============ */}
      {pagesections.showHotels !== false && (hotelsLoading || hotels.length > 0) && (
        <section className="eco-stay eco-reveal" id="accommodation">
          <div className="eco-section-header">
            <div className="esh-left">
              <span className="eco-eyebrow">{t('featured_section_eyebrow')}</span>
              <h3>{t('featured_stay')}</h3>
              <p>{t('featured_stay_subtitle')}</p>
            </div>
            <button className="eco-view-all" onClick={() => navigate('/hotels')}>
              {t('view_all')} <Icons.ArrowRight size={15} />
            </button>
          </div>
          {hotelsLoading ? (
            <div className="eco-skeleton" style={{ height: 380 }} />
          ) : hotels.length === 0 ? null : (
            <div className="stay-cards eco-stagger">
              {hotels.slice(0, 3).map(hotel => (
                <article key={hotel.id} className="stay-card" onClick={() => navigate(`/hotels/${hotel.id}`)}>
                  <div className="stay-card-img">
                    <img src={hotel.image || '/placeholder-hotel.svg'} alt={hotel.name} loading="lazy" />
                    <span className="stay-badge stay-badge-plain">{t('amenity_eco')}</span>
                    {toNumericRating(hotel.rating) !== null && hotel.rating >= 4.8 && (
                      <span className="stay-badge stay-badge-terra">{t('top_rated_txt')}</span>
                    )}
                  </div>
                  <div className="stay-card-body">
                    <div className="stay-card-title-row">
                      <h4 className="serif stay-card-name">{hotel.name}</h4>
                      <b className="stay-card-price num">{formatCurrency(hotel.pricePerNight || hotel.price || 0, hotel.currency)}<span className="stay-card-per">/{t('mobile_stay')}</span></b>
                    </div>
                    <p className="stay-card-desc">{hotel.location || t('current_location')}</p>
                    <div className="stay-card-meta">
                      <span className="stay-stars num">{'★★★★★'.slice(0, 5)}</span>
                      {toNumericRating(hotel.rating) !== null && (
                        <span className="num"> {Number(hotel.rating).toFixed(1)}</span>
                      )}
                      <span className="stay-reviews num"> · {hotel.reviews_count || hotel.reviewCount || 0} {t('reviews_txt')}</span>
                    </div>
                    <button className="eco-book-btn stay-book" onClick={(e) => { e.stopPropagation(); navigate(`/hotels/${hotel.id}`); }}>
                      <Icons.Booking size={16} />
                      {t('book_now_txt')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="eco-lightbox open" onClick={() => setLightbox(null)}>
          <button className="lb-close" onClick={(e) => { e.stopPropagation(); setLightbox(null); }} aria-label="Close">
            <Icons.X size={20} />
          </button>
          <img src={lightbox.src} alt={lightbox.caption} />
          <div className="lb-cap">{lightbox.caption}</div>
        </div>
      )}

      {/* Back to top */}
      {showBackToTop && (
        <button
          className="eco-back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('back_to_top')}
        >
          <Icons.ArrowUp size={20} />
        </button>
      )}

      {/* Mobile bottom nav */}
      <nav className="eco-mobile-nav" aria-label={t('explore_button')}>
        {mobileNavItems.slice(0, 2).map(item => (
          <button key={item.key} className="nav-item" onClick={item.onClick}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
        <button className="nav-center" onClick={() => navigate('/map')} aria-label={t('interactive_map')}>
          <Icons.Compass size={22} />
        </button>
        {mobileNavItems.slice(3).map(item => (
          <button key={item.key} className="nav-item" onClick={item.onClick}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default EcoHomeLayout;