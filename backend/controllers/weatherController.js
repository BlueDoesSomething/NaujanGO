/**
 * Enhanced Weather API Routes
 * Comprehensive weather and hazard management endpoints
 */

import express from 'express';
import db from '../db.js';
import axios from 'axios';

const router = express.Router();

let weatherDataColumnsCache = null;
let weatherAlertsTableCache = null;

const getWeatherDataColumns = async () => {
  if (weatherDataColumnsCache) return weatherDataColumnsCache;
  const [rows] = await db.promise().query('SHOW COLUMNS FROM weather_data');
  weatherDataColumnsCache = new Set(rows.map((row) => row.Field));
  return weatherDataColumnsCache;
};

const hasWeatherAlertsTable = async () => {
  if (weatherAlertsTableCache !== null) return weatherAlertsTableCache;
  try {
    const [rows] = await db.promise().query("SHOW TABLES LIKE 'weather_alerts'");
    weatherAlertsTableCache = rows.length > 0;
  } catch (error) {
    weatherAlertsTableCache = false;
  }
  return weatherAlertsTableCache;
};

const getCachedWeatherRows = async (attractionId) => {
  const columns = await getWeatherDataColumns();
  const conditions = ['attraction_id = ?'];
  if (columns.has('expires_at')) conditions.push('expires_at > NOW()');
  if (columns.has('is_forecast')) conditions.push('is_forecast = FALSE');

  const [rows] = await db.promise().query(
    `SELECT * FROM weather_data WHERE ${conditions.join(' AND ')} ORDER BY recorded_at DESC LIMIT 1`,
    [attractionId]
  );
  return rows;
};

// Weather API configuration
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || null;
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

/**
 * GET /api/weather/current/:attractionId
 * Get current weather for a specific attraction
 */
router.get('/current/:attractionId', async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { force_refresh = false } = req.query;

    // Get attraction coordinates
    const [attractionRows] = await db.promise().query(
      'SELECT latitude, longitude, name FROM attractions WHERE id = ?',
      [attractionId]
    );

    if (attractionRows.length === 0) {
      return res.status(404).json({ error: 'Attraction not found' });
    }

    let { latitude, longitude, name } = attractionRows[0];

    // Use default Naujan coordinates if attraction has no coordinates
    if (!latitude || !longitude) {
      console.warn(`Attraction ${attractionId} (${name}) has no coordinates, using Naujan defaults`);
      latitude = 13.3333;
      longitude = 121.3000;
    }

    // Check for cached weather data (if not forcing refresh)
    if (!force_refresh) {
      const cachedRows = await getCachedWeatherRows(attractionId);

      if (cachedRows.length > 0) {
        const weatherData = formatWeatherResponse(cachedRows[0]);
        const alerts = await getWeatherAlerts(cachedRows[0].weather_id);
        return res.json({ ...weatherData, alerts });
      }
    }

    // Fetch fresh weather data
    const weatherData = await fetchWeatherFromAPI(latitude, longitude, name);
    
    // Ensure latitude and longitude are never null before saving
    const finalLat = latitude || 13.3333;
    const finalLon = longitude || 121.3000;
    
    // Save to database
    const weatherId = await saveWeatherData(attractionId, finalLat, finalLon, name, weatherData);
    
    // Generate and save alerts
    const alerts = await generateAndSaveAlerts(weatherId, weatherData);
    
    res.json({ ...weatherData, alerts, weatherId });

  } catch (error) {
    console.error('Error fetching current weather:', error);
    res.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
  }
});

/**
 * GET /api/weather/forecast/:attractionId
 * Get weather forecast for a specific attraction (7 days)
 */
