import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { fetchAttractions, fetchHotels, getApiBaseUrl, get as apiGet, post as apiPost, put as apiPut } from '../api';
import CustomDropdown from '../components/CustomDropdown';
import LeafletMap from '../components/LeafletMap';
import Icons from '../components/Icons';
import HeroSlideshow from '../components/HeroSlideshow';
import SearchInput from '../components/SearchInput';
import FilterChips from '../components/FilterChips';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useMediaQuery from '../hooks/useMediaQuery';
import './ItineraryBuilder.css';

const API_BASE_URL = getApiBaseUrl();
import { weatherService } from '../services/weatherService';

// Unified Theme System
const THEME = {
  primary: '#16a34a',
  secondary: '#059669',
  accent: '#f59e0b',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#f8f9fa',
  surface: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  shadow: '0 4px 12px rgba(0,0,0,0.08)',
  shadowLarge: '0 8px 24px rgba(0,0,0,0.12)'
};

export const MINUTES_BY_TIME_OF_DAY = {
  morning: 120,
  afternoon: 120,
  evening: 120,
};

export const timeOfDayForMinutes = (minutes) => {
  const m = parseInt(minutes) || 120;
  if (m <= 120) return 'morning';
  if (m <= 240) return 'afternoon';
  return 'evening';
};

const TIME_OF_DAY_OPTIONS = [
  { value: 'morning',   label: 'Morning',   icon: '☀️' },
  { value: 'afternoon', label: 'Afternoon', icon: '🌤️' },
  { value: 'evening',   label: 'Evening',   icon: '🌙' },
];

