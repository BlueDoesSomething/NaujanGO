import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { fetchAttractionSuggestions, fetchAttractions } from '../api';
import HeroSlideshow from '../components/HeroSlideshow';
import Icons from '../components/Icons';
import { weatherService } from '../services/weatherService';
import './Attractions.css';

const ATTRACTIONS_PER_PAGE = 10;

const ATTRACTION_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80',
  'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1200&q=80'
];

const getAttractionFallbackImage = (attraction) => {
  const key = `${attraction?.id || ''}${attraction?.name || ''}${attraction?.category || ''}${attraction?.location || ''}`.toLowerCase();
  const total = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return ATTRACTION_FALLBACK_IMAGES[total % ATTRACTION_FALLBACK_IMAGES.length];
};

const getLatLon = (attraction) => {
  const lat = Number.parseFloat(attraction?.latitude ?? attraction?.lat);
  const lon = Number.parseFloat(attraction?.longitude ?? attraction?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
};

const StarRating = ({ value }) => (
  <span style={{ display: 'inline-flex', gap: 1 }}>
    {[1, 2, 3, 4, 5].map(star => (
      <span key={star} style={{ color: star <= Math.round(value) ? '#f59e0b' : '#d1d5db', fontSize: 13 }}>★</span>
    ))}
  </span>
);

const Pagination = ({ current, total, onChange, totalItems, perPage, t }) => {
  if (total <= 1) {
    return (
      <div className="pagination-wrapper">
        <div className="pagination-info">{totalItems} {totalItems !== 1 ? t('attractions_found_count') : t('attraction_not_found')}</div>
      </div>
    );
  }

  const start = (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, totalItems);
  const pages = total <= 7
    ? Array.from({ length: total }, (_, i) => i + 1)
    : current <= 4
      ? [1, 2, 3, 4, 5, '...', total]
      : current >= total - 3
        ? [1, '...', total - 4, total - 3, total - 2, total - 1, total]
        : [1, '...', current - 1, current, current + 1, '...', total];

  return (
    <div className="pagination-wrapper">
      <div className="pagination-info">
        {t('showing')} <strong>{start}-{end}</strong> {t('of')} <strong>{totalItems}</strong>
      </div>
      <div className="pagination-controls">
        <button className={`pag-btn${current === 1 ? ' pag-btn--disabled' : ''}`} onClick={() => onChange(current - 1)} disabled={current === 1}>{t('prev')}</button>
        {pages.map((p, idx) => p === '...'
          ? <span key={`e-${idx}`} className="pag-ellipsis">...</span>
          : <button key={p} className={`pag-btn${p === current ? ' pag-btn--active' : ''}`} onClick={() => onChange(p)}>{p}</button>
        )}
        <button className={`pag-btn${current === total ? ' pag-btn--disabled' : ''}`} onClick={() => onChange(current + 1)} disabled={current === total}>{t('next')}</button>
      </div>
    </div>
  );
};

const Attractions = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMinRating, setFilterMinRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [weatherData, setWeatherData] = useState({});

  const debounceRef = useRef(null);

  useEffect(() => {
    fetchAttractions()
      .then((res) => {
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        setAttractions(rows);
        const withCoords = rows.filter(a => !!getLatLon(a));
        if (withCoords.length > 0) {
          Promise.all(withCoords.map(async (attraction) => {
            try {
              const coords = getLatLon(attraction);
              if (!coords) return null;
              const weather = await weatherService.getCurrentWeather(
                coords.lat,
                coords.lon,
                attraction.name
              );
              return { id: attraction.id, weather };
            } catch {
              return null;
            }
          })).then(results => {
            const map = {};
            results.forEach(r => {
              if (r?.weather) map[r.id] = r.weather;
            });
            setWeatherData(map);
          });
        }
      })
      .catch((err) => setError(err?.response?.data?.message || err?.message || 'Failed to load attractions'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (location.state?.destination) {
      setSearchQuery(location.state.destination);
    }
  }, [location.state]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetchAttractionSuggestions(searchQuery)
        .then(r => setSuggestions(r.data || []))
        .catch(() => setSuggestions([]));
    }, 300);
  }, [searchQuery]);

  const categories = useMemo(
    () => ['all', ...new Set(Array.isArray(attractions) ? attractions.map(a => a.category).filter(Boolean) : [])],
    [attractions]
  );

  const filteredAttractions = useMemo(() => {
    if (!Array.isArray(attractions)) return [];
    const q = searchQuery.trim().toLowerCase();
    const list = attractions.filter(a => {
      const text = `${a.name || ''} ${a.location || ''} ${a.description || ''} ${a.category || ''}`.toLowerCase();
      const matchesSearch = !q || text.includes(q);
      const matchesCategory = filterCategory === 'all' || (a.category || '').toLowerCase() === filterCategory.toLowerCase();
      const matchesRating = filterMinRating <= 0 || (parseFloat(a.avg_rating) || 0) >= filterMinRating;
      return matchesSearch && matchesCategory && matchesRating;
    });

    return list.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'location') return (a.location || '').localeCompare(b.location || '');
      if (sortBy === 'rating') return (parseFloat(b.avg_rating) || 0) - (parseFloat(a.avg_rating) || 0);
      return (parseInt(b.review_count) || 0) - (parseInt(a.review_count) || 0);
    });
  }, [attractions, searchQuery, filterCategory, filterMinRating, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterMinRating, sortBy, view]);

  const perPage = ATTRACTIONS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(filteredAttractions.length / perPage));
  const paged = filteredAttractions.slice((currentPage - 1) * perPage, currentPage * perPage);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div className="skeleton-card" style={{ width: 320 }}>
          <div className="skeleton-img" />
          <div style={{ padding: 16 }}>
            <div className="skeleton-line" style={{ height: 14, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ height: 12, width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 12, padding: 16, maxWidth: 600 }}>
          <h3 style={{ margin: '0 0 8px' }}>{t('error')}</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', paddingBottom: 32 }}>
      <HeroSlideshow
        title={t('discover_naujan')}
        subtitle={`${Array.isArray(attractions) ? attractions.length : 0} ${t('attractions')} ${t('in_oriental_mindoro')}`}
        height="450px"
        showControls={false}
      />

      <div className="filters-wrapper">
        <div className="search-bar-wrap">
          <div className="search-bar-inner">
            <span className="search-bar-icon"><Icons.Search size={18} /></span>
            <input
              className="search-bar-input"
              placeholder={t('search_attractions_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            />
            {searchQuery && <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map(s => (
                <div key={s.id} className="suggestion-item" onMouseDown={() => setSearchQuery(s.name)}>
                  <Icons.Search size={12} />
                  <span>{s.name}</span>
                  <span className="suggestion-location">{s.location}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="filters-control-row">
          <button className={`filter-toggle-btn${filterPanelOpen ? ' filter-toggle-btn--open' : ''}`} onClick={() => setFilterPanelOpen(v => !v)}>
            {t('filters_button')}
          </button>
          <div className="sort-inline-wrap">
            <label className="sort-inline-label">{t('sort')}:</label>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="popular">{t('sort_popular')}</option>
              <option value="rating">{t('sort_highest_rated')}</option>
              <option value="name">{t('sort_name_az')}</option>
              <option value="location">{t('sort_nearest')}</option>
            </select>
          </div>
        </div>

        {filterPanelOpen && (
          <div className="filter-panel">
            <div className="filter-panel-grid">
              <div className="filter-group">
                <label className="filter-label">{t('filter_category_label')}</label>
                <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  {categories.map(c => <option key={c} value={c}>{c === 'all' ? t('filter_all_categories') : c}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">{t('filter_minimum_rating_label')}</label>
                <div className="rating-filter-stars">
                  {[0, 1, 2, 3, 4, 5].map(r => (
                    <button key={r} type="button" className={`rating-star-btn${filterMinRating === r ? ' rating-star-btn--active' : ''}`} onClick={() => setFilterMinRating(r)}>
                      {r === 0 ? t('filter_rating_any') : `${r}${t('filter_stars_suffix')}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button className="clear-all-filters-btn" onClick={() => {
              setFilterCategory('all');
              setFilterMinRating(0);
              setSearchQuery('');
            }}>{t('clear_all_filters_button')}</button>
          </div>
        )}

        <div className="active-chips">
          {searchQuery && <span className="filter-chip">{searchQuery} <button onClick={() => setSearchQuery('')}>✕</button></span>}
          {filterCategory !== 'all' && <span className="filter-chip">{filterCategory} <button onClick={() => setFilterCategory('all')}>✕</button></span>}
          {filterMinRating > 0 && <span className="filter-chip">{filterMinRating}{t('filter_stars_suffix')} <button onClick={() => setFilterMinRating(0)}>✕</button></span>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'rgba(255,255,255,0.45)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={view === 'grid' ? { ...viewButton, ...activeViewButton } : viewButton} onClick={() => setView('grid')}>{t('view_grid')}</button>
          <button style={view === 'list' ? { ...viewButton, ...activeViewButton } : viewButton} onClick={() => setView('list')}>{t('view_list')}</button>
        </div>
        <div className="results-summary"><strong>{filteredAttractions.length}</strong>{t('attractions_found_count')}</div>
      </div>

      {filteredAttractions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="empty-state-icon"><Icons.Search size={36} /></div>
          <h3>{t('no_attractions_found')}</h3>
          <p>{t('no_attractions_try_again')}</p>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 24, padding: 24 }}>
          {paged.map(a => (
            <div key={a.id} style={modernCardStyle} className="modern-card" onClick={() => navigate(`/attractions/${a.id}`, { state: { attraction: a } })}>
              <div style={cardImageContainer}>
                <img src={a.image_url || getAttractionFallbackImage(a)} alt={a.name} style={cardImageStyle} className="card-image" loading="lazy" />
              </div>
              <div style={cardContent}>
                <h3 style={cardTitle}>{a.name}</h3>
                <p style={cardLocation}><Icons.Location size={14} /> {a.location}</p>
                <p style={cardDescription}>{a.description?.substring(0, 120)}...</p>
                {(parseFloat(a.avg_rating) || 0) > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRating value={parseFloat(a.avg_rating)} />
                    <span style={{ fontSize: 12, color: 'var(--theme-faint)' }}>{Number(a.avg_rating).toFixed(1)} ({a.review_count || 0})</span>
                  </div>
                )}
                {(parseInt(a.review_count, 10) || 0) > 0 && (
                  <p style={{ margin: '0.45rem 0 0', fontSize: 12, color: 'var(--theme-muted)', fontWeight: 600 }}>
                    {a.review_count} {t('reviews_label')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
          {paged.map((a, idx) => (
            <div key={a.id} style={listCardStyle} className="list-card" onClick={() => navigate(`/attractions/${a.id}`, { state: { attraction: a } })}>
              <div style={{ position: 'absolute', top: 10, left: 10, background: '#16a34a', color: '#fff', borderRadius: 8, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                #{(currentPage - 1) * ATTRACTIONS_PER_PAGE + idx + 1}
              </div>
              <div style={{ width: 240, minHeight: 180, overflow: 'hidden', borderRadius: '10px 0 0 10px' }}>
                <img src={a.image_url || getAttractionFallbackImage(a)} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              </div>
              <div style={listContentStyle}>
                <h3 style={listTitleStyle}>{a.name}</h3>
                <p style={listLocationStyle}><Icons.Location size={13} /> {a.location}</p>
                <p style={listDescriptionStyle}>{a.description?.substring(0, 180)}{a.description?.length > 180 ? '...' : ''}</p>
                <p style={{ margin: '0.55rem 0 0', fontSize: 12, color: 'var(--theme-muted)', fontWeight: 600 }}>
                  {(parseInt(a.review_count, 10) || 0)} {t('reviews_label')}
                  {(parseFloat(a.avg_rating) || 0) > 0 ? ` • ${Number(a.avg_rating).toFixed(1)}★` : ''}
                </p>
                {weatherData[a.id] && (
                  <div style={{ marginTop: 8, display: 'inline-flex', gap: 6, background: 'var(--theme-chip-bg, #e0f2fe)', color: '#0369a1', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>
                    <span>{weatherData[a.id].temperature}°C</span>
                    <span>{weatherData[a.id].condition}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination current={currentPage} total={totalPages} onChange={setCurrentPage} totalItems={filteredAttractions.length} perPage={perPage} t={t} />
      {totalPages > 1 && (
          <div className="load-more-wrap">
          <button className="load-more-btn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}>{t('load_more')}</button>
        </div>
      )}
    </div>
  );
};

const viewButton = {
  padding: '0.6rem 1rem',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
  color: '#374151'
};

const activeViewButton = {
  background: '#16a34a',
  color: '#fff',
  borderColor: '#16a34a'
};

const modernCardStyle = {
  backgroundColor: 'rgba(255,255,255,0.75)',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.35)'
};

const cardImageContainer = { overflow: 'hidden' };
const cardImageStyle = { width: '100%', height: 240, objectFit: 'cover' };
const cardContent = { padding: '1rem 1.1rem 1.2rem' };
const cardTitle = { margin: 0, fontSize: '1.08rem', color: 'var(--theme-title)' };
const cardLocation = { margin: '0.45rem 0', color: 'var(--theme-faint)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 };
const cardDescription = { margin: '0 0 0.5rem', color: 'var(--theme-muted)', fontSize: 14, lineHeight: 1.5 };

const listCardStyle = {
  display: 'flex',
  position: 'relative',
  background: 'var(--theme-surface)',
  borderRadius: 12,
  overflow: 'hidden',
  border: '1px solid rgba(255,255,255,0.4)',
  marginBottom: 16,
  cursor: 'pointer'
};

const listContentStyle = { padding: '1rem 1.2rem', flex: 1 };
const listTitleStyle = { margin: 0, fontSize: '1.1rem', color: 'var(--theme-title-ink)' };
const listLocationStyle = { margin: '0.4rem 0', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--theme-faint)', fontSize: 13 };
const listDescriptionStyle = { margin: 0, color: 'var(--theme-muted)', lineHeight: 1.5, fontSize: 14 };

export default Attractions;