router.get('/forecast/:attractionId', async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { days = 7, force_refresh = false } = req.query;

    // Get attraction coordinates
    const [attractionRows] = await db.promise().query(
      'SELECT latitude, longitude, name FROM attractions WHERE id = ?',
      [attractionId]
    );

    if (attractionRows.length === 0) {
      return res.status(404).json({ error: 'Attraction not found' });
    }

    let { latitude, longitude, name } = attractionRows[0];

    // Use default Naujan coordinates if attraction has no coordinates
    if (!latitude || !longitude) {
      console.warn(`Attraction ${attractionId} (${name}) has no coordinates, using Naujan defaults`);
      latitude = 13.3333;
      longitude = 121.3000;
    }

    // Check for cached forecast data (if not forcing refresh)
    if (!force_refresh) {
      const [cachedRows] = await db.promise().query(
        `SELECT * FROM weather_forecasts 
         WHERE attraction_id = ? 
         AND forecast_date >= CURDATE() 
         AND forecast_date < DATE_ADD(CURDATE(), INTERVAL ? DAY)
         ORDER BY forecast_date, forecast_hour`,
        [attractionId, days]
      );

      if (cachedRows.length > 0) {
        const forecast = formatForecastResponse(cachedRows);
        return res.json({ location: name, forecast });
      }
    }

    // Fetch fresh forecast data
    const forecastData = await fetchForecastFromAPI(latitude, longitude);
    
    // Ensure latitude and longitude are never null before saving
    const finalLat = latitude || 13.3333;
    const finalLon = longitude || 121.3000;
    
    // Save to database
    await saveForecastData(attractionId, finalLat, finalLon, name, forecastData);
    
    res.json(forecastData);

  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    res.status(500).json({ error: 'Failed to fetch forecast data', details: error.message });
  }
});

/**
 * GET /api/weather/batch
 * Get weather for multiple locations
 */
router.post('/batch', async (req, res) => {
  try {
    const { attractionIds } = req.body;

    if (!Array.isArray(attractionIds) || attractionIds.length === 0) {
      return res.status(400).json({ error: 'attractionIds array is required' });
    }

    const weatherPromises = attractionIds.map(async (id) => {
      try {
        // Get attraction data
        const [attractionRows] = await db.promise().query(
          'SELECT id, latitude, longitude, name FROM attractions WHERE id = ?',
          [id]
        );

        if (attractionRows.length === 0) {
          return { attractionId: id, error: 'Attraction not found' };
        }

        const attraction = attractionRows[0];
        
        // Get cached weather or fetch new
        const weatherRows = await getCachedWeatherRows(id);

        let weatherData;
        if (weatherRows.length > 0) {
          weatherData = formatWeatherResponse(weatherRows[0]);
        } else {
          weatherData = await fetchWeatherFromAPI(attraction.latitude, attraction.longitude, attraction.name);
          await saveWeatherData(id, attraction.latitude, attraction.longitude, attraction.name, weatherData);
        }

        const alerts = await getWeatherAlerts(weatherRows[0]?.weather_id);

        return {
          attractionId: id,
          attraction: {
            name: attraction.name,
            latitude: attraction.latitude,
            longitude: attraction.longitude
          },
          weather: weatherData,
          alerts
        };

      } catch (error) {
        return { attractionId: id, error: error.message };
      }
    });

    const results = await Promise.all(weatherPromises);
    res.json(results);

  } catch (error) {
    console.error('Error in batch weather request:', error);
    res.status(500).json({ error: 'Failed to fetch batch weather data' });
  }
});

