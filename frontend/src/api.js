
import axios from 'axios';

// Get backend URL from environment or auto-detect from current host
// This allows the app to work on both localhost AND network access
export const getApiBaseUrl = () => {
  // If VITE_API_URL is set and not empty, use it
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }
  // Always use the same origin the browser is on (protocol + host + port).
  // The frontend server proxies /api, /auth, /socket.io and /uploads to the
  // backend (in production) and Vite proxies them (in development). Same-origin
  // calls avoid CORS errors AND cross-site cookie blocking, which is required
  // because *.up.railway.app deployments are on the Public Suffix List (cross-site).
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  // Fallback for SSR or non-browser environments
  return 'http://localhost:3000';
};

const apiClient = axios.create({
  baseURL: `${getApiBaseUrl()}/api`,
  withCredentials: true,
  validateStatus: (status) => status >= 200 && status < 300  // Only 2xx is success
});

const getStoredToken = () => {
  // Tokens are now in HttpOnly cookies - automatically sent with requests
  // This function is deprecated but kept for backwards compatibility
  return null;
};

// Track if we've already redirected to prevent infinite loops
let isRedirecting = false;

// Reset redirect flag after navigation completes (safety mechanism)
window.addEventListener('load', () => {
  // If page load completes after redirect, clear the flag
  isRedirecting = false;
});

// Also reset when user manually navigates
window.addEventListener('popstate', () => {
  isRedirecting = false;
});

apiClient.interceptors.request.use((config) => {
  // Ensure every request carries the desired language so backend can return
  // DB-backed translations. Default to 'en' unless user explicitly selected different language
  let lang = 'en'
  try {
    lang = localStorage.getItem('naujango_language') || 'en'
  } catch (err) {
    lang = 'en'
  }

  // Add header expected by backend middleware
  config.headers = config.headers || {}
  config.headers['x-language'] = lang

  // Send the readable CSRF cookie back in a header for cookie-authenticated writes.
  const csrfCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('csrf_token='));
  if (csrfCookie) {
    config.headers['X-CSRF-Token'] = decodeURIComponent(csrfCookie.split('=').slice(1).join('='));
  }

  // Also add query param for backward compatibility if not present
  if (!config.params) config.params = {}
  if (!('lang' in config.params)) config.params.lang = lang

  return config;
});

const handleTokenExpiry = (response) => {
  // Don't redirect if already redirecting
  if (isRedirecting) return;

  // On 401/403, session is invalid - but let components handle the redirect
  // Don't use window.location.href - it causes full page reloads and breaks the app
};

apiClient.interceptors.response.use(
  (response) => {
    handleTokenExpiry(response);
    return response;
  },
  (error) => {
    handleTokenExpiry(error.response);
    return Promise.reject(error);
  }
);

// Export named functions for direct use
export const get = (url, config) => apiClient.get(url, config);
export const post = (url, data, config) => apiClient.post(url, data, config);
export const put = (url, data, config) => apiClient.put(url, data, config);
export const delete_ = (url, config) => apiClient.delete(url, config);

export const fetchAttractions = () => {
  return apiClient.get('/attractions');
};

export const fetchAttractionSuggestions = (q) => {
  return apiClient.get('/attractions/search/suggestions', { params: { q } });
};

export const fetchAttractionHeroSettings = () => {
  return apiClient.get('/admin/attraction-hero');
};

export const fetchAttractionsMeta = () => {
  return apiClient.get('/attractions/meta');
};

export const fetchReviews = (attractionId) => {
  return apiClient.get(`/attractions/${attractionId}/reviews`);
};

export const submitReview = (attractionId, reviewData) => {
  return apiClient.post(`/attractions/${attractionId}/reviews`, reviewData);
};

export const deleteAttraction = (attractionId, hardDelete = false) => {
  return apiClient.delete(`/attractions/${attractionId}`, { data: { hardDelete } });
};

export const restoreAttraction = (attractionId) => {
  return apiClient.post(`/attractions/${attractionId}/restore`);
};

