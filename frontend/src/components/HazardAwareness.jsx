/**
 * Hazard Awareness Component
 * Comprehensive hazard detection, monitoring, and user awareness system
 */

import React, { useState, useEffect } from 'react';
import { weatherService } from '../services/weatherService';
import { getApiBaseUrl } from '../api';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = getApiBaseUrl();

const HazardAwareness = ({ 
  attractionId, 
  latitude,
  longitude, 
  locationName,
  attractions = [],
  userId,
  enableNotifications = true,
  onHazardUpdate,
  style = {},
  compact = false
}) => {
  const { t } = useLanguage();
  const attractionList = Array.isArray(attractions) ? attractions : [];
  const [hazards, setHazards] = useState([]);
  const [hazardStats, setHazardStats] = useState({
    total: 0,
    extreme: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(!compact);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [expandedHazardDetail, setExpandedHazardDetail] = useState(null);

  const formatPredictedTime = (value) => {
    if (!value) return 'Unknown time';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const resolveForecastPredictionTime = (entry) => {
    if (entry?.datetime instanceof Date) {
      return entry.datetime;
    }

    if (typeof entry?.time === 'string' && /^\d{2}:\d{2}$/.test(entry.time)) {
      const [hour, minute] = entry.time.split(':').map(Number);
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      return date;
    }

    if (entry?.predictedAt) {
      const date = new Date(entry.predictedAt);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }

    return new Date();
  };

  // Fetch hazard data
  useEffect(() => {
    console.log('HazardAwareness - Attractions received:', attractions);
    fetchHazardData();
    const interval = setInterval(fetchHazardData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [attractionId, latitude, longitude, attractions]);

  const fetchHazardData = async () => {
    setLoading(true);
    setError(null);

    try {
      let allHazards = [];
      // Only fetch hazards for attractions, not the general location
      if (attractionList.length > 0) {
        const attractionResults = await fetchAttractionsHazards(attractionList);
        allHazards = attractionResults;
      }

      const displayHazards = aggregateHazardsForDisplay(allHazards);

      // Update hazard statistics
      const stats = {
        total: displayHazards.length,
        extreme: displayHazards.filter(h => h.level === 'extreme' || h.severity === 'extreme').length,
        high: displayHazards.filter(h => h.level === 'high' || h.severity === 'high').length,
        medium: displayHazards.filter(h => h.level === 'medium' || h.severity === 'medium').length,
        low: displayHazards.filter(h => h.level === 'low' || h.severity === 'low').length
      };

      // Group hazards by location
      const groupedHazards = groupHazardsByLocation(displayHazards);

      setHazards(groupedHazards);
      setHazardStats(stats);
      setLastUpdate(new Date());

      // Send browser notifications for extreme hazards
      if (enableNotifications && stats.extreme > 0) {
        sendExtremeHazardNotifications(displayHazards.filter(h => h.level === 'extreme' || h.severity === 'extreme'));
      }

      // Trigger callback
      if (onHazardUpdate) {
        onHazardUpdate({ hazards: displayHazards, stats });
      }

    } catch (err) {
      console.error('Error fetching hazard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttractionsHazards = async (attractions) => {
    const allHazards = [];

    console.log('Fetching hazards for attractions:', attractions);

    for (const attraction of attractions) {
      try {
        let weatherData;

        // Check if attraction has coordinates
        const hasCoordinates = (attraction.latitude && attraction.longitude) || 
                               (attraction.lat && attraction.lon) ||
                               (attraction.lat && attraction.lng);

        console.log(`Attraction ${attraction.name}:`, {
          hasCoordinates,
          latitude: attraction.latitude,
          longitude: attraction.longitude,
          lat: attraction.lat,
          lon: attraction.lon,
          lng: attraction.lng
        });

        if (!hasCoordinates) {
          console.warn(`Attraction ${attraction.name} has no coordinates, skipping...`);
          continue;
        }

        // Get coordinates from various possible field names
        const lat = attraction.latitude || attraction.lat;
        const lon = attraction.longitude || attraction.lon || attraction.lng;

        console.log(`Fetching weather for ${attraction.name} at (${lat}, ${lon})`);

        // Fetch weather data using coordinates
        weatherData = await weatherService.getCurrentWeather(
          lat,
          lon,
          attraction.name
        );

        if (weatherData) {
          const detectedHazards = weatherService.analyzeHazards(weatherData);
          console.log(`Found ${detectedHazards.length} hazards for ${attraction.name}`);
          detectedHazards.forEach(h => {
            allHazards.push({
              ...h,
              location: attraction.name,
              attractionId: attraction.id,
              predictedAt: new Date()
            });
          });

          const forecast = await weatherService.getWeatherForecast(lat, lon);
          const forecastHazards = buildForecastHazards(forecast, attraction);
          forecastHazards.forEach(hazard => allHazards.push(hazard));
        }
      } catch (error) {
        console.warn(`Failed to fetch hazards for ${attraction.name}:`, error);
      }
    }

    console.log('Total hazards found:', allHazards.length);
    return allHazards;
  };

  const buildForecastHazards = (forecast, attraction) => {
    if (!forecast) return [];

    const predictions = [];
    const forecastEntries = [
      ...(Array.isArray(forecast.hourlyToday) ? forecast.hourlyToday.map(item => ({ ...item, predictedAt: item.time })) : []),
      ...(Array.isArray(forecast.forecast) ? forecast.forecast.map(item => ({
        ...item,
        predictedAt: item.datetime
      })) : [])
    ];

    forecastEntries.forEach((entry) => {
      const analysisInput = {
        temperature: entry.temperature,
        humidity: entry.humidity ?? 0,
        windSpeed: entry.windSpeed ?? 0,
        condition: entry.condition || '',
        rainfall: entry.rainfall ?? 0,
        visibility: entry.visibility ?? null
      };

      const detectedHazards = weatherService.analyzeHazards(analysisInput);
      detectedHazards.forEach((hazard) => {
        predictions.push({
          ...hazard,
          location: attraction.name,
          attractionId: attraction.id,
          forecasted: true,
          predictedAt: resolveForecastPredictionTime(entry)
        });
      });
    });

    return predictions;
  };

  const aggregateHazardsForDisplay = (hazardList) => {
    const groupedByLocation = new Map();

    hazardList.forEach((hazard) => {
      const locationKey = hazard.location || 'Unknown Location';
      const hazardKey = [
        hazard.type || 'unknown',
        hazard.level || hazard.severity || 'low',
        hazard.message || ''
      ].join('::');

      if (!groupedByLocation.has(locationKey)) {
        groupedByLocation.set(locationKey, new Map());
      }

      const hazardsByType = groupedByLocation.get(locationKey);
      if (!hazardsByType.has(hazardKey)) {
        hazardsByType.set(hazardKey, {
          ...hazard,
          occurrences: [hazard.predictedAt || new Date()],
          occurrenceCount: 1
        });
        return;
      }

      const existing = hazardsByType.get(hazardKey);
      existing.occurrences.push(hazard.predictedAt || new Date());
      existing.occurrenceCount += 1;
      if (!existing.predictedAt || new Date(hazard.predictedAt || Date.now()) < new Date(existing.predictedAt || Date.now())) {
        existing.predictedAt = hazard.predictedAt || existing.predictedAt;
      }
    });

    return Array.from(groupedByLocation.values()).flatMap(locationMap => Array.from(locationMap.values()));
  };

  const sendExtremeHazardNotifications = (extremeHazards) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    extremeHazards.forEach(hazard => {
      new Notification('🚨 EXTREME WEATHER HAZARD', {
        body: `${hazard.message} at ${hazard.location || locationName}`,
        icon: '⚠️',
        tag: `extreme-hazard-${Date.now()}`,
        requireInteraction: true
      });
    });
  };

  const getSeverityIcon = (level) => {
    const icons = {
      'extreme': '🚨',
      'high': '⚠️',
      'medium': '⚡',
      'low': 'ℹ️'
    };
    return icons[level] || '⚠️';
  };

  const getSeverityColor = (level) => {
    const colors = {
      'extreme': '#f44336',
      'high': '#ff5722',
      'medium': '#ff9800',
      'low': '#4caf50'
    };
    return colors[level] || '#757575';
  };

  const getSeverityLabel = (level) => {
    return (level || 'unknown').toUpperCase();
  };

  const getHazardDescription = (hazard) => {
    const descriptions = {
      'heat': 'Extreme heat may cause heat exhaustion and dehydration',
      'cold': 'Cold temperatures require appropriate clothing and shelter',
      'storm': 'Thunderstorm poses risk of lightning strikes and flooding',
      'rain': 'Heavy rainfall may cause slippery surfaces and reduced visibility',
      'wind': 'Strong winds may be dangerous for outdoor activities',
      'flood': 'Flooding risk in low-lying areas',
      'visibility': 'Low visibility may make travel hazardous',
      'humidity': 'High humidity combined with heat increases discomfort'
    };
    return descriptions[hazard.type] || hazard.message;
  };

  const groupHazardsByLocation = (hazards) => {
    const grouped = {};

    hazards.forEach(hazard => {
      const location = hazard.location || 'Unknown Location';
      if (!grouped[location]) {
        grouped[location] = {
          location: location,
          hazards: [],
          highestLevel: 'low'
        };
      }
      grouped[location].hazards.push(hazard);

      // Determine highest severity level
      const currentLevel = hazard.level || hazard.severity || 'low';
      const levels = ['low', 'medium', 'high', 'extreme'];
      const currentIndex = levels.indexOf(currentLevel);
      const highestIndex = levels.indexOf(grouped[location].highestLevel);
      if (currentIndex > highestIndex) {
        grouped[location].highestLevel = currentLevel;
      }
    });

    return Object.values(grouped);
  };

  const getRecommendation = (hazard) => {
    const recommendations = {
      'heat': '✓ Stay hydrated, use sunscreen, avoid peak sun hours (11 AM - 3 PM)',
      'cold': '✓ Wear layers, protect extremities, limit outdoor time',
      'storm': '✓ Seek shelter indoors, avoid high ground, stay away from trees',
      'rain': '✓ Use waterproof gear, watch for slippery surfaces, drive carefully',
      'wind': '✓ Secure loose items, avoid tall structures, use caution outdoors',
      'flood': '✓ Avoid low-lying areas, stay on higher ground',
      'visibility': '✓ Use lights/reflective gear, reduce speed, increase caution',
      'humidity': '✓ Stay in shaded areas, increase fluid intake, take breaks'
    };
    return recommendations[hazard.type] || 'Take appropriate safety precautions';
  };

  if (loading) {
    return (
      <div style={{ ...hazardAwarenessStyle, ...style }}>
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle}></div>
          <span>{t('monitoring_hazards')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...hazardAwarenessStyle, ...style }}>
        <div style={errorContainerStyle}>
          <span>⚠️ {t('unable_fetch_hazard_data')}</span>
          <button style={retryButtonStyle} onClick={fetchHazardData}>
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const hasHazards = hazards.length > 0;
  const criticalCount = hazardStats.extreme + hazardStats.high;

  return (
    <div style={{ ...hazardAwarenessStyle, ...style }}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleSectionStyle}>
          <span style={{ fontSize: '1.3rem' }}>{hasHazards ? '⚠️' : '✅'}</span>
          <div>
            <h3 style={titleStyle}>{t('hazard_awareness')}</h3>
            <p style={subtitleStyle}>
              {attractionList.length > 0 
                ? `${t('locations_monitored')}: ${attractionList.length} • ${t('last_updated')}: ${lastUpdate.toLocaleTimeString()}`
                : `${t('weather_related_safety_monitoring')} • ${t('last_updated')}: ${lastUpdate.toLocaleTimeString()}`
              }
            </p>
          </div>
        </div>
        <button 
          style={expandButtonStyle}
          className="expand-button"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? t('collapse') : t('expand')}
        >
          {expanded ? '▼' : '▶'} 
        </button>
      </div>

      {/* Hazard Summary */}
      <div style={statsContainerStyle}>
        <div style={{ ...statBoxStyle, flex: '1 1 240px' }}>
          <span style={statValueStyle}>
            {hasHazards ? `${criticalCount} critical` : 'Clear'}
          </span>
          <span style={statLabelStyle}>
            {hasHazards
              ? `${hazardStats.total} total hazards across ${hazards.length} locations`
              : t('no_current_hazards')}
          </span>
        </div>
        {attractionList.length > 0 && (
          <div style={{ ...statBoxStyle, ...monitoringStatStyle }}>
            <span style={statValueStyle}>{attractionList.length}</span>
            <span style={statLabelStyle}>{t('locations_monitored')}</span>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={expandedContentStyle}>
          {/* Hazards List */}
          {hasHazards ? (
            <div style={hazardsContainerStyle}>
              <h4 style={sectionTitleStyle}>
                <span>⚠️</span> {t('current_hazards')}
              </h4>
              <div style={hazardsScrollContainerStyle}>
                {hazards.map((locationGroup, idx) => (
                  <div 
                    key={idx}
                    className="hazard-item-card"
                    style={{
                      ...hazardItemCompactStyle,
                      borderLeftColor: getSeverityColor(locationGroup.highestLevel)
                    }}
                  >
                    <div 
                      style={hazardHeaderCompactStyle}
                      onClick={() => setExpandedHazardDetail(expandedHazardDetail === idx ? null : idx)}
                    >
                      <div style={hazardLabelCompactStyle}>
                        <span style={hazardSeverityCompactStyle}>
                          {getSeverityIcon(locationGroup.highestLevel)}
                        </span>
                        <div style={hazardTextCompactStyle}>
                          <div style={hazardLocationRowStyle}>
                            <span style={locationNameStyle}>📍 {locationGroup.location}</span>
                            <span style={hazardCountBadgeStyle}>{locationGroup.hazards.length} hazard{locationGroup.hazards.length > 1 ? 's' : ''}</span>
                          </div>
                          <span style={hazardMessageCompactStyle}>
                            {locationGroup.hazards.map(h => h.type).join(', ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span style={expandIconStyle}>{expandedHazardDetail === idx ? '▼' : '▶'}</span>
                    </div>

                    {expandedHazardDetail === idx && (
                      <div style={hazardDetailStyle}>
                        {locationGroup.hazards.map((hazard, hIdx) => (
                          <div key={hIdx} style={individualHazardStyle}>
                            <div style={hazardTypeBadgeStyle}>
                              {getSeverityIcon(hazard.level || hazard.severity)} {(hazard.type || 'unknown').toUpperCase()}
                            </div>
                            <div style={detailSectionStyle}>
                              <strong style={detailLabelStyle}>Warning:</strong>
                              <p style={detailTextStyle}>{hazard.message}</p>
                            </div>
                            <div style={detailSectionStyle}>
                              <strong style={detailLabelStyle}>When:</strong>
                              <p style={detailTextStyle}>
                                {hazard.occurrences && hazard.occurrences.length > 1
                                  ? hazard.occurrences.map(formatPredictedTime).join(', ')
                                  : formatPredictedTime(hazard.predictedAt)}
                              </p>
                            </div>
                            <div style={detailSectionStyle}>
                              <strong style={detailLabelStyle}>{t('what_it_means')}:</strong>
                              <p style={detailTextStyle}>{getHazardDescription(hazard)}</p>
                            </div>
                            <div style={detailSectionStyle}>
                              <strong style={detailLabelStyle}>{t('occurrences')}:</strong>
                              <p style={detailTextStyle}>{hazard.occurrenceCount || 1}</p>
                            </div>
                            <div style={detailSectionStyle}>
                              <strong style={detailLabelStyle}>{t('safety_recommendation')}:</strong>
                              <p style={detailTextStyle}>{getRecommendation(hazard)}</p>
                            </div>
                            {hIdx < locationGroup.hazards.length - 1 && <div style={hazardDividerStyle}></div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={noHazardsCompactStyle}>
              <span>✅ {t('no_current_hazards')}</span>
            </div>
          )}

          {/* Refresh Button */}
          <button style={refreshButtonCompactStyle} onClick={fetchHazardData}>
            🔄 {t('refresh')}
          </button>
        </div>
      )}
    </div>
  );
};

// Styles
const hazardAwarenessStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(46, 125, 50, 0.14)',
  borderRadius: '18px',
  boxShadow: '0 6px 22px rgba(24, 64, 45, 0.08)',
  padding: '1.6rem',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
};

const titleSectionStyle = {
  flex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.55rem',
  color: '#1b5e20'
};

const titleStyle = {
  margin: '0 0 4px 0',
  fontSize: '1.3rem',
  fontWeight: '800',
  color: '#1b5e20'
};

const subtitleStyle = {
  margin: '0',
  fontSize: '0.88rem',
  color: '#5f6f66',
  marginTop: '0.35rem'
};

const expandButtonStyle = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(46, 125, 50, 0.3)',
  fontSize: '0.95rem',
  cursor: 'pointer',
  padding: '6px 10px',
  borderRadius: '8px',
  transition: 'all 0.3s ease',
  color: '#1b5e20',
  fontWeight: '600',
  boxShadow: '0 2px 6px rgba(46, 125, 50, 0.08)'
};

const statsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
  gap: '12px',
  marginBottom: '1.2rem'
};

const statBoxStyle = {
  backgroundColor: 'linear-gradient(135deg, #f9fffb 0%, #eef8f1 100%)',
  border: '1px solid rgba(46, 125, 50, 0.15)',
  borderRadius: '12px',
  padding: '14px',
  textAlign: 'center',
  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.06)'
};

const extremeStatStyle = {
  backgroundColor: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
  borderColor: '#ff5722'
};

const highStatStyle = {
  backgroundColor: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)',
  borderColor: '#ff9800'
};

const mediumStatStyle = {
  backgroundColor: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
  borderColor: '#9c27b0'
};

const monitoringStatStyle = {
  backgroundColor: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
  borderColor: '#2196f3'
};

const statValueStyle = {
  display: 'block',
  fontSize: '1.5rem',
  fontWeight: '800',
  color: '#1b5e20',
  marginBottom: '4px'
};

const statLabelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  opacity: 0.7,
  fontWeight: '600',
  color: '#1a1a1a'
};

const hazardsContainerStyle = {
  marginBottom: '1.2rem'
};

const sectionTitleStyle = {
  margin: '0 0 12px 0',
  fontSize: '0.95rem',
  fontWeight: '700',
  color: '#1b5e20',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const hazardsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const hazardItemStyle = {
  backgroundColor: '#fafafa',
  border: '1px solid rgba(46, 125, 50, 0.1)',
  borderLeft: '4px solid',
  borderRadius: '12px',
  padding: '14px',
  boxShadow: '0 2px 8px rgba(24, 64, 45, 0.05)',
  transition: 'all 0.3s ease'
};

const hazardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px',
  flexWrap: 'wrap'
};

const hazardSeverityStyle = {
  fontSize: '0.8rem',
  fontWeight: '700',
  padding: '4px 10px',
  borderRadius: '6px',
  backgroundColor: 'rgba(46, 125, 50, 0.1)',
  color: '#1b5e20',
  textTransform: 'uppercase',
  letterSpacing: '0.3px'
};

const hazardTypeStyle = {
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#5f6f66',
  textTransform: 'uppercase',
  opacity: 0.8
};

const locationTagStyle = {
  fontSize: '0.75rem',
  backgroundColor: 'rgba(46, 125, 50, 0.1)',
  color: '#1b5e20',
  padding: '3px 8px',
  borderRadius: '4px',
  marginLeft: 'auto',
  fontWeight: '600'
};

const hazardBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginBottom: '10px'
};

const hazardMessageStyle = {
  margin: '0',
  fontSize: '0.9rem',
  color: '#1a1a1a',
  lineHeight: '1.5',
  fontWeight: '600'
};

const descriptionBoxStyle = {
  backgroundColor: 'rgba(33, 150, 243, 0.08)',
  padding: '10px',
  borderRadius: '8px',
  borderLeft: '3px solid #2196f3',
  fontSize: '0.85rem'
};

const descriptionTextStyle = {
  margin: '4px 0 0 0',
  fontSize: '0.8rem',
  lineHeight: '1.4',
  color: '#333'
};

const recommendationBoxStyle = {
  backgroundColor: 'rgba(76, 175, 80, 0.08)',
  padding: '10px',
  borderRadius: '8px',
  borderLeft: '3px solid #4caf50',
  fontSize: '0.85rem'
};

const recommendationTextStyle = {
  margin: '4px 0 0 0',
  fontSize: '0.8rem',
  lineHeight: '1.4',
  color: '#333'
};

const acknowledgeButtonStyle = {
  backgroundColor: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  alignSelf: 'flex-start',
  fontWeight: '600',
  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)'
};

const noHazardsStyle = {
  textAlign: 'center',
  padding: '40px 16px',
  color: '#2e7d32',
  backgroundColor: 'linear-gradient(135deg, #f9fffb 0%, #eef8f1 100%)',
  borderRadius: '12px',
  border: '1px solid rgba(46, 125, 50, 0.15)'
};

const noHazardsIconStyle = {
  fontSize: '3rem',
  marginBottom: '12px'
};

const awarenessHistoryStyle = {
  marginBottom: '12px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(46, 125, 50, 0.1)'
};

const historyListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const historyItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  backgroundColor: 'linear-gradient(135deg, #f9fffb 0%, #eef8f1 100%)',
  border: '1px solid rgba(46, 125, 50, 0.1)',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: '500'
};

const historyTimeStyle = {
  fontSize: '0.75rem',
  opacity: 0.6
};

const lastUpdateStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.8rem',
  opacity: 0.6,
  paddingTop: '10px',
  borderTop: '1px solid rgba(46, 125, 50, 0.1)',
  color: '#5f6f66'
};

const refreshButtonStyle = {
  backgroundColor: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontWeight: '600',
  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '40px'
};

const spinnerStyle = {
  width: '36px',
  height: '36px',
  border: '3px solid rgba(46, 125, 50, 0.15)',
  borderTop: '3px solid #2e7d32',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  padding: '30px',
  color: '#d32f2f',
  backgroundColor: 'rgba(211, 47, 47, 0.08)',
  borderRadius: '12px',
  border: '1px solid rgba(211, 47, 47, 0.15)'
};

const retryButtonStyle = {
  backgroundColor: '#d32f2f',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'all 0.3s ease'
};

// Add CSS animation and hover effects
if (typeof window !== 'undefined' && !document.getElementById('hazard-awareness-styles')) {
  const styles = document.createElement('style');
  styles.id = 'hazard-awareness-styles';
  styles.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .hazard-awareness-btn:hover {
      filter: brightness(0.9);
      transform: translateY(-1px);
    }
    
    .hazard-item-card:hover {
      box-shadow: 0 4px 12px rgba(24, 64, 45, 0.1) !important;
      background-color: #ffffff !important;
    }
    
    .expand-button:hover {
      border-color: rgba(46, 125, 50, 0.5) !important;
      background-color: rgba(46, 125, 50, 0.05) !important;
      box-shadow: 0 2px 8px rgba(46, 125, 50, 0.15) !important;
    }
  `;
  document.head.appendChild(styles);
}

// Compact styles for homepage dropdown view
const expandedContentStyle = {
  maxHeight: '480px',
  overflowY: 'auto',
  paddingRight: '8px'
};

const hazardsScrollContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const hazardItemCompactStyle = {
  backgroundColor: '#fafafa',
  border: '1px solid rgba(46, 125, 50, 0.1)',
  borderLeft: '4px solid',
  borderRadius: '10px',
  padding: '0',
  boxShadow: '0 1px 4px rgba(24, 64, 45, 0.05)',
  transition: 'all 0.2s ease',
  overflow: 'hidden'
};

const hazardHeaderCompactStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  padding: '10px 12px',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.2s ease'
};

const hazardLabelCompactStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  flex: 1,
  minWidth: 0
};

const hazardSeverityCompactStyle = {
  fontSize: '1rem',
  flexShrink: 0
};

const hazardTextCompactStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  minWidth: 0,
  flex: 1
};

const hazardLocationRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'wrap'
};

const locationNameStyle = {
  fontSize: '0.85rem',
  fontWeight: '700',
  color: '#1b5e20'
};

const hazardCountBadgeStyle = {
  fontSize: '0.7rem',
  backgroundColor: 'rgba(244, 67, 54, 0.1)',
  color: '#d32f2f',
  padding: '2px 8px',
  borderRadius: '6px',
  fontWeight: '600',
  border: '1px solid rgba(244, 67, 54, 0.2)'
};

const hazardTypeCompactStyle = {
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#5f6f66',
  textTransform: 'uppercase',
  opacity: 0.7
};

const individualHazardStyle = {
  marginBottom: '12px'
};

const hazardTypeBadgeStyle = {
  display: 'inline-block',
  fontSize: '0.75rem',
  fontWeight: '700',
  backgroundColor: 'rgba(46, 125, 50, 0.1)',
  color: '#1b5e20',
  padding: '4px 10px',
  borderRadius: '6px',
  marginBottom: '8px',
  textTransform: 'uppercase'
};

const hazardDividerStyle = {
  height: '1px',
  backgroundColor: 'rgba(46, 125, 50, 0.15)',
  margin: '12px 0'
};



const hazardMessageCompactStyle = {
  fontSize: '0.85rem',
  color: '#1a1a1a',
  fontWeight: '500',
  lineHeight: '1.3',
  wordBreak: 'break-word'
};

const expandIconStyle = {
  fontSize: '0.75rem',
  color: '#999',
  flexShrink: 0,
  marginLeft: '4px'
};

const hazardDetailStyle = {
  padding: '0 12px 10px 12px',
  backgroundColor: 'rgba(46, 125, 50, 0.02)',
  borderTop: '1px solid rgba(46, 125, 50, 0.08)'
};

const detailSectionStyle = {
  marginBottom: '8px',
  fontSize: '0.8rem'
};

const detailLabelStyle = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#1b5e20',
  marginBottom: '4px',
  textTransform: 'uppercase'
};

const detailTextStyle = {
  margin: '0',
  fontSize: '0.75rem',
  lineHeight: '1.3',
  color: '#333'
};

const acknowledgeButtonCompactStyle = {
  backgroundColor: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '0.7rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignSelf: 'flex-start',
  fontWeight: '600'
};

const noHazardsCompactStyle = {
  textAlign: 'center',
  padding: '16px',
  color: '#2e7d32',
  backgroundColor: 'linear-gradient(135deg, #f9fffb 0%, #eef8f1 100%)',
  borderRadius: '10px',
  border: '1px solid rgba(46, 125, 50, 0.15)',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const awarenessHistoryCompactStyle = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(46, 125, 50, 0.1)'
};

const historyListCompactStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const historyItemCompactStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 8px',
  backgroundColor: '#f9fffb',
  borderRadius: '6px',
  fontSize: '0.75rem'
};

const historyTimeCompactStyle = {
  fontSize: '0.7rem',
  color: '#999',
  flexShrink: 0
};

const refreshButtonCompactStyle = {
  marginTop: '10px',
  backgroundColor: '#2e7d32',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 14px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  width: '100%',
  transition: 'all 0.2s ease',
  fontWeight: '600',
  boxShadow: '0 2px 6px rgba(46, 125, 50, 0.15)'
};

// Time-based warning styles
const timeWarningsContainerStyle = {
  marginBottom: '1.2rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid rgba(46, 125, 50, 0.1)'
};

const timeWarningSubtitleStyle = {
  margin: '0 0 12px 0',
  fontSize: '0.8rem',
  color: '#5f6f66',
  fontWeight: '500'
};

const timeWarningsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const timeWarningItemStyle = {
  backgroundColor: '#fafafa',
  border: '1px solid rgba(46, 125, 50, 0.1)',
  borderRadius: '10px',
  padding: '12px',
  boxShadow: '0 2px 8px rgba(24, 64, 45, 0.05)'
};

const timeWarningHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
};

const timeWarningTimeStyle = {
  fontSize: '0.95rem',
  fontWeight: '700',
  color: '#1b5e20'
};

const timeWarningTempStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#5f6f66',
  backgroundColor: 'rgba(46, 125, 50, 0.08)',
  padding: '4px 10px',
  borderRadius: '6px'
};

const timeWarningHazardsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const timeWarningBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 10px',
  borderRadius: '8px',
  border: '1px solid',
  fontSize: '0.8rem',
  fontWeight: '600'
};

const timeWarningMessageStyle = {
  color: '#1a1a1a'
};

const bestTimeContainerStyle = {
  marginBottom: '1.2rem',
  backgroundColor: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
  border: '1px solid rgba(46, 125, 50, 0.2)',
  borderRadius: '10px',
  padding: '12px',
  boxShadow: '0 2px 8px rgba(46, 125, 50, 0.1)'
};

const bestTimeContentStyle = {
  marginTop: '8px'
};

const bestTimeTextStyle = {
  margin: '0',
  fontSize: '0.85rem',
  color: '#1b5e20',
  lineHeight: '1.5'
};

export default HazardAwareness;