/**
 * GET /api/weather/recommendations
 * Returns attractions ranked by weather-aware safety/comfort scores.
 * Query params: type=attractions (default), mode=smart|baseline
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { type = 'attractions', mode = 'smart' } = req.query;

    if (type !== 'attractions') {
      return res.status(400).json({ error: 'Only attractions recommendations are supported currently' });
    }

    // Fetch attractions with coordinates
    const [rows] = await db.promise().query(
      `SELECT id, name, location, description, latitude, longitude
       FROM attractions
       WHERE latitude IS NOT NULL AND longitude IS NOT NULL
       LIMIT 50`
    );

    const items = [];

    for (const row of rows) {
      try {
        const lat = parseFloat(row.latitude);
        const lon = parseFloat(row.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lon)) {
          console.warn(`Invalid coordinates for attraction ${row.id}: lat=${row.latitude}, lon=${row.longitude}`);
          continue;
        }

        // Get cached weather or fetch fresh (with error handling)
        let weatherPayload = null;
        try {
          weatherPayload = await getWeatherWithCache(row.id, lat, lon, row.name);
        } catch (weatherError) {
          console.warn(`Weather fetch failed for attraction ${row.id}:`, weatherError.message);
          // Continue with null weatherPayload
        }

        // Derive recommendation summary (may be null if weather fetch failed)
        const summary = weatherPayload ? getRecommendationSummary(weatherPayload) : null;

        // Baseline score fallback when smart mode or weather unavailable
        const baselineScore = 60; // simple neutral baseline
        const score = mode === 'smart' && summary ? summary.score : baselineScore;

        items.push({
          id: row.id,
          name: row.name,
          location: row.location,
          description: row.description,
          temperature: weatherPayload?.temperature ?? null,
          condition: weatherPayload?.condition ?? null,
          hazards: summary?.hazards ?? [],
          hazardLevel: summary?.hazardLevel ?? 'unknown',
          safetyScore: summary?.safetyScore ?? null,
          comfortScore: summary?.comfortScore ?? null,
          score,
          explanation: summary?.explanation ?? 'Standard ranking',
          modeUsed: summary ? 'smart' : 'baseline'
        });
      } catch (itemError) {
        console.error(`Error processing attraction ${row.id}:`, itemError);
        // Continue processing other attractions
        continue;
      }
    }

    // Sort by score desc
    items.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.json({ mode: mode === 'smart' ? 'smart' : 'baseline', items });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations', details: error.message });
  }
});

/**
 * GET /api/weather/alerts/:attractionId
 * Get active weather alerts for an attraction
 */
router.get('/alerts/:attractionId', async (req, res) => {
  try {
    const { attractionId } = req.params;

    const hasAlerts = await hasWeatherAlertsTable();
    if (!hasAlerts) {
      return res.json([]);
    }

    const [alertRows] = await db.promise().query(
      `SELECT wa.* FROM weather_alerts wa
       JOIN weather_data wd ON wa.weather_id = wd.weather_id
       WHERE wd.attraction_id = ? 
       AND wa.is_active = TRUE 
       AND (wa.expires_at IS NULL OR wa.expires_at > NOW())
       ORDER BY wa.severity_level DESC, wa.created_at DESC`,
      [attractionId]
    );

    const alerts = alertRows.map(formatAlertResponse);
    res.json(alerts);

  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    res.status(500).json({ error: 'Failed to fetch weather alerts' });
  }
});

/**
 * GET /api/weather/alternatives/:attractionId
 * Get alternative destinations based on weather conditions
 */
router.get('/alternatives/:attractionId', async (req, res) => {
  try {
    const { attractionId } = req.params;

    // Get current weather for the attraction
    const weatherRows = await getCachedWeatherRows(attractionId);

    if (weatherRows.length === 0) {
      return res.status(404).json({ error: 'No current weather data available' });
    }

    const currentWeather = weatherRows[0];
    const weatherCondition = currentWeather.weather_condition.toLowerCase();

    // Get weather alerts to determine if alternatives are needed
    const hasAlerts = await hasWeatherAlertsTable();
    if (!hasAlerts) {
      return res.json({
        needsAlternative: false,
        message: 'Weather alerts are not enabled in this environment',
        alternatives: []
      });
    }

    const [alertRows] = await db.promise().query(
      `SELECT * FROM weather_alerts 
       WHERE weather_id = ? 
       AND is_active = TRUE 
       AND severity_level IN ('high', 'extreme')`,
      [currentWeather.weather_id]
    );

    if (alertRows.length === 0) {
      return res.json({ 
        needsAlternative: false, 
        message: 'Current weather conditions are suitable for travel',
        alternatives: []
      });
    }

    // Get predefined alternatives
    const [alternativeRows] = await db.promise().query(
      `SELECT 
         wa.*, 
         a.name as alternative_name, 
         a.latitude, 
         a.longitude, 
         a.description as alternative_description
       FROM weather_alternatives wa
       JOIN attractions a ON wa.alternative_attraction_id = a.id
       WHERE wa.original_attraction_id = ? 
       AND wa.is_active = TRUE
       AND JSON_CONTAINS(wa.weather_conditions, JSON_QUOTE(?))
       ORDER BY wa.suitability_score DESC`,
      [attractionId, weatherCondition]
    );

    const alternatives = alternativeRows.map(row => ({
      attractionId: row.alternative_attraction_id,
      name: row.alternative_name,
      reason: row.reason,
      suitabilityScore: row.suitability_score,
      latitude: row.latitude,
      longitude: row.longitude,
      description: row.alternative_description
    }));

    res.json({
      needsAlternative: true,
      currentCondition: weatherCondition,
      alerts: alertRows.map(formatAlertResponse),
      alternatives
    });

  } catch (error) {
    console.error('Error fetching weather alternatives:', error);
    res.status(500).json({ error: 'Failed to fetch weather alternatives' });
  }
});