export const fetchPOIs = () => {
  return apiClient.get('/pois');
};

// Unified map markers endpoint (consolidated attractions + POI)
export const fetchMapMarkers = (category = null) => {
  const params = category ? { category } : {};
  return apiClient.get('/attractions/map/markers', { params });
};

// Weather-aware recommendations
export const fetchWeatherRecommendations = (type = 'attractions', mode = 'smart') => {
  return apiClient.get(`/weather/recommendations`, { params: { type, mode } });
};

export const saveRoute = (routeData) => {
  return apiClient.post('/routes', routeData);
};

export const fetchAllRoutes = () => {
  return apiClient.get('/routes');
};

export const fetchUserRoutes = (userId) => {
  return apiClient.get(`/routes/user/${userId}`);
};

// Language API functions
export const fetchLanguages = () => {
  return apiClient.get('/languages');
};

export const updateUserLanguagePreference = (userId, languageCode) => {
  return apiClient.put(`/languages/preference/${userId}`, { language_code: languageCode });
};

export const getUserLanguagePreference = (userId) => {
  return apiClient.get(`/languages/preference/${userId}`);
};

// Hotel bookings
export const fetchHotels = () => {
  return apiClient.get('/hotels');
};

export const createHotelBooking = (bookingData) => {
  console.log('Creating booking with token:', getStoredToken() ? 'Token exists' : 'No token');
  return apiClient.post('/bookings/hotels', bookingData);
};

export const fetchHotelBookings = () => {
  return apiClient.get('/bookings/hotels');
};

export const fetchHotelReceipt = (bookingId) => {
  return apiClient.get(`/bookings/hotels/${bookingId}/receipt`);
};

export const modifyHotelBooking = (bookingId, data) => {
  return apiClient.patch(`/bookings/hotels/${bookingId}/modify`, data);
};

export const cancelHotelBooking = (bookingId) => {
  return apiClient.patch(`/bookings/hotels/${bookingId}/cancel`);
};

// Payment API functions
export const processPayment = (paymentData) => {
  return apiClient.post('/payments/process', paymentData);
};

export const startPaymentCheckout = (paymentData) => {
  return apiClient.post('/payments/checkout', paymentData);
};

export const getPaymentDetails = (paymentId) => {
  return apiClient.get(`/payments/${paymentId}`);
};

export const getLatestPaymentByBooking = (bookingId) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // If redirect included a lookup_token in the URL, forward it to the backend
  try {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search || '');
      const lookup = params.get('lookup_token') || params.get('lookupToken') || params.get('lookup-token');
      if (lookup) {
        headers['x-lookup-token'] = lookup;
      }
    }
  } catch (err) {
    // ignore
  }

  return apiClient.get(`/payments/booking/${bookingId}/latest`, { headers });
};

export const submitPaymentReference = (paymentId, referenceNumber) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return apiClient.post(`/payments/${paymentId}/submit-reference`, {
    reference_number: referenceNumber
  }, { headers });
};

export const getPaymentHistory = () => {
  return apiClient.get('/payments/user/history');
};

export const refundPayment = (paymentId, refundData) => {
  return apiClient.post(`/payments/${paymentId}/refund`, refundData);
};

// Itinerary API functions
export const fetchUserItineraries = () => {
  return apiClient.get('/itinerary');
};

export const fetchItineraryById = (itineraryId) => {
  return apiClient.get(`/itinerary/${itineraryId}`);
};

export const fetchItineraryReviews = (itineraryId) => {
  return apiClient.get(`/itinerary/${itineraryId}/reviews`);
};

export const createItinerary = (itineraryData) => {
  return apiClient.post('/itinerary', itineraryData);
};

export const updateItinerary = (itineraryId, itineraryData) => {
  return apiClient.put(`/itinerary/${itineraryId}`, itineraryData);
};

export const deleteItinerary = (itineraryId) => {
  return apiClient.delete(`/itinerary/${itineraryId}`);
};

export default apiClient;
