/**
 * Enhanced Weather Widget Component
 * Displays comprehensive weather information with hazard alerts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService';
import { getApiBaseUrl } from '../api';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = getApiBaseUrl();

const WeatherWidget = ({ 
  attractionId, 
  latitude, 
  longitude, 
  locationName, 
  showForecast = false,
  showAlerts = true,
  showSafetyTips = false,
  size = 'medium', // small, medium, large
  theme = 'light' // light, dark
}) => {
  const { t, language } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedHourlyTime, setSelectedHourlyTime] = useState('');
  const isCompactLayout = size === 'small';

  const normalizeForecastPayload = (raw) => {
    if (!raw || typeof raw !== 'object') return null;

    if (Array.isArray(raw.hourlyToday) || Array.isArray(raw.forecast)) {
      return {
        location: raw.location,
        hourlyToday: Array.isArray(raw.hourlyToday) ? raw.hourlyToday : [],
        forecast: Array.isArray(raw.forecast) ? raw.forecast : []
      };
    }

    if (raw.data && (Array.isArray(raw.data.hourlyToday) || Array.isArray(raw.data.forecast))) {
      return {
        location: raw.data.location,
        hourlyToday: Array.isArray(raw.data.hourlyToday) ? raw.data.hourlyToday : [],
        forecast: Array.isArray(raw.data.forecast) ? raw.data.forecast : []
      };
    }

    return null;
  };

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let weatherData;
      let usedBackend = false;
      
      if (attractionId) {
        // Try to fetch from backend API first
        try {
          const response = await fetch(`${API_BASE_URL}/api/weather/current/${attractionId}`);
          if (response.ok) {
            const data = await response.json();
            weatherData = data;
            setAlerts(data.alerts || []);
            usedBackend = true;
          } else {
            console.warn('Backend API returned non-ok status, falling back to direct service');
          }
        } catch (backendErr) {
          console.warn('Backend API fetch failed, falling back to weatherService:', backendErr);
        }
        
        // If backend failed and we have coordinates, fall back to weatherService
        if (!usedBackend && latitude && longitude) {
          weatherData = await weatherService.getCurrentWeather(latitude, longitude, locationName);
          const hazards = weatherService.analyzeHazards(weatherData);
          setAlerts(hazards);
        }
      } else if (latitude && longitude) {
        // Use weather service directly if no attractionId
        weatherData = await weatherService.getCurrentWeather(latitude, longitude, locationName);
        const hazards = weatherService.analyzeHazards(weatherData);
        setAlerts(hazards);
      }
      
      if (!weatherData) {
        throw new Error('Unable to fetch weather data - no data source available');
      }

      setWeather(weatherData);

      // Store alerts locally for checking
      const currentAlerts = weatherData ? weatherService.analyzeHazards(weatherData) : [];

      // Fetch forecast if requested
      if (showForecast) {
        let forecastData;
        if (usedBackend && attractionId) {
          try {
            const forecastResponse = await fetch(`${API_BASE_URL}/api/weather/forecast/${attractionId}?force_refresh=true`);
            if (!forecastResponse.ok) {
              throw new Error(`Forecast API returned ${forecastResponse.status}`);
            }

            const backendForecastData = await forecastResponse.json();
            forecastData = normalizeForecastPayload(backendForecastData);

            // If backend payload has no hourly data, use weather service for hourly fallback.
            if ((!forecastData || !Array.isArray(forecastData.hourlyToday) || forecastData.hourlyToday.length === 0) && latitude && longitude) {
              forecastData = await weatherService.getWeatherForecast(latitude, longitude);
            }
          } catch (err) {
            console.warn('Backend forecast fetch failed, using service');
            forecastData = await weatherService.getWeatherForecast(latitude, longitude);
          }
        } else {
          forecastData = await weatherService.getWeatherForecast(latitude, longitude);
        }

        setForecast(normalizeForecastPayload(forecastData) || { hourlyToday: [], forecast: [] });
      }

      // Fetch alternatives if there are high-risk alerts
      if (usedBackend && attractionId && currentAlerts.some(alert => alert.level === 'high' || alert.severity === 'high')) {
        try {
          const altResponse = await fetch(`${API_BASE_URL}/api/weather/alternatives/${attractionId}`);
          if (altResponse.ok) {
            const altData = await altResponse.json();
            if (altData.needsAlternative) {
              setAlternatives(altData.alternatives || []);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch alternatives:', err);
        }
      }

    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [attractionId, latitude, longitude, locationName, showForecast]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  useEffect(() => {
    if (!forecast || !Array.isArray(forecast.hourlyToday) || forecast.hourlyToday.length === 0) {
      setSelectedHourlyTime('');
      return;
    }

    const now = new Date();
    const currentHour = now.getHours();

    const nearestSlot = forecast.hourlyToday.reduce((best, slot) => {
      const slotHour = parseInt(slot.time.split(':')[0], 10);
      const bestHour = parseInt(best.time.split(':')[0], 10);
      return Math.abs(slotHour - currentHour) < Math.abs(bestHour - currentHour) ? slot : best;
    }, forecast.hourlyToday[0]);

    setSelectedHourlyTime(prev => prev || nearestSlot.time);
  }, [forecast]);

  const getWeatherIcon = (condition, iconCode) => {
    if (iconCode && iconCode.length > 0) {
      return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }
    
    const icons = {
      'Clear': '🌞',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️',
      'Smoke': '💨'
    };
    return icons[condition] || '🌤️';
  };

  const getSafetyScore = () => {
    if (!weather) return 100;
    return weatherService.getTravelSafetyScore(weather);
  };

  const getSafetyColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    if (score >= 40) return '#ff5722';
    return '#f44336';
  };

  const localizeAlertMessage = (alert) => {
    if (!alert) return '';
    const level = alert.level || alert.severity;

    if (alert.type === 'storm') return t('alert_storm_seek_shelter');
    if (alert.type === 'rain' && level === 'high') return t('alert_heavy_rain_warning');
    if (alert.type === 'rain') return t('alert_moderate_rain_expected');
    if (alert.type === 'wind' && level === 'high') return t('alert_strong_winds');
    if (alert.type === 'wind') return t('alert_moderate_winds');
    if (alert.type === 'fog') return t('alert_poor_visibility');
    if (alert.type === 'humidity') return t('alert_high_humidity');

    return alert.message;
  };

  const getSafetyTips = () => {
    if (!weather) return [];

    const tips = [];
    const alertLevels = new Set((alerts || []).map((alert) => alert.level || alert.severity || ''));

    if (alertLevels.has('high') || alertLevels.has('extreme')) {
      tips.push(t('tip_check_hazard_alerts'));
    }

    if ((weather.temperature ?? 0) >= 32) {
      tips.push(t('tip_heat_hydration'));
    }

    if ((weather.rainfall ?? 0) > 0 || alertLevels.has('medium') || alertLevels.has('high') || alertLevels.has('extreme')) {
      tips.push(t('tip_rain_gear'));
    }

    if ((weather.windSpeed ?? 0) >= 20) {
      tips.push(t('tip_strong_wind'));
    }

    if ((weather.humidity ?? 0) >= 80) {
      tips.push(t('tip_high_humidity'));
    }

    tips.push(t('tip_general_safety'));

    return Array.from(new Set(tips));
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const selectedHourlyForecast = forecast && Array.isArray(forecast.hourlyToday)
    ? forecast.hourlyToday.find(hour => hour.time === selectedHourlyTime) || forecast.hourlyToday[0]
    : null;

  if (loading) {
    return (
      <div style={getContainerStyle()}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <span>{t('loading_weather_data')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={getContainerStyle()}>
        <div style={errorStyle}>
          <span>⚠️ {t('weather_data_unavailable')}</span>
          <button style={retryButtonStyle} onClick={fetchWeatherData}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const safetyScore = getSafetyScore();

  return (
    <div style={getContainerStyle()}>
      {/* Main Weather Display */}
      <div style={mainWeatherStyle}>
        <div style={headerStyle}>
          <div style={locationStyle}>
            <h3 style={locationNameStyle}>{locationName || weather.location?.name || t('location')}</h3>
            {weather.timestamp && (
              <span style={timestampStyle}>
                {t('updated')}: {formatTime(weather.timestamp)}
              </span>
            )}
          </div>
          <div style={safetyScoreStyle}>
            <div 
              style={{
                ...safetyCircleStyle,
                borderColor: getSafetyColor(safetyScore)
              }}
            >
              <span style={{ color: getSafetyColor(safetyScore), fontWeight: 'bold' }}>
                {safetyScore}
              </span>
            </div>
            <span style={safetyLabelStyle}>{t('safety_score')}</span>
          </div>
        </div>

        <div style={currentWeatherStyle}>
          <div style={temperatureDisplayStyle}>
            {typeof getWeatherIcon(weather.condition, weather.iconCode) === 'string' && 
             getWeatherIcon(weather.condition, weather.iconCode).startsWith('http') ? (
              <img 
                src={getWeatherIcon(weather.condition, weather.iconCode)} 
                alt={weather.condition}
                style={weatherIconImageStyle}
              />
            ) : (
              <span style={weatherIconStyle}>
                {getWeatherIcon(weather.condition, weather.iconCode)}
              </span>
            )}
            <div>
              <span style={temperatureStyle}>{weather.temperature}°C</span>
              <span style={conditionStyle}>{weather.description}</span>
            </div>
          </div>

          <div style={weatherDetailsGridStyle}>
            <div style={weatherDetailStyle}>
              <span style={detailIconStyle}>🌡️</span>
              <div>
                <span style={detailLabelStyle}>{t('feels_like')}</span>
                <span style={detailValueStyle}>{weather.feelsLike}°C</span>
              </div>
            </div>
            
            <div style={weatherDetailStyle}>
              <span style={detailIconStyle}>💧</span>
              <div>
                <span style={detailLabelStyle}>{t('humidity')}</span>
                <span style={detailValueStyle}>{weather.humidity}%</span>
              </div>
            </div>
            
            <div style={weatherDetailStyle}>
              <span style={detailIconStyle}>💨</span>
              <div>
                <span style={detailLabelStyle}>{t('wind')}</span>
                <span style={detailValueStyle}>{weather.windSpeed} km/h</span>
              </div>
            </div>
            
            {weather.rainfall > 0 && (
              <div style={weatherDetailStyle}>
                <span style={detailIconStyle}>🌧️</span>
                <div>
                  <span style={detailLabelStyle}>{t('rain')}</span>
                  <span style={detailValueStyle}>{weather.rainfall.toFixed(1)}mm</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weather Alerts */}
        {showAlerts && alerts.length > 0 && (
          <div style={alertsContainerStyle}>
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                style={{
                  ...alertStyle,
                  backgroundColor: getAlertBackgroundColor(alert.level || alert.severity),
                  borderLeftColor: alert.color || getAlertColor(alert.level || alert.severity)
                }}
              >
                <span style={alertIconStyle}>{alert.icon}</span>
                <span style={alertMessageStyle}>{localizeAlertMessage(alert)}</span>
              </div>
            ))}
          </div>
        )}

        {showSafetyTips && (
          <div style={safetyTipsContainerStyle}>
            <h4 style={safetyTipsTitleStyle}>{t('safety_tips')}</h4>
            <div style={safetyTipsListStyle}>
              {getSafetyTips().map((tip, index) => (
                <div key={index} style={safetyTipItemStyle}>
                  <span style={safetyTipBulletStyle}>•</span>
                  <span style={safetyTipTextStyle}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Alternatives Button */}
        {alternatives.length > 0 && (
          <button 
            style={alternativesButtonStyle}
            onClick={() => setShowAlternatives(!showAlternatives)}
          >
            {showAlternatives ? '🔼' : '🔽'} {t('safer_alternatives')} ({alternatives.length})
          </button>
        )}

        {/* Alternatives List */}
        {showAlternatives && alternatives.length > 0 && (
          <div style={alternativesListStyle}>
            <h4 style={alternativesTitleStyle}>{t('recommended_alternatives')}</h4>
            {alternatives.map((alt, index) => (
              <div key={index} style={alternativeItemStyle}>
                <div style={alternativeHeaderStyle}>
                  <span style={alternativeNameStyle}>{alt.name}</span>
                  <span style={suitabilityScoreStyle}>
                    {alt.suitabilityScore}% {t('suitable')}
                  </span>
                </div>
                <p style={alternativeReasonStyle}>{alt.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Weather Info Toggle */}
        {size !== 'small' && (
          <button 
            style={detailsToggleStyle}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? t('hide') : t('show')} {t('details')}
          </button>
        )}

        {/* Detailed Weather Information */}
        {showDetails && (
          <div style={detailedInfoStyle}>
            <div style={detailRowStyle}>
              <span>{t('pressure')}:</span>
              <span>{weather.pressure} hPa</span>
            </div>
            {weather.visibility && (
              <div style={detailRowStyle}>
                <span>{t('visibility')}:</span>
                <span>{(weather.visibility / 1000).toFixed(1)} km</span>
              </div>
            )}
            <div style={detailRowStyle}>
              <span>{t('cloudiness')}:</span>
              <span>{weather.cloudiness}%</span>
            </div>
            {weather.windDirection && (
              <div style={detailRowStyle}>
                <span>{t('wind_direction')}:</span>
                <span>{weather.windDirection}°</span>
              </div>
            )}
            {weather.location?.sunrise && (
              <div style={detailRowStyle}>
                <span>{t('sunrise')}:</span>
                <span>{formatTime(weather.location.sunrise)}</span>
              </div>
            )}
            {weather.location?.sunset && (
              <div style={detailRowStyle}>
                <span>{t('sunset')}:</span>
                <span>{formatTime(weather.location.sunset)}</span>
              </div>
            )}
          </div>
        )}

        {/* Today's Hourly Forecast */}
        {showForecast && forecast && (
          <div style={hourlyContainerStyle}>
            <h4 style={forecastTitleStyle}>⏰ {t('today_hourly_forecast')}</h4>
            {selectedHourlyForecast ? (
              <div style={selectedHourlyCardStyle}>
                <div style={selectedHourlyHeaderStyle}>
                  <div>
                    <div style={selectedHourlyLabelStyle}>{t('weather_selected_time')}</div>
                    <div style={selectedHourlyTimeStyle}>{selectedHourlyForecast.time} {t('today')}</div>
                  </div>
                  <select
                    value={selectedHourlyTime}
                    onChange={(e) => setSelectedHourlyTime(e.target.value)}
                    style={selectedHourlySelectStyle}
                  >
                    {forecast.hourlyToday.map((hour) => (
                      <option key={hour.time} value={hour.time}>
                        {hour.time}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={selectedHourlyBodyStyle}>
                  <div style={selectedHourlyWeatherStyle}>
                    {(() => {
                      const iconResult = getWeatherIcon(selectedHourlyForecast.condition, selectedHourlyForecast.iconCode);
                      const isImageUrl = typeof iconResult === 'string' && iconResult.startsWith('http');
                      return isImageUrl ? (
                        <img
                          src={iconResult}
                          alt={selectedHourlyForecast.condition}
                          style={selectedHourlyMainIconStyle}
                        />
                      ) : (
                        <span style={selectedHourlyMainIconStyle}>{iconResult}</span>
                      );
                    })()}
                    <div>
                      <div style={selectedHourlyTempStyle}>{selectedHourlyForecast.temperature}°C</div>
                      <div style={selectedHourlyConditionStyle}>{selectedHourlyForecast.description}</div>
                    </div>
                  </div>
                  <div style={selectedHourlyMetaStyle}>
                    <span>{t('wind')}: {selectedHourlyForecast.windSpeed} m/s</span>
                    <span>{t('humidity')}: {selectedHourlyForecast.humidity}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                {t('no_hourly_forecast_today')}
              </div>
            )}
            {Array.isArray(forecast.hourlyToday) && forecast.hourlyToday.length > 0 && (
              <div style={hourlyListStyle}>
                {forecast.hourlyToday.map((hour, index) => {
                  const iconResult = getWeatherIcon(hour.condition, hour.iconCode);
                  const isImageUrl = typeof iconResult === 'string' && iconResult.startsWith('http');
                  const isSelected = hour.time === selectedHourlyTime;
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedHourlyTime(hour.time)}
                      style={{
                        ...hourlyItemStyle,
                        borderColor: isSelected ? '#1976d2' : 'rgba(0,0,0,0.08)',
                        boxShadow: isSelected ? '0 0 0 2px rgba(25, 118, 210, 0.18)' : 'none',
                        transform: isSelected ? 'translateY(-1px)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={hourlyTimeStyle}>{hour.time}</span>
                      <div style={hourlyIconStyle}>
                        {isImageUrl ? (
                          <img 
                            src={iconResult} 
                            alt={hour.condition}
                            style={hourlyWeatherIconStyle}
                          />
                        ) : (
                          iconResult
                        )}
                      </div>
                      <span style={hourlyTempStyle}>{hour.temperature}°</span>
                      <span style={hourlyWindStyle}>{hour.windSpeed} m/s</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Weather Forecast */}
        {showForecast && forecast && (
          <div style={forecastContainerStyle}>
            <h4 style={forecastTitleStyle}>📅 {t('forecast_7_day')}</h4>
            <div style={forecastListStyle}>
              {forecast.forecast && Array.isArray(forecast.forecast) ? (
                forecast.forecast.slice(0, 7).map((day, index) => {
                  // Parse date - handle both date objects and ISO strings
                  const date = day.datetime ? new Date(day.datetime) : new Date();
                  // Get UTC date to avoid timezone shift issues
                  const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
                  const iconResult = getWeatherIcon(day.condition, day.iconCode);
                  const isImageUrl = typeof iconResult === 'string' && iconResult.startsWith('http');
                  
                  return (
                    <div key={index} style={forecastItemStyle}>
                      <span style={forecastDateStyle}>
                        {utcDate.toLocaleDateString(language === 'zh' ? 'zh-CN' : language, { weekday: 'short' }).toUpperCase()}
                      </span>
                      <div style={forecastIconStyle}>
                        {isImageUrl ? (
                          <img 
                            src={iconResult} 
                            alt={day.condition}
                            style={forecastWeatherIconStyle}
                          />
                        ) : (
                          iconResult
                        )}
                      </div>
                      <span style={forecastTempStyle}>{day.temperature}°</span>
                      <span style={forecastConditionStyle}>{day.condition}</span>
                    </div>
                  );
                })
              ) : (
                <div style={forecastItemStyle}>{t('no_forecast_data')}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Style functions and definitions
  function getContainerStyle() {
    const baseStyle = {
      fontFamily: 'Arial, sans-serif',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      backgroundColor: theme === 'dark' ? '#2c3e50' : '#ffffff',
      color: theme === 'dark' ? '#ecf0f1' : '#2c3e50'
    };

    switch (size) {
      case 'small':
        return { ...baseStyle, width: '100%', maxWidth: '340px', padding: '14px' };
      case 'large':
        return { ...baseStyle, width: '100%', maxWidth: '500px', padding: '24px' };
      default:
        return { ...baseStyle, width: '100%', maxWidth: '400px', padding: '20px' };
    }
  }

  function getAlertColor(level) {
    const colors = {
      'low': '#4caf50',
      'medium': '#ff9800',
      'high': '#ff5722',
      'extreme': '#f44336'
    };
    return colors[level] || '#757575';
  }

  function getAlertBackgroundColor(level) {
    const colors = {
      'low': '#e8f5e8',
      'medium': '#fff3e0',
      'high': '#ffebee',
      'extreme': '#ffebee'
    };
    return colors[level] || '#f5f5f5';
  }
};

// Styles
const mainWeatherStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const locationStyle = {
  flex: 1
};

const locationNameStyle = {
  margin: 0,
  fontSize: '1.4rem',
  fontWeight: '600',
  color: 'inherit'
};

const timestampStyle = {
  fontSize: '0.8rem',
  opacity: 0.7,
  display: 'block',
  marginTop: '4px'
};

const safetyScoreStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
};

const safetyCircleStyle = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  border: '3px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.9rem'
};

const safetyLabelStyle = {
  fontSize: '0.7rem',
  opacity: 0.8
};

const currentWeatherStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const temperatureDisplayStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
};

const weatherIconStyle = {
  fontSize: '3rem'
};

const weatherIconImageStyle = {
  width: '64px',
  height: '64px'
};

const temperatureStyle = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  display: 'block',
  lineHeight: '1'
};

const conditionStyle = {
  fontSize: '1rem',
  opacity: 0.8,
  textTransform: 'capitalize',
  display: 'block'
};

const weatherDetailsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '12px'
};

const weatherDetailStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px',
  borderRadius: '8px',
  backgroundColor: 'rgba(0,0,0,0.05)'
};

const detailIconStyle = {
  fontSize: '1.2rem'
};

const detailLabelStyle = {
  fontSize: '0.8rem',
  opacity: 0.7,
  display: 'block'
};

const detailValueStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  display: 'block'
};

const alertsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const safetyTipsContainerStyle = {
  marginTop: '4px',
  padding: '14px',
  borderRadius: '10px',
  backgroundColor: '#f8fafc',
  border: '1px solid #dbeafe'
};

const safetyTipsTitleStyle = {
  margin: '0 0 10px 0',
  fontSize: '0.95rem',
  fontWeight: '700',
  color: '#0f172a'
};

const safetyTipsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const safetyTipItemStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'flex-start'
};

const safetyTipBulletStyle = {
  color: '#16a34a',
  fontWeight: '800',
  lineHeight: '1.2'
};

const safetyTipTextStyle = {
  fontSize: '0.88rem',
  lineHeight: '1.45',
  color: '#334155'
};

const alertStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px',
  borderRadius: '8px',
  borderLeft: '4px solid',
  fontSize: '0.9rem'
};

const alertIconStyle = {
  fontSize: '1.1rem'
};

const alertMessageStyle = {
  flex: 1
};

const alternativesButtonStyle = {
  backgroundColor: '#2196f3',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 12px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
};

const alternativesListStyle = {
  backgroundColor: 'rgba(0,0,0,0.05)',
  borderRadius: '8px',
  padding: '16px'
};

const alternativesTitleStyle = {
  margin: '0 0 12px 0',
  fontSize: '1rem',
  fontWeight: '600'
};

const alternativeItemStyle = {
  backgroundColor: 'white',
  borderRadius: '6px',
  padding: '12px',
  marginBottom: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const alternativeHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px'
};

const alternativeNameStyle = {
  fontWeight: '600',
  color: '#2196f3'
};

const suitabilityScoreStyle = {
  fontSize: '0.8rem',
  color: '#4caf50',
  fontWeight: '600'
};

const alternativeReasonStyle = {
  margin: 0,
  fontSize: '0.85rem',
  opacity: 0.8,
  lineHeight: '1.4'
};

const detailsToggleStyle = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(0,0,0,0.2)',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '0.85rem',
  cursor: 'pointer',
  alignSelf: 'center'
};

const detailedInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  backgroundColor: 'rgba(0,0,0,0.05)',
  borderRadius: '8px',
  padding: '16px'
};

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.9rem'
};

const forecastContainerStyle = {
  marginTop: '16px'
};

const forecastTitleStyle = {
  margin: '0 0 12px 0',
  fontSize: '1rem',
  fontWeight: '600'
};

const forecastListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const forecastItemStyle = {
  display: 'grid',
  gridTemplateColumns: '80px 50px auto 1fr',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: '8px',
  backgroundColor: 'rgba(0,0,0,0.05)',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(0,0,0,0.08)',
  scrollSnapAlign: 'start'
};

const forecastDateStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#2c3e50',
  minWidth: '80px'
};

const forecastIconStyle = {
  fontSize: '2rem',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const forecastWeatherIconStyle = {
  width: '48px',
  height: '48px',
  objectFit: 'contain'
};

const forecastTempStyle = {
  fontSize: '1rem',
  fontWeight: '700',
  color: '#ff6b6b',
  minWidth: '50px',
  textAlign: 'center'
};

const forecastConditionStyle = {
  fontSize: '0.85rem',
  opacity: 0.9,
  color: '#555',
  fontWeight: '500'
};

const hourlyContainerStyle = {
  marginTop: '16px',
  marginBottom: '16px'
};

const hourlyListStyle = {
  display: 'flex',
  gap: '10px',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  scrollSnapType: 'x mandatory',
  paddingBottom: '8px',
  justifyContent: 'flex-start',
  touchAction: 'pan-x'
};

const selectedHourlyCardStyle = {
  marginBottom: '14px',
  padding: '14px',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  border: '1px solid #e5eef8',
  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)'
};

const selectedHourlyHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '12px',
  flexWrap: 'wrap'
};

const selectedHourlyLabelStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const selectedHourlyTimeStyle = {
  fontSize: '1.05rem',
  fontWeight: '700',
  color: '#0f172a'
};

const selectedHourlySelectStyle = {
  minWidth: '110px',
  padding: '8px 10px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  color: '#0f172a',
  fontSize: '0.95rem',
  outline: 'none'
};

const selectedHourlyBodyStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const selectedHourlyWeatherStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const selectedHourlyMainIconStyle = {
  width: '52px',
  height: '52px',
  fontSize: '2.6rem',
  objectFit: 'contain'
};

const selectedHourlyTempStyle = {
  fontSize: '1.7rem',
  fontWeight: '700',
  color: '#0f172a',
  lineHeight: 1.1
};

const selectedHourlyConditionStyle = {
  fontSize: '0.95rem',
  color: '#475569',
  textTransform: 'capitalize'
};

const selectedHourlyMetaStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontSize: '0.9rem',
  color: '#334155'
};

const hourlyItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  padding: '12px 10px',
  borderRadius: '8px',
  backgroundColor: 'rgba(0,0,0,0.05)',
  border: '1px solid rgba(0,0,0,0.08)',
  minWidth: '90px',
  flex: '0 0 90px',
  textAlign: 'center'
};

const hourlyTimeStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#2c3e50'
};

const hourlyIconStyle = {
  fontSize: '1.8rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '36px'
};

const hourlyWeatherIconStyle = {
  width: '36px',
  height: '36px',
  objectFit: 'contain'
};

const hourlyTempStyle = {
  fontSize: '0.95rem',
  fontWeight: '700',
  color: '#ff6b6b'
};

const hourlyWindStyle = {
  fontSize: '0.75rem',
  opacity: 0.8,
  color: '#666'
};

const loadingStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '40px'
};

const spinnerStyle = {
  width: '32px',
  height: '32px',
  border: '3px solid rgba(0,0,0,0.1)',
  borderTop: '3px solid #2196f3',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const errorStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '40px',
  color: '#f44336'
};

const retryButtonStyle = {
  backgroundColor: '#f44336',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 16px',
  cursor: 'pointer'
};

// Add CSS animation (only once)
if (typeof window !== 'undefined' && !document.getElementById('weather-widget-styles')) {
  const styles = document.createElement('style');
  styles.id = 'weather-widget-styles';
  styles.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styles);
}

export default WeatherWidget;
