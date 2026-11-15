import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import Icons from '../components/Icons';
import LeafletMap from '../components/LeafletMap';
import WeatherWidget from '../components/WeatherWidget';
import HeroSlideshow from '../components/HeroSlideshow';
import CustomDropdown from '../components/CustomDropdown';
import { getApiBaseUrl, getCsrfToken } from '../api';
import { downloadReportCsv, shareSavedTrip } from '../utils/exportFiles';
import ExportPdfButton from '../components/ExportPdfButton';
import ItineraryArchiveDialog from '../components/ItineraryArchiveDialog';
import useMediaQuery from '../hooks/useMediaQuery';
import { itineraryStopReport, itineraryBudgetReport, itineraryPrintReport } from '../utils/itineraryExports';
import './ItineraryDetail.css';

const API_BASE_URL = getApiBaseUrl();
const EMPTY_STOPS = [];
const dateRangeDays = (start, end) => {
  if (!start || !end) return 0;
  const startMs = Date.parse(`${String(start).slice(0, 10)}T00:00:00Z`);
  const endMs = Date.parse(`${String(end).slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs
    ? Math.min(365, Math.round((endMs - startMs) / 86400000) + 1) : 0;
};
const stopCoordinates = (item) => {
  // The saved stop owns its pin: an admin clearing coordinates must remove it.
  const latValue = item.latitude;
  const lngValue = item.longitude;
  if (latValue === '' || latValue == null || lngValue === '' || lngValue == null) return null;
  const lat = Number(latValue);
  const lng = Number(lngValue);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
};

const csrfHeaders = () => {
  const token = getCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
};

export const TIME_OF_DAY_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

const timeOfDayForMinutes = (minutes) => {
  const m = parseInt(minutes) || 120;
  if (m <= 120) return 'morning';
  if (m <= 240) return 'afternoon';
  return 'evening';
};

const ItineraryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const L = (key, fallback) => {
    try {
      const v = t(key);
      return (typeof v === 'string' && v === key) ? fallback : v;
    } catch (e) {
      return fallback;
    }
  };
  
  const TRANSPORT_MODES = {
    tricycle:   { label: 'ðŸ›º Tricycle',    base: 10, perKm: 2.00 },
    jeepney:    { label: 'ðŸšŒ Jeepney',     base: 13, perKm: 1.80 },
    bus:        { label: 'ðŸš Bus',          base: 15, perKm: 2.65 },
    van:        { label: 'ðŸš Van/FX',       base: 20, perKm: 3.50 },
    motorcycle: { label: 'ðŸï¸ Motorcycle',  base: 8,  perKm: 1.50 },
    car:        { label: 'ðŸš— Private Car',  base: 0,  perKm: 7.00 },
  };

  // Helper function to calculate default fare per day
  const calculateDefaultFarePerDay = (mode = globalTransportMode, itineraryData = null, itemsByDayData = null) => {
    const m = TRANSPORT_MODES[mode];
    if (!m) return 0;
    const dist = parseFloat(itineraryData?.total_distance || itinerary?.total_distance || 0);
    const days = itineraryData?.duration_days || itinerary?.duration_days || (itemsByDayData ? Object.keys(itemsByDayData).length : 1) || 1;
    return Math.ceil(m.base + (dist / Math.max(days, 1)) * m.perKm);
  };

  // Helper function to calculate total estimated budget from statistics
  const calculateTotalEstimatedBudget = (statsData = null) => {
    const stats = statsData || statistics;
    if (!stats || !stats.budget) return 0;
    return stats.budget.reduce((sum, cat) => sum + parseFloat(cat.estimated_total || 0), 0);
  };

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, plan, budget, weather
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [mobilePlanView, setMobilePlanView] = useState('list');
  const stopRefs = useRef({});
  useEffect(() => {
    if (activeTab === 'plan' && mobilePlanView === 'list' && selectedStopId != null) {
      stopRefs.current[selectedStopId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTab, mobilePlanView, selectedStopId]);
  const [statistics, setStatistics] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [navTarget, setNavTarget] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [activeTooltip, setActiveTooltip] = useState(null);
  const gpsWatchIdRef = useRef(null);
  const [budgetAssumptions, setBudgetAssumptions] = useState({
    foodPerDay: 300,
    otherPerDay: 100
  });
  // Restore saved assumptions (including farePerDay) when itinerary loads
  const assumptionsRestoredRef = useRef(false);
  const [globalTransportMode, setGlobalTransportMode] = useState('jeepney');
  const [farePerDay, setFarePerDay] = useState(null);
  const [serverBreakdown, setServerBreakdown] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const archiveRequestRef = useRef(false);
  
  useEffect(() => {
    setShowArchiveDialog(false);
    setArchiveError('');
    setSelectedDay(1);
    setSelectedStopId(null);
    loadItinerary();
    loadStatistics();
    getUserLocation();
  }, [id]);

  useEffect(() => {
    return () => {
      if (navigator.geolocation && gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, []);
  
  const loadItinerary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/${id}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setItinerary(data);
        if (!assumptionsRestoredRef.current && data.budget_assumptions) {
          assumptionsRestoredRef.current = true;
          const saved = typeof data.budget_assumptions === 'string'
            ? JSON.parse(data.budget_assumptions)
            : data.budget_assumptions;
          if (saved.foodPerDay != null || saved.otherPerDay != null) {
            setBudgetAssumptions(prev => ({
              ...prev,
              ...(saved.foodPerDay != null && { foodPerDay: saved.foodPerDay }),
              ...(saved.otherPerDay != null && { otherPerDay: saved.otherPerDay }),
            }));
          }
          if (saved.farePerDay != null) setFarePerDay(saved.farePerDay);
        }
      } else {
        alert(t('failed_load_itinerary'));
        navigate('/itinerary');
      }
    } catch (error) {
      console.error('Error loading itinerary:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/${id}/statistics`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };
  
  const updateItineraryStatus = async (newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setItinerary(prev => ({ ...prev, status: newStatus }));
        alert(t('status_updated_successfully'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  const markItemComplete = async (itemId, completed) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/${id}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        credentials: 'include',
        body: JSON.stringify({ completed })
      });
      
      if (response.ok) {
        // Update local state
        setItinerary(prev => ({
          ...prev,
          items: (prev.items || []).map(item =>
            String(item.id) === String(itemId) ? { ...item, completed } : item
          )
        }));
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };
  
  const shareItinerary = async () => {
    try {
      const result = await shareSavedTrip({ id, name: itinerary.name });
      if (result === 'copied') alert('Saved itinerary link copied. Existing access permissions still apply.');
      if (result === 'unavailable') alert('Sharing is unavailable in this browser. Copy this pageâ€™s address instead.');
    } catch (error) {
      console.error('Error sharing itinerary:', error);
      alert(t('error_sharing_itinerary'));
    }
  };
  
  const recalculateBudget = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/${id}/recalculate-budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          farePerDay: farePerDay !== null ? farePerDay : 0,
          foodPerDay: parseFloat(budgetAssumptions.foodPerDay) || 0,
          otherPerDay: parseFloat(budgetAssumptions.otherPerDay) || 0
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setItinerary(prev => ({ ...prev, total_budget: data.total_budget }));
        alert(`${t('budget_recalculated')}: â‚±${data.total_budget.toFixed(2)}`);
        loadStatistics(); // Reload statistics

        // Fetch server-side per-day breakdown with current assumptions
        try {
          const breakdownResp = await fetch(`${API_BASE_URL}/api/itinerary/${id}/budget-breakdown?farePerDay=${encodeURIComponent(farePerDay !== null ? farePerDay : 0)}&foodPerDay=${encodeURIComponent(budgetAssumptions.foodPerDay || 0)}&otherPerDay=${encodeURIComponent(budgetAssumptions.otherPerDay || 0)}`, {
            credentials: 'include'
          });

          if (breakdownResp.ok) {
            const bd = await breakdownResp.json();
            setServerBreakdown(bd);
          }
        } catch (err) {
          console.warn('Failed to fetch server budget breakdown', err);
        }
      } else {
        alert(t('failed_recalculate_budget'));
      }
    } catch (error) {
      console.error('Error recalculating budget:', error);
      alert(t('error_recalculating_budget'));
    }
  };
  
  
  const deleteItinerary = async () => {
    if (archiveRequestRef.current) return;
    archiveRequestRef.current = true;
    setArchiving(true);
    setArchiveError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/${id}`, {
        method: 'DELETE',
        headers: csrfHeaders(),
        credentials: 'include'
      });
      
      if (response.ok) {
        setShowArchiveDialog(false);
        navigate('/itinerary');
      } else setArchiveError(L('failed_archive_itinerary', 'Could not archive this itinerary. Please try again.'));
    } catch (error) {
      console.error('Error archiving itinerary:', error);
      setArchiveError(L('failed_archive_itinerary', 'Could not archive this itinerary. Please try again.'));
    } finally { archiveRequestRef.current = false; setArchiving(false); }
  };
  
  const getUserLocation = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError(t('geolocation_not_supported') || 'Geolocation not supported');
      return;
    }
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setGpsError(t('gps_requires_https') || 'GPS requires HTTPS');
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
      setGpsLoading(false);
      setGpsError('');
    };
    const handleError = (error) => {
      setGpsLoading(false);
      const msgs = {
        1: t('gps_permission_denied') || 'Permission denied',
        2: t('gps_position_unavailable') || 'Position unavailable',
        3: t('gps_timeout') || 'Timeout',
      };
      setGpsError(msgs[error.code] || `Location error: ${error.message}`);
    };

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, gpsOptions);
  };
  
  const handleRouteToAttraction = (item) => {
    if (!userLocation) {
      alert(t('please_enable_location') || 'Please enable location services first');
      return;
    }
    
    const coords = stopCoordinates(item);
    if (!coords) {
      alert(t('invalid_coordinates') || 'This location does not have valid coordinates');
      return;
    }
    
    setNavTarget({
      ...coords,
      name: item.custom_name || item.attraction_name
    });
    setSelectedDay(Number(item.day_number) || 1);
    setSelectedStopId(item.id);
    setMobilePlanView('map');
    setActiveTab('plan');
  };
  
  const handleRoutingChange = (info) => {
    setRouteInfo(info);
  };

  const normalizedItems = useMemo(() => {
    const sourceItems = itinerary?.items || [];
    if (sourceItems.length === 0) return [];

    const hasExplicitMultiDay = sourceItems.some((item) => {
      const day = Number.parseInt(item.day_number, 10);
      return !Number.isNaN(day) && day > 1;
    });

    if (hasExplicitMultiDay) {
      return sourceItems;
    }

    // Legacy fallback: infer day breaks from reset/non-increasing order_sequence values.
    let inferredDay = 1;
    let previousOrder = null;
    return sourceItems.map((item, index) => {
      const currentOrder = Number.parseInt(item.order_sequence, 10);
      if (
        index > 0
        && !Number.isNaN(currentOrder)
        && previousOrder !== null
        && currentOrder <= previousOrder
      ) {
        inferredDay += 1;
      }

      if (!Number.isNaN(currentOrder)) {
        previousOrder = currentOrder;
      }

      return {
        ...item,
        day_number: inferredDay
      };
    });
  }, [itinerary?.items]);

  // Completed items count for progress bar
  const completedCount = useMemo(() => (itinerary?.items || []).filter(i => i.completed).length, [itinerary?.items]);
  const totalCount = (itinerary?.items || []).length;

  // Group items by day from flat array (use order_sequence as fallback)
  const itemsByDay = useMemo(() => {
    const grouped = {};
    normalizedItems.forEach(item => {
      const parsedDay = Number.parseInt(item.day_number, 10);
      const day = Number.isNaN(parsedDay) || parsedDay < 1 ? 1 : parsedDay;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(item);
    });
    Object.values(grouped).forEach(items => items.sort((a, b) => (Number(a.order_in_day ?? a.order_sequence) || 0) - (Number(b.order_in_day ?? b.order_sequence) || 0)));
    return grouped;
  }, [normalizedItems]);

  const dayNumbers = Array.from({ length: Math.max(1, Number(itinerary?.duration_days) || 0, dateRangeDays(itinerary?.start_date, itinerary?.end_date), ...Object.keys(itemsByDay).map(Number)) }, (_, i) => i + 1);
  const dayItems = itemsByDay[selectedDay] || EMPTY_STOPS;
  const selectDay = (day) => {
    setSelectedDay(day);
    setSelectedStopId(null);
    setNavTarget(null);
    setRouteInfo(null);
  };

  const dayBreakdown = useMemo(() => {
    const durationDays = dayNumbers.length;
    const perDayBudget = durationDays > 0 ? (parseFloat(itinerary?.total_budget || 0) / durationDays) : 0;
    const mode = TRANSPORT_MODES[globalTransportMode] || TRANSPORT_MODES.jeepney;
    const totalDist = parseFloat(itinerary?.total_distance || 0);
    const kmPerDay = durationDays > 0 ? totalDist / durationDays : 20;
    const suggestedFare = Math.ceil(mode.base + kmPerDay * mode.perKm);
    const resolvedFare = farePerDay !== null ? farePerDay : suggestedFare;
    const foodPerDayVal = Number(budgetAssumptions.foodPerDay) || 0;
    const otherPerDayVal = Number(budgetAssumptions.otherPerDay) || 0;

    const days = Array.from({ length: durationDays }, (_, i) => i + 1);
    const breakdown = days.map(day => {
      const fareCost = resolvedFare;
      const foodCost = foodPerDayVal;
      const otherCost = otherPerDayVal;
      const attractionCost = (itemsByDay[day] || []).reduce((sum, item) => sum + (parseFloat(item.estimated_cost) || 0), 0);
      const estimatedNeed = fareCost + foodCost + otherCost + attractionCost;
      const balance = perDayBudget - estimatedNeed;
      const fits = balance >= 0;
      return { day, dayBudget: perDayBudget, fareCost, foodCost, otherCost, attractionCost, estimatedNeed, balance, fits };
    });

    return { perDayBudget, days: durationDays, breakdown };
  }, [itemsByDay, itinerary, budgetAssumptions, globalTransportMode, farePerDay, dayNumbers.length]);

  const displayedBreakdown = serverBreakdown?.breakdown || dayBreakdown.breakdown;

  const toggleCategoryFilter = (category) => {
    if (!category) return setActiveCategoryFilter(null);
    setActiveCategoryFilter(prev => prev === category ? null : category);
  };

  // Helper component for tooltips
  const Tooltip = ({ id, text }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{...styles.helpIcon, ...(activeTooltip === id ? styles.helpIconHover : {})}}
        onMouseEnter={() => setActiveTooltip(id)}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        ?
      </div>
      {activeTooltip === id && (
        <div style={styles.tooltip}>
          {text}
          <div style={styles.tooltipArrow} />
        </div>
      )}
    </div>
  );

  const allMarkers = dayItems.map((item, index) => {
    const coords = stopCoordinates(item);
    if (!coords) return null;
    return {
      id: item.id, ...coords,
      iconHtml: `<span class="itin-map-pin${selectedStopId === item.id ? ' is-selected' : ''}">${index + 1}</span>`
    };
  }).filter(Boolean);

  const autoRouteWaypoints = useMemo(() => {
    const points = [];

    if (navTarget && userLocation) {
      return [{ lat: userLocation[0], lng: userLocation[1] }, { lat: navTarget.lat, lng: navTarget.lng }];
    }

    dayItems.forEach((item) => {
      const coords = stopCoordinates(item);

      if (coords) {
        points.push({
          ...coords,
          name: item.custom_name || item.attraction_name
        });
      }
    });

    return points;
  }, [dayItems, navTarget, userLocation]);
  
  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>{t('loading_itinerary')}</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div style={styles.error}>
        <h2>Itinerary not found</h2>
        <button onClick={() => navigate('/itinerary')} style={styles.backBtn}>
          â† Back to Itineraries
        </button>
      </div>
    );
  }

  return (
    <div style={styles.page} className="itinerary-detail-page">
  
  {/* Hero Header */}
  <HeroSlideshow 
        title={itinerary.name}
        subtitle={itinerary.description}
        height="400px"
        showControls={false}
      />

      {/* Metadata Bar with Back Button */}
      <div style={styles.metadataBar}>
        <div style={styles.metadataHeader}>
          <button onClick={() => navigate('/itinerary')} style={styles.breadcrumbLink}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            {t('back')}
          </button>
        </div>
        <div style={styles.metadataContent}>
          <span style={styles.statusBadge(itinerary.status)}>
            {t(itinerary.status) || itinerary.status}
          </span>
          <span style={styles.metaText}>{t('created_by')} {itinerary.creator_name}</span>
          {itinerary.start_date && (
            <span style={styles.metaText}>
              <Icons.CalendarIcon size={14} color="#666" style={{marginRight: '0.5rem'}} />
              {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      {/* Stats Bar */}
      <div style={styles.statsBar} className="itin-stats">
        <div style={styles.statCard}>
          <Icons.MapIcon size={18} color="#2e7d32" />
          <div>
            <div style={styles.statLabel}>{t('total_distance')}</div>
            <div style={styles.statValue}>{itinerary.total_distance || 0} km</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <Icons.ClockIcon size={18} color="#f59e0b" />
          <div>
            <div style={styles.statLabel}>{t('duration')}</div>
            <div style={styles.statValue}>
              {Math.floor((itinerary.total_time || 0) / 60)}h {(itinerary.total_time || 0) % 60}m
            </div>
          </div>
        </div>
        <div style={styles.statCard}>
          <Icons.MoneyIcon size={18} color="#f59e0b" />
          <div>
            <div style={styles.statLabel}>{t('budget')}</div>
            <div style={styles.statValue}>â‚±{(parseFloat(itinerary.total_budget) || 0).toFixed(2)}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <Icons.LocationIcon size={18} color="#2e7d32" />
          <div>
            <div style={styles.statLabel}>{t('destinations')}</div>
            <div style={styles.statValue}>{itinerary.items?.length || 0}</div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div style={{...styles.tabs, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}} className="itin-tabs">
        <div style={{display: 'flex', gap: '0'}}>
          <button
            style={activeTab === 'overview' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('overview')}
          >
            <Icons.MenuIcon size={16} />
            {t('overview')}
          </button>
          <button
            style={activeTab === 'plan' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('plan')}
          >
            <Icons.CalendarIcon size={16} />
            Trip Plan
          </button>
          <button
            style={activeTab === 'budget' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('budget')}
          >
            <Icons.MoneyIcon size={16} />
            {t('budget')}
          </button>
          <button
            style={activeTab === 'weather' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('weather')}
          >
            <Icons.SparklesIcon size={16} />
            Weather
          </button>
        </div>
        <div style={{paddingRight: '1.5rem'}}>
          <Tooltip id="tabs-help" text="Overview: Trip summary Â· Trip Plan: Daily stops and map Â· Budget: Spending breakdown Â· Weather: Forecasts at each stop" />
        </div>
      </div>
      
      {/* Progress bar for in-progress itineraries */}
      {itinerary.status === 'in-progress' && totalCount > 0 && (
        <div style={styles.progressBarWrap}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>Trip Progress</span>
            <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700 }}>{completedCount} / {totalCount} stops completed</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${Math.round((completedCount / totalCount) * 100)}%` }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.35rem' }}>{Math.round((completedCount / totalCount) * 100)}% done</div>
        </div>
      )}

      {/* Content */}
      <div style={styles.content} className="itin-content">
        {activeTab === 'overview' && (
          <div style={styles.overviewContent} className="itin-overview">
            <div style={styles.mainColumn} className="itin-main-column">
              <div style={styles.card} className="itin-panel">
                <h2>At a glance</h2>
                <p className="itin-plan-hint">Choose a day below to see its stops and route together in Trip Plan.</p>
                <div className="itin-overview-days">
                  {dayNumbers.slice(0, 6).map((day) => {
                    const stops = itemsByDay[day] || EMPTY_STOPS;
                    const cost = stops.reduce((sum, stop) => sum + (Number(stop.estimated_cost) || 0), 0);
                    return <button key={day} type="button" className="itin-overview-day" onClick={() => { selectDay(day); setActiveTab('plan'); }}>
                      <strong>Day {day} <span>Â· {stops.length} {stops.length === 1 ? 'stop' : 'stops'}</span></strong>
                      <span>{stops.length ? stops.map((stop) => stop.custom_name || stop.attraction_name || 'Stop').slice(0, 2).join(' Â· ') + (stops.length > 2 ? ' â€¦' : '') : 'No stops planned yet'}</span>
                      <small>Attractions: â‚±{cost.toFixed(2)} Â· View day â†’</small>
                    </button>;
                  })}
                  {dayNumbers.length > 6 && <button type="button" className="itin-overview-day" onClick={() => setActiveTab('plan')}>Explore all {dayNumbers.length} days in Trip Plan →</button>}
                </div>
              </div>

            </div>
            
            <div style={styles.sidebar} className="itin-sidebar">
              <div style={styles.card} className="itin-panel itin-actions-panel">
                <h3>{t('quick_actions')}</h3>
                <div className="itin-quick-actions">
                <CustomDropdown
                  value={itinerary.status}
                  fullWidth
                  triggerStyle={styles.statusSelect}
                  options={[
                    { value: 'draft', label: t('draft'), color: '#9ca3af' },
                    { value: 'planned', label: t('planned'), color: '#3b82f6' },
                    { value: 'in-progress', label: t('in_progress'), color: '#f59e0b' },
                    { value: 'completed', label: t('completed'), color: '#16a34a' },
                    { value: 'cancelled', label: t('cancelled'), color: '#ef4444' },
                  ]}
                  onChange={(val) => updateItineraryStatus(val)}
                />
                
                <button style={styles.quickActionBtn} onClick={() => {
                  navigate('/itinerary', { state: { editItinerary: itinerary, itineraryId: id, globalTransportMode } });
                }}>
                  <Icons.PencilIcon size={14} /> {t('edit_itinerary')}
                </button>
                <button style={styles.quickActionBtn} onClick={shareItinerary}>
                  <Icons.UploadIcon size={14} /> {t('share_with_friends')}
                </button>
                <ExportPdfButton style={styles.quickActionBtn} getReport={() => itineraryPrintReport({ itinerary, items: normalizedItems, budget: displayedBreakdown })} />
                <button style={styles.quickActionBtn} onClick={() => downloadReportCsv(itineraryStopReport({ itinerary, items: normalizedItems }))}>
                  <Icons.ArchiveIcon size={14} /> Export stops CSV
                </button>
                <button style={styles.quickActionBtnDelete} onClick={() => { setArchiveError(''); setShowArchiveDialog(true); }}>
                  <Icons.ArchiveIcon size={14} /> {t('delete_itinerary')}
                </button>
                </div>
              </div>
              
              <div style={styles.card} className="itin-panel itin-summary-panel">
                <div className="itin-summary-heading" style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem'}}>
                  <Icons.ChartPieIcon size={18} color="#2e7d32" />
                  <h3>{t('trip_summary')}</h3>
                </div>
                <div style={styles.summaryItem}>
                  <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <Icons.CalendarIcon size={16} color="#666" />
                    {t('duration')}
                  </span>
                  <strong>{itinerary.duration_days || Object.keys(itemsByDay).length} {(itinerary.duration_days || Object.keys(itemsByDay).length) === 1 ? t('day') : t('days')}</strong>
                </div>
                <div style={styles.summaryItem}>
                  <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <Icons.LocationIcon size={16} color="#666" />
                    Destinations
                  </span>
                  <strong>{(itinerary.items || []).length}</strong>
                </div>
                <div style={styles.summaryItem}>
                  <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <Icons.MapIcon size={16} color="#666" />
                    {t('distance')}
                  </span>
                  <strong>{itinerary.total_distance || 0} km</strong>
                </div>
                <div style={styles.summaryItem}>
                  <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <Icons.MoneyIcon size={16} color="#666" />
                    {t('budget')}
                  </span>
                  <strong>â‚±{parseFloat(itinerary.total_budget || 0).toFixed(2)}</strong>
                </div>
              </div>
              
              {itinerary.collaborators && itinerary.collaborators.length > 0 && (
                <div style={styles.card} className="itin-panel">
                  <h3>{t('collaborators')}</h3>
                  {itinerary.collaborators.map(collab => (
                    <div key={collab.collaborator_id} style={styles.collaboratorItem}>
                      <strong>{collab.username}</strong>
                      <span style={styles.roleBadge}>{t(`${collab.role}_role`) || collab.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'plan' && (
          <div className="itin-plan">
            <div className="itin-plan-header itin-panel" style={styles.card}>
              <div>
                <h2>Trip Plan</h2>
                <p className="itin-plan-hint">Stops and map pins follow the same saved day and order.</p>
              </div>
              <label className="itin-plan-day-select">Choose a day
                <select value={selectedDay} onChange={(e) => selectDay(Number(e.target.value))}>
                  {dayNumbers.map((day) => <option key={day} value={day}>Day {day} Â· {(itemsByDay[day] || EMPTY_STOPS).length} stops</option>)}
                </select>
              </label>
              <div className="itin-plan-mobile-switch" role="group" aria-label="Trip plan view">
                <button type="button" aria-pressed={mobilePlanView === 'list'} onClick={() => setMobilePlanView('list')}>List</button>
                <button type="button" aria-pressed={mobilePlanView === 'map'} onClick={() => setMobilePlanView('map')}>Map</button>
              </div>
            </div>
            <div className="itin-plan-grid">
              {(!isMobile || mobilePlanView === 'list') && <div className="itin-plan-stops itin-panel" style={styles.card}>
                <h3>Day {selectedDay} Â· {dayItems.length} {dayItems.length === 1 ? 'stop' : 'stops'}</h3>
                {activeCategoryFilter && <button type="button" className="itin-clear-filter" onClick={() => setActiveCategoryFilter(null)}>Clear budget category filter Ã—</button>}
                {!dayItems.length && <p className="itin-plan-hint">No stops planned for this day.</p>}
                {dayItems.map((item, index) => {
                  const coords = stopCoordinates(item);
                  const selected = selectedStopId === item.id;
                  const dimmed = activeCategoryFilter && activeCategoryFilter !== (item.cost_category || item.costCategory || 'uncategorized');
                  const name = item.custom_name || item.attraction_name || 'Unnamed stop';
                  return <div key={item.id || index} ref={(element) => { if (item.id) stopRefs.current[item.id] = element; }} className={`itin-plan-stop${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}>
                    <button type="button" className="itin-plan-stop-main" aria-pressed={selected} onClick={() => { setSelectedStopId(item.id); setNavTarget(null); setRouteInfo(null); if (isMobile && coords) setMobilePlanView('map'); }}>
                      <span className="itin-plan-number">{index + 1}</span>
                      <span className="itin-plan-stop-text"><strong>{name}</strong><small>{item.start_time ? String(item.start_time).slice(0, 5) : 'Time not set'} Â· {Number(item.duration_minutes || item.estimated_duration) || 0} min</small><small>{item.custom_location || item.attraction_location || 'Location not specified'}{!coords && ' Â· Not shown on map'}</small></span>
                    </button>
                    <div className="itin-plan-stop-footer">
                      {item.estimated_cost > 0 && <span>Est. â‚±{Number(item.estimated_cost).toFixed(2)}</span>}
                      {itinerary.status === 'in-progress' && <label><input type="checkbox" checked={!!item.completed} onChange={(e) => markItemComplete(item.id, e.target.checked)} /> Completed</label>}
                      {coords && <button type="button" onClick={() => { setSelectedStopId(item.id); setMobilePlanView('map'); handleRouteToAttraction(item); }}>Directions</button>}
                    </div>
                    {item.notes && <p className="itin-plan-note">{item.notes}</p>}
                    {item.booking_reference && <p className="itin-plan-note">Booking: {item.booking_reference}</p>}
                  </div>;
                })}
              </div>}
              {(!isMobile || mobilePlanView === 'map') && <div className="itin-plan-map itin-panel" style={styles.card}>
                <div className="itin-plan-map-heading"><h3>Day {selectedDay} map</h3><button type="button" onClick={getUserLocation} disabled={gpsLoading}>{gpsLoading ? 'Getting locationâ€¦' : userLocation ? 'Refresh GPS' : 'Enable GPS'}</button></div>
                {gpsError && <p className="itin-plan-error" role="alert">{gpsError}</p>}
                {navTarget && <div className="itin-plan-directions"><strong>Route to {navTarget.name}</strong>{routeInfo && <span> Â· {routeInfo.distance} km Â· about {routeInfo.duration} min</span>}<button type="button" onClick={() => { setNavTarget(null); setRouteInfo(null); }}>Clear</button></div>}
                {allMarkers.length ? <LeafletMap
                  center={navTarget ? [navTarget.lat, navTarget.lng] : selectedStopId && allMarkers.find((marker) => marker.id === selectedStopId) ? [allMarkers.find((marker) => marker.id === selectedStopId).lat, allMarkers.find((marker) => marker.id === selectedStopId).lng] : [allMarkers[0].lat, allMarkers[0].lng]}
                  focusKey={`${selectedDay}:${selectedStopId || ''}`}
                  zoom={12}
                  markers={allMarkers}
                  onMarkerClick={(marker) => { setSelectedStopId(marker.id); setNavTarget(null); setRouteInfo(null); if (isMobile) setMobilePlanView('list'); }}
                  userLocation={userLocation}
                  autoRouteWaypoints={autoRouteWaypoints}
                  onRoutingChange={handleRoutingChange}
                  style={{ height:'420px', borderRadius:'12px' }}
                /> : <p className="itin-plan-hint">No map pins for this day. Stops without coordinates are still shown in the list.</p>}
                <p className="itin-plan-hint">Route lines and travel estimates depend on available map data; confirm travel times locally.</p>
              </div>}
            </div>
          </div>
        )}
        
        {activeTab === 'budget' && (
          <div style={styles.budgetContent}>
            {!statistics && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                <Icons.MoneyIcon size={32} color="#d1d5db" />
                <p style={{ marginTop: '0.75rem' }}>Budget statistics are loading or unavailable. You can still use the per-day breakdown below.</p>
              </div>
            )}
            {statistics && <div style={styles.card}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h2>{t('budget_breakdown')}</h2>
              </div>
              
              {(() => {
                const totalNeed = dayBreakdown.breakdown.reduce((s, d) => s + d.estimatedNeed, 0);
                const totalBudget = parseFloat(itinerary.total_budget) || 0;
                const balance = totalBudget - totalNeed;
                return (
                  <div style={styles.budgetSummary}>
                    <div style={styles.budgetItem}>
                      <span>{t('total_budget')}</span>
                      <strong>â‚±{totalBudget.toFixed(2)}</strong>
                    </div>
                    <div style={styles.budgetItem}>
                      <span>Est. Total Need</span>
                      <strong style={{ color: totalNeed > totalBudget ? '#dc2626' : '#16a34a' }}>â‚±{totalNeed.toFixed(2)}</strong>
                    </div>
                    <div style={styles.budgetItem}>
                      <span>Balance</span>
                      <strong style={{ color: balance >= 0 ? '#16a34a' : '#dc2626' }}>{balance >= 0 ? '+' : ''}â‚±{balance.toFixed(2)}</strong>
                    </div>
                    {itinerary.actual_cost > 0 && (
                      <div style={styles.budgetItem}>
                        <span>{t('actual_cost')}</span>
                        <strong>â‚±{(itinerary.actual_cost).toFixed(2)}</strong>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{marginTop: '0.75rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={styles.budgetActionHeader}>Budget actions</span>
                  <Tooltip id="budget-actions" text="Refresh totals recalculates the total budget from items and daily assumptions. Save assumptions remembers your fare, food, and other daily estimates." />
                </div>
                <div style={styles.budgetActionGrid}>
                <button
                  onClick={recalculateBudget}
                  style={styles.budgetActionBtn}
                  title="Recalculates total budget from all items and daily budget assumptions (fare, food, other)">
                  <Icons.ChartLineUpIcon size={14} /> Refresh totals
                </button>
                <button
                  onClick={async () => {
                    try {
                      const resp = await fetch(`${API_BASE_URL}/api/itinerary/${id}/save-assumptions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
                        credentials: 'include',
                        body: JSON.stringify({
                          ...budgetAssumptions,
                          ...(farePerDay !== null && { farePerDay })
                        })
                      });
                      if (resp.ok) {
                        const j = await resp.json();
                        alert(t('assumptions_saved') || 'Assumptions saved');
                        setItinerary(prev => ({ ...prev, budget_assumptions: j.assumptions }));
                      } else {
                        alert(t('failed_save_assumptions') || 'Failed to save assumptions');
                      }
                    } catch (err) {
                      console.error(err);
                      alert(t('error_saving_assumptions') || 'Error saving assumptions');
                    }
                  }}
                  style={styles.budgetActionBtn}>
                  <Icons.CheckIcon size={14} /> Save assumptions
                </button>
                <button
                  onClick={() => downloadReportCsv(itineraryBudgetReport(displayedBreakdown, itinerary.name))}
                  style={styles.budgetActionBtn}>
                  <Icons.ArchiveIcon size={14} /> Export CSV
                </button>
                <ExportPdfButton style={styles.budgetActionBtn} getReport={() => ({ ...itineraryBudgetReport(displayedBreakdown, itinerary.name), subtitle: itinerary.name })} />
              </div>
              </div>

              <div style={styles.budgetToolCaption}>
                <strong>Budget tools:</strong> Refresh totals updates the saved itinerary budget from its items. Save assumptions remembers your fare, food, and other daily estimates for this itinerary. Export CSV downloads the day-by-day budget table.
              </div>

              <div style={styles.budgetSubsection}>
                <h3 style={styles.budgetSubsectionTitle}>{L('per_day_budget_fit','Per-day Budget Fit')}</h3>

                {/* Fare suggestion cards */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#d97706', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.MoneyIcon size={13} color="#d97706" /> Suggested Fare Estimate Â· click a card to pre-fill
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {[
                      { key: 'tricycle',   label: 'Tricycle',    color: '#d97706', bg: '#fef3c7', note: 'Negotiate fare' },
                      { key: 'jeepney',    label: 'Jeepney',     color: '#0891b2', bg: '#cffafe', note: 'Fixed route' },
                      { key: 'bus',        label: 'Bus',         color: '#7c3aed', bg: '#ede9fe', note: 'Long distance' },
                      { key: 'motorcycle', label: 'Habal-habal', color: '#16a34a', bg: '#dcfce7', note: 'Flexible route' },
                    ].map(v => {
                      const mode = TRANSPORT_MODES[v.key];
                      const dist = parseFloat(itinerary?.total_distance || 0);
                      const days = itinerary?.duration_days || Object.keys(itemsByDay).length || 1;
                      const kmPerDay = days > 0 ? dist / days : 20;
                      const low  = Math.ceil(mode.base + kmPerDay * mode.perKm);
                      const high = Math.ceil(mode.base + kmPerDay * mode.perKm * 1.4);
                      const isSelected = globalTransportMode === v.key;
                      return (
                        <div key={v.key} onClick={() => { setGlobalTransportMode(v.key); setFarePerDay(null); }}
                          style={{ position: 'relative', overflow: 'hidden', padding: '0.65rem 0.6rem 0.65rem 0.85rem', borderRadius: '10px', background: '#fff', border: isSelected ? `2px solid ${v.color}` : '1px solid #fde68a', boxShadow: isSelected ? `0 0 0 3px ${v.color}22` : 'none', cursor: 'pointer' }}
                        >
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: v.color, borderRadius: '10px 0 0 10px' }} />
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>{v.label}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: v.color, marginTop: '0.1rem' }}>â‚±{low}â€“â‚±{high}</div>
                          <div style={{ fontSize: '0.65rem', color: isSelected ? v.color : '#9ca3af', marginTop: '0.1rem' }}>{isSelected ? 'âœ“ Pre-filling fare' : v.note}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 0.75rem', display: 'flex', gap: '0.4rem' }}>
                    <Icons.InfoIcon size={12} color="#d97706" />
                    Tricycle fares in Naujan are often negotiated. Always agree on the fare before boarding.
                  </div>
                </div>

                <div style={{ ...styles.assumptionGrid, gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
                  <div style={styles.assumptionField}>
                    <label style={styles.assumptionLabel}>ðŸšŒ Fare / Day</label>
                    <input type="number" min="0"
                      value={farePerDay !== null ? farePerDay : calculateDefaultFarePerDay()}
                      onChange={e => setFarePerDay(parseFloat(e.target.value) || 0)}
                      style={styles.assumptionInput}
                    />
                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{farePerDay !== null ? 'Manual' : 'âš¡ Auto-suggested'}</span>
                  </div>
                  <div style={styles.assumptionField}>
                    <label style={styles.assumptionLabel}>{L('food_per_day','Food / Day')}</label>
                    <input type="number" value={budgetAssumptions.foodPerDay} onChange={e => setBudgetAssumptions(prev => ({ ...prev, foodPerDay: e.target.value }))} style={styles.assumptionInput} />
                  </div>
                  <div style={styles.assumptionField}>
                    <label style={styles.assumptionLabel}>{L('other_per_day','Other / Day')}</label>
                    <input type="number" value={budgetAssumptions.otherPerDay} onChange={e => setBudgetAssumptions(prev => ({ ...prev, otherPerDay: e.target.value }))} style={styles.assumptionInput} />
                  </div>
                </div>

                <div style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '2px solid #f0f0f0'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem'}}>
                    <h3 style={{margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f2937'}}>Day-by-Day Budget Breakdown</h3>
                    <Tooltip id="breakdown-help" text="Shows what you need to spend each day: Transportation (Fare) + Attraction Entries + Food + Other costs. Compare with your Daily Budget to see if you're within budget." />
                  </div>

                  {displayedBreakdown.map(d => (
                    <div key={d.day} style={{...styles.perDayRow, marginBottom: '0.75rem'}} className="itin-day-row">
                      <div style={{flex: 1}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                          <strong style={{fontSize: '1rem', color: '#1f2937'}}>{L('day','Day')} {d.day}</strong>
                          <span style={{fontSize: '0.85rem', color: '#666', backgroundColor: '#f5f5f5', padding: '0.35rem 0.65rem', borderRadius: '12px'}}>
                            {d.fits ? 'âœ“ Within budget' : 'âš  Over budget'}
                          </span>
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem'}}>
                          <div style={{padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7'}}>
                            <div style={{fontSize: '0.8rem', color: '#22863a', fontWeight: 600}}>ðŸšŒ Transport</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem'}}>â‚±{(d.fareCost || 0).toFixed(0)}</div>
                          </div>
                          
                          <div style={{padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a'}}>
                            <div style={{fontSize: '0.8rem', color: '#92400e', fontWeight: 600}}>ðŸŽŸï¸ Attractions</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#d97706', marginTop: '0.25rem'}}>â‚±{(d.attractionCost || 0).toFixed(0)}</div>
                          </div>
                          
                          <div style={{padding: '0.75rem', backgroundColor: '#e0e7ff', borderRadius: '8px', border: '1px solid #c7d2fe'}}>
                            <div style={{fontSize: '0.8rem', color: '#3730a3', fontWeight: 600}}>ðŸ½ï¸ Food</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#4f46e5', marginTop: '0.25rem'}}>â‚±{(d.foodCost || 0).toFixed(0)}</div>
                          </div>
                          
                          <div style={{padding: '0.75rem', backgroundColor: '#f3e8ff', borderRadius: '8px', border: '1px solid #e9d5ff'}}>
                            <div style={{fontSize: '0.8rem', color: '#6b21a8', fontWeight: 600}}>âœ¨ Other</div>
                            <div style={{fontSize: '1.1rem', fontWeight: 700, color: '#a855f7', marginTop: '0.25rem'}}>â‚±{(d.otherCost || 0).toFixed(0)}</div>
                          </div>
                        </div>

                        <div style={{marginTop: '0.75rem', padding: '0.85rem', backgroundColor: '#ecfdf3', borderRadius: '8px', border: '2px solid #bbf7d0'}}>
                          <div style={{fontSize: '0.8rem', color: '#166534', fontWeight: 600}}>Total You Need This Day</div>
                          <div style={{fontSize: '1.35rem', fontWeight: 900, color: '#15803d', marginTop: '0.2rem'}}>â‚±{(d.estimatedNeed || 0).toFixed(0)}</div>
                        </div>
                      </div>

                      <div style={{width: '200px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem'}}>
                        <div>
                          <div style={{fontSize: '0.75rem', color: '#999', marginBottom: '0.3rem', fontWeight: 600}}>YOUR BUDGET THIS DAY</div>
                          <strong style={{fontSize: '1.25rem', color: '#1f2937'}}>â‚±{(d.dayBudget || 0).toFixed(0)}</strong>
                        </div>
                        <div style={{padding: '0.5rem', backgroundColor: d.fits ? '#e7f6e9' : '#fbe4e6', borderRadius: '6px'}}>
                          <span style={{fontSize: '0.75rem', fontWeight: 700, color: d.fits ? '#16a34a' : '#dc2626'}}>
                            {d.fits ? `âœ“ â‚±${Math.abs(d.balance || 0).toFixed(0)} extra` : `âœ— â‚±${Math.abs(d.balance || 0).toFixed(0)} short`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* By Category section */}
              {(() => {
                const totalEstimated = calculateTotalEstimatedBudget();
                const totalBudget = parseFloat(itinerary.total_budget) || 0;
                const catColors = ['#2e7d32','#0891b2','#7c3aed','#d97706','#dc2626','#0d9488','#9333ea','#ea580c'];
                const overBudget = totalEstimated > totalBudget;
                return (
                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #f0f0f0' }}>
                    {/* Section header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Icons.ChartPieIcon size={18} color="#2e7d32" />
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a1a1a' }}>Spending by Category</span>
                        <Tooltip id="spending-category" text="Groups spending by category. Click a card to highlight matching stops in Trip Plan." />
                        <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 400 }}>· click a card to highlight stops in Trip Plan</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: overBudget ? '#dc2626' : '#16a34a', fontWeight: 700, background: overBudget ? '#fef2f2' : '#f0fdf4', padding: '0.3rem 0.75rem', borderRadius: '20px', border: `1px solid ${overBudget ? '#fecaca' : '#bbf7d0'}` }}>
                          {overBudget ? 'âš  Over budget' : 'âœ“ Within budget'} Â· â‚±{totalEstimated.toFixed(0)} / â‚±{totalBudget.toFixed(0)}
                        </span>
                        {activeCategoryFilter && (
                          <button onClick={() => setActiveCategoryFilter(null)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            âœ• Clear filter
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stacked spend bar */}
                    <div style={{ height: '8px', borderRadius: '999px', overflow: 'hidden', display: 'flex', marginBottom: '1.25rem', background: '#f3f4f6' }}>
                      {statistics.budget?.map((cat, i) => {
                        const pct = totalEstimated > 0 ? (parseFloat(cat.estimated_total || 0) / totalEstimated) * 100 : 0;
                        return <div key={cat.cost_category || i} title={`${cat.cost_category}: â‚±${parseFloat(cat.estimated_total||0).toFixed(0)}`} style={{ width: `${pct}%`, background: catColors[i % catColors.length], transition: 'width 0.3s' }} />;
                      })}
                    </div>

                    {/* Category cards */}
                    <div style={styles.budgetCategories}>
                      {statistics.budget?.map((category, i) => {
                        const catKey = category.cost_category || 'uncategorized';
                        const selected = activeCategoryFilter === catKey;
                        const color = catColors[i % catColors.length];
                        const est = parseFloat(category.estimated_total || 0);
                        const pct = totalEstimated > 0 ? Math.round((est / totalEstimated) * 100) : 0;
                        const budgetShare = totalBudget > 0 ? Math.min((est / totalBudget) * 100, 100) : 0;
                        return (
                          <div
                            key={catKey}
                            onClick={() => toggleCategoryFilter(catKey)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') toggleCategoryFilter(catKey); }}
                            style={{
                              ...styles.categoryCard,
                              cursor: 'pointer',
                              border: selected ? `2px solid ${color}` : '1px solid #e9e9e9',
                              boxShadow: selected ? `0 0 0 3px ${color}22, 0 8px 24px rgba(0,0,0,0.06)` : '0 2px 8px rgba(0,0,0,0.04)',
                              position: 'relative',
                              overflow: 'hidden',
                              transition: 'all 0.18s ease',
                              paddingLeft: '1.75rem'
                            }}
                          >
                            {/* Left accent bar */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5px', background: color, borderRadius: '12px 0 0 12px' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', textTransform: 'capitalize' }}>{catKey}</div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 900, color, marginTop: '0.2rem' }}>â‚±{est.toFixed(0)}</div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', background: color, padding: '0.2rem 0.55rem', borderRadius: '20px' }}>{pct}%</span>
                                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{category.item_count} {category.item_count === 1 ? 'stop' : 'stops'}</span>
                              </div>
                            </div>

                            {/* Mini spend bar */}
                            <div style={{ marginTop: '0.85rem' }}>
                              <div style={{ height: '5px', borderRadius: '999px', background: '#f3f4f6', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${budgetShare}%`, background: color, borderRadius: '999px', transition: 'width 0.3s' }} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                                <span>of total budget</span>
                                <span>{budgetShare.toFixed(0)}%</span>
                              </div>
                            </div>

                            {category.actual_total > 0 && (
                              <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#374151', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>Actual spent</span>
                                <strong style={{ color: parseFloat(category.actual_total) > est ? '#dc2626' : '#16a34a' }}>â‚±{parseFloat(category.actual_total).toFixed(0)}</strong>
                              </div>
                            )}

                            {selected && (
                              <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                ✓ Filtering Trip Plan · click again to clear
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>}
          </div>
        )}

        {activeTab === 'weather' && (
          <div style={styles.card}>
            <h2 style={{ marginBottom: '1.5rem' }}>Weather at Your Stops</h2>
            {normalizedItems.filter(item => {
              const lat = parseFloat(item.latitude ?? item.attraction_latitude);
              const lng = parseFloat(item.longitude ?? item.attraction_longitude);
              return !Number.isNaN(lat) && !Number.isNaN(lng);
            }).length === 0 ? (
              <div style={styles.emptyState}>
                <Icons.MapIcon size={32} color="#ccc" />
                <p>No stops with coordinates found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))', gap: '1.5rem' }}>
                {normalizedItems
                  .filter((item, idx, arr) => {
                    const lat = parseFloat(item.latitude ?? item.attraction_latitude);
                    const lng = parseFloat(item.longitude ?? item.attraction_longitude);
                    if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
                    return arr.findIndex(i => (i.attraction_id || i.item_id) === (item.attraction_id || item.item_id)) === idx;
                  })
                  .map((item, idx) => (
                    <div key={item.id || idx}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Day {item.day_number} Â· Stop {idx + 1}
                      </div>
                      <WeatherWidget
                        attractionId={item.attraction_id}
                        latitude={parseFloat(item.latitude ?? item.attraction_latitude)}
                        longitude={parseFloat(item.longitude ?? item.attraction_longitude)}
                        locationName={item.custom_name || item.attraction_name}
                        showForecast={false}
                        showAlerts={true}
                        showSafetyTips={true}
                        size="medium"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </div>
      {showArchiveDialog && <ItineraryArchiveDialog name={itinerary.name}
        message={t('confirm_archive_itinerary')} busy={archiving} error={archiveError}
        onCancel={() => { if (!archiveRequestRef.current) setShowArchiveDialog(false); }} onConfirm={deleteItinerary}
        labels={{ title: L('archive_itinerary_title', 'Archive itinerary?'), cancel: t('cancel'), confirm: L('archive_itinerary_action', 'Archive itinerary'), busy: L('archiving_itinerary', 'Archivingâ€¦') }} />}
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: 'transparent',
    minHeight: '100vh',
    paddingBottom: '3rem'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '1rem'
  },
  spinner: {
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #2e7d32',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite'
  },
  error: {
    textAlign: 'center',
    padding: '3rem'
  },
  backBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2e7d32',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  breadcrumbContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0'
  },
  breadcrumbLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: '#2e7d32',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  metadataBar: {
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e0e0e0',
    paddingTop: '0',
    position: 'relative',
    zIndex: 1,
    marginTop: '1rem'
  },
  metadataHeader: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1rem 2rem 0.5rem 2rem',
    display: 'flex',
    alignItems: 'center'
  },
  metadataContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0.5rem 2rem 1rem 2rem',
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  metaText: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    fontSize: '0.9rem',
    color: '#666'
  },
  statusBadge: (status) => ({
    padding: '0.35rem 1rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor:
      status === 'completed' ? '#4caf50' :
      status === 'in-progress' ? '#ff9800' :
      status === 'planned' ? '#2196f3' :
      status === 'cancelled' ? '#f44336' : '#666',
    color: 'white'
  }),
  headerActions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '1rem',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 0
  },
  actionBtn: {
    padding: '0.95rem 2rem',
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.4)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    minWidth: '120px',
    whiteSpace: 'nowrap'
  },
  deleteBtn: {
    padding: '0.95rem 2rem',
    backgroundColor: '#d32f2f',
    color: 'white',
    border: '2px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    minWidth: '120px',
    whiteSpace: 'nowrap'
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem',
    maxWidth: '1400px',
    margin: '1.5rem auto 2rem',
    padding: '0 2rem'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },
  statIcon: {
    fontSize: '2.5rem'
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#666',
    marginBottom: '0.25rem',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#2e7d32'
  },
  tabs: {
    maxWidth: '1400px',
    margin: '0 auto 0',
    padding: '0 2rem',
    display: 'flex',
    gap: '0',
    borderBottom: '2px solid #e0e0e0'
  },
  tab: {
    padding: '1rem 2rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontWeight: '500',
    color: '#666',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  tabActive: {
    padding: '1rem 2rem',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid #2e7d32',
    cursor: 'pointer',
    fontWeight: '600',
    color: '#2e7d32',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: 'white'
  },
  overviewContent: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 350px',
    alignItems: 'start',
    gap: '2rem'
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0'
  },
  daySection: {
    marginBottom: '2.5rem'
  },
  dayHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e8e8e8'
  },
  dayItemCount: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  dayItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  itemCard: {
    display: 'flex',
    gap: '1.25rem',
    padding: '1.25rem',
    border: '1px solid #e8e8e8',
    borderRadius: '10px',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      backgroundColor: '#fff'
    }
  },
  itemNumber: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: '#2e7d32',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    flexShrink: 0,
    fontSize: '1.1rem'
  },
  itemBody: {
    flex: 1
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    gap: '1rem'
  },
  checkbox: {
    width: '22px',
    height: '22px',
    cursor: 'pointer'
  },
  itemLocation: {
    color: '#666',
    fontSize: '0.95rem',
    margin: '0.35rem 0',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  itemDetails: {
    display: 'flex',
    gap: '1.25rem',
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '0.75rem',
    flexWrap: 'wrap'
  },
  itemMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '0.75rem',
    marginTop: '0.85rem'
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    padding: '0.65rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    border: '1px solid #e5e5e5'
  },
  metaLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  metaValue: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#333'
  },
  metaValueHighlight: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#16a34a',
    padding: '0.3rem 0.5rem',
    backgroundColor: '#f0fdf4',
    borderRadius: '4px',
    display: 'inline-block'
  },
  priorityBadge: (priority) => ({
    padding: '0.3rem 0.7rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor:
      priority === 'must-visit' || priority === 'high' ? '#ffebee' :
      priority === 'medium' ? '#fff3e0' : '#e8f5e9',
    color:
      priority === 'must-visit' || priority === 'high' ? '#c62828' :
      priority === 'medium' ? '#e65100' : '#2e7d32'
  }),
  itemNotes: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#fffef0',
    borderLeft: '3px solid #fbc02d',
    borderRadius: '4px',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem'
  },
  bookingInfo: {
    marginTop: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#e8f5e9',
    borderLeft: '3px solid #2e7d32',
    borderRadius: '4px',
    fontSize: '0.9rem',
    color: '#2e7d32',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem'
  },
  statusSelect: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '1rem',
    backgroundColor: '#ffffff'
  },
  quickActionBtn: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '0.75rem',
    textAlign: 'left',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  quickActionBtnDelete: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#ffebee',
    border: '1px solid #f44336',
    color: '#d32f2f',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '0.75rem',
    textAlign: 'left',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '0.85rem',
    marginBottom: '0.85rem',
    borderBottom: '1px solid #f0f0f0'
  },
  collaboratorItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 0',
    borderBottom: '1px solid #f0f0f0'
  },
  roleBadge: {
    padding: '0.3rem 0.7rem',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#1976d2',
    textTransform: 'capitalize'
  },
  scheduleContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px'
  },
  timelineDay: {
    marginBottom: '2.5rem'
  },
  timeline: {
    position: 'relative',
    paddingLeft: '2.5rem',
    marginTop: '1.25rem'
  },
  timelineItem: {
    position: 'relative',
    marginBottom: '1.5rem',
    paddingLeft: '2rem'
  },
  timelineItemDim: {
    opacity: 0.35,
    filter: 'grayscale(20%)'
  },
  timelineItemHighlight: {
    boxShadow: '0 8px 24px rgba(46,125,50,0.06)',
    borderRadius: '8px'
  },
  timelineDot: {
    position: 'absolute',
    left: '-1rem',
    top: '0.5rem',
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    backgroundColor: '#2e7d32',
    border: '3px solid white',
    boxShadow: '0 0 0 2px #2e7d32'
  },
  timelineContent: {
    backgroundColor: '#f9f9f9',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e8e8e8'
  },
  timelineTime: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: '0.35rem'
  },
  timelineTitle: {
    fontSize: '1.15rem',
    fontWeight: '600',
    marginBottom: '0.35rem',
    color: '#212121'
  },
  timelineDuration: {
    fontSize: '0.9rem',
    color: '#666'
  },
  progressBarWrap: {
    maxWidth: '1400px',
    margin: '1rem auto 0',
    padding: '1rem 2rem',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb'
  },
  progressTrack: {
    height: '10px',
    borderRadius: '999px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #16a34a, #22c55e)',
    transition: 'width 0.4s ease'
  },
  budgetContent: {},
  budgetSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2.5rem'
  },
  budgetItem: {
    padding: '1.5rem',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    border: '1px solid #e8e8e8'
  },
  budgetCategories: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
    gap: '1.75rem',
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #eef0f2'
  },
  budgetToolCaption: {
    marginTop: '0.75rem',
    padding: '0.85rem 1rem',
    backgroundColor: '#f8fafb',
    border: '1px solid #e8edf2',
    borderRadius: '10px',
    color: '#5b6470',
    fontSize: '0.92rem',
    lineHeight: 1.5
  },
  byCategoryHeader: {
    marginTop: '1.5rem'
  },
  categoryAccentBar: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: '5px',
    borderRadius: '12px 0 0 12px'
  },
  budgetActionHeader: {
    marginBottom: '0.75rem',
    color: '#5b6470',
    fontSize: '0.92rem',
    fontWeight: 700,
    letterSpacing: '0.02em'
  },
  budgetActionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '0.75rem'
  },
  budgetActionBtn: {
    padding: '0.6rem 0.9rem',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    backgroundColor: '#f7f7f7',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: '600',
    color: '#344054',
    transition: 'all 0.2s ease'
  },
  budgetSubsection: {
    marginTop: '1.25rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eef0f2'
  },
  budgetSubsectionTitle: {
    marginBottom: '0.75rem'
  },
  assumptionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75rem',
    alignItems: 'stretch'
  },
  assumptionField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
    padding: '0.9rem',
    backgroundColor: '#fafafa',
    border: '1px solid #edf0f2',
    borderRadius: '10px'
  },
  assumptionLabel: {
    fontWeight: 600,
    color: '#344054'
  },
  assumptionHelper: {
    fontSize: '0.85rem',
    color: '#667085',
    lineHeight: 1.4
  },
  categoryCard: {
    padding: '1.5rem',
    border: '1px solid #e9e9e9',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    boxShadow: '0 6px 18px rgba(0,0,0,0.04)'
  },
  categoryDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  mapContent: {},
  routeBtn: {
    marginTop: '1rem',
    padding: '0.65rem 1rem',
    backgroundColor: '#2e7d32',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#1b5e20',
      transform: 'scale(1.05)'
    }
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999'
  }
  ,
  perDayPanel: {
    marginTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  perDayRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 220px',
    gap: '1rem',
    alignItems: 'start',
    padding: '1rem',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    backgroundColor: '#fff'
  },
  fitBadgeGood: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '0.45rem 0.85rem',
    borderRadius: '20px',
    fontWeight: '700'
  },
  fitBadgeBad: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '0.45rem 0.85rem',
    borderRadius: '20px',
    fontWeight: '700'
  },
  assumptionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem'
  },
  assumptionInput: {
    width: '110px',
    padding: '0.45rem 0.6rem',
    border: '1px solid #e0e0e0',
    borderRadius: '6px'
  },
  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  breakdownCell: {
    backgroundColor: '#fafafa',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #f0f0f0',
    fontSize: '0.9rem'
  },
  helpIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.2rem',
    height: '1.2rem',
    borderRadius: '50%',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: '0.5rem',
    position: 'relative'
  },
  helpIconHover: {
    backgroundColor: '#2e7d32',
    color: 'white',
    transform: 'scale(1.1)'
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '0.5rem',
    backgroundColor: '#1f2937',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    lineHeight: '1.4',
    whiteSpace: 'normal',
    width: '220px',
    zIndex: 1000,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: 'none'
  },
  tooltipArrow: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid #1f2937'
  }
};

export default ItineraryDetail;