const ItineraryBuilder = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTiny = useMediaQuery('(max-width: 480px)');
  const isWide = useMediaQuery('(min-width: 1200px)');
  
  // Responsive container / panels
  const containerStyle = isWide
    ? styles.container
    : isMobile
      ? { ...styles.container, gridTemplateColumns: '1fr', padding: '0.75rem', gap: '1rem', maxWidth: '100%' }
      : { ...styles.container, gridTemplateColumns: '1fr', padding: '1.25rem', gap: '1.25rem', maxWidth: '100%' };
  
  // Sidebar: sticky positioning only applies in the 3-column desktop grid.
  // On stacked tablet/mobile layouts it becomes a normal full-width block.
  const sidebarStyle = isWide
    ? styles.sidebar
    : { ...styles.sidebar, position: 'static', top: 'auto', maxHeight: 'none' };
  
  const rightPanelStyle = isWide
    ? styles.rightPanel
    : { ...styles.rightPanel, position: 'static', height: 'auto' };
  
  // Right panel on tablets/mobile goes below the main content (visual order).
  const rightPanelOrder = isWide ? {} : { order: 3 };
  
  const plannerGuideStyle = isMobile
    ? { ...styles.plannerGuide, padding: '0 0.75rem' }
    : isTiny
      ? { ...styles.plannerGuide, padding: '0 0.5rem' }
      : styles.plannerGuide;
  
  // Inner responsive grids (mobile / tiny overrides of the fixed desktop grids)
  const responsiveStyle = (cond, base, mobileOverride) => (cond ? { ...base, ...mobileOverride } : base);
  const dateInputsStyle = responsiveStyle(isMobile, styles.dateInputs, { gridTemplateColumns: '1fr', gap: '0.75rem' });
  const statsBarStyle = responsiveStyle(isMobile, styles.statsBar, { gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' });
  const routeStatsRowStyle = responsiveStyle(isMobile, styles.routeStatsRow, { gridTemplateColumns: 'repeat(2, 1fr)' });
  const actionButtonsStyle = responsiveStyle(isMobile, styles.actionButtons, { gridTemplateColumns: '1fr' });
  const dayBudgetBreakdownRowStyle = isMobile ? { gridTemplateColumns: '1fr 1fr', gap: '0.5rem' } : { gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' };
  const itineraryHeaderStyle = responsiveStyle(isMobile, styles.itineraryHeader, { padding: '1.25rem', borderRadius: '18px' });
  const nameInputStyle = responsiveStyle(isTiny, styles.nameInput, { fontSize: '1.4rem', padding: '0.75rem' });
  const dayContentStyle = responsiveStyle(isMobile, styles.dayContent, { padding: '1rem' });
  const mapContainerStyle = responsiveStyle(isMobile, styles.mapContainer, { padding: '1rem', borderRadius: '20px' });
  const summaryCardStyle = responsiveStyle(isMobile, styles.summaryCard, { padding: '1.25rem', borderRadius: '18px' });
  const savedListStyle = responsiveStyle(isMobile, styles.savedList, { padding: '1rem', borderRadius: '18px', maxHeight: 'none' });
  const savedItemCardStyle = responsiveStyle(isTiny, styles.savedItemCard, { flexDirection: 'column', padding: '1rem' });
  
  const [attractions, setAttractions] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [itinerary, setItinerary] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    durationDays: 1,
    status: 'draft',
    visibility: 'private',
    totalBudget: 0
  });
  // Transport fare rates (LTFRB/standard PH rates)
  const TRANSPORT_MODES = {
    tricycle:  { label: '🛺 Tricycle',   base: 10,  perKm: 2.00 },
    jeepney:   { label: '🚌 Jeepney',    base: 13,  perKm: 1.80 },
    bus:       { label: '🚍 Bus',         base: 15,  perKm: 2.65 },
    van:       { label: '🚐 Van/FX',      base: 20,  perKm: 3.50 },
    motorcycle:{ label: '🏍️ Motorcycle', base: 8,   perKm: 1.50 },
    car:       { label: '🚗 Private Car', base: 0,   perKm: 7.00 },
  };
  const DEFAULT_FOOD = 300;
  const DEFAULT_OTHER = 100;
  const [foodPerDay, setFoodPerDay] = useState({});
  const [otherPerDay, setOtherPerDay] = useState({});
  const [farePerDay, setFarePerDay] = useState({});
  const [transportPerDay, setTransportPerDay] = useState({});
  const [globalTransportMode, setGlobalTransportMode] = useState('jeepney');
  
  const [itemsByDay, setItemsByDay] = useState({ 1: [] });
  const [currentDay, setCurrentDay] = useState(1);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [savedSearch, setSavedSearch] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [weather, setWeather] = useState({});
  const [editingItineraryId, setEditingItineraryId] = useState(null);
  const [attractionsLoading, setAttractionsLoading] = useState(true);
  const [attractionSearch, setAttractionSearch] = useState('');
  const [showAttractionSuggestions, setShowAttractionSuggestions] = useState(false);
  const [attractionSuggestions, setAttractionSuggestions] = useState([]);
  const [attractionSearchLoading, setAttractionSearchLoading] = useState(false);
  const [showSidebarFilters, setShowSidebarFilters] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [sidebarSort, setSidebarSort] = useState('popular');
  const [sidebarCategories, setSidebarCategories] = useState([]);
  const [sidebarMinRating, setSidebarMinRating] = useState(0);
  const [sidebarMinFee, setSidebarMinFee] = useState('');
  const [sidebarMaxFee, setSidebarMaxFee] = useState('');
  const [sidebarMaxDistance, setSidebarMaxDistance] = useState('');
  const [attractionsPage, setAttractionsPage] = useState(1);
  const [savedStatusFilter, setSavedStatusFilter] = useState('all');
  const [savedBudgetMin, setSavedBudgetMin] = useState('');
  const [savedBudgetMax, setSavedBudgetMax] = useState('');
  const [savedSort, setSavedSort] = useState('recent');
  const [savedPage, setSavedPage] = useState(1);
  const [showSavedSuggestions, setShowSavedSuggestions] = useState(false);
  const [savedSearchLoading, setSavedSearchLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const suggestionCacheRef = useRef(new Map());
  const sidebarRef = useRef(null);
  const dayPlannerRef = useRef(null);
  const budgetPanelRef = useRef(null);
  const preselectedAppliedRef = useRef(false);
  const ATTR_PER_PAGE = 8;
  const SAVED_PER_PAGE = 5;
  const debouncedAttractionSearch = useDebouncedValue(attractionSearch, 300);
  const debouncedSavedSearch = useDebouncedValue(savedSearch, 300);

  const getPreselectedAttraction = () => {
    if (location.state?.preselectedAttraction) {
      return location.state.preselectedAttraction;
    }
    try {
      const raw = localStorage.getItem('itinerary-preselected-attraction');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  
  useEffect(() => {
    try {
      const cached = localStorage.getItem('itinerary-search-filters-v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        setAttractionSearch(parsed.attractionSearch || '');
        setSidebarCategories(Array.isArray(parsed.sidebarCategories) ? parsed.sidebarCategories : []);
        setSidebarMinRating(parsed.sidebarMinRating || 0);
        setSidebarMinFee(parsed.sidebarMinFee || '');
        setSidebarMaxFee(parsed.sidebarMaxFee || '');
        setSidebarMaxDistance(parsed.sidebarMaxDistance || '');
        setSavedSearch(parsed.savedSearch || '');
        setSavedStatusFilter(parsed.savedStatusFilter || 'all');
        setSavedBudgetMin(parsed.savedBudgetMin || '');
        setSavedBudgetMax(parsed.savedBudgetMax || '');
        setSavedSort(parsed.savedSort || 'recent');
      }
    } catch {
      // ignore malformed local storage
    }

    if (location.state?.destination) {
      setAttractionSearch(location.state.destination);
    }
    // Hydrate dates from search state if available
    if (location.state?.checkIn) {
      setItinerary(prev => ({ ...prev, startDate: location.state.checkIn }));
    }
    if (location.state?.checkOut) {
      setItinerary(prev => ({ ...prev, endDate: location.state.checkOut }));
    }

    setAttractionsLoading(true);
    fetchAttractions()
      .then(res => setAttractions(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(err => console.error('Failed to fetch attractions:', err))
      .finally(() => setAttractionsLoading(false));

    fetchHotels()
      .then(res => setHotels(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setHotels([]));
    
    loadSavedItineraries();
    loadTemplates();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setLocationError('GPS unavailable')
      );
    }
    
    // Check if we're in edit mode
    if (location.state?.editItinerary && location.state?.itineraryId) {
      loadExistingItinerary(location.state.editItinerary, location.state.itineraryId);
    }
    if (location.state?.globalTransportMode) {
      setGlobalTransportMode(location.state.globalTransportMode);
    }
  }, []);

  useEffect(() => {
    const payload = {
      attractionSearch,
      sidebarCategories,
      sidebarMinRating,
      sidebarMinFee,
      sidebarMaxFee,
      sidebarMaxDistance,
      savedSearch,
      savedStatusFilter,
      savedBudgetMin,
      savedBudgetMax,
      savedSort
    };
    localStorage.setItem('itinerary-search-filters-v1', JSON.stringify(payload));
  }, [
    attractionSearch,
    sidebarCategories,
    sidebarMinRating,
    sidebarMinFee,
    sidebarMaxFee,
    sidebarMaxDistance,
    savedSearch,
    savedStatusFilter,
    savedBudgetMin,
    savedBudgetMax,
    savedSort
  ]);
  
  const loadExistingItinerary = async (itineraryData, itineraryId) => {
    setEditingItineraryId(itineraryId);
    const plannedDays = Math.max(parseInt(itineraryData.duration_days, 10) || 1, 1);
    const existingTotalBudget = parseFloat(itineraryData.total_budget) || 0;
    const defaultPerDayBudget = plannedDays > 0
      ? parseFloat((existingTotalBudget / plannedDays).toFixed(2))
      : 0;
    
    // Set basic itinerary info
    setItinerary({
      name: itineraryData.name || '',
      description: itineraryData.description || '',
      startDate: itineraryData.start_date ? itineraryData.start_date.split('T')[0] : '',
      endDate: itineraryData.end_date ? itineraryData.end_date.split('T')[0] : '',
      durationDays: itineraryData.duration_days || 1,
      status: itineraryData.status || 'draft',
      visibility: itineraryData.visibility || 'private',
      totalBudget: itineraryData.total_budget || 0
    });
    
    // Load items by day if available
    if (itineraryData.items && Array.isArray(itineraryData.items)) {
      const groupedItems = {};
      itineraryData.items.forEach(item => {
        const day = item.day_number || 1;
        if (!groupedItems[day]) groupedItems[day] = [];
        groupedItems[day].push(item);
      });
      setItemsByDay(groupedItems);
    } else {
      // no items
    }
  };
  
  useEffect(() => {
    if (itinerary.startDate && itinerary.endDate) {
      const start = new Date(itinerary.startDate);
      const end = new Date(itinerary.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setItinerary(prev => ({ ...prev, durationDays: days }));
      
      const newItemsByDay = {};
      for (let i = 1; i <= days; i++) {
        newItemsByDay[i] = itemsByDay[i] || [];
      }
      setItemsByDay(newItemsByDay);
    }
  }, [itinerary.startDate, itinerary.endDate]);
  
  const loadSavedItineraries = async () => {
    try {
      const response = await apiGet('/itinerary');
      setSavedItineraries(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Failed to load saved itineraries:', error);
      setSavedItineraries([]);
    }
  };
  
  const loadTemplates = async () => {
    try {
      const response = await apiGet('/itinerary/templates/list');
      setTemplates(Array.isArray(response.data) ? response.data : (Array.isArray(response.data?.data) ? response.data.data : []));
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    }
  };
  
  const addToDay = (attraction, day = currentDay) => {
    const item = {
      item_type: 'attraction',
      attraction_id: attraction.id,
      custom_name: attraction.name,
      custom_location: attraction.location,
      latitude: attraction.latitude,
      longitude: attraction.longitude,
      day_number: day,
      order_in_day: (itemsByDay[day] || []).length,
      duration_minutes: 120,
      estimated_cost: parseFloat(attraction.entrance_fee || attraction.price || 0) || 0,
      priority: 'medium',
      weather_dependent: false
    };
    
    setItemsByDay(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { ...attraction, ...item }]
    }));
    
    fetchWeatherForAttraction(attraction);
  };

  useEffect(() => {
    if (preselectedAppliedRef.current) return;

    const preselected = getPreselectedAttraction();
    if (!preselected?.id) return;

    const sourceAttraction = attractions.find((item) => String(item.id) === String(preselected.id)) || preselected;

    const alreadyAdded = Object.values(itemsByDay).some((dayItems) =>
      dayItems.some((item) => String(item.attraction_id || item.id) === String(sourceAttraction.id))
    );

    if (!alreadyAdded) {
      addToDay(sourceAttraction, 1);
      setCurrentDay(1);
      if (!itinerary.name.trim()) {
        setItinerary((prev) => ({ ...prev, name: `${sourceAttraction.name} itinerary` }));
      }
    }

    preselectedAppliedRef.current = true;
    localStorage.removeItem('itinerary-preselected-attraction');
  }, [attractions, itemsByDay, itinerary.name]);
  
  const removeFromDay = (day, index) => {
    setItemsByDay(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index)
    }));
  };
  
  const fetchWeatherForAttraction = async (attraction) => {
    try {
      if (attraction.latitude && attraction.longitude) {
        const weatherData = await weatherService.getCurrentWeather(
          attraction.latitude,
          attraction.longitude,
          attraction.name
        );
        setWeather(prev => ({
          ...prev,
          [attraction.id]: weatherData
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch weather for ${attraction.name}:`, error);
    }
  };
  
  const calculateTotals = () => {
    let totalDistance = 0;
    let totalTime = 0;
    let totalBudget = 0;
    
    Object.entries(itemsByDay).forEach(([dayKey, dayItems]) => {
      const day = parseInt(dayKey, 10) || 1;
      
      dayItems.forEach((item, index) => {
        if (index > 0) {
          const prev = dayItems[index - 1];
          if (item.latitude && item.longitude && prev.latitude && prev.longitude) {
            totalDistance += calculateDistance(
              parseFloat(prev.latitude), parseFloat(prev.longitude),
              parseFloat(item.latitude), parseFloat(item.longitude)
            );
          }
        }
        totalTime += item.duration_minutes || 0;
        totalBudget += parseFloat(item.estimated_cost || 0);
      });
      
      // Add daily budget breakdowns (Fare, Food, Other)
      const fareCost = farePerDay[day] !== undefined ? farePerDay[day] : 0;
      const foodCost = foodPerDay[day] !== undefined ? foodPerDay[day] : DEFAULT_FOOD;
      const otherCost = otherPerDay[day] !== undefined ? otherPerDay[day] : DEFAULT_OTHER;
      
      totalBudget += fareCost + foodCost + otherCost;
    });
    
    return {
      distance: Math.round(totalDistance * 100) / 100,
      time: totalTime,
      budget: totalBudget
    };
  };
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };
  
  const saveItinerary = async () => {
    if (!itinerary.name.trim()) {
      alert(t('please_enter_name'));
      return;
    }
    
    const totals = calculateTotals();
    const allItems = [];
    
    Object.entries(itemsByDay).forEach(([day, items]) => {
      items.forEach((item, index) => {
        allItems.push({
          ...item,
          day_number: parseInt(day),
          order_in_day: index
        });
      });
    });
    
    if (allItems.length === 0) {
      alert(t('please_add_item'));
      return;
    }
    
    try {
      const payload = {
        name: itinerary.name,
        description: itinerary.description,
        start_date: itinerary.startDate || null,
        end_date: itinerary.endDate || null,
        status: itinerary.status,
        items: allItems,
        totalDistance: totals.distance,
        totalTime: totals.time + (routeInfo ? routeInfo.duration : 0),
        totalBudget: totals.budget
      };
      
      let result;
      if (editingItineraryId) {
        // Update existing itinerary using PUT
        result = await apiPut(`/itinerary/${editingItineraryId}`, payload);
      } else {
        // Create new itinerary using POST
        result = await apiPost('/itinerary', payload);
      }
      
      if (result.data?.success || result.data?.itinerary_id) {
        alert(editingItineraryId ? t('itinerary_updated') : t('itinerary_saved'));
        navigate(`/itinerary/${result.data.itinerary_id || editingItineraryId}`);
        loadSavedItineraries();
      } else {
        alert(`${t('failed_save')}: ${result.data?.error || t('unknown_error')}`);
      }
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert(error.response?.data?.error || t('failed_save'));
    }
  };
  
  // Sync suggested fare into farePerDay when transport/route changes, but only for days not manually overridden
  const fareOverriddenRef = useRef({});
  useEffect(() => {
    const mode = TRANSPORT_MODES[globalTransportMode];
    const kmPerDay = routeInfo ? (routeInfo.distance / Math.max(itinerary.durationDays, 1)) : 0;
    const suggested = Math.ceil(mode.base + (kmPerDay * mode.perKm));
    setFarePerDay(prev => {
      const next = { ...prev };
      Object.keys(itemsByDay).forEach(dayKey => {
        const day = parseInt(dayKey, 10);
        if (!fareOverriddenRef.current[day]) {
          next[day] = suggested;
        }
      });
      return next;
    });
  }, [globalTransportMode, routeInfo, itinerary.durationDays, itemsByDay]);

  const totals = calculateTotals();
  const dayBudgetBreakdown = useMemo(() => {
    const result = {};
    Object.keys(itemsByDay).forEach((dayKey) => {
      const day = parseInt(dayKey, 10) || 1;
      const dayItems = itemsByDay[day] || [];
      const attractionCost = dayItems.reduce((sum, item) => sum + (parseFloat(item.estimated_cost) || 0), 0);
      const foodCost = foodPerDay[day] !== undefined ? foodPerDay[day] : DEFAULT_FOOD;
      const otherCost = otherPerDay[day] !== undefined ? otherPerDay[day] : DEFAULT_OTHER;
      const modeKey = transportPerDay[day] || globalTransportMode;
      const mode = TRANSPORT_MODES[modeKey];
      const kmPerDay = routeInfo ? (routeInfo.distance / Math.max(itinerary.durationDays, 1)) : 0;
      const suggestedFare = Math.ceil(mode.base + (kmPerDay * mode.perKm));
      const fareCost = farePerDay[day] !== undefined ? farePerDay[day] : suggestedFare;
      const estimatedNeed = fareCost + foodCost + otherCost;
      result[day] = { attractionCost, fareCost, foodCost, otherCost, estimatedNeed, modeKey };
    });
    return result;
  }, [itemsByDay, foodPerDay, otherPerDay, farePerDay, transportPerDay, globalTransportMode, routeInfo, itinerary.durationDays]);

  const currentDayBudget = dayBudgetBreakdown[currentDay] || {
    attractionCost: 0,
    fareCost: farePerDay[currentDay] !== undefined ? farePerDay[currentDay] : 0,
    foodCost: foodPerDay[currentDay] !== undefined ? foodPerDay[currentDay] : DEFAULT_FOOD,
    otherCost: otherPerDay[currentDay] !== undefined ? otherPerDay[currentDay] : DEFAULT_OTHER,
    estimatedNeed: 0, modeKey: transportPerDay[currentDay] || 'jeepney'
  };

  const allPlannedItems = useMemo(() => {
    return Object.entries(itemsByDay)
      .flatMap(([day, items]) =>
        (items || []).map((item, index) => ({
          ...item,
          day_number: parseInt(day, 10) || 1,
          order_in_day: item.order_in_day ?? index
        }))
      )
      .filter((item) => {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);
        return !Number.isNaN(lat) && !Number.isNaN(lng);
      });
  }, [itemsByDay]);

  const mapMarkers = useMemo(() => {
    return allPlannedItems.map((item, index) => ({
      lat: parseFloat(item.latitude),
      lng: parseFloat(item.longitude),
      popup: `<div><strong>${index + 1}. ${item.custom_name || item.name}</strong><br/><small>Day ${item.day_number || 1}</small></div>`,
      title: `${item.custom_name || item.name} (Day ${item.day_number || 1})`
    }));
  }, [allPlannedItems]);

  const mapRouteWaypoints = useMemo(() => {
    const destinationPoints = allPlannedItems
      .slice()
      .sort((a, b) => {
        const dayDiff = (a.day_number || 1) - (b.day_number || 1);
        if (dayDiff !== 0) return dayDiff;
        const aOrder = a.order_in_day !== undefined ? a.order_in_day : (a.order_sequence || 0);
        const bOrder = b.order_in_day !== undefined ? b.order_in_day : (b.order_sequence || 0);
        return aOrder - bOrder;
      })
      .map((item) => ({
        lat: parseFloat(item.latitude),
        lng: parseFloat(item.longitude),
        name: item.custom_name || item.name
      }))
      .filter((point) => !Number.isNaN(point.lat) && !Number.isNaN(point.lng));

    if (userLocation && destinationPoints.length > 0) {
      return [{ lat: userLocation[0], lng: userLocation[1], name: 'Your Location' }, ...destinationPoints];
    }
    return destinationPoints;
  }, [allPlannedItems, userLocation]);

  const mapCenter = useMemo(() => {
    if (mapMarkers.length === 0) {
      return [13.3333, 121.3000];
    }

    const latTotal = mapMarkers.reduce((sum, marker) => sum + marker.lat, 0);
    const lngTotal = mapMarkers.reduce((sum, marker) => sum + marker.lng, 0);
    return [latTotal / mapMarkers.length, lngTotal / mapMarkers.length];
  }, [mapMarkers]);

  useEffect(() => {
    if (attractionSearch !== debouncedAttractionSearch) {
      setAttractionSearchLoading(true);
      return;
    }
    setAttractionSearchLoading(false);
  }, [attractionSearch, debouncedAttractionSearch]);

  useEffect(() => {
    if (savedSearch !== debouncedSavedSearch) {
      setSavedSearchLoading(true);
      return;
    }
    setSavedSearchLoading(false);
  }, [savedSearch, debouncedSavedSearch]);

  const categoryOptions = useMemo(
    () => [...new Set(attractions.map(a => (a.category || '').toLowerCase()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [attractions]
  );

  const sidebarSuggestionSource = useMemo(() => {
    const suggestions = [];
    attractions.forEach(a => {
      suggestions.push({ id: `a-${a.id}`, label: a.name || 'Attraction', meta: `Attraction • ${a.location || 'Unknown location'}`, value: a.name || '' });
      if (a.location) suggestions.push({ id: `al-${a.id}`, label: a.location, meta: 'Location', value: a.location });
    });
    return suggestions;
  }, [attractions]);

  useEffect(() => {
    const query = (debouncedAttractionSearch || '').trim().toLowerCase();
    if (!query || query.length < 2) {
      setAttractionSuggestions([]);
      return;
    }

    if (suggestionCacheRef.current.has(query)) {
      setAttractionSuggestions(suggestionCacheRef.current.get(query));
      return;
    }

    const results = sidebarSuggestionSource
      .filter(item => item.label.toLowerCase().includes(query) || (item.meta || '').toLowerCase().includes(query))
      .slice(0, 8);

    suggestionCacheRef.current.set(query, results);
    setAttractionSuggestions(results);
  }, [debouncedAttractionSearch, sidebarSuggestionSource]);

  const savedSuggestions = useMemo(() => {
    const query = (debouncedSavedSearch || '').trim().toLowerCase();
    if (!query || query.length < 2) return [];
    return savedItineraries
      .filter(item => `${item.name || ''} ${item.description || ''}`.toLowerCase().includes(query))
      .slice(0, 8)
      .map(item => ({
        id: `saved-${item.itinerary_id}`,
        label: item.name || 'Untitled Itinerary',
        meta: `${item.status || 'draft'} • ${new Date(item.created_at).toLocaleDateString()}`,
        value: item.name || ''
      }));
  }, [debouncedSavedSearch, savedItineraries]);

  const filteredAttractions = useMemo(() => {
    const searchTerm = (debouncedAttractionSearch || '').trim().toLowerCase();
    const minFee = sidebarMinFee === '' ? null : parseFloat(sidebarMinFee);
    const maxFee = sidebarMaxFee === '' ? null : parseFloat(sidebarMaxFee);
    const maxDistance = sidebarMaxDistance === '' ? null : parseFloat(sidebarMaxDistance);

    const list = attractions.filter(a => {
      const haystack = `${a.name || ''} ${a.description || ''} ${a.location || ''} ${a.municipality || ''}`.toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm);
      const matchesCategory = sidebarCategories.length === 0 || sidebarCategories.includes((a.category || '').toLowerCase());
      const matchesRating = sidebarMinRating <= 0 || (parseFloat(a.avg_rating) || 0) >= sidebarMinRating;
      const fee = parseFloat(a.entrance_fee || a.price || 0);
      const matchesMinFee = minFee === null || fee >= minFee;
      const matchesMaxFee = maxFee === null || fee <= maxFee;
      return matchesSearch && matchesCategory && matchesRating && matchesMinFee && matchesMaxFee;
    });

    const withDistance = list.map(a => {
      const lat = parseFloat(a.latitude);
      const lng = parseFloat(a.longitude);
      const valid = !Number.isNaN(lat) && !Number.isNaN(lng);
      const distance = valid
        ? Math.sqrt(Math.pow(lat - 13.3333, 2) + Math.pow(lng - 121.3, 2))
        : Number.MAX_SAFE_INTEGER;
      return { ...a, _distance: distance, _fee: parseFloat(a.entrance_fee || a.price || 0) };
    });

    const distanceFiltered = withDistance.filter(a => {
      if (maxDistance === null || Number.isNaN(maxDistance)) return true;
      if (a._distance === Number.MAX_SAFE_INTEGER) return false;
      return a._distance <= maxDistance;
    });

    distanceFiltered.sort((a, b) => {
      if (sidebarSort === 'rated') return (parseFloat(b.avg_rating) || 0) - (parseFloat(a.avg_rating) || 0);
      if (sidebarSort === 'nearest') return a._distance - b._distance;
      return (parseInt(b.review_count) || 0) - (parseInt(a.review_count) || 0);
    });
    return distanceFiltered;
  }, [
    attractions,
    debouncedAttractionSearch,
    sidebarCategories,
    sidebarMinRating,
    sidebarMinFee,
    sidebarMaxFee,
    sidebarMaxDistance,
    sidebarSort
  ]);

  const attractionsTotalPages = Math.max(1, Math.ceil(filteredAttractions.length / ATTR_PER_PAGE));
  const visibleAttractions = filteredAttractions.slice((attractionsPage - 1) * ATTR_PER_PAGE, attractionsPage * ATTR_PER_PAGE);

  useEffect(() => {
    setAttractionsPage(1);
  }, [sidebarCategories, sidebarMinRating, sidebarMinFee, sidebarMaxFee, sidebarMaxDistance, sidebarSort]);

  useEffect(() => {
    setAttractionsPage(p => Math.min(p, attractionsTotalPages));
  }, [attractionsTotalPages]);

  const filteredSavedItineraries = useMemo(() => {
    const query = debouncedSavedSearch.trim().toLowerCase();
    const minBudget = savedBudgetMin === '' ? null : parseFloat(savedBudgetMin);
    const maxBudget = savedBudgetMax === '' ? null : parseFloat(savedBudgetMax);

    const filtered = savedItineraries.filter((saved) => {
      // Exclude archived itineraries
      if (saved.status === 'archived') return false;
      
      const matchesQuery = !query || `${saved.name || ''} ${saved.description || ''} ${saved.status || ''}`.toLowerCase().includes(query);
      const matchesStatus = savedStatusFilter === 'all' || (saved.status || 'draft') === savedStatusFilter;
      const budget = parseFloat(saved.total_budget || 0);
      const matchesBudgetMin = minBudget === null || budget >= minBudget;
      const matchesBudgetMax = maxBudget === null || budget <= maxBudget;
      return matchesQuery && matchesStatus && matchesBudgetMin && matchesBudgetMax;
    });

    filtered.sort((a, b) => {
      if (savedSort === 'budgetHigh') return (parseFloat(b.total_budget) || 0) - (parseFloat(a.total_budget) || 0);
      if (savedSort === 'budgetLow') return (parseFloat(a.total_budget) || 0) - (parseFloat(b.total_budget) || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return filtered;
  }, [savedItineraries, debouncedSavedSearch, savedStatusFilter, savedBudgetMin, savedBudgetMax, savedSort]);

  const savedTotalPages = Math.max(1, Math.ceil(filteredSavedItineraries.length / SAVED_PER_PAGE));
  const visibleSavedItineraries = filteredSavedItineraries.slice((savedPage - 1) * SAVED_PER_PAGE, savedPage * SAVED_PER_PAGE);

  // Count only non-archived itineraries
  const activeItinerariesCount = savedItineraries.filter(i => i.status !== 'archived').length;

  useEffect(() => {
    setSavedPage(1);
  }, [savedSearch, savedStatusFilter, savedBudgetMin, savedBudgetMax, savedSort]);

  useEffect(() => {
    setSavedPage(p => Math.min(p, savedTotalPages));
  }, [savedTotalPages]);

  const highlightMatch = (text = '', query = '') => {
    const q = query.trim();
    if (!q) return text;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: '#fef08a', padding: '0 2px', borderRadius: 3 }}>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const sortedDayNumbers = useMemo(
    () => Object.keys(itemsByDay)
      .map((day) => parseInt(day, 10))
      .filter((day) => Number.isFinite(day))
      .sort((a, b) => a - b),
    [itemsByDay]
  );

  const scrollToSection = (ref) => {
    ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const parseTemplateDurationDays = (durationText = '') => {
    const match = String(durationText).match(/(\d+)\s*day/i);
    if (match) {
      return Math.max(1, parseInt(match[1], 10) || 1);
    }

    return 1;
  };

  const recommendedTemplates = useMemo(() => templates.slice(0, 3), [templates]);

  const ShowMoreChips = ({ items, activeItems, onToggle, limit = 6 }) => {
    const [expanded, setExpanded] = useState(false);
    const visible = expanded ? items : items.slice(0, limit);
    const hasMore = items.length > limit;
    return (
      <div style={styles.chipGrid}>
        {visible.map((item) => {
          const active = activeItems.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              style={active ? styles.chipButtonActive : styles.chipButton}
            >
              {item}
            </button>
          );
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            style={styles.showMoreBtn}
          >
            {expanded ? '▲ Less' : `+${items.length - limit} more`}
          </button>
        )}
      </div>
    );
  };

  const applyTemplate = (template) => {
    if (!template) return;

    const selectedAttractions = (template.attractions || [])
      .map((templateAttractionId) => attractions.find((attraction) => String(attraction.id) === String(templateAttractionId)))
      .filter(Boolean);

    if (selectedAttractions.length === 0) {
      alert('This template does not have matching attractions yet.');
      return;
    }

    const confirmReplace = Object.values(itemsByDay).some((dayItems) => (dayItems || []).length > 0)
      ? window.confirm('Applying this template will replace the current draft itinerary. Continue?')
      : true;

    if (!confirmReplace) return;

    const templateDays = parseTemplateDurationDays(template.duration);
    const nextItemsByDay = {};

    for (let day = 1; day <= templateDays; day += 1) {
      nextItemsByDay[day] = [];
    }

    selectedAttractions.forEach((attraction, index) => {
      const day = (index % templateDays) + 1;
      const estimatedCost = parseFloat(attraction.entrance_fee || attraction.price || 0) || 0;
      const item = {
        item_type: 'attraction',
        attraction_id: attraction.id,
        custom_name: attraction.name,
        custom_location: attraction.location,
        latitude: attraction.latitude,
        longitude: attraction.longitude,
        day_number: day,
        order_in_day: nextItemsByDay[day].length,
        duration_minutes: 120,
        estimated_cost: estimatedCost,
        priority: 'medium',
        weather_dependent: false
      };

      nextItemsByDay[day].push({ ...attraction, ...item });
    });

    // Calculate start and end dates
    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (templateDays - 1));
    const endDateStr = endDate.toISOString().split('T')[0];

    setItinerary((prev) => ({
      ...prev,
      name: template.name || template.title || prev.name,
      description: template.description || prev.description,
      durationDays: templateDays,
      startDate: startDateStr,
      endDate: endDateStr,
      status: 'draft'
    }));
    setItemsByDay(nextItemsByDay);
    setCurrentDay(1);
    setEditingItineraryId(null);
    setSelectedTemplateId(template.id || template.template_id || template.title || template.name || null);
    scrollToSection(dayPlannerRef);
  };
  
  return (
    <div style={styles.page}>
      <HeroSlideshow 
        title={t('smart_itinerary_planner')}
        subtitle={t('plan_perfect_trip')}
        height="400px"
        showControls={false}
      />

      <div style={plannerGuideStyle}>
        <div style={isMobile ? styles.plannerGuideCardMobile : styles.plannerGuideCard}>
          <div style={styles.plannerGuideCopy}>
            <div style={styles.plannerGuideLabel}>Quick start</div>
            <h2 style={styles.plannerGuideTitle}>Trip planning at a glance</h2>
            <p style={styles.plannerGuideText}>
              Search an attraction, add it to the right day with one tap, and review the budget before saving.
            </p>
          </div>
          <div style={styles.plannerGuideActions}>
            <button type="button" style={styles.plannerGuideButton} onClick={() => scrollToSection(sidebarRef)}>
              1. Find places
            </button>
            <button type="button" style={styles.plannerGuideButton} onClick={() => scrollToSection(dayPlannerRef)}>
              2. Arrange days
            </button>
            <button type="button" style={styles.plannerGuideButtonPrimary} onClick={() => scrollToSection(budgetPanelRef)}>
              3. Check budget
            </button>
          </div>
        </div>
      </div>
      
      <div style={containerStyle}>
        {/* Sidebar */}
        <div ref={sidebarRef} style={sidebarStyle}>
          <div style={styles.tabs}>
            <button 
              style={!showTemplates ? styles.tabActive : styles.tab}
              onClick={() => setShowTemplates(false)}
            >
              <Icons.LocationIcon size={18} color={!showTemplates ? THEME.primary : THEME.textSecondary} />
              <span>{t('attractions')}</span>
            </button>
            <button 
              style={showTemplates ? styles.tabActive : styles.tab}
              onClick={() => setShowTemplates(true)}
            >
              <Icons.BookingIcon size={18} color={showTemplates ? THEME.primary : THEME.textSecondary} />
              <span>{t('templates')}</span>
            </button>
          </div>
          
          {!showTemplates ? (
            <div style={styles.attractionsList}>
              <div className="itinerary-search-shell">
                <SearchInput
                  value={attractionSearch}
                  onChange={setAttractionSearch}
                  placeholder={(() => {
                    const value = t('search_attractions_locations');
                    return typeof value === 'string' && value !== 'search_attractions_locations'
                      ? value
                      : 'Search attractions';
                  })()}
                  ariaLabel={(() => {
                    const value = t('search_attractions_locations');
                    return typeof value === 'string' && value !== 'search_attractions_locations'
                      ? value
                      : 'Search attractions';
                  })()}
                  onClear={() => setAttractionSearch('')}
                  suggestions={attractionSuggestions}
                  onSelectSuggestion={(item) => setAttractionSearch(item.value || item.label)}
                  isLoading={attractionSearchLoading}
                  showSuggestions={showAttractionSuggestions}
                  setShowSuggestions={setShowAttractionSuggestions}
                  className="itinerary-search-input-wrap"
                  inputClassName="itinerary-search-input"
                  clearButtonClassName="itinerary-search-clear"
                  dropdownClassName="itinerary-search-dropdown"
                  itemClassName="itinerary-search-item"
                  loadingClassName="itinerary-search-loading"
                />

                { /* left sidebar toggle removed to keep original layout */ }

                <div id="itinerarySidebarFilters" className={`itinerary-filter-panel${showSidebarFilters ? ' is-open' : ''}`}>
                  <div style={styles.filterHeaderRow}>
                    <div>
                      <div style={styles.filterSectionTitle}>{t('filters_button')}</div>
                      <div style={styles.filterSectionHint}>These filters only narrow the attractions shown below.</div>
                    </div>
                    <button
                      type="button"
                      style={styles.resetFilterBtn}
                      onClick={() => {
                        setAttractionSearch('');
                        setSidebarCategories([]);
                        setSidebarMinRating(0);
                        setSidebarMinFee('');
                        setSidebarMaxFee('');
                        setSidebarMaxDistance('');
                        setSidebarSort('popular');
                      }}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="itinerary-filter-group">
                    <label className="itinerary-filter-label">{t('category')}</label>
                    <ShowMoreChips
                      items={categoryOptions}
                      activeItems={sidebarCategories}
                      onToggle={(c) => setSidebarCategories(prev =>
                        prev.includes(c) ? prev.filter(v => v !== c) : [...prev, c]
                      )}
                    />
                  </div>

                  <div className="itinerary-filter-grid">
                    <div className="itinerary-filter-group">
                      <label className="itinerary-filter-label" htmlFor="rating-select">{t('rating')}</label>
                      <CustomDropdown
                        value={sidebarMinRating}
                        fullWidth
                        triggerStyle={styles.sidebarFilterSelect}
                        options={[
                          { value: 0, label: t('filter_rating_any') },
                          { value: 4, label: `4${t('filter_stars_suffix')}` },
                          { value: 3, label: `3${t('filter_stars_suffix')}` },
                          { value: 2, label: `2${t('filter_stars_suffix')}` },
                        ]}
                        onChange={(val) => setSidebarMinRating(parseInt(val, 10))}
                      />
                    </div>
                    <div className="itinerary-filter-group">
                      <label className="itinerary-filter-label" htmlFor="sort-select">{t('sort_by')}</label>
                      <CustomDropdown
                        value={sidebarSort}
                        fullWidth
                        triggerStyle={styles.sidebarFilterSelect}
                        options={[
                          { value: 'popular', label: t('sort_popular') },
                          { value: 'rated', label: t('sort_highest_rated') },
                          { value: 'nearest', label: t('sort_nearest') },
                        ]}
                        onChange={setSidebarSort}
                      />
                    </div>
                  </div>

                  <div className="itinerary-filter-group">
                    <label className="itinerary-filter-label" htmlFor="distance-input">{t('max_distance_from_naujan')} (km)</label>
                    <input
                      id="distance-input"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder={t('for_example_10')}
                      value={sidebarMaxDistance}
                      onChange={(e) => setSidebarMaxDistance(e.target.value)}
                      className="itinerary-filter-input"
                    />
                  </div>
                </div>

                <FilterChips
                  className="itinerary-active-chips"
                  chipClassName="itinerary-active-chip"
                  clearClassName="itinerary-clear-all-btn"
                  chips={[
                    attractionSearch ? { key: 'q', label: `${t('search')}: ${attractionSearch}`, onRemove: () => setAttractionSearch('') } : null,
                    ...sidebarCategories.map(c => ({ key: `c-${c}`, label: c, onRemove: () => setSidebarCategories(prev => prev.filter(v => v !== c)) })),
                    sidebarMinRating > 0 ? { key: 'r', label: `${sidebarMinRating}${t('filter_stars_suffix')}`, onRemove: () => setSidebarMinRating(0) } : null,
                    sidebarMinFee !== '' ? { key: 'minFee', label: `${t('min_fee')}: ${sidebarMinFee}`, onRemove: () => setSidebarMinFee('') } : null,
                    sidebarMaxFee !== '' ? { key: 'maxFee', label: `${t('max_fee')}: ${sidebarMaxFee}`, onRemove: () => setSidebarMaxFee('') } : null,
                    sidebarMaxDistance !== '' ? { key: 'dist', label: `${t('within')} ${sidebarMaxDistance} km`, onRemove: () => setSidebarMaxDistance('') } : null
                  ]}
                  onClearAll={() => {
                    setAttractionSearch('');
                    setSidebarCategories([]);
                    setSidebarMinRating(0);
                    setSidebarMinFee('');
                    setSidebarMaxFee('');
                    setSidebarMaxDistance('');
                    setSidebarSort('popular');
                  }}
                />

                <p style={styles.sidebarResultCount}>{filteredAttractions.length}{t('attractions_found_count')}</p>
              </div>

              {attractionsLoading ? (
                <div style={styles.skeletonList}>
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx} style={styles.skeletonCard}>
                      <div style={styles.skeletonImage} />
                      <div style={styles.skeletonLineWide} />
                      <div style={styles.skeletonLineShort} />
                    </div>
                  ))}
                </div>
              ) : visibleAttractions.length === 0 ? (
                <div style={styles.emptyAttractionsState}>
                  <p style={{ margin: 0, color: THEME.textSecondary }}>{t('no_attractions_found')}</p>
                </div>
              ) : (
                visibleAttractions.map(attraction => (
                  <div key={attraction.id} style={styles.attractionCard}>
                    <img src={attraction.image_url} alt={attraction.name} style={styles.attractionImage} />
                    <div style={styles.attractionInfo}>
                      <h4>{highlightMatch(attraction.name, debouncedAttractionSearch)}</h4>
                      <p style={styles.location}>
                        <Icons.LocationIcon size={14} color={THEME.textSecondary} />
                        <span>{highlightMatch(attraction.location || '', debouncedAttractionSearch)}</span>
                      </p>
                      <p style={styles.sidebarMetaText}>
                        {(parseFloat(attraction.avg_rating) || 0) > 0 ? `${Number(attraction.avg_rating).toFixed(1)}★` : t('no_reviews_yet')}
                        {' • '}
                        {(parseInt(attraction.review_count) || 0)} {t('reviews')}
                      </p>

                      <div style={styles.dayActionWrap}>
                        <div style={styles.dayActionHeader}>
                          <span style={styles.dayActionLabel}>{t('add_to_day')}</span>
                          <span style={styles.dayActionHint}>Tap a day to add this place instantly</span>
                        </div>
                        <div style={styles.dayActionButtons}>
                          <button
                            type="button"
                            onClick={() => addToDay(attraction, currentDay)}
                            style={styles.dayActionPrimaryButton}
                          >
                            + {t('day')} {currentDay}
                          </button>
                          {sortedDayNumbers.map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => addToDay(attraction, day)}
                              style={day === currentDay ? styles.dayActionButtonActive : styles.dayActionButton}
                            >
                              {t('day')} {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {!attractionsLoading && filteredAttractions.length > ATTR_PER_PAGE && (
                <div style={styles.sidebarPaginationWrap}>
                  <button
                    style={attractionsPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
                    disabled={attractionsPage === 1}
                    onClick={() => setAttractionsPage(p => Math.max(1, p - 1))}
                  >
                    {t('prev')}
                  </button>
                  {Array.from({ length: attractionsTotalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
                    <button
                      key={page}
                      style={page === attractionsPage ? styles.pageBtnActive : styles.pageBtn}
                      onClick={() => setAttractionsPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    style={attractionsPage === attractionsTotalPages ? styles.pageBtnDisabled : styles.pageBtn}
                    disabled={attractionsPage === attractionsTotalPages}
                    onClick={() => setAttractionsPage(p => Math.min(attractionsTotalPages, p + 1))}
                  >
                    {t('next')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={styles.templatesList}>
              <div style={styles.templatesIntro}>
                <h3 style={styles.templatesIntroTitle}>{t('templates')}</h3>
                <p style={styles.templatesIntroText}>Start with a ready-made trip layout. Choose one and the planner will add the matching places for you.</p>
              </div>
              <div style={styles.templatesRecommendations}>
                <div style={styles.templatesRecommendationsHeader}>
                  <div>
                    <h4 style={styles.templatesRecommendationsTitle}>Recommended templates</h4>
                    <p style={styles.templatesRecommendationsText}>Tap a template to apply it. You can keep clicking other templates to compare different trip ideas.</p>
                  </div>
                  <span style={styles.templatesRecommendationsPill}>{recommendedTemplates.length} ready-made plans</span>
                </div>
                <div style={styles.templatesRecommendationRow}>
                  {recommendedTemplates.map((template) => {
                    const templateId = template.id || template.template_id || template.title || template.name;
                    const templateAttractions = (template.attractions || [])
                      .map((templateAttractionId) => attractions.find((attraction) => String(attraction.id) === String(templateAttractionId)))
                      .filter(Boolean);

                    return (
                      <button
                        key={templateId}
                        type="button"
                        onClick={() => applyTemplate(template)}
                        style={{
                          ...styles.recommendedTemplateCard,
                          ...(selectedTemplateId === templateId ? styles.recommendedTemplateCardActive : {})
                        }}
                      >
                        <div style={styles.templateBadge}>{template.category || 'Template'}</div>
                        <h4 style={styles.templateTitle}>{template.name || template.title}</h4>
                        <p style={styles.templateDescription}>{template.description}</p>
                        <div style={styles.templateMeta}>
                          <span style={styles.templateMetaPill}>
                            <Icons.CalendarIcon size={14} color={THEME.textSecondary} />
                            <span>{template.duration || `${template.duration_days || 1} day${(template.duration_days || 1) > 1 ? 's' : ''}`}</span>
                          </span>
                          <span style={styles.templateMetaPill}>
                            <Icons.LocationIcon size={14} color={THEME.textSecondary} />
                            <span>{templateAttractions.length} places</span>
                          </span>
                        </div>
                        <span style={styles.recommendedTemplateAction}>{selectedTemplateId === templateId ? 'Applied' : 'Tap to apply'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div style={styles.mainContent}>
          <div style={itineraryHeaderStyle}>
            <input
              type="text"
              placeholder={t('itinerary_name_placeholder')}
              value={itinerary.name}
              onChange={(e) => setItinerary(prev => ({ ...prev, name: e.target.value }))}
              style={nameInputStyle}
            />
            <textarea
              placeholder={t('description_optional')}
              value={itinerary.description}
              onChange={(e) => setItinerary(prev => ({ ...prev, description: e.target.value }))}
              style={styles.descriptionInput}
            />
            
            <div style={dateInputsStyle}>
              <div>
                <label style={styles.label}>{t('start_date')}</label>
                <input
                  type="date"
                  value={itinerary.startDate}
                  min={new Date().toISOString().split('T')[0]}
                  max={itinerary.endDate || undefined}
                  onChange={(e) => setItinerary(prev => ({ ...prev, startDate: e.target.value }))}
                  style={styles.dateInput}
                  title={t('select_check_in_date_hint')}
                />
                <small style={{color: THEME.textSecondary, fontSize: '0.8rem', display: 'block', marginTop: '4px'}}>{t('check_in_date')}</small>
              </div>
              <div>
                <label style={styles.label}>{t('end_date')}</label>
                <input
                  type="date"
                  value={itinerary.endDate}
                  min={itinerary.startDate || undefined}
                  onChange={(e) => setItinerary(prev => ({ ...prev, endDate: e.target.value }))}
                  style={styles.dateInput}
                  title={t('select_check_out_date_hint')}
                />
                <small style={{color: THEME.textSecondary, fontSize: '0.8rem', display: 'block', marginTop: '4px'}}>{t('check_out_date')}</small>
              </div>
            </div>
            {itinerary.startDate && itinerary.endDate && (
              <div style={{padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '6px', marginTop: '10px'}}>
                <p style={{margin: 0, fontSize: '0.9rem', color: '#2e7d32'}}>
                  ✓ {t('duration')}: <strong>{itinerary.durationDays} {t('days')}</strong> ({t('auto_calculated')})
                </p>
              </div>
            )}
            
            <div style={statsBarStyle}>
              <div style={styles.stat}>
                <span style={styles.statLabel}>{t('distance')}</span>
                <span style={styles.statValue}>
                  <Icons.MapIcon size={16} color={THEME.primary} />
                  {totals.distance} km
                </span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statLabel}>{t('duration')}</span>
                <span style={styles.statValue}>
                  <Icons.ClockIcon size={16} color={THEME.primary} />
                  {Math.floor(totals.time / 60)}h {totals.time % 60}m
                </span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statLabel}>{t('est_cost')}</span>
                <span style={styles.statValue}>
                  <Icons.MoneyIcon size={16} color={THEME.primary} />
                  ₱{totals.budget.toFixed(2)}
                </span>
              </div>
              <div style={styles.stat}>
                <span style={styles.statLabel}>{t('items')}</span>
                <span style={styles.statValue}>
                  <Icons.LocationIcon size={16} color={THEME.primary} />
                  {Object.values(itemsByDay).flat().length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Day Planning */}
          <div ref={dayPlannerRef} style={styles.daysContainer}>
            <div style={styles.dayTabs}>
              {Object.keys(itemsByDay).map(day => (
                <button
                  key={day}
                  style={currentDay === parseInt(day) ? styles.dayTabActive : styles.dayTab}
                  onClick={() => setCurrentDay(parseInt(day))}
                >
                  {t('day')} {day}
                  <span style={styles.dayItemCount}>{(itemsByDay[day] || []).length}</span>
                </button>
              ))}
              {itinerary.durationDays > Object.keys(itemsByDay).length && (
                <button
                  style={styles.addDayBtn}
                  onClick={() => {
                    const nextDay = Object.keys(itemsByDay).length + 1;
                    setItemsByDay(prev => ({ ...prev, [nextDay]: [] }));
                    setCurrentDay(nextDay);
                  }}
                >
                  + {t('add_day')}
                </button>
              )}
            </div>
            
            <div ref={budgetPanelRef} style={dayContentStyle}>
              <div style={styles.dayBudgetPanel}>
                <div style={styles.dayBudgetHeaderRow}>
                  <h4 style={styles.dayBudgetTitle}>Day {currentDay} — Estimated Budget</h4>
                  <span style={styles.autoCalcBadge}>⚡ Auto-suggested</span>
                </div>
                <div style={dayBudgetBreakdownRowStyle}>
                  <div style={{ ...styles.dayBudgetBreakdownItem, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icons.RouteIcon size={14} color={THEME.primary} /> Fare
                    </span>
                    <input
                      type="number" min="0" step="1"
                      value={farePerDay[currentDay] !== undefined ? farePerDay[currentDay] : currentDayBudget.fareCost}
                      onChange={(e) => {
                        fareOverriddenRef.current[currentDay] = true;
                        setFarePerDay(prev => ({ ...prev, [currentDay]: parseFloat(e.target.value) || 0 }));
                      }}
                      style={{ ...styles.budgetInlineInput, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4', color: THEME.primary }}
                    />
                  </div>
                  <div style={styles.dayBudgetBreakdownItem}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icons.UtensilsIcon size={14} color={THEME.textSecondary} /> Food
                    </span>
                    <input
                      type="number" min="0" step="1"
                      value={foodPerDay[currentDay] !== undefined ? foodPerDay[currentDay] : DEFAULT_FOOD}
                      onChange={(e) => setFoodPerDay(prev => ({ ...prev, [currentDay]: parseFloat(e.target.value) || 0 }))}
                      style={styles.budgetInlineInput}
                    />
                  </div>
                  <div style={styles.dayBudgetBreakdownItem}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Icons.SparklesIcon size={14} color={THEME.textSecondary} /> Other
                    </span>
                    <input
                      type="number" min="0" step="1"
                      value={otherPerDay[currentDay] !== undefined ? otherPerDay[currentDay] : DEFAULT_OTHER}
                      onChange={(e) => setOtherPerDay(prev => ({ ...prev, [currentDay]: parseFloat(e.target.value) || 0 }))}
                      style={styles.budgetInlineInput}
                    />
                  </div>
                  <div style={{ ...styles.dayBudgetBreakdownItem, gridColumn: 'span 3', backgroundColor: '#ecfdf3', borderColor: '#bbf7d0' }}>
                    <span style={{ fontWeight: 700 }}>Total Estimated</span>
                    <strong style={{ color: '#15803d', fontSize: '1rem' }}>₱{currentDayBudget.estimatedNeed.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {(itemsByDay[currentDay] || []).length === 0 ? (
                <div style={styles.emptyDay}>
                  <Icons.LocationIcon size={48} color={THEME.textSecondary} />
                  <p style={{marginTop: '1rem'}}>{t('no_items_planned')}</p>
                  <p style={styles.emptyDayHint}>{t('select_attractions_hint')}</p>
                </div>
              ) : (
                <div style={styles.dayItems}>
                  {itemsByDay[currentDay].map((item, index) => (
                    <div key={index} style={styles.dayItem}>
                      <div style={styles.itemNumber}>{index + 1}</div>
                      <div style={styles.itemDetails}>
                        <h4>{item.custom_name || item.name}</h4>
                        <p style={styles.itemLocation}>
                          <Icons.LocationIcon size={14} color={THEME.textSecondary} />
                          <span>{item.custom_location || item.location}</span>
                        </p>
                        <div style={styles.itemMeta}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <Icons.ClockIcon size={14} color={THEME.textSecondary} />
                            <CustomDropdown
                              value={timeOfDayForMinutes(item.duration_minutes || 120)}
                              options={TIME_OF_DAY_OPTIONS}
                              onChange={(val) => {
                                const mins = MINUTES_BY_TIME_OF_DAY[val] || 120;
                                setItemsByDay(prev => ({
                                  ...prev,
                                  [currentDay]: prev[currentDay].map((it, i) =>
                                    i === index ? { ...it, duration_minutes: mins } : it
                                  )
                                }));
                              }}
                            />
                          </div>

                          <span style={styles.priorityBadge(item.priority)}>
                            {item.priority || 'medium'}
                          </span>
                        </div>
                        {weather[item.id] && (
                          <div style={styles.weatherBadge}>
                            {weather[item.id].condition} {weather[item.id].temperature}°C
                          </div>
                        )}
                      </div>
                      <button
                        style={styles.removeBtn}
                        onClick={() => removeFromDay(currentDay, index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Interactive Map - Connected to Itinerary */}
          {allPlannedItems.length > 0 && (
            <div style={mapContainerStyle}>
              {/* Auto-calculated route summary ABOVE the map */}
              <div style={styles.routeSummary}>

                {/* ── Banner ── */}
                <div style={styles.routeBanner}>
                  <div style={styles.routeBannerLeft}>
                    <div style={styles.routeBannerIconWrap}>
                      <Icons.RouteIcon size={20} color="#fff" />
                    </div>
                    <div>
                      <div style={styles.routeBannerTitle}>Auto-calculated Route</div>
                      <div style={styles.routeBannerSub}>Live overview · updates as you plan</div>
                    </div>
                  </div>
                  <div style={styles.routeBannerBadges}>
                    <span style={styles.routeBannerBadge}>
                      <Icons.LocationIcon size={12} color="#a7f3d0" />
                      {allPlannedItems.length} stop{allPlannedItems.length !== 1 ? 's' : ''}
                    </span>
                    <span style={styles.routeBannerBadge}>
                      <Icons.CalendarIcon size={12} color="#a7f3d0" />
                      {itinerary.durationDays} day{itinerary.durationDays !== 1 ? 's' : ''}
                    </span>
                    {userLocation
                      ? <span style={{...styles.routeBannerBadge, background:'rgba(167,243,208,0.2)', border:'1px solid rgba(167,243,208,0.4)'}}>
                          <Icons.MapPinIcon size={12} color="#6ee7b7" /> GPS on
                        </span>
                      : locationError
                        ? <span style={{...styles.routeBannerBadge, background:'rgba(252,165,165,0.15)', border:'1px solid rgba(252,165,165,0.3)'}}>
                            <Icons.InfoIcon size={12} color="#fca5a5" /> No GPS
                          </span>
                        : <span style={styles.routeBannerBadge}>
                            <Icons.LoaderIcon size={12} color="#a7f3d0" /> Locating…
                          </span>}
                  </div>
                </div>

                {/* ── 4 stat cards ── */}
                <div style={routeStatsRowStyle}>
                  {[
                    { icon: <Icons.MapIcon size={20} color="#16a34a" />, bg:'#dcfce7', accent:'#16a34a', label:'Road Distance', value: routeInfo ? `${routeInfo.distance} km` : `${totals.distance} km`, sub:'via road network' },
                    { icon: <Icons.ClockIcon size={20} color="#0891b2" />, bg:'#cffafe', accent:'#0891b2', label:'Drive Time', value: routeInfo ? (routeInfo.duration >= 60 ? `${Math.floor(routeInfo.duration/60)}h ${routeInfo.duration%60}m` : `${routeInfo.duration} min`) : 'Calculating…', sub:'road travel only' },
                    { icon: <Icons.LocationIcon size={20} color="#d97706" />, bg:'#fef3c7', accent:'#d97706', label:'Time at Stops', value:`${Math.floor(totals.time/60)}h ${totals.time%60}m`, sub:`${allPlannedItems.length} destination${allPlannedItems.length!==1?'s':''}` },
                    { icon: <Icons.SparklesIcon size={20} color="#7c3aed" />, bg:'#ede9fe', accent:'#7c3aed', label:'Total Trip Time', value:(() => { const tt = totals.time+(routeInfo?routeInfo.duration:0); return tt>=60?`${Math.floor(tt/60)}h ${tt%60}m`:`${tt} min`; })(), sub:'drive + all stops' }
                  ].map((c, i) => (
                    <div key={i} style={styles.routeStatCard}>
                      <div style={{width:'40px',height:'40px',borderRadius:'10px',background:c.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{c.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:'0.68rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:THEME.textSecondary,marginBottom:'0.15rem'}}>{c.label}</div>
                        <div style={{fontSize:'1.35rem',fontWeight:900,color:c.accent,lineHeight:1.1}}>{c.value}</div>
                        <div style={{fontSize:'0.7rem',color:THEME.textSecondary,marginTop:'0.15rem'}}>{c.sub}</div>
                      </div>
                      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'3px',background:c.accent,borderRadius:'0 0 12px 12px'}} />
                    </div>
                  ))}
                </div>

                {/* ── Fare Estimate ── */}
                {(() => {
                  const rawDist = routeInfo ? routeInfo.distance : totals.distance;
                  const dist = Number(rawDist ?? 0);
                  const safeDist = Number.isFinite(dist) ? dist : 0;
                  const fareVehicles = [
                    { key: 'tricycle',   label: 'Tricycle',    color: '#d97706', bg: '#fef3c7', note: 'Negotiate fare' },
                    { key: 'jeepney',    label: 'Jeepney',     color: '#0891b2', bg: '#cffafe', note: 'Fixed route' },
                    { key: 'bus',        label: 'Bus',         color: '#7c3aed', bg: '#ede9fe', note: 'Long distance' },
                    { key: 'motorcycle', label: 'Habal-habal', color: '#16a34a', bg: '#dcfce7', note: 'Flexible route' },
                  ];
                  return (
                    <div style={styles.fareEstimateWrap}>
                      <div style={styles.fareEstimateHeader}>
                        <Icons.MoneyIcon size={14} color="#d97706" />
                        <span>Suggested Fare Estimate</span>
                        <span style={styles.fareEstimateNote}>Based on {safeDist.toFixed(1)} km · Actual fare may vary</span>
                      </div>
                      <div style={styles.fareEstimateGrid}>
                        {fareVehicles.map(v => {
                          const mode = TRANSPORT_MODES[v.key];
                          const low  = Math.ceil(mode.base + safeDist * mode.perKm);
                          const high = Math.ceil(mode.base + safeDist * mode.perKm * 1.4);
                          const isSelected = globalTransportMode === v.key;
                          return (
                            <div
                              key={v.key}
                              onClick={() => setGlobalTransportMode(v.key)}
                              style={{
                                ...styles.fareCard,
                                cursor: 'pointer',
                                border: isSelected ? `2px solid ${v.color}` : '1px solid #fde68a',
                                boxShadow: isSelected ? `0 0 0 3px ${v.color}22` : 'none'
                              }}
                            >
                              <div style={{...styles.fareCardAccent, background: v.color}} />
                              <div style={{...styles.fareCardIconBox, background: v.bg}}>
                                <Icons.MoneyIcon size={16} color={v.color} />
                              </div>
                              <div style={styles.fareCardBody}>
                                <div style={styles.fareCardLabel}>{v.label}</div>
                                <div style={{...styles.fareCardRange, color: v.color}}>₱{low}–₱{high}</div>
                                <div style={styles.fareCardNote}>{isSelected ? '✓ Selected for budget' : v.note}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={styles.fareDisclaimer}>
                        <Icons.InfoIcon size={12} color="#d97706" />
                        <span>Tricycle fares in Naujan are often negotiated. Always agree on the fare before boarding.</span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Vertical stop timeline ── */}
                <div style={styles.routeTimelineWrap}>
                  <div style={styles.routeTimelineHeader}>
                    <Icons.RouteIcon size={14} color="#16a34a" />
                    <span>Stop-by-stop order</span>
                  </div>
                  <div style={styles.routeTimelineScroll}>
                    {(userLocation ? [{_isYou:true}, ...allPlannedItems] : allPlannedItems).slice(0,8).map((item, i, arr) => {
                      const isYou = item._isYou;
                      const isLast = i === arr.length - 1;
                      const dotColor = isYou ? '#16a34a' : isLast ? '#0f766e' : '#16a34a';
                      return (
                        <div key={i} style={{display:'flex',alignItems:'flex-start',gap:'0.75rem'}}>
                          <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0}}>
                            <div style={{width:'12px',height:'12px',borderRadius:'50%',background:dotColor,boxShadow:`0 0 0 3px ${dotColor}25`,flexShrink:0,marginTop:'3px'}} />
                            {!isLast && <div style={{width:'2px',flex:1,minHeight:'20px',background:'linear-gradient(180deg,#bbf7d0,#d1fae5)',margin:'3px 0'}} />}
                          </div>
                          <div style={{paddingBottom: isLast ? 0 : '0.6rem', minWidth:0}}>
                            <div style={{fontSize:'0.82rem',fontWeight:700,color:THEME.text,lineHeight:1.3,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'260px'}}>
                              {isYou ? 'Your location' : (item.custom_name || item.name || '')}
                            </div>
                            {!isYou && <div style={{fontSize:'0.7rem',color:THEME.textSecondary,marginTop:'1px'}}>Day {item.day_number}</div>}
                          </div>
                        </div>
                      );
                    })}
                    {allPlannedItems.length > 7 && (
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginTop:'0.25rem'}}>
                        <div style={{width:'12px',height:'12px',borderRadius:'50%',background:'#94a3b8',flexShrink:0}} />
                        <span style={{fontSize:'0.78rem',color:THEME.textSecondary,fontWeight:600}}>+{allPlannedItems.length - 7} more stops</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <LeafletMap
                center={mapCenter}
                zoom={12}
                markers={mapMarkers}
                autoRouteWaypoints={mapRouteWaypoints}
                userLocation={userLocation}
                style={{ height: '480px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 18px 44px rgba(15, 23, 42, 0.12)' }}
                onRoutingChange={setRouteInfo}
                onMarkerClick={(marker) => {
                  // Auto-scroll to day with this item
                  const matchingDay = Object.keys(itemsByDay).find((day) =>
                    (itemsByDay[day] || []).some((item) =>
                      parseFloat(item.latitude) === marker.lat && parseFloat(item.longitude) === marker.lng
                    )
                  );

                  if (matchingDay) {
                    setCurrentDay(parseInt(matchingDay, 10));
                  }
                }}
              />

              <small style={{display: 'block', marginTop: '10px', color: THEME.textSecondary}}>
                <div style={styles.routeTip}>
                  <Icons.SparklesIcon size={16} color="#f59e0b" style={{flexShrink: 0, marginTop: '2px'}} />
                  <div>
                    <strong>Tip:</strong> Click on any destination marker to navigate to it in your itinerary. Organize by date to auto-calculate trip duration.
                  </div>
                </div>
              </small>
            </div>
          )}
          
          {/* Actions */}
          <div style={actionButtonsStyle}>
            <button style={styles.saveBtn} onClick={saveItinerary}>
              <Icons.BookingIcon size={20} color="white" />
              Save Itinerary
            </button>
            <button style={styles.shareBtn} onClick={() => window.print()}>
              <Icons.GlobeIcon size={20} color="white" />
              Share
            </button>
            <button style={styles.exportBtn} onClick={() => window.print()}>
              <Icons.BookingIcon size={20} color="white" />
              Print/Export
            </button>
          </div>
        </div>
        
        {/* Right Panel */}
        <div style={{...rightPanelStyle, ...rightPanelOrder}}>
          <div style={summaryCardStyle}>
            <h3>Trip Summary</h3>
            <div style={styles.summaryItem}>
              <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <Icons.CalendarIcon size={16} color={THEME.textSecondary} />
                Duration
              </span>
              <strong>{itinerary.durationDays} days</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <Icons.LocationIcon size={16} color={THEME.textSecondary} />
                Destinations
              </span>
              <strong>{Object.values(itemsByDay).flat().length}</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <Icons.MapIcon size={16} color={THEME.textSecondary} />
                Distance
              </span>
              <strong>{totals.distance} km</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <Icons.ClockIcon size={16} color={THEME.textSecondary} />
                Travel Time
              </span>
              <strong>{Math.floor(totals.time / 60)}h {totals.time % 60}m</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <Icons.MoneyIcon size={16} color={THEME.textSecondary} />
                Budget
              </span>
              <strong>₱{totals.budget.toFixed(2)}</strong>
            </div>
          </div>
          
          <div style={savedListStyle}>
              <div className="saved-itinerary-header-row">
              <h3>Saved Itineraries ({activeItinerariesCount})</h3>
              { /* saved filters toggle removed to preserve original layout */ }
            </div>

            <SearchInput
              value={savedSearch}
              onChange={setSavedSearch}
              placeholder={t('admin_search_itineraries_placeholder')}
              ariaLabel={t('admin_search_itineraries_placeholder')}
              onClear={() => setSavedSearch('')}
              suggestions={savedSuggestions}
              onSelectSuggestion={(item) => setSavedSearch(item.value || item.label)}
              isLoading={savedSearchLoading}
              showSuggestions={showSavedSuggestions}
              setShowSuggestions={setShowSavedSuggestions}
              className="saved-search-wrap"
              inputClassName="saved-search-input"
              clearButtonClassName="saved-search-clear"
              dropdownClassName="saved-search-dropdown"
              itemClassName="saved-search-item"
              loadingClassName="saved-search-loading"
            />

            <div id="savedItineraryFilters" className={`saved-filter-panel${showSavedFilters ? ' is-open' : ''}`}>
              {/* Quick Filters Row */}
              <div className="saved-filter-grid">
                <CustomDropdown
                  value={savedStatusFilter}
                  fullWidth
                  triggerStyle={styles.savedFilterSelect}
                  title={t('admin_filter_by_status')}
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ]}
                  onChange={setSavedStatusFilter}
                />
                <CustomDropdown
                  value={savedSort}
                  fullWidth
                  triggerStyle={styles.savedFilterSelect}
                  title={t('admin_sort_itineraries')}
                  options={[
                    { value: 'recent', label: 'Most Recent' },
                    { value: 'budgetHigh', label: 'Highest Budget' },
                    { value: 'budgetLow', label: 'Lowest Budget' },
                  ]}
                  onChange={setSavedSort}
                />
              </div>

              {/* Budget Range Section */}
              <div style={{marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb'}}>
                <label style={{fontSize: '0.85rem', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px'}}>Budget Range (₱)</label>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('itinerary_min_placeholder')}
                    value={savedBudgetMin}
                    onChange={(e) => setSavedBudgetMin(e.target.value.replace(/^0+(?!$)/, ''))}
                    inputMode="numeric"
                    style={{...styles.savedBudgetInput, flex: 1}}
                    title={t('admin_min_budget')}
                  />
                  <span style={{color: '#9ca3af', fontWeight: '500'}}>to</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={t('itinerary_max_placeholder')}
                    value={savedBudgetMax}
                    onChange={(e) => setSavedBudgetMax(e.target.value.replace(/^0+(?!$)/, ''))}
                    inputMode="numeric"
                    style={{...styles.savedBudgetInput, flex: 1}}
                    title={t('admin_max_budget')}
                  />
                </div>
              </div>
            </div>

            <FilterChips
              className="saved-active-chips"
              chipClassName="saved-active-chip"
              clearClassName="saved-clear-all"
              chips={[
                savedSearch ? { key: 'saved-q', label: `Search: ${savedSearch}`, onRemove: () => setSavedSearch('') } : null,
                savedStatusFilter !== 'all' ? { key: 'saved-status', label: `Status: ${savedStatusFilter}`, onRemove: () => setSavedStatusFilter('all') } : null,
                savedBudgetMin !== '' ? { key: 'saved-min', label: `Min: ${savedBudgetMin}`, onRemove: () => setSavedBudgetMin('') } : null,
                savedBudgetMax !== '' ? { key: 'saved-max', label: `Max: ${savedBudgetMax}`, onRemove: () => setSavedBudgetMax('') } : null
              ]}
              onClearAll={() => {
                setSavedSearch('');
                setSavedStatusFilter('all');
                setSavedBudgetMin('');
                setSavedBudgetMax('');
                setSavedSort('recent');
              }}
            />

            <p style={styles.savedResultsInfo}>{filteredSavedItineraries.length} matching itineraries</p>
            {visibleSavedItineraries.map((saved, idx) => (
              <div 
                key={saved.itinerary_id} 
                style={savedItemCardStyle}
                onClick={() => navigate(`/itinerary/${saved.itinerary_id}`)}
              >
                <div style={styles.savedItemNumber}>{idx + 1}</div>
                <div style={styles.savedItemContent}>
                  <h4 style={{margin: '0 0 0.5rem 0'}}>{saved.name}</h4>
                  <p style={{fontSize: '0.85rem', color: '#666', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <Icons.CalendarIcon size={14} color="#666" />
                    {new Date(saved.created_at).toLocaleDateString()}
                  </p>
                  <div style={styles.savedItemMetaGrid}>
                    <div style={styles.savedMetaItem}>
                      <span style={styles.savedMetaLabel}>
                        <Icons.MoneyIcon size={12} color="#999" />
                        Budget
                      </span>
                      <span style={styles.savedMetaValue}>₱{Number(saved.total_budget || 0).toFixed(2)}</span>
                    </div>
                    <div style={styles.savedMetaItem}>
                      <span style={styles.savedMetaLabel}>
                        <Icons.BookingIcon size={12} color="#999" />
                        Status
                      </span>
                      <span style={{...styles.savedMetaValue, textTransform: 'capitalize'}}>{saved.status || 'draft'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredSavedItineraries.length > SAVED_PER_PAGE && (
              <div style={styles.savedPaginationWrap}>
                <button
                  style={savedPage === 1 ? styles.pageBtnDisabled : styles.pageBtn}
                  disabled={savedPage === 1}
                  onClick={() => setSavedPage(p => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.82rem', color: THEME.textSecondary }}>Page {savedPage} of {savedTotalPages}</span>
                <button
                  style={savedPage === savedTotalPages ? styles.pageBtnDisabled : styles.pageBtn}
                  disabled={savedPage === savedTotalPages}
                  onClick={() => setSavedPage(p => Math.min(savedTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0f9ff 100%)',
    paddingBottom: '3rem'
  },
  header: {
    background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)',
    color: 'white',
    padding: '3rem 2rem',
    textAlign: 'center',
    boxShadow: THEME.shadowLarge
  },
  headerTitle: {
    fontSize: '3.5rem',
    fontWeight: '800',
    margin: '0 0 1rem 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerSubtitle: {
    fontSize: '1.2rem',
    margin: 0,
    opacity: 0.95
  },
  container: {
    display: 'grid',
    gridTemplateColumns: '350px 1fr 300px',
    gap: '1.5rem',
    padding: '2rem',
    maxWidth: '1600px',
    margin: '0 auto'
  },
  plannerGuide: {
    maxWidth: '1600px',
    margin: '1.25rem auto 0',
    padding: '0 2rem'
  },
  plannerGuideCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1.5rem',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,253,244,0.92))',
    border: '1px solid rgba(22, 163, 74, 0.12)',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
  },
  plannerGuideCardMobile: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '1.25rem',
    alignItems: 'flex-start',
    padding: '1.25rem 1.5rem',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,253,244,0.92))',
    border: '1px solid rgba(22, 163, 74, 0.12)',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)'
  },
  plannerGuideCopy: {
    minWidth: 0,
    flex: 1
  },
  plannerGuideLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.3rem 0.65rem',
    borderRadius: '999px',
    backgroundColor: '#e8f5e9',
    color: THEME.primary,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    marginBottom: '0.65rem'
  },
  plannerGuideTitle: {
    margin: 0,
    fontSize: '1.4rem',
    color: THEME.text,
    lineHeight: 1.2
  },
  plannerGuideText: {
    margin: '0.45rem 0 0',
    color: THEME.textSecondary,
    lineHeight: 1.5,
    maxWidth: '64ch'
  },
  plannerGuideActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    justifyContent: 'flex-end'
  },
  plannerGuideButton: {
    border: `1px solid ${THEME.border}`,
    backgroundColor: '#fff',
    color: THEME.text,
    borderRadius: '999px',
    padding: '0.7rem 1rem',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)'
  },
  plannerGuideButtonPrimary: {
    border: '1px solid transparent',
    backgroundColor: THEME.primary,
    color: '#fff',
    borderRadius: '999px',
    padding: '0.7rem 1rem',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 6px 18px rgba(22, 163, 74, 0.2)'
  },
  sidebar: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '24px',
    height: 'fit-content',
    position: 'sticky',
    top: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${THEME.border}`
  },
  tab: {
    flex: 1,
    padding: '1rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    color: THEME.textSecondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  tabActive: {
    flex: 1,
    padding: '1rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    color: THEME.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderBottom: `3px solid ${THEME.primary}`
  },
  attractionsList: {
    maxHeight: '70vh',
    overflowY: 'auto',
    padding: '1rem'
  },
  attractionCard: {
    marginBottom: '1rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: THEME.shadow,
    transition: 'transform 0.2s ease'
  },
  attractionImage: {
    width: '100%',
    height: '120px',
    objectFit: 'cover'
  },
  attractionInfo: {
    padding: '0.75rem'
  },
  location: {
    fontSize: '0.85rem',
    color: THEME.textSecondary,
    margin: '0.25rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dayActionWrap: {
    marginTop: '0.85rem',
    padding: '0.9rem',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: `1px solid ${THEME.border}`
  },
  dayActionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    marginBottom: '0.65rem'
  },
  dayActionLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: THEME.text,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  dayActionHint: {
    fontSize: '0.82rem',
    color: THEME.textSecondary,
    lineHeight: 1.4
  },
  dayActionButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  dayActionPrimaryButton: {
    padding: '0.55rem 0.85rem',
    borderRadius: '999px',
    border: '1px solid transparent',
    backgroundColor: THEME.primary,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    boxShadow: '0 6px 18px rgba(22, 163, 74, 0.16)'
  },
  dayActionButton: {
    padding: '0.55rem 0.8rem',
    borderRadius: '999px',
    border: `1px solid ${THEME.border}`,
    backgroundColor: '#fff',
    color: THEME.text,
    cursor: 'pointer',
    fontWeight: 600
  },
  dayActionButtonActive: {
    padding: '0.55rem 0.8rem',
    borderRadius: '999px',
    border: `1px solid ${THEME.primary}`,
    backgroundColor: '#ecfdf3',
    color: '#166534',
    cursor: 'pointer',
    fontWeight: 700
  },
  filterHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1rem'
  },
  filterSectionTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: THEME.text,
    marginBottom: '0.25rem'
  },
  filterSectionHint: {
    fontSize: '0.82rem',
    color: THEME.textSecondary,
    lineHeight: 1.4
  },
  resetFilterBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    border: 'none',
    background: 'transparent',
    color: '#6b7280',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    whiteSpace: 'nowrap'
  },
  chipGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  chipButton: {
    border: `1px solid ${THEME.border}`,
    backgroundColor: '#fff',
    color: THEME.text,
    borderRadius: '999px',
    padding: '0.45rem 0.75rem',
    cursor: 'pointer',
    fontWeight: 600
  },
  chipButtonActive: {
    border: `1px solid ${THEME.primary}`,
    backgroundColor: '#ecfdf3',
    color: '#166534',
    borderRadius: '999px',
    padding: '0.45rem 0.75rem',
    cursor: 'pointer',
    fontWeight: 700
  },
  showMoreBtn: {
    border: `1px dashed ${THEME.border}`,
    backgroundColor: 'transparent',
    color: THEME.textSecondary,
    borderRadius: '999px',
    padding: '0.45rem 0.75rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.78rem'
  },
  rangeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  rangeSeparator: {
    color: THEME.textSecondary,
    fontWeight: 600
  },
  templatesList: {
    padding: '1rem',
    maxHeight: '70vh',
    overflowY: 'auto'
  },
  templatesIntro: {
    marginBottom: '1rem',
    padding: '1rem',
    borderRadius: '12px',
    backgroundColor: '#f8fafc',
    border: `1px solid ${THEME.border}`
  },
  templatesIntroTitle: {
    margin: '0 0 0.25rem 0'
  },
  templatesIntroText: {
    margin: 0,
    color: THEME.textSecondary,
    lineHeight: 1.5,
    fontSize: '0.92rem'
  },
  templatesRecommendations: {
    marginBottom: '1rem'
  },
  templatesRecommendationsHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginBottom: '0.75rem'
  },
  templatesRecommendationsTitle: {
    margin: 0,
    fontSize: '1rem'
  },
  templatesRecommendationsText: {
    margin: '0.25rem 0 0',
    color: THEME.textSecondary,
    fontSize: '0.88rem',
    lineHeight: 1.45
  },
  templatesRecommendationsPill: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: '0.35rem 0.65rem',
    borderRadius: '999px',
    backgroundColor: '#ecfdf3',
    color: '#166534',
    border: '1px solid #bbf7d0',
    fontSize: '0.82rem',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  templatesSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    margin: '0.5rem 0 0.75rem'
  },
  templatesSectionTitle: {
    margin: 0,
    fontSize: '1rem'
  },
  templatesSectionCount: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.3rem 0.6rem',
    borderRadius: '999px',
    backgroundColor: '#f8fafc',
    color: THEME.textSecondary,
    border: `1px solid ${THEME.border}`,
    fontSize: '0.8rem',
    fontWeight: 700
  },
  templatesRecommendationRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.75rem'
  },
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1rem'
  },
  recommendedTemplateCard: {
    width: '100%',
    textAlign: 'left',
    padding: '1rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    boxShadow: THEME.shadow,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  recommendedTemplateCardActive: {
    border: `1px solid ${THEME.primary}`,
    boxShadow: '0 10px 24px rgba(22, 163, 74, 0.16)'
  },
  recommendedTemplateAction: {
    display: 'inline-flex',
    marginTop: '0.5rem',
    padding: '0.35rem 0.65rem',
    borderRadius: '999px',
    backgroundColor: '#f8fafc',
    color: THEME.textSecondary,
    fontSize: '0.78rem',
    fontWeight: 700
  },
  templateCard: {
    padding: '1rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '8px',
    height: '100%',
    position: 'relative',
    boxShadow: THEME.shadow,
    display: 'flex',
    flexDirection: 'column'
  },
  templateCardActive: {
    border: `1px solid ${THEME.primary}`,
    boxShadow: '0 10px 24px rgba(22, 163, 74, 0.14)'
  },
  templateBadge: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: THEME.success,
    color: 'white',
    borderRadius: '4px',
    fontSize: '0.75rem',
    textTransform: 'capitalize',
    fontWeight: '600'
  },
  templateMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: THEME.textSecondary,
    margin: '0.5rem 0'
  },
  templateMetaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.55rem',
    borderRadius: '999px',
    backgroundColor: '#f8fafc',
    border: `1px solid ${THEME.border}`
  },
  templateTitle: {
    marginTop: '0.9rem',
    marginBottom: '0.25rem'
  },
  templateDescription: {
    fontSize: '0.9rem',
    color: THEME.textSecondary,
    lineHeight: 1.5
  },
  templateAttractionList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    marginBottom: '0.5rem'
  },
  templateAttractionChip: {
    padding: '0.35rem 0.55rem',
    borderRadius: '999px',
    backgroundColor: '#e8f5e9',
    color: '#166534',
    fontSize: '0.8rem',
    fontWeight: 600
  },
  templateAttractionChipMuted: {
    padding: '0.35rem 0.55rem',
    borderRadius: '999px',
    backgroundColor: '#f3f4f6',
    color: THEME.textSecondary,
    fontSize: '0.8rem',
    fontWeight: 600
  },
  useTemplateBtn: {
    width: '100%',
    padding: '0.7rem 0.85rem',
    backgroundColor: THEME.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '700',
    marginTop: 'auto'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  itineraryHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    padding: '2rem',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  nameInput: {
    width: '100%',
    padding: '1rem',
    fontSize: '2rem',
    fontWeight: '700',
    border: `2px solid ${THEME.border}`,
    borderRadius: '12px',
    marginBottom: '1rem',
    fontFamily: 'inherit'
  },
  descriptionInput: {
    width: '100%',
    padding: '0.75rem',
    border: `2px solid ${THEME.border}`,
    borderRadius: '8px',
    marginBottom: '1rem',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  durationInput: {
    width: '70px',
    padding: '8px 10px',
    border: `2px solid ${THEME.primary}`,
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: THEME.text,
    backgroundColor: '#f0fdf4',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    textAlign: 'center'
  },
  costInput: {
    width: '85px',
    padding: '8px 10px',
    border: `2px solid ${THEME.accent}`,
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: THEME.text,
    backgroundColor: '#fffbf0',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    textAlign: 'center'
  },
  dateInputs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginBottom: '1rem'
  },
  label: {
    fontSize: '0.75rem',
    color: THEME.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  dateInput: {
    width: '100%',
    padding: '0.5rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '6px',
    marginTop: '0.25rem',
    fontFamily: 'inherit'
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: THEME.background,
    borderRadius: '8px'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  statLabel: {
    fontSize: '0.75rem',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  statValue: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: THEME.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  daysContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  routeSummary: {
    marginBottom: '1.25rem',
    borderRadius: '20px',
    overflow: 'hidden',
    border: '1px solid rgba(226,232,240,0.8)',
    boxShadow: '0 8px 32px rgba(15,23,42,0.10)'
  },
  routeBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    padding: '1.1rem 1.4rem',
    background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)'
  },
  routeBannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  routeBannerIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  routeBannerTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.2
  },
  routeBannerSub: {
    fontSize: '0.75rem',
    color: 'rgba(167,243,208,0.85)',
    marginTop: '0.15rem'
  },
  routeBannerBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem'
  },
  routeBannerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.3rem 0.65rem',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#d1fae5',
    fontSize: '0.75rem',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  routeStatsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    background: '#fff',
    borderBottom: '1px solid #f1f5f9'
  },
  routeStatCard: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '1.1rem 1rem 1.25rem',
    borderRight: '1px solid #f1f5f9'
  },
  routeTimelineWrap: {
    padding: '1rem 1.4rem 1.1rem',
    background: '#f8fafc'
  },
  routeTimelineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.7rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#16a34a',
    marginBottom: '0.85rem'
  },
  routeTimelineScroll: {
    display: 'flex',
    flexDirection: 'column'
  },
  fareEstimateWrap: {
    padding: '1rem 1.4rem',
    background: '#fffdf4',
    borderTop: '1px solid #fde68a'
  },
  fareEstimateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    fontSize: '0.7rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: '#d97706',
    marginBottom: '0.75rem'
  },
  fareEstimateNote: {
    marginLeft: 'auto',
    fontSize: '0.68rem',
    fontWeight: 500,
    color: '#92400e',
    textTransform: 'none',
    letterSpacing: 0
  },
  fareEstimateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.6rem',
    marginBottom: '0.75rem'
  },
  fareCard: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.7rem 0.75rem 0.7rem 0.85rem',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #fde68a',
    overflow: 'hidden'
  },
  fareCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    borderRadius: '12px 0 0 12px'
  },
  fareCardIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  fareCardBody: {
    minWidth: 0
  },
  fareCardLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  fareCardRange: {
    fontSize: '0.95rem',
    fontWeight: 900,
    lineHeight: 1.2,
    marginTop: '0.1rem'
  },
  fareCardNote: {
    fontSize: '0.65rem',
    color: '#9ca3af',
    marginTop: '0.1rem'
  },
  fareDisclaimer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.4rem',
    fontSize: '0.72rem',
    color: '#92400e',
    background: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem'
  },
  routeTip: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.7rem',
    fontSize: '0.85rem',
    color: '#475569',
    marginTop: '0.95rem',
    padding: '0.95rem 1rem',
    background: 'linear-gradient(135deg, #fffdf4 0%, #fff7e6 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(245, 158, 11, 0.22)',
    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.08)'
  },
  dayTabs: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem',
    borderBottom: `1px solid ${THEME.border}`,
    overflowX: 'auto'
  },
  dayTab: {
    padding: '0.75rem 1.5rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '8px',
    background: THEME.surface,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  dayTabActive: {
    padding: '0.75rem 1.5rem',
    border: `2px solid ${THEME.primary}`,
    borderRadius: '8px',
    background: 'rgba(25, 118, 210, 0.05)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontWeight: '600',
    color: THEME.primary,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  dayItemCount: {
    backgroundColor: THEME.primary,
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  addDayBtn: {
    padding: '0.75rem 1.5rem',
    border: `2px dashed ${THEME.primary}`,
    borderRadius: '8px',
    background: 'transparent',
    color: THEME.primary,
    cursor: 'pointer',
    fontWeight: '500'
  },
  dayContent: {
    padding: '1.5rem'
  },
  dayBudgetPanel: {
    marginBottom: '1rem',
    padding: '1rem',
    borderRadius: '10px',
    border: `1px solid ${THEME.border}`,
    backgroundColor: '#ffffff'
  },
  dayBudgetHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap'
  },
  dayBudgetTitle: {
    margin: 0,
    fontSize: '1rem',
    color: THEME.text
  },
  budgetFitBadgeGood: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '0.3rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '700'
  },
  budgetFitBadgeBad: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '0.3rem 0.6rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '700'
  },
  dayBudgetInputGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '0.75rem',
    marginBottom: '0.75rem'
  },
  dayBudgetLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    fontSize: '0.78rem',
    color: THEME.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  dayBudgetInput: {
    width: '100%',
    padding: '0.5rem 0.6rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: THEME.text,
    backgroundColor: '#f9fafb'
  },
  dayBudgetBreakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '0.5rem'
  },
  dayBudgetBreakdownItem: {
    padding: '0.55rem 0.65rem',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: `1px solid ${THEME.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.85rem'
  },
  emptyDay: {
    textAlign: 'center',
    padding: '3rem',
    color: '#999'
  },
  emptyDayHint: {
    fontSize: '0.9rem',
    marginTop: '0.5rem',
    color: THEME.textSecondary
  },
  dayItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  dayItem: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '8px',
    backgroundColor: THEME.background,
    alignItems: 'flex-start'
  },
  itemNumber: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: THEME.primary,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    flexShrink: 0
  },
  itemDetails: {
    flex: 1
  },
  itemLocation: {
    fontSize: '0.85rem',
    color: THEME.textSecondary,
    margin: '0.25rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  itemMeta: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.85rem',
    color: THEME.textSecondary,
    marginTop: '0.5rem',
    flexWrap: 'wrap'
  },
  priorityBadge: (priority) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor:
      priority === 'high' || priority === 'must-visit' ? THEME.error :
      priority === 'medium' ? THEME.warning : THEME.success,
    color: 'white'
  }),
  weatherBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    backgroundColor: 'rgba(25, 118, 210, 0.1)',
    borderRadius: '4px',
    fontSize: '0.8rem',
    color: THEME.primary,
    marginTop: '0.5rem'
  },
  transportSelect: {
    width: '100%',
    padding: '6px 8px',
    border: `1.5px solid ${THEME.primary}`,
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: THEME.text,
    backgroundColor: '#f0fdf4',
    fontFamily: 'inherit',
    cursor: 'pointer'
  },
  budgetInlineInput: {
    width: '100px',
    padding: '7px 10px',
    border: `1.5px solid ${THEME.border}`,
    borderRadius: '6px',
    fontSize: '0.92rem',
    fontWeight: 700,
    color: THEME.text,
    backgroundColor: '#fff',
    textAlign: 'right',
    fontFamily: 'inherit',
    lineHeight: '1.4'
  },
  autoCalcBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    fontSize: '0.88rem',
    fontWeight: 700
  },
  removeBtn: {
    padding: '0.25rem 0.5rem',
    border: 'none',
    background: THEME.error,
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    height: 'fit-content'
  },
  mapContainer: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.45) 100%)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    padding: '1.5rem',
    borderRadius: '28px',
    boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
    border: '1px solid rgba(148, 163, 184, 0.16)'
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem'
  },
  saveBtn: {
    padding: '1.2rem',
    background: 'linear-gradient(135deg, #16a34a, #059669)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '1.1rem',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  shareBtn: {
    padding: '1.2rem',
    background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '1.1rem',
    boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  exportBtn: {
    padding: '1.2rem',
    background: 'linear-gradient(135deg, #6b7280, #4b5563)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '1.1rem',
    boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'sticky',
    top: '2rem',
    height: 'fit-content'
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    padding: '2rem',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)'
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: `1px solid ${THEME.border}`
  },
  savedList: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    padding: '1.25rem',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    maxHeight: 'calc(100vh - 190px)',
    overflowY: 'auto'
  },
  savedSearchInput: {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    border: `1px solid ${THEME.border}`,
    margin: '0.75rem 0 0.9rem',
    fontSize: '0.9rem'
  },
  sidebarFiltersWrap: {
    marginBottom: '0.9rem'
  },
  sidebarSearchWrap: {
    position: 'relative'
  },
  sidebarSearchInput: {
    width: '100%',
    padding: '0.6rem 2rem 0.6rem 0.75rem',
    borderRadius: '8px',
    border: `1px solid ${THEME.border}`,
    fontSize: '0.86rem',
    marginBottom: '0.6rem'
  },
  sidebarClearBtn: {
    position: 'absolute',
    top: '0.38rem',
    right: '0.4rem',
    border: 'none',
    background: '#f3f4f6',
    borderRadius: '999px',
    width: '24px',
    height: '24px',
    cursor: 'pointer'
  },
  sidebarFilterGrid: {
    display: 'grid',
    gap: '0.45rem'
  },
  sidebarFilterSelect: {
    width: '100%',
    padding: '0.45rem 0.6rem',
    borderRadius: '8px',
    border: `1px solid ${THEME.border}`,
    fontSize: '0.82rem',
    background: '#fff',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease'
  },
  savedFilterSelect: {
    width: '100%',
    padding: '0.6rem',
    borderRadius: '8px',
    border: `1px solid ${THEME.border}`,
    fontSize: '0.85rem',
    background: '#fff',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease'
  },
  savedBudgetInput: {
    padding: '0.65rem 0.7rem',
    borderRadius: '8px',
    border: `1.5px solid ${THEME.border}`,
    fontSize: '0.9rem',
    background: '#fff',
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: THEME.primary
    }
  },
  multiSelectDropdown: {
    width: '100%',
    padding: '0.4rem 0.6rem',
    border: `1px solid ${THEME.border}`,
    borderRadius: '6px',
    fontSize: '0.85rem',
    background: '#fff',
    fontFamily: 'inherit',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    height: '36px',
    maxHeight: '150px',
    overflowY: 'auto'
  },
  sidebarClearFiltersBtn: {
    marginTop: '0.5rem',
    border: 'none',
    background: 'transparent',
    color: THEME.secondary,
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0
  },
  sidebarResultCount: {
    margin: '0.45rem 0 0',
    fontSize: '0.78rem',
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  sidebarMetaText: {
    margin: '0.25rem 0 0.45rem',
    fontSize: '0.78rem',
    color: THEME.textSecondary
  },
  sidebarPaginationWrap: {
    marginTop: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    flexWrap: 'wrap'
  },
  pageBtn: {
    border: `1px solid ${THEME.border}`,
    background: '#fff',
    borderRadius: '8px',
    padding: '0.35rem 0.6rem',
    fontSize: '0.78rem',
    cursor: 'pointer',
    color: THEME.text
  },
  pageBtnActive: {
    border: `1px solid ${THEME.primary}`,
    background: THEME.primary,
    color: '#fff',
    borderRadius: '8px',
    padding: '0.35rem 0.6rem',
    fontSize: '0.78rem',
    cursor: 'pointer'
  },
  pageBtnDisabled: {
    border: `1px solid ${THEME.border}`,
    background: '#f3f4f6',
    color: '#9ca3af',
    borderRadius: '8px',
    padding: '0.35rem 0.6rem',
    fontSize: '0.78rem',
    cursor: 'not-allowed'
  },
  skeletonList: {
    display: 'grid',
    gap: '0.7rem'
  },
  skeletonCard: {
    border: `1px solid ${THEME.border}`,
    borderRadius: '12px',
    padding: '0.6rem',
    background: '#fff'
  },
  skeletonImage: {
    height: '90px',
    borderRadius: '8px',
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
    backgroundSize: '400% 100%'
  },
  skeletonLineWide: {
    height: '11px',
    borderRadius: '6px',
    marginTop: '0.55rem',
    width: '80%',
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
    backgroundSize: '400% 100%'
  },
  skeletonLineShort: {
    height: '11px',
    borderRadius: '6px',
    marginTop: '0.4rem',
    width: '52%',
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
    backgroundSize: '400% 100%'
  },
  emptyAttractionsState: {
    border: `1px dashed ${THEME.border}`,
    borderRadius: '10px',
    padding: '0.8rem',
    textAlign: 'center'
  },
  savedFiltersRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '0.5rem'
  },
  savedBudgetRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
    marginBottom: '0.45rem'
  },
  savedClearFiltersBtn: {
    border: 'none',
    background: 'transparent',
    color: THEME.secondary,
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.78rem',
    padding: 0,
    marginBottom: '0.35rem'
  },
  savedResultsInfo: {
    margin: '0.2rem 0 0.5rem',
    color: THEME.textSecondary,
    fontSize: '0.78rem'
  },
  savedItem: {
    padding: '0.75rem',
    borderBottom: `1px solid ${THEME.border}`,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.35rem',
    flexWrap: 'wrap'
  },
  savedItemCard: {
    display: 'flex',
    gap: '1rem',
    padding: '1.25rem',
    backgroundColor: '#fafafa',
    border: `1px solid ${THEME.border}`,
    borderRadius: '10px',
    cursor: 'pointer',
    marginBottom: '0.85rem',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      borderColor: THEME.primary
    }
  },
  savedItemNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: THEME.primary,
    color: 'white',
    fontWeight: '700',
    fontSize: '0.95rem',
    flexShrink: 0
  },
  savedItemContent: {
    flex: 1,
    minWidth: 0
  },
  savedItemMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '0.65rem'
  },
  savedMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    padding: '0.55rem',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: `1px solid ${THEME.border}`
  },
  savedMetaLabel: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
  },
  savedMetaValue: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: THEME.text
  },
  savedDate: {
    fontSize: '0.75rem',
    color: THEME.textSecondary
  },
  savedMetaInline: {
    width: '100%',
    fontSize: '0.74rem',
    color: THEME.textSecondary
  },
  savedPaginationWrap: {
    marginTop: '0.65rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem'
  }
};

export default ItineraryBuilder;