/**
 * GET /api/weather/statistics/:attractionId
 * Get weather statistics for an attraction
 */
router.get('/statistics/:attractionId', async (req, res) => {
  try {
    const { attractionId } = req.params;
    const { year = new Date().getFullYear() } = req.query;

    const [statRows] = await db.promise().query(
      'SELECT * FROM weather_statistics WHERE attraction_id = ? AND year = ? ORDER BY month',
      [attractionId, year]
    );

    res.json(statRows);

  } catch (error) {
    console.error('Error fetching weather statistics:', error);
    res.status(500).json({ error: 'Failed to fetch weather statistics' });
  }
});

/**
 * POST /api/weather/preferences
 * Update user weather preferences
 */
router.post('/preferences', async (req, res) => {
  try {
    const { 
      userId, 
      temperatureUnit, 
      windSpeedUnit, 
      receiveAlerts, 
      alertTypes,
      minSafeTemperature,
      maxSafeTemperature,
      maxSafeWindSpeed
    } = req.body;

    await db.promise().query(
      `INSERT INTO user_weather_preferences 
       (user_id, temperature_unit, wind_speed_unit, receive_alerts, alert_types, 
        min_safe_temperature, max_safe_temperature, max_safe_wind_speed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       temperature_unit = VALUES(temperature_unit),
       wind_speed_unit = VALUES(wind_speed_unit),
       receive_alerts = VALUES(receive_alerts),
       alert_types = VALUES(alert_types),
       min_safe_temperature = VALUES(min_safe_temperature),
       max_safe_temperature = VALUES(max_safe_temperature),
       max_safe_wind_speed = VALUES(max_safe_wind_speed),
       updated_at = CURRENT_TIMESTAMP`,
      [userId, temperatureUnit, windSpeedUnit, receiveAlerts, 
       JSON.stringify(alertTypes), minSafeTemperature, maxSafeTemperature, maxSafeWindSpeed]
    );

    res.json({ success: true, message: 'Weather preferences updated successfully' });

  } catch (error) {
    console.error('Error updating weather preferences:', error);
    res.status(500).json({ error: 'Failed to update weather preferences' });
  }
});

// Helper Functions

async function fetchWeatherFromAPI(lat, lon, locationName) {
  if (!WEATHER_API_KEY) {
    // Return mock data when API key is not available
    return getMockWeatherData(locationName);
  }

  try {
    const response = await axios.get(
      `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`,
      { timeout: 5000 } // Add 5 second timeout
    );

    const data = response.data;
    
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind?.speed * 3.6 * 10) / 10,
      windDirection: data.wind?.deg || 0,
      visibility: data.visibility || null,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      iconCode: data.weather[0].icon,
      rainfall1h: data.rain?.['1h'] || 0,
      cloudiness: data.clouds?.all || 0,
      timestamp: new Date()
    };

  } catch (error) {
    console.warn('Weather API failed, using mock data:', error.message);
    return getMockWeatherData(locationName);
  }
}

