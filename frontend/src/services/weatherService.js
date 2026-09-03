/**
 * Enhanced Weather Service with Real-Time Data and Hazard Detection
 * Integrates with OpenWeatherMap API for accurate weather information
 */

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'demo_key';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Get current weather for specific coordinates
   */
  async getCurrentWeather(lat, lon, locationName = '') {
    const cacheKey = `current_${lat}_${lon}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // For demo purposes, return mock data when API key is not available
      if (WEATHER_API_KEY === 'demo_key') {
        return this.getMockWeatherData(locationName);
      }

      const response = await fetch(
        `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      const weatherData = this.formatWeatherData(data);
      
      this.setCache(cacheKey, weatherData);
      return weatherData;
      
    } catch (error) {
      console.warn('Weather API unavailable, using mock data:', error.message);
      return this.getMockWeatherData(locationName);
    }
  }

  /**
   * Get weather forecast for next 5 days
   */
  async getWeatherForecast(lat, lon) {
    const cacheKey = `forecast_${lat}_${lon}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      if (WEATHER_API_KEY === 'demo_key') {
        return this.getMockForecastData();
      }

      const response = await fetch(
        `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      const forecastData = this.formatForecastData(data);
      
      this.setCache(cacheKey, forecastData);
      return forecastData;
      
    } catch (error) {
      console.warn('Weather forecast unavailable, using mock data:', error.message);
      return this.getMockForecastData();
    }
  }

  /**
   * Get weather for multiple locations (batch)
   */
  async getBatchWeather(locations) {
    const promises = locations.map(async (location) => {
      const weather = await this.getCurrentWeather(
        location.lat, 
        location.lon, 
        location.name
      );
      return {
        ...location,
        weather
      };
    });

    return Promise.all(promises);
  }

  /**
   * Analyze weather data for hazards and safety
   */
  analyzeHazards(weatherData) {
    const hazards = [];
    const { temperature, humidity, windSpeed, condition, rainfall, visibility } = weatherData;

    // Temperature-based hazards
    if (temperature > 35) {
      hazards.push({
        type: 'heat',
        level: 'high',
        message: 'Extreme heat warning - Stay hydrated and seek shade',
        icon: '🌡️',
        color: '#ff5722'
      });
    } else if (temperature < 15) {
      hazards.push({
        type: 'cold',
        level: 'medium',
        message: 'Cool weather - Bring warm clothing',
        icon: '🧥',
        color: '#2196f3'
      });
    }

    // Weather condition hazards
    if (condition.includes('Thunderstorm') || condition.includes('Storm')) {
      hazards.push({
        type: 'storm',
        level: 'high',
        message: 'Thunderstorm alert - Seek indoor shelter immediately',
        icon: '⛈️',
        color: '#ff1744'
      });
    }

    if (condition.includes('Rain') || rainfall > 5) {
      const level = rainfall > 15 ? 'high' : 'medium';
      hazards.push({
        type: 'rain',
        level,
        message: rainfall > 15 ? 'Heavy rain warning - Flash floods possible' : 'Moderate rain expected - Carry umbrella',
        icon: '🌧️',
        color: level === 'high' ? '#ff5722' : '#ff9800'
      });
    }

    // Wind hazards
    if (windSpeed > 20) {
      hazards.push({
        type: 'wind',
        level: 'high',
        message: 'Strong winds - Avoid outdoor activities',
        icon: '💨',
        color: '#ff5722'
      });
    } else if (windSpeed > 10) {
      hazards.push({
        type: 'wind',
        level: 'medium',
        message: 'Moderate winds - Be cautious near water',
        icon: '💨',
        color: '#ff9800'
      });
    }

    // Visibility hazards
    if (visibility && visibility < 1000) {
      hazards.push({
        type: 'fog',
        level: 'medium',
        message: 'Poor visibility - Drive carefully',
        icon: '🌫️',
        color: '#757575'
      });
    }

    // Humidity-based comfort warnings
    if (humidity > 80 && temperature > 25) {
      hazards.push({
        type: 'humidity',
        level: 'medium',
        message: 'High humidity - Uncomfortable conditions',
        icon: '💧',
        color: '#4caf50'
      });
    }

    return hazards;
  }

  /**
   * Compute a comfort score from temperature and humidity.
   */
  computeComfortScore(weatherData) {
    const { temperature, humidity, feelsLike } = weatherData;
    let score = 100;

    // Temperature comfort band: 22-30C ideal
    if (temperature < 16 || temperature > 35) score -= 25;
    else if (temperature < 19 || temperature > 32) score -= 15;
    else if (temperature < 22 || temperature > 30) score -= 8;

    // Humidity comfort
    if (humidity > 85) score -= 15;
    else if (humidity > 75) score -= 8;
    else if (humidity > 65) score -= 4;

    // Feels-like deviation
    if (Math.abs((feelsLike ?? temperature) - temperature) > 3) score -= 6;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Derive hazard level label from hazards list.
   */
  getHazardLevel(hazards) {
    if (!hazards || hazards.length === 0) return 'low';
    if (hazards.some(h => h.level === 'extreme' || h.severity === 'extreme')) return 'extreme';
    if (hazards.some(h => h.level === 'high' || h.severity === 'high')) return 'high';
    if (hazards.some(h => h.level === 'medium' || h.severity === 'medium')) return 'medium';
    return 'low';
  }

  /**
   * Compute composite recommendation score and short explanation.
   */
  getRecommendationSummary(weatherData) {
    if (!weatherData) return null;

    const hazards = this.analyzeHazards(weatherData);
    const safetyScore = this.getTravelSafetyScore(weatherData);
    const comfortScore = this.computeComfortScore(weatherData);

    // Weighted blend: prioritize safety
    const compositeScore = Math.round(safetyScore * 0.65 + comfortScore * 0.35);

    const reasons = [];
    reasons.push(`Safety ${safetyScore}/100`);
    reasons.push(`Comfort ${comfortScore}/100`);
    if (hazards.length > 0) {
      const topHazard = hazards[0];
      reasons.push(`Hazard: ${topHazard.message}`);
    } else {
      reasons.push('No significant hazards');
    }

    return {
      score: compositeScore,
      safetyScore,
      comfortScore,
      hazards,
      hazardLevel: this.getHazardLevel(hazards),
      explanation: reasons.join(' | ')
    };
  }

  /**
   * Suggest alternative destinations based on weather conditions
   */
  suggestAlternatives(currentWeather, allDestinations) {
    const hazards = this.analyzeHazards(currentWeather);
    const hasHighRisk = hazards.some(h => h.level === 'high');
    
    if (!hasHighRisk) {
      return [];
    }

    // For now, return a basic suggestion - in a real app, this would analyze
    // weather for all destinations and rank them by safety
    const suggestions = [
      {
        name: 'Naujan Town Plaza',
        reason: 'Indoor attractions available during bad weather',
        weatherSuitability: 85,
        safetyRating: 'high'
      },
      {
        name: 'Local Museums',
        reason: 'Perfect for rainy day exploration',
        weatherSuitability: 90,
        safetyRating: 'high'
      },
      {
        name: 'Shopping Centers',
        reason: 'Climate-controlled environment',
        weatherSuitability: 95,
        safetyRating: 'high'
      }
    ];

    return suggestions;
  }

  /**
   * Get travel safety score based on weather
   */
  getTravelSafetyScore(weatherData) {
    let score = 100;
    const hazards = this.analyzeHazards(weatherData);
    
    hazards.forEach(hazard => {
      if (hazard.level === 'high') {
        score -= 30;
      } else if (hazard.level === 'medium') {
        score -= 15;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Format raw weather API data
   */
  formatWeatherData(data) {
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind?.speed * 3.6 * 10) / 10, // Convert m/s to km/h
      windDirection: data.wind?.deg || 0,
      visibility: data.visibility || null,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      rainfall: data.rain?.['1h'] || 0,
      cloudiness: data.clouds?.all || 0,
      uvIndex: data.uvi || null,
      timestamp: new Date(),
      location: {
        name: data.name,
        country: data.sys.country,
        sunrise: new Date(data.sys.sunrise * 1000),
        sunset: new Date(data.sys.sunset * 1000)
      }
    };
  }

  /**
   * Format forecast data
   */
  formatForecastData(data) {
    // Get today's date
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Extract today's hourly data (1-hour intervals from 3-hour data)
    const hourlyToday = [];
    const processedHours = new Set();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const itemDateKey = date.toISOString().split('T')[0];
      
      // Only include today's entries
      if (itemDateKey === todayKey) {
        const hours = date.getHours();
        
        // Add the 3-hour interval data point
        if (!processedHours.has(hours)) {
          hourlyToday.push({
            time: `${String(hours).padStart(2, '0')}:00`,
            temperature: Math.round(item.main.temp),
            condition: item.weather[0].main,
            description: item.weather[0].description,
            iconCode: item.weather[0].icon,
            windSpeed: Math.round(item.wind?.speed * 3.6 * 10) / 10,
            humidity: item.main.humidity
          });
          processedHours.add(hours);
          
          // Interpolate 1-hour intervals between 3-hour data points
          if (hourlyToday.length > 1) {
            const prevData = hourlyToday[hourlyToday.length - 2];
            const currData = hourlyToday[hourlyToday.length - 1];
            const prevHour = parseInt(prevData.time.split(':')[0]);
            const currHour = parseInt(currData.time.split(':')[0]);
            
            // Fill in the hours between
            for (let h = prevHour + 1; h < currHour; h++) {
              const ratio = (h - prevHour) / (currHour - prevHour);
              hourlyToday.splice(hourlyToday.length - 1, 0, {
                time: `${String(h).padStart(2, '0')}:00`,
                temperature: Math.round(prevData.temperature + (currData.temperature - prevData.temperature) * ratio),
                condition: ratio < 0.5 ? prevData.condition : currData.condition,
                description: ratio < 0.5 ? prevData.description : currData.description,
                iconCode: ratio < 0.5 ? prevData.iconCode : currData.iconCode,
                windSpeed: Math.round((prevData.windSpeed + (currData.windSpeed - prevData.windSpeed) * ratio) * 10) / 10,
                humidity: Math.round(prevData.humidity + (currData.humidity - prevData.humidity) * ratio)
              });
            }
          }
        }
      }
    });
    
    // Sort by time
    hourlyToday.sort((a, b) => {
      const timeA = parseInt(a.time.split(':')[0]);
      const timeB = parseInt(b.time.split(':')[0]);
      return timeA - timeB;
    });
    
    // Group forecast by day - take one entry per day (usually the noon entry)
    const forecastByDay = {};
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Keep the entry closest to noon (12:00) for each day
      if (!forecastByDay[dateKey] || Math.abs(date.getHours() - 12) < Math.abs(new Date(forecastByDay[dateKey].dt * 1000).getHours() - 12)) {
        forecastByDay[dateKey] = item;
      }
    });
    
    // Convert to array and sort by date
    const forecast = Object.values(forecastByDay)
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 7) // Take only 7 days
      .map(item => ({
        datetime: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        rainfall: item.rain?.['3h'] || 0,
        windSpeed: Math.round(item.wind?.speed * 3.6 * 10) / 10
      }));
    
    return {
      location: data.city.name,
      hourlyToday,
      forecast
    };
  }

  /**
   * Get mock weather data for demo
   */
  getMockWeatherData(locationName) {
    const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Mist'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
      feelsLike: Math.floor(Math.random() * 15) + 22,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      pressure: Math.floor(Math.random() * 50) + 1000,
      windSpeed: Math.floor(Math.random() * 20), // 0-20 km/h
      windDirection: Math.floor(Math.random() * 360),
      visibility: Math.floor(Math.random() * 10000) + 5000,
      condition,
      description: this.getConditionDescription(condition),
      icon: this.getWeatherIcon(condition),
      rainfall: condition === 'Rain' ? Math.random() * 10 : 0,
      cloudiness: Math.floor(Math.random() * 100),
      timestamp: new Date(),
      location: {
        name: locationName || 'Naujan',
        country: 'PH',
        sunrise: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 AM
        sunset: new Date(Date.now() + 18 * 60 * 60 * 1000) // 6 PM
      }
    };
  }

  /**
   * Get mock forecast data
   */
  getMockForecastData() {
    const forecast = [];
    const hourlyToday = [];
    const today = new Date();
    const currentHour = today.getHours();
    const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Mist'];
    
    // Generate today's hourly data for remaining hours (1-hour intervals)
    for (let hour = currentHour; hour < 24; hour++) {
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      hourlyToday.push({
        time: `${String(hour).padStart(2, '0')}:00`,
        temperature: Math.floor(Math.random() * 10) + 22,
        condition: condition,
        description: this.getConditionDescription(condition),
        iconCode: this.getWeatherIcon(condition),
        windSpeed: Math.floor(Math.random() * 15),
        humidity: Math.floor(Math.random() * 40) + 40
      });
    }
    
    for (let i = 0; i < 7; i++) {
      // Create date in UTC to avoid timezone issues
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + i);
      date.setUTCHours(12, 0, 0, 0);
      
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      forecast.push({
        datetime: date,
        temperature: Math.floor(Math.random() * 10) + 22,
        condition: condition,
        description: this.getConditionDescription(condition),
        icon: this.getWeatherIcon(condition),
        rainfall: condition === 'Rain' ? Math.random() * 10 : 0,
        windSpeed: Math.floor(Math.random() * 15)
      });
    }
    
    return {
      location: 'Naujan',
      hourlyToday,
      forecast
    };
  }

  getConditionDescription(condition) {
    const descriptions = {
      'Clear': 'clear sky',
      'Clouds': 'scattered clouds',
      'Rain': 'light rain',
      'Thunderstorm': 'thunderstorm with rain',
      'Mist': 'mist'
    };
    return descriptions[condition] || 'unknown';
  }

  getWeatherIcon(condition) {
    const icons = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️'
    };
    return icons[condition] || '🌤️';
  }

  // Cache management
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
export default weatherService;
