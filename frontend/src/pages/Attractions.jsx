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
  const [favs, setFavs] = useState({});

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

  const openAttraction = (a) => navigate(`/attractions/${a.id}`, { state: { attraction: a } });

  if (loading) {
    return (
      <div className="attractions-page">
        <div className="attr-skeleton-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="attr-skeleton-card">
              <div className="skeleton-img" />
              <div style={{ padding: 14 }}>
                <div className="skeleton-line" style={{ height: 12, marginBottom: 8 }} />
                <div className="skeleton-line" style={{ height: 10, width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attractions-page" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div className="attr-error">
          <h3>{t('error')}</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attractions-page">
      <HeroSlideshow
        className="attractions-hero"
        title={t('discover_naujan')}
        subtitle={`${Array.isArray(attractions) ? attractions.length : 0} ${t('attractions')} ${t('in_oriental_mindoro')}`}
        height="470px"
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

      <div className="attr-toolbar">
        <div className="attr-view-toggle">
          <button className={`attr-view-btn${view === 'grid' ? ' attr-view-btn--active' : ''}`} onClick={() => setView('grid')}>{t('view_grid')}</button>
          <button className={`attr-view-btn${view === 'list' ? ' attr-view-btn--active' : ''}`} onClick={() => setView('list')}>{t('view_list')}</button>
        </div>
        <div className="attr-results"><strong>{filteredAttractions.length}</strong>{t('attractions_found_count')}</div>
      </div>

      {filteredAttractions.length === 0 ? (
        <div className="attr-empty">
          <div className="attr-empty-icon"><Icons.Search size={34} /></div>
          <h3 className="attr-empty-title">{t('no_attractions_found')}</h3>
          <p className="attr-empty-sub">{t('no_attractions_try_again')}</p>
        </div>
      ) : view === 'grid' ? (
        <div className="attr-grid">
          {paged.map(a => {
            const rating = parseFloat(a.avg_rating) || 0;
            const reviews = parseInt(a.review_count, 10) || 0;
            return (
              <article key={a.id} className="attr-card" onClick={() => openAttraction(a)}>
                <img src={a.image_url || getAttractionFallbackImage(a)} alt={a.name} className="attr-card-img" loading="lazy" />
                <div className="attr-card-shade" />
                <button
                  type="button"
                  className={`attr-heart${favs[a.id] ? ' attr-heart--on' : ''}`}
                  aria-label="Favorite"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFavs(f => ({ ...f, [a.id]: !f[a.id] }));
                  }}
                >
                  <Icons.Heart size={15} filled={!!favs[a.id]} />
                </button>
                <div className="attr-card-content">
                  <div>
                    <h3 className="attr-card-title">{a.name}</h3>
                    <p className="attr-card-location"><Icons.Location size={12} /> {a.location}</p>
                  </div>
                  <span className="attr-rating-badge">
                    <span className="attr-rating-star">★</span>
                    <span>{rating > 0 ? rating.toFixed(1) : '-'} ({reviews})</span>
                  </span>
                  <span className="attr-glass-btn">
                    <span className="attr-glass-label">{t('view_details')}</span>
                    <span className="attr-glass-chevron"><Icons.ChevronRight size={13} /></span>
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="attr-list">
          {paged.map((a, idx) => {
            const rating = parseFloat(a.avg_rating) || 0;
            const reviews = parseInt(a.review_count, 10) || 0;
            return (
              <div key={a.id} className="attr-list-card" onClick={() => openAttraction(a)}>
                <div className="attr-list-rank">#{(currentPage - 1) * ATTRACTIONS_PER_PAGE + idx + 1}</div>
                <div className="attr-list-media">
                  <img src={a.image_url || getAttractionFallbackImage(a)} alt={a.name} loading="lazy" />
                </div>
                <div className="attr-list-body">
                  <h3 className="attr-list-title">{a.name}</h3>
                  <p className="attr-list-location"><Icons.Location size={13} /> {a.location}</p>
                  <p className="attr-list-desc">{a.description?.substring(0, 180)}{a.description?.length > 180 ? '...' : ''}</p>
                  <div className="attr-list-meta">
                    {rating > 0 && <span className="attr-list-chip"><span className="attr-rating-star">★</span> {rating.toFixed(1)}</span>}
                    {reviews > 0 && <span className="attr-list-chip">{reviews} {t('reviews_label')}</span>}
                    {weatherData[a.id] && (
                      <span className="attr-list-chip attr-list-chip--weather">{weatherData[a.id].temperature}°C • {weatherData[a.id].condition}</span>
                    )}
                  </div>
                  <span className="attr-glass-btn attr-glass-btn--sm">
                    <span className="attr-glass-label">{t('view_details')}</span>
                    <span className="attr-glass-chevron"><Icons.ChevronRight size={13} /></span>
                  </span>
                </div>
              </div>
            );
          })}
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

export default Attractions;