async function fetchForecastFromAPI(lat, lon) {
  if (!WEATHER_API_KEY) {
    return getMockForecastData();
  }

  try {
    const response = await axios.get(
      `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    const data = response.data;
    
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
    
    // Convert to array, sort by date, and take 7 days
    const forecast = Object.values(forecastByDay)
      .sort((a, b) => a.dt - b.dt)
      .slice(0, 7)
      .map(item => ({
        datetime: new Date(item.dt * 1000),
        temperature: Math.round(item.main.temp),
        condition: item.weather[0].main,
        description: item.weather[0].description,
        iconCode: item.weather[0].icon,
        rainfall: item.rain?.['3h'] || 0,
        windSpeed: Math.round(item.wind?.speed * 3.6 * 10) / 10
      }));
    
    return {
      location: data.city.name,
      forecast
    };

  } catch (error) {
    console.warn('Forecast API failed, using mock data:', error.message);
    return getMockForecastData();
  }
}

function getMockWeatherData(locationName) {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Mist'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    temperature: Math.floor(Math.random() * 15) + 20,
    feelsLike: Math.floor(Math.random() * 15) + 22,
    humidity: Math.floor(Math.random() * 40) + 40,
    pressure: Math.floor(Math.random() * 50) + 1000,
    windSpeed: Math.floor(Math.random() * 20),
    windDirection: Math.floor(Math.random() * 360),
    visibility: Math.floor(Math.random() * 10000) + 5000,
    condition,
    description: getConditionDescription(condition),
    iconCode: getIconCode(condition),
    rainfall1h: condition === 'Rain' ? Math.random() * 10 : 0,
    cloudiness: Math.floor(Math.random() * 100),
    timestamp: new Date()
  };
}

function getMockForecastData() {
  const forecast = [];
  const today = new Date();
  const conditions = ['Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Mist'];
  
  for (let i = 0; i < 7; i++) {
    // Create date in UTC to avoid timezone issues
    const forecastDate = new Date(today);
    forecastDate.setUTCDate(forecastDate.getUTCDate() + i);
    forecastDate.setUTCHours(12, 0, 0, 0);
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    forecast.push({
      datetime: forecastDate,
      temperature: Math.floor(Math.random() * 10) + 22,
      condition: condition,
      description: getConditionDescription(condition),
      rainfall: condition === 'Rain' ? Math.random() * 10 : 0,
      windSpeed: Math.floor(Math.random() * 15)
    });
  }
  
  return { location: 'Naujan', forecast };
}

async function saveWeatherData(attractionId, lat, lon, locationName, weatherData) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Cache for 10 minutes

  const columns = await getWeatherDataColumns();
  const fields = ['attraction_id'];
  const values = [attractionId];
  const addField = (name, value) => {
    if (columns.has(name)) {
      fields.push(name);
      values.push(value ?? null);
    }
  };

  addField('latitude', lat);
  addField('longitude', lon);
  addField('location_name', locationName);
  addField('temperature', weatherData.temperature);
  addField('feels_like', weatherData.feelsLike);
  addField('humidity', weatherData.humidity);
  addField('pressure', weatherData.pressure);
  addField('wind_speed', weatherData.windSpeed);
  addField('wind_direction', weatherData.windDirection);
  addField('visibility', weatherData.visibility);
  addField('weather_condition', weatherData.condition);
  addField('description', weatherData.description);
  addField('icon_code', weatherData.iconCode);
  addField('rainfall_1h', weatherData.rainfall1h);
  addField('cloudiness', weatherData.cloudiness);
  addField('data_timestamp', weatherData.timestamp);
  addField('expires_at', expiresAt);

  const placeholders = fields.map(() => '?').join(', ');
  const [result] = await db.promise().query(
    `INSERT INTO weather_data (${fields.join(', ')}) VALUES (${placeholders})`,
    values
  );

  return result.insertId;
}

async function generateAndSaveAlerts(weatherId, weatherData) {
  const hasAlerts = await hasWeatherAlertsTable();
  if (!hasAlerts) return [];
  const alerts = [];
  
  // Temperature alerts
  if (weatherData.temperature > 35) {
    alerts.push({
      weatherId, type: 'heat', severity: 'high',
      message: 'Extreme heat warning - Stay hydrated and seek shade',
      icon: '🌡️', color: '#ff5722'
    });
  }

  // Weather condition alerts
  if (weatherData.condition.includes('Thunderstorm')) {
    alerts.push({
      weatherId, type: 'storm', severity: 'high',
      message: 'Thunderstorm alert - Seek indoor shelter immediately',
      icon: '⛈️', color: '#ff1744'
    });
  }

  if (weatherData.condition.includes('Rain') || weatherData.rainfall1h > 5) {
    const severity = weatherData.rainfall1h > 15 ? 'high' : 'medium';
    alerts.push({
      weatherId, type: 'rain', severity,
      message: severity === 'high' ? 'Heavy rain warning - Flash floods possible' : 'Moderate rain expected - Carry umbrella',
      icon: '🌧️', color: severity === 'high' ? '#ff5722' : '#ff9800'
    });
  }

  // Save alerts to database
  for (const alert of alerts) {
    await db.promise().query(
      `INSERT INTO weather_alerts 
       (weather_id, alert_type, severity_level, alert_message, alert_icon, alert_color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [alert.weatherId, alert.type, alert.severity, alert.message, alert.icon, alert.color]
    );
  }

  return alerts;
}

async function getWeatherAlerts(weatherId) {
  if (!weatherId) return [];

  const hasAlerts = await hasWeatherAlertsTable();
  if (!hasAlerts) return [];

  const [rows] = await db.promise().query(
    `SELECT * FROM weather_alerts 
     WHERE weather_id = ? AND is_active = TRUE 
     AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY severity_level DESC`,
    [weatherId]
  );

  return rows.map(formatAlertResponse);
}

function formatWeatherResponse(row) {
  return {
    temperature: parseFloat(row.temperature),
    feelsLike: parseFloat(row.feels_like),
    humidity: row.humidity,
    pressure: parseFloat(row.pressure),
    windSpeed: parseFloat(row.wind_speed),
    windDirection: row.wind_direction,
    visibility: row.visibility,
    condition: row.weather_condition,
    description: row.description,
    iconCode: row.icon_code,
    rainfall: parseFloat(row.rainfall_1h),
    cloudiness: row.cloudiness,
    timestamp: row.data_timestamp,
    location: row.location_name
  };
}

function formatAlertResponse(row) {
  return {
    id: row.alert_id,
    type: row.alert_type,
    severity: row.severity_level,
    message: row.alert_message,
    icon: row.alert_icon,
    color: row.alert_color,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

function formatForecastResponse(rows) {
  // Group by day and select the noon (12:00) entry for each day
  const forecastByDay = {};
  
  rows.forEach(row => {
    const dateKey = row.forecast_date; // YYYY-MM-DD format
    const hour = row.forecast_hour;
    
    // Keep entry closest to noon (12:00)
    if (!forecastByDay[dateKey] || Math.abs(hour - 12) < Math.abs(forecastByDay[dateKey].forecast_hour - 12)) {
      forecastByDay[dateKey] = row;
    }
  });
  
  // Convert to array and sort by date
  return Object.values(forecastByDay)
    .sort((a, b) => new Date(a.forecast_date) - new Date(b.forecast_date))
    .slice(0, 7) // Limit to 7 days
    .map(row => ({
      datetime: new Date(row.forecast_date + 'T' + String(row.forecast_hour).padStart(2, '0') + ':00:00'),
      temperature: parseFloat(row.temperature),
      condition: row.weather_condition,
      description: row.description,
      rainfall: parseFloat(row.rainfall_amount),
      windSpeed: parseFloat(row.wind_speed)
    }));
}

function getConditionDescription(condition) {
  const descriptions = {
    'Clear': 'clear sky',
    'Clouds': 'scattered clouds',
    'Rain': 'light rain',
    'Thunderstorm': 'thunderstorm with rain',
    'Mist': 'mist'
  };
  return descriptions[condition] || 'unknown';
}

function getIconCode(condition) {
  const icons = {
    'Clear': '01d',
    'Clouds': '03d',
    'Rain': '10d',
    'Thunderstorm': '11d',
    'Mist': '50d'
  };
  return icons[condition] || '01d';
}

async function saveForecastData(attractionId, lat, lon, locationName, forecastData) {
  for (const forecast of forecastData.forecast) {
    const forecastDate = forecast.datetime.toISOString().split('T')[0];
    const forecastHour = forecast.datetime.getHours();

    await db.promise().query(
      `INSERT INTO weather_forecasts 
       (attraction_id, latitude, longitude, location_name, forecast_date, forecast_hour,
        temperature, humidity, wind_speed, weather_condition, description, rainfall_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       temperature = VALUES(temperature),
       weather_condition = VALUES(weather_condition),
       description = VALUES(description),
       rainfall_amount = VALUES(rainfall_amount)`,
      [attractionId, lat, lon, locationName, forecastDate, forecastHour,
       forecast.temperature, 70, forecast.windSpeed, forecast.condition, 
       forecast.description, forecast.rainfall]
    );
  }
}

// Utility: fetch weather with cache fallback for recommendations
async function getWeatherWithCache(attractionId, lat, lon, name) {
  try {
    // Try cached
    const cachedRows = await getCachedWeatherRows(attractionId);

    if (cachedRows.length > 0) {
      return formatWeatherResponse(cachedRows[0]);
    }

    // Fetch fresh and store
    const weatherData = await fetchWeatherFromAPI(lat, lon, name);
    
    // Only save to database if we have valid weather data
    if (weatherData && weatherData.temperature !== undefined) {
      try {
        const weatherId = await saveWeatherData(attractionId, lat, lon, name, weatherData);
        await generateAndSaveAlerts(weatherId, weatherData);
      } catch (saveError) {
        console.warn(`Failed to save weather data for attraction ${attractionId}:`, saveError.message);
        // Continue with weatherData even if save fails
      }
    }
    
    return weatherData;
  } catch (error) {
    console.error(`Error in getWeatherWithCache for attraction ${attractionId}:`, error);
    throw error; // Re-throw to be handled by caller
  }
}

// Utility: hazard analysis and scoring (aligned with frontend scoring additions)
function analyzeHazardsLocal(weatherData) {
  const hazards = [];
  const { temperature, windSpeed, condition, rainfall, visibility, humidity } = weatherData;

  if (temperature > 35) hazards.push({ level: 'high', message: 'Extreme heat warning' });
  else if (temperature < 15) hazards.push({ level: 'medium', message: 'Cool conditions' });

  if (condition && (condition.includes('Thunderstorm') || condition.includes('Storm'))) {
    hazards.push({ level: 'high', message: 'Thunderstorm alert' });
  }

  if ((condition && condition.includes('Rain')) || (rainfall && rainfall > 5)) {
    hazards.push({ level: rainfall > 15 ? 'high' : 'medium', message: 'Rain expected' });
  }

  if (windSpeed > 20) hazards.push({ level: 'high', message: 'Strong winds' });
  else if (windSpeed > 10) hazards.push({ level: 'medium', message: 'Moderate winds' });

  if (visibility && visibility < 1000) hazards.push({ level: 'medium', message: 'Low visibility' });

  if (humidity > 80 && temperature > 25) hazards.push({ level: 'medium', message: 'High humidity discomfort' });

  return hazards;
}

function getTravelSafetyScoreLocal(weatherData) {
  let score = 100;
  const hazards = analyzeHazardsLocal(weatherData);
  hazards.forEach(h => {
    if (h.level === 'high') score -= 30;
    else if (h.level === 'medium') score -= 15;
  });
  return Math.max(0, score);
}

function computeComfortScoreLocal(weatherData) {
  const { temperature, humidity, feelsLike } = weatherData;
  let score = 100;
  if (temperature < 16 || temperature > 35) score -= 25;
  else if (temperature < 19 || temperature > 32) score -= 15;
  else if (temperature < 22 || temperature > 30) score -= 8;
  if (humidity > 85) score -= 15;
  else if (humidity > 75) score -= 8;
  else if (humidity > 65) score -= 4;
  if (Math.abs((feelsLike ?? temperature) - temperature) > 3) score -= 6;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getHazardLevelLocal(hazards) {
  if (!hazards || hazards.length === 0) return 'low';
  if (hazards.some(h => h.level === 'high')) return 'high';
  if (hazards.some(h => h.level === 'medium')) return 'medium';
  return 'low';
}

function getRecommendationSummary(weatherData) {
  if (!weatherData) return null;
  const hazards = analyzeHazardsLocal(weatherData);
  const safetyScore = getTravelSafetyScoreLocal(weatherData);
  const comfortScore = computeComfortScoreLocal(weatherData);
  const compositeScore = Math.round(safetyScore * 0.65 + comfortScore * 0.35);
  const reasons = [
    `Safety ${safetyScore}/100`,
    `Comfort ${comfortScore}/100`,
    hazards.length > 0 ? `Hazard: ${hazards[0].message}` : 'No significant hazards'
  ];
  return {
    score: compositeScore,
    safetyScore,
    comfortScore,
    hazards,
    hazardLevel: getHazardLevelLocal(hazards),
    explanation: reasons.join(' | ')
  };
}

export default router;