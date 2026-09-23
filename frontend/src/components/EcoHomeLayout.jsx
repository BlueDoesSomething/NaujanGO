import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAttractions, getApiBaseUrl } from '../api';
import Icons from './Icons';
import WeatherWidget from './WeatherWidget';
import HazardAwareness from './HazardAwareness';
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

  const resolvedUserId = userId || authUser?.id || null;

  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [attractionsLoading, setAttractionsLoading] = useState(true);
  const [hotelsLoading, setHotelsLoading] = useState(true);
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
  const [slideshowExt, setSlideshowExt] = useState(() => loadCachedSetting('home-slideshow-extended', { intervalSeconds: 4, showArrows: true }, language));
  const [pagesections, setPageSections] = useState(() => loadCachedSetting('homepage-sections', {
    showWelcome: true, showWeather: true, showAttractions: true, showHotels: true, showDining: false,
    showGallery: true, showBento: true, showTestimonials: true,
    welcomeTitle: '', welcomeSubtitle: '', attractionsTitle: '', attractionsSubtitle: '',
    hotelsTitle: '', hotelsSubtitle: '',
  }, language));

  // Stage/slideshow state
  const [stageIdx, setStageIdx] = useState(0);
  const stageTimerRef = useRef(null);
  const heroInViewRef = useRef(true);
  const stageRef = useRef(null);

  // Search
  const [searchDestination, setSearchDestination] = useState('');
  const [searchTab, setSearchTab] = useState('hotels');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(-1);
  const searchWrapRef = useRef(null);

  // Misc UI
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  // Now/hourly forecast for the bento "Now" card
  const [nowForecast, setNowForecast] = useState(null);
  const [nowLoading, setNowLoading] = useState(true);

  // Dynamic falling leaves (mirrors prototype leaf spawner)
  const leafIconVariants = useMemo(() => [Icons.Leaf, Icons.Seedling], []);
  const leafSeqRef = useRef(0);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const createLeaf = () => {
      const id = leafSeqRef.current++;
      const Icon = leafIconVariants[Math.floor(Math.random() * leafIconVariants.length)];
      setLeaves(prev => {
        const next = [...prev, {
          id,
          Icon,
          left: Math.random() * 100,
          size: Math.random() * 20 + 12,
          dur: Math.random() * 15 + 15,
          delay: Math.random() * 5,
        }];
        const excess = next.length - 40;
        return excess > 0 ? next.slice(excess) : next;
      });
    };
    const seedTimers = [];
    for (let i = 0; i < 8; i++) seedTimers.push(setTimeout(createLeaf, i * 2000));
    const interval = setInterval(createLeaf, 4000);
    return () => { seedTimers.forEach(clearTimeout); clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featured = useMemo(() => attractions.slice(0, 6), [attractions]);

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
    setSlideshowExt(loadCachedSetting('home-slideshow-extended', { intervalSeconds: 4, showArrows: true }, language));
    setPageSections(loadCachedSetting('homepage-sections', {
      showWelcome: true, showWeather: true, showAttractions: true, showHotels: true, showDining: false,
      showGallery: true, showBento: true, showTestimonials: true,
      welcomeTitle: '', welcomeSubtitle: '', attractionsTitle: '', attractionsSubtitle: '',
      hotelsTitle: '', hotelsSubtitle: '',
    }, language));
  }, [language, t]);

  // Data fetching
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/home-slideshow`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const merged = { ...slideshowSettings, ...data };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Stage autoplay + intersection observer (mirrors mockup behaviour)
  const goToStage = useCallback((idx, isAuto = false) => {
    setStageIdx(prev => {
      const total = Math.max(1, featured.length);
      return ((idx % total) + total) % total;
    });
  }, [featured.length]);

  const stopAutoplay = useCallback(() => {
    if (stageTimerRef.current) { clearInterval(stageTimerRef.current); stageTimerRef.current = null; }
  }, []);

  const setAutoplay = useCallback(() => {
    stopAutoplay();
    if (!heroInViewRef.current) return;
    const ms = (slideshowExt.intervalSeconds || 4) * 1000;
    stageTimerRef.current = setInterval(() => {
      setStageIdx(prev => (prev + 1) % Math.max(1, featured.length));
    }, ms);
  }, [slideshowExt.intervalSeconds, featured.length, stopAutoplay]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        heroInViewRef.current = entry.isIntersecting;
        if (entry.isIntersecting) setAutoplay();
        else stopAutoplay();
      });
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => { observer.disconnect(); stopAutoplay(); };
  }, [setAutoplay, stopAutoplay, stageRef]);

  useEffect(() => {
    if (featured.length > 0) setAutoplay();
    return stopAutoplay;
  }, [featured.length, setAutoplay, stopAutoplay]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (!heroInViewRef.current) return;
      const tag = (e.target.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') goToStage(stageIdx + 1);
      if (e.key === 'ArrowLeft') goToStage(stageIdx - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goToStage, stageIdx]);

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

  // Lean autoplay fallback: if attraction images change, reset index
  useEffect(() => { setStageIdx(0); }, [featured.length]);

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

  // Search autocomplete suggestions (mirrors prototype autocomplete-list)
  const searchSuggestions = useMemo(() => {
    const q = searchDestination.trim().toLowerCase();
    if (q.length === 0) return [];
    const items = [];
    attractions.forEach(a => {
      if (items.length >= 6) return;
      const label = String(a.name || '');
      const sub = getAttractionArea(a) || String(a.municipality || '');
      if ((label + ' ' + sub).toLowerCase().includes(q)) {
        items.push({ type: 'attraction', id: a.id, label, sub, image: a.image_url });
      }
    });
    hotels.forEach(h => {
      if (items.length >= 6) return;
      const label = String(h.name || '');
      const sub = String(h.location || h.city || '');
      if ((label + ' ' + sub).toLowerCase().includes(q)) {
        items.push({ type: 'hotel', id: h.id, label, sub, image: h.image });
      }
    });
    return items.slice(0, 6);
  }, [searchDestination, attractions, hotels]);

  const pickSuggestion = (item) => {
    setSearchOpen(false);
    setSearchActive(-1);
    setSearchDestination('');
    if (item.type === 'hotel') navigate(`/hotels/${item.id}`, { state: { hotel: item } });
    else navigate(`/attractions/${item.id}`, { state: { attraction: item } });
  };

  // Close autocomplete when clicking outside the search bar
  useEffect(() => {
    if (!searchWrapRef.current) return;
    const onDoc = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchActive(-1);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const active = featured.length ? featured[stageIdx % featured.length] : null;
  const total = Math.max(1, featured.length);

  const [weatherSafetyScore, setWeatherSafetyScore] = useState(100);

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

  const hotel = hotels[0];

  return (
    <div className="eco-home">
      <div className="eco-scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Floating leaves */}
      <div className="floating-leaves" aria-hidden="true">
        {leaves.map(l => (
          <span
            key={l.id}
            className="floating-leaf"
            style={{ left: `${l.left}%`, fontSize: `${l.size}px`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s` }}
          >
            <l.Icon size={Math.round(l.size)} />
          </span>
        ))}
      </div>

      {/* Hero backdrop (drift animation behind hero) */}
      <div className="hero-backdrop" aria-hidden="true">
        <div className="hero-backdrop-img" />
        <div className="hero-backdrop-shade" />
      </div>

      {/* ============ HERO ============ */}
      <section className="hero-section" id="home">
        <div className="hero-gradient-orb orb-1" aria-hidden="true" />
        <div className="hero-gradient-orb orb-2" aria-hidden="true" />
        <div className="hero-gradient-orb orb-3" aria-hidden="true" />

        <div className="eco-hero-head">
          <span className="hero-pill shimmer">
            <span className="pulse-dot" />
            <Icons.MapPin size={13} />
            {t('hero_location_badge')}
          </span>
          <h1 className="hero-title">
            {t('hero_title_pre')}{' '}
            <span className="hero-title-accent">{t('hero_title_accent')}</span>
          </h1>
          <div className="hero-stats">
            <div className="hero-stat">
              <b>{heroStats.ecoSites}</b>
              <span>{t('hero_stat_eco_sites')}</span>
            </div>
            <span className="hero-stat-divider" aria-hidden="true" />
            <div className="hero-stat">
              <b>{heroStats.languages}</b>
              <span>{t('hero_stat_languages')}</span>
            </div>
            <span className="hero-stat-divider" aria-hidden="true" />
            <div className="hero-stat">
              <b>{heroStats.ecoRating}</b>
              <span>{t('hero_stat_eco_rating')}</span>
            </div>
          </div>
        </div>

        <div className="eco-hero-inner">
          <div className="featured-stage" ref={stageRef} id="featuredStage">
            <div className="stage-track" style={{ transform: `translate3d(-${stageIdx * 100}%, 0, 0)` }}>
              {featured.map((attraction, i) => (
                <article
                  key={attraction.id}
                  className={`stage-slide${i === stageIdx ? ' is-active' : ''}`}
                  data-slide={i}
                >
                  <img src={attraction.image_url || '/placeholder-attraction.svg'} alt={attraction.name} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable="false" />
                  <div className="stage-shade" />
                  <div className="stage-content">
                    <div className="stage-cat">
                      <Icons.Seedling size={13} />
                      {getCategoryChip(attraction, t)}
                    </div>
                    <h2 className="stage-name">{attraction.name}</h2>
                    <p className="stage-desc">{attraction.description || t('experience_beauty')}</p>
                    <div className="stage-meta">
                      <span className="green"><Icons.MapPin size={14} /> {getAttractionArea(attraction) || attraction.municipality}</span>
                      {toNumericRating(attraction.avg_rating) !== null && (
                        <span><Icons.Star size={14} /> {Number(attraction.avg_rating).toFixed(1)} {t('stat_rating')}</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {featured.length > 0 && (
              <div className="stage-badge">
                <Icons.Seedling size={12} />
                <span className="badge-txt">{t('featured_badge')}</span>
              </div>
            )}

            {featured.length > 1 && slideshowExt.showArrows !== false && (
              <>
                <div className="stage-counter">
                  <span className="cur">{pad2(stageIdx + 1)}</span>
                  <span className="tot">/ {pad2(total)}</span>
                </div>
                <button className="stage-nav stage-nav-prev" id="stagePrev" onClick={() => goToStage(stageIdx - 1)} aria-label={t('clear')}>
                  <Icons.ChevronLeft size={20} />
                </button>
                <button className="stage-nav stage-nav-next" id="stageNext" onClick={() => goToStage(stageIdx + 1)} aria-label={t('explore_button')}>
                  <Icons.ChevronRight size={20} />
                </button>
                <div className="thumb-rail-wrap">
                  <span className="thumb-rail-hint">{t('browse_destinations_rail')}</span>
                  <div className="thumb-rail" id="thumbRail">
                    {featured.map((attraction, i) => (
                      <button
                        key={attraction.id}
                        className={`thumb-card${i === stageIdx ? ' is-active' : ''}`}
                        onClick={() => goToStage(i)}
                        aria-label={attraction.name}
                      >
                        <img src={attraction.image_url?.replace(/w=\d+/, 'w=320') || '/placeholder-attraction.svg'} alt="" loading="lazy" draggable="false" />
                        <span className="thumb-shade" />
                        <span className="thumb-idx">{pad2(i + 1)}</span>
                        <span className="thumb-name">{attraction.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="rail-dots" id="railDots">
                    {featured.map((_, i) => (
                      <button key={i} className={`rail-dot${i === stageIdx ? ' is-active' : ''}`} onClick={() => goToStage(i)} aria-label={`${i + 1}`} />
                    ))}
                  </div>
                </div>
                <div className="stage-progress run" id="stageProgress" />
              </>
            )}
          </div>

          {/* Info card */}
          <div className="info-card" id="infoCard">
            <div className="info-idx" id="infoIdx">{pad2(stageIdx + 1)} / {pad2(total)}</div>
            <div className="info-body" id="infoBody" key={stageIdx}>
              <div className="info-cat" id="infoCat">
                <Icons.Seedling size={15} />
                {active ? getCategoryChip(active, t) : t('featured_badge')}
              </div>
              <h3 className="info-name" id="infoName">{active?.name || t('welcome_to_naujan')}</h3>
              <p className="info-desc" id="infoDesc">{active?.description || t('experience_beauty')}</p>
              {active && (
                <div className="ts-list" id="infoTs">
                  <div className="ts-row ts-row-sun">
                    <span className="ts-ico"><Icons.Sun size={14} /></span>
                    <span className="ts-label">{t('best_time')}</span>
                    <span className="ts-value">{active.best_time_to_visit || t('early_morning')}</span>
                  </div>
                  <div className="ts-row ts-row-clock">
                    <span className="ts-ico"><Icons.Clock size={14} /></span>
                    <span className="ts-label">{t('visit_duration')}</span>
                    <span className="ts-value">{active.visit_duration || active.duration || active.duration_hours || t('approx_2_3_hours')}</span>
                  </div>
                  <div className="ts-row ts-row-route">
                    <span className="ts-ico"><Icons.Route size={14} /></span>
                    <span className="ts-label">{t('difficulty')}</span>
                    <span className="ts-value">{active.difficulty_level || t('easy_to_moderate')}</span>
                  </div>
                </div>
              )}
              {active && (
                <>
                  <div className="info-stats">
                    <div className="info-stat">
                      <b>{toNumericRating(active.avg_rating) !== null ? Number(active.avg_rating).toFixed(1) : '—'}</b>
                      <span>{t('stat_rating')}</span>
                    </div>
                    <div className="info-stat">
                      <b>{getAttractionArea(active) ? getAttractionArea(active).slice(0, 12) : '—'}</b>
                      <span>{t('stat_area')}</span>
                    </div>
                    <div className="info-stat">
                      <b>{active.duration || (active.duration_hours ? `${active.duration_hours}h` : '—')}</b>
                      <span>{t('stat_category')}</span>
                    </div>
                  </div>
                  <div className="info-tags" id="infoTags">
                    {(active.category_tags || active.tags || []).slice(0, 4).map((tag, i) => (
                      <span className="info-tag" key={i}>{tag}</span>
                    ))}
                  </div>
                </>
              )}
              <div className="hero-actions">
                <button className="btn-primary-hero" id="heroExploreBtn" onClick={() => active && navigate(`/attractions/${active.id}`, { state: { attraction: active } })}>
                  <Icons.Route size={16} />
                  {t('explore_destination')}
                </button>
                {isGuest === false && (
                  <button className="btn-ghost-hero hero-save-btn" onClick={() => navigate('/itinerary')} aria-label={t('my_itineraries')}>
                    <Icons.Heart size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ SEARCH ============ */}
      <div className="eco-search-wrap">
        <div className="eco-search-bar" ref={searchWrapRef}>
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
              onChange={(e) => { setSearchDestination(e.target.value); setSearchOpen(true); setSearchActive(-1); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setSearchOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setSearchActive(prev => (prev + 1) % Math.max(1, searchSuggestions.length)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchActive(prev => (prev - 1 + Math.max(1, searchSuggestions.length)) % Math.max(1, searchSuggestions.length)); }
                else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchOpen && searchActive >= 0 && searchSuggestions[searchActive]) pickSuggestion(searchSuggestions[searchActive]);
                  else handleSearch();
                } else if (e.key === 'Escape') { setSearchOpen(false); setSearchActive(-1); }
              }}
              aria-label={t('search_eco_placeholder')}
              aria-expanded={searchOpen && searchSuggestions.length > 0}
              role="combobox"
            />
            {searchDestination && (
              <button type="button" onClick={() => setSearchDestination('')} aria-label={t('clear')} style={{ background: 'none', border: 'none', color: 'var(--eco-text-faint)', cursor: 'pointer' }}>
                <Icons.X size={16} />
              </button>
            )}
            {searchOpen && searchSuggestions.length > 0 && (
              <ul className="eco-autocomplete" role="listbox" onMouseDown={(e) => e.preventDefault()} onBlur={() => setSearchOpen(false)}>
                {searchSuggestions.map((s, i) => (
                  <li
                    key={`${s.type}-${s.id}`}
                    role="option"
                    aria-selected={i === searchActive}
                    className={`eco-autocomplete-item${i === searchActive ? ' is-active' : ''}`}
                    onMouseEnter={() => setSearchActive(i)}
                    onClick={() => { setSearchOpen(false); pickSuggestion(s); }}
                  >
                    <span className="eco-ac-ic">{s.type === 'hotel' ? <Icons.Hotel size={15} /> : <Icons.Attraction size={15} />}</span>
                    <span className="eco-ac-body">
                      <b>{s.label}</b>
                      <em>{s.sub}</em>
                    </span>
                    <span className="eco-ac-type">{s.type === 'hotel' ? t('mobile_stay') : t('mobile_attraction')}</span>
                  </li>
                ))}
              </ul>
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

      {/* ============ BENTO ============ */}
      {(pagesections.showWeather !== false || pagesections.showHazardAwareness !== false) && (
        <section className="eco-bento-section eco-reveal">
        <div className="eco-section-header">
          <div className="esh-left">
            <span className="eco-eyebrow">{t('live_conditions')}</span>
            <h3>{t('weather_safety_heading')}</h3>
            <p>{t('weather_safety_subtitle')}</p>
          </div>
        </div>
        <div className="bento-grid">
          {/* Live Conditions (main weather card) */}
          {pagesections.showWeather !== false && (
          <div className="bento-item bento-main eco-bento-weather">
            <div className="bento-head">
              <div>
                <p className="bento-live-badge"><span className="pulse-dot" /> {t('current_location')}</p>
              </div>
              <div className="bento-weather-score">
                <div className="bento-weather-score-circle" style={{
                  borderColor: weatherSafetyScore >= 80 ? '#4caf50' : weatherSafetyScore >= 60 ? '#ff9800' : '#ff5722'
                }}>
                  <span style={{ color: weatherSafetyScore >= 80 ? '#4caf50' : weatherSafetyScore >= 60 ? '#ff9800' : '#ff5722', fontWeight: 'bold' }}>
                    {weatherSafetyScore}
                  </span>
                </div>
                <span className="bento-weather-score-label">{t('safety_score')}</span>
              </div>
            </div>
            <WeatherWidget
              latitude={NAUJAN_COORDS.lat}
              longitude={NAUJAN_COORDS.lon}
              locationName="Naujan, Oriental Mindoro"
              showForecast={true}
              showAlerts={true}
              showSafetyTips={true}
              size="large"
              theme={isDark ? 'dark' : 'light'}
              horizontal={true}
              onSafetyScore={setWeatherSafetyScore}
            />
          </div>
          )}

          {/* Hazard Awareness */}
          {pagesections.showHazardAwareness !== false && (
          <div className="bento-item bento-half eco-hazard">
            <div className="bento-head">
              <div className="bh-icon"><Icons.ShieldCheck size={20} /></div>
              <div>
                <h3>{t('hazard_alert')}</h3>
                <p>{t('critical_locations')}</p>
              </div>
            </div>
            <HazardAwareness
              latitude={NAUJAN_COORDS.lat}
              longitude={NAUJAN_COORDS.lon}
              locationName="Naujan, Oriental Mindoro"
              attractions={attractions}
              userId={resolvedUserId}
              enableNotifications={!isGuest}
              compact={true}
              theme={isDark ? 'dark' : 'light'}
            />
          </div>
          )}

          {/* Safety Score */}
          <div className="bento-item bento-third eco-safety">
            <div className="bento-head">
              <div className="bh-icon"><Icons.ShieldCheck size={20} /></div>
              <div>
                <h3>{t('safety')}</h3>
                <p>{t('eco_rating_desc')}</p>
              </div>
            </div>
            <div className="eco-safety-ring-row">
              <div className="safety-ring" style={{ '--safety-pct': `${safetyScorePct * 3.6}deg` }}>
                <span className="safety-ring-value">{safetyScorePct}</span>
              </div>
              <div className="eco-safety-copy">
                <div className="safety-metric">
                  <b>{safetyScorePct >= 70 ? t('safety_good') : t('exercise_caution')}</b>
                  <span>{t('travel_sustainably')}</span>
                </div>
                <div className="safety-bar">
                  <div className="safety-fill" style={{ width: `${safetyScorePct}%` }} />
                </div>
                <span className="safety-score">{safetyScorePct}/100</span>
              </div>
            </div>
          </div>

          {/* Now / hourly */}
          <div className="bento-item bento-third eco-now">
            {nowLoading ? (
              <div className="eco-skeleton" style={{ height: 120 }} />
            ) : nowCard ? (
              <>
                <div className="bento-head">
                  <div className="bh-icon"><Icons.Clock size={20} /></div>
                  <div>
                    <h3>{t('current_label')}</h3>
                    <p>{t('today_hourly_forecast')}</p>
                  </div>
                </div>
                <div className="eco-now-row">
                  <div className="eco-now-main">
                    <span className="eco-now-cond">{nowCard.current.description || nowCard.current.condition}</span>
                    <b className="eco-now-temp">{nowCard.current.temperature}°</b>
                  </div>
                  <div className="eco-now-hours">
                    {nowCard.upcoming.map((hour, i) => (
                      <div key={i} className="eco-now-hour">
                        <span>{hour.time}</span>
                        <b>{hour.temperature}°</b>
                        <em>{hour.description || hour.condition}</em>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bento-head">
                <div className="bh-icon"><Icons.Clock size={20} /></div>
                <div>
                  <h3>{t('current_label')}</h3>
                  <p>{t('weather_data_unavailable')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Eco Tip */}
          <div className="bento-item bento-third">
            <div className="bento-head">
              <div className="bh-icon"><Icons.Seedling size={20} /></div>
              <div>
                <h3>{t('eco_tip')}</h3>
                <p>{t('travel_sustainably')}</p>
              </div>
            </div>
            <ul className="eco-tip-list">
              <li><Icons.Check size={15} /> {t('tip_check_hazards')}</li>
              <li><Icons.Check size={15} /> {t('tip_reusable_bottle')}</li>
              <li><Icons.Check size={15} /> {t('tip_respect_wildlife')}</li>
            </ul>
          </div>

          </div>
      </section>
      )}

      {/* ============ ECO ATTRACTIONS ============ */}
      {pagesections.showAttractions !== false && (attractionsLoading || attractions.length > 0) && (
      <section className="eco-attractions eco-reveal" id="attractions">
        <div className="eco-section-header">
          <div className="esh-left">
            <span className="eco-eyebrow">{t('featured_section_eyebrow')}</span>
            <h3>{pagesections.attractionsTitle || (isGuest ? t('explore_top_attractions') : t('recommended_for_you'))}</h3>
            <p>{pagesections.attractionsSubtitle || (isGuest ? t('handpicked_destinations') : t('personalized_recommendations'))}</p>
          </div>
          <button className="eco-view-all" onClick={() => navigate('/attractions')}>
            {t('view_all')} <Icons.ArrowRight size={15} />
          </button>
        </div>
        {attractionsLoading ? (
          <div className="eco-rail">
            {[...Array(4)].map((_, i) => <div key={i} className="eco-skeleton" style={{ height: 300 }} />)}
          </div>
        ) : attractions.length === 0 ? (
          <div className="eco-rail">
            <div className="bento-item bento-third">{t('home_no_results')}</div>
          </div>
        ) : (
          <div className="eco-rail eco-stagger">
            {attractions.slice(0, 8).map(attraction => (
              <div
                key={attraction.id}
                className="eco-attraction-card"
                onClick={() => navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/attractions/${attraction.id}`, { state: { attraction } })}
              >
                <div className="card-img">
                  <img src={attraction.image_url || '/placeholder-attraction.svg'} alt={attraction.name} loading="lazy" />
                  <div className="card-shade" />
                  <span className="eco-cat-chip">
                    <Icons.Seedling size={12} />
                    {getCategoryChip(attraction, t)}
                  </span>
                </div>
                <div className="eco-card-body">
                  <h4>{attraction.name}</h4>
                  <div className="card-loc">
                    <Icons.MapPin size={13} />
                    {getAttractionArea(attraction) || attraction.municipality}
                  </div>
                  <div className="eco-card-meta">
                    {toNumericRating(attraction.avg_rating) !== null && (
                      <span className="eco-rating-pill">
                        <Icons.Star size={13} filled />
                        {Number(attraction.avg_rating).toFixed(1)}
                      </span>
                    )}
                    {attraction.duration && (
                      <span className="eco-duration-pill">{attraction.duration}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* ============ FEATURED STAY ============ */}
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
            <div className="eco-skeleton" style={{ height: 360 }} />
          ) : hotel ? (
            <div className="eco-split">
              <div className="eco-split-img">
                <img src={hotel.image || '/placeholder-hotel.svg'} alt={hotel.name} loading="lazy" />
                <span className="split-badge"><Icons.Star size={12} /> {t('top_rated_txt')}</span>
              </div>
              <div className="eco-split-body">
                <h3>{hotel.name}</h3>
                <div className="split-loc">
                  <Icons.MapPin size={14} />
                  {hotel.location || t('current_location')}
                </div>
                {toNumericRating(hotel.rating) !== null && (
                  <div className="eco-split-stars">
                    {'★★★★★'.slice(0, 5)}
                    <span className="val"> {Number(hotel.rating).toFixed(1)}</span>
                    <span> · {hotel.reviews_count || hotel.reviewCount || 0} {t('reviews_txt')}</span>
                  </div>
                )}
                <div className="eco-amenities">
                  <span className="eco-amenity"><Icons.Wifi size={14} /> {t('amenity_wifi')}</span>
                  <span className="eco-amenity"><Icons.Coffee size={14} /> {t('amenity_breakfast')}</span>
                  <span className="eco-amenity"><Icons.Seedling size={14} /> {t('amenity_eco')}</span>
                </div>
                <div className="eco-split-price">
                  <span className="from">{t('starting_from')}</span>
                  <b>{formatCurrency(hotel.pricePerNight || hotel.price || 0, hotel.currency)}</b>
                  <span className="eco-reviews-count">/ {t('mobile_stay')}</span>
                </div>
                <div className="eco-book-row">
                  <button className="eco-book-btn" onClick={() => navigate(`/hotels/${hotel.id}`)}>
                    <Icons.Booking size={16} />
                    {t('book_now_txt')}
                  </button>
                  <button className="btn-ghost-hero" onClick={() => navigate('/hotels')}>
                    {t('view_all')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
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