import { getApiBaseUrl } from '../api';

const API_BASE_URL = getApiBaseUrl() + '/api';

export const mapService = {
  // Get all routes for a user
  async getUserRoutes(userId) {
    const response = await fetch(`${API_BASE_URL}/routes/user/${userId}`);
    const data = await response.json();
    return { data };
  },

  // Save a new route
  async saveRoute(routeData) {
    const response = await fetch(`${API_BASE_URL}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routeData)
    });
    return response.json();
  },

  // Get all POIs
  async getPOIs() {
    const response = await fetch(`${API_BASE_URL}/pois`);
    const data = await response.json();
    return { data };
  },

  // Get POIs by category
  async getPOIsByCategory(category) {
    const response = await fetch(`${API_BASE_URL}/pois/category/${category}`);
    const data = await response.json();
    return { data };
  }
};
