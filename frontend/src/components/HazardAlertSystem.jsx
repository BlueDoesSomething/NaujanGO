/**
 * Hazard Alert System Component
 * Comprehensive weather hazard detection and alert management
 */

import React, { useState, useEffect } from 'react';
import { weatherService } from '../services/weatherService';
import { getApiBaseUrl } from '../api';

const API_BASE_URL = getApiBaseUrl();

const getApiHeaders = (extra = {}) => {
  let csrf = '';
  try {
    const cookie = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='));
    if (cookie) csrf = decodeURIComponent(cookie.split('=').slice(1).join('='));
  } catch (err) {
    csrf = '';
  }
  return { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...extra };
};

const HazardAlertSystem = ({ 
  attractions = [], 
  userId, 
  showGlobalAlerts = true,
  enableNotifications = true,
  onHazardDetected,
  style = {}
}) => {
  const [alerts, setAlerts] = useState([]);
  const [globalHazards, setGlobalHazards] = useState([]);
  const [userPreferences, setUserPreferences] = useState({
    receiveAlerts: true,
    alertTypes: ['storm', 'rain', 'heat', 'wind', 'flood'],
    minSafeTemperature: 15,
    maxSafeTemperature: 35,
    maxSafeWindSpeed: 20
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    initializeAlertSystem();
    const interval = setInterval(checkHazards, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [attractions, userId]);

  const initializeAlertSystem = async () => {
    setLoading(true);
    try {
      // Load user preferences
      if (userId) {
        await loadUserPreferences();
      }
      
      // Initial hazard check
      await checkHazards();
      
      // Request notification permission
      if (enableNotifications && 'Notification' in window) {
        Notification.requestPermission();
      }
      
    } catch (error) {
      console.error('Failed to initialize alert system:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/preferences/${userId}`);
      if (response.ok) {
        const prefs = await response.json();
        setUserPreferences(prefs);
      }
    } catch (error) {
      console.warn('Failed to load user preferences, using defaults:', error);
    }
  };

  const checkHazards = async () => {
    try {
      const attractionAlerts = [];
      const globalHazardsList = [];

      // Check each attraction
      for (const attraction of attractions) {
        try {
          let weatherData;
          let hazards = [];

          if (attraction.id) {
            // Fetch from API
            const response = await fetch(`${API_BASE_URL}/api/weather/current/${attraction.id}`);
            if (response.ok) {
              const data = await response.json();
              weatherData = data;
              hazards = data.alerts || [];
            }
          } else if (attraction.latitude && attraction.longitude) {
            // Use weather service
            weatherData = await weatherService.getCurrentWeather(
              attraction.latitude, 
              attraction.longitude, 
              attraction.name
            );
            hazards = weatherService.analyzeHazards(weatherData);
          }

          if (hazards.length > 0) {
            const filteredHazards = filterHazardsByPreferences(hazards);
            
            if (filteredHazards.length > 0) {
              attractionAlerts.push({
                attraction,
                hazards: filteredHazards,
                weather: weatherData,
                timestamp: new Date()
              });

              // Add to global hazards if high severity
              const highSeverityHazards = filteredHazards.filter(h => 
                (h.level === 'high' || h.severity === 'high') ||
                (h.level === 'extreme' || h.severity === 'extreme')
              );
              
              if (highSeverityHazards.length > 0) {
                globalHazardsList.push(...highSeverityHazards.map(h => ({
                  ...h,
                  location: attraction.name,
                  attractionId: attraction.id
                })));
              }
            }
          }

        } catch (error) {
          console.error(`Failed to check hazards for ${attraction.name}:`, error);
        }
      }

      setAlerts(attractionAlerts);
      setGlobalHazards(globalHazardsList);
      setLastUpdate(new Date());

      // Send notifications for new critical hazards
      if (enableNotifications && globalHazardsList.length > 0) {
        sendHazardNotifications(globalHazardsList);
      }

      // Trigger callback if provided
      if (onHazardDetected && (attractionAlerts.length > 0 || globalHazardsList.length > 0)) {
        onHazardDetected({
          attractionAlerts,
          globalHazards: globalHazardsList,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Failed to check hazards:', error);
    }
  };

  const filterHazardsByPreferences = (hazards) => {
    if (!userPreferences.receiveAlerts) return [];
    
    return hazards.filter(hazard => {
      // Check if user wants this type of alert
      if (!userPreferences.alertTypes.includes(hazard.type)) {
        return false;
      }

      // Apply custom thresholds
      if (hazard.type === 'heat' && hazard.temperature <= userPreferences.maxSafeTemperature) {
        return false;
      }
      
      if (hazard.type === 'cold' && hazard.temperature >= userPreferences.minSafeTemperature) {
        return false;
      }
      
      if (hazard.type === 'wind' && hazard.windSpeed <= userPreferences.maxSafeWindSpeed) {
        return false;
      }

      return true;
    });
  };

  const sendHazardNotifications = (hazards) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    hazards.forEach(hazard => {
      const notification = new Notification(`Weather Alert: ${hazard.location}`, {
        body: hazard.message,
        icon: hazard.icon || '⚠️',
        tag: `hazard-${hazard.location}-${hazard.type}`,
        requireInteraction: hazard.level === 'extreme' || hazard.severity === 'extreme'
      });

      // Auto-close after 10 seconds for non-critical alerts
      if (hazard.level !== 'extreme' && hazard.severity !== 'extreme') {
        setTimeout(() => notification.close(), 10000);
      }
    });
  };

  const dismissAlert = (attractionId, hazardIndex) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.attraction.id === attractionId
          ? { ...alert, hazards: alert.hazards.filter((_, index) => index !== hazardIndex) }
          : alert
      ).filter(alert => alert.hazards.length > 0)
    );
  };

  const dismissGlobalHazard = (index) => {
    setGlobalHazards(prev => prev.filter((_, i) => i !== index));
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/preferences`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          userId,
          ...newPreferences
        })
      });

      if (response.ok) {
        setUserPreferences(newPreferences);
        await checkHazards(); // Recheck with new preferences
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  const getAlertPriority = (hazard) => {
    const priorities = {
      'extreme': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return priorities[hazard.level || hazard.severity] || 1;
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

  if (loading) {
    return (
      <div style={{...alertSystemStyle, ...style}}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <span>Initializing hazard monitoring...</span>
        </div>
      </div>
    );
  }

  const hasActiveAlerts = alerts.length > 0 || globalHazards.length > 0;
  const criticalAlertsCount = globalHazards.filter(h => 
    h.level === 'extreme' || h.severity === 'extreme' ||
    h.level === 'high' || h.severity === 'high'
  ).length;

  return (
    <div style={{...alertSystemStyle, ...style}}>
      {/* Alert System Header */}
      <div style={headerStyle}>
        <div style={titleSectionStyle}>
          <h3 style={titleStyle}>
            {hasActiveAlerts ? '⚠️' : '✅'} Weather Alert System
          </h3>
          <span style={statusStyle}>
            {hasActiveAlerts 
              ? `${criticalAlertsCount} critical alerts active`
              : 'All conditions normal'
            }
          </span>
        </div>
        <div style={updateInfoStyle}>
          <span style={lastUpdateStyle}>
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <button style={refreshButtonStyle} onClick={checkHazards}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Global Hazards */}
      {showGlobalAlerts && globalHazards.length > 0 && (
        <div style={globalHazardsStyle}>
          <h4 style={sectionTitleStyle}>🌍 Regional Weather Alerts</h4>
          <div style={hazardsListStyle}>
            {globalHazards
              .sort((a, b) => getAlertPriority(b) - getAlertPriority(a))
              .map((hazard, index) => (
                <div 
                  key={index} 
                  style={{
                    ...globalHazardItemStyle,
                    borderLeftColor: getSeverityColor(hazard.level || hazard.severity)
                  }}
                >
                  <div style={hazardHeaderStyle}>
                    <span style={hazardIconStyle}>
                      {getSeverityIcon(hazard.level || hazard.severity)}
                    </span>
                    <div style={hazardInfoStyle}>
                      <strong>{hazard.location}</strong>
                      <span style={hazardTypeStyle}>
                        {(hazard.level || hazard.severity).toUpperCase()} - {hazard.type.toUpperCase()}
                      </span>
                    </div>
                    <button 
                      style={dismissButtonStyle}
                      onClick={() => dismissGlobalHazard(index)}
                    >
                      ✕
                    </button>
                  </div>
                  <p style={hazardMessageStyle}>{hazard.message}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Attraction-Specific Alerts */}
      {alerts.length > 0 && (
        <div style={attractionAlertsStyle}>
          <h4 style={sectionTitleStyle}>📍 Location-Specific Alerts</h4>
          {alerts.map((alert, alertIndex) => (
            <div key={alert.attraction.id || alertIndex} style={attractionAlertStyle}>
              <h5 style={attractionNameStyle}>{alert.attraction.name}</h5>
              <div style={hazardsListStyle}>
                {alert.hazards.map((hazard, hazardIndex) => (
                  <div 
                    key={hazardIndex}
                    style={{
                      ...hazardItemStyle,
                      backgroundColor: getHazardBackgroundColor(hazard.level || hazard.severity)
                    }}
                  >
                    <span style={hazardIconStyle}>
                      {hazard.icon || getSeverityIcon(hazard.level || hazard.severity)}
                    </span>
                    <div style={hazardContentStyle}>
                      <div style={hazardTitleStyle}>
                        {hazard.type.charAt(0).toUpperCase() + hazard.type.slice(1)} Alert
                      </div>
                      <div style={hazardMessageStyle}>{hazard.message}</div>
                    </div>
                    <button 
                      style={dismissButtonStyle}
                      onClick={() => dismissAlert(alert.attraction.id, hazardIndex)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {alert.weather && (
                <div style={weatherSummaryStyle}>
                  <span>🌡️ {alert.weather.temperature}°C</span>
                  <span>💧 {alert.weather.humidity}%</span>
                  <span>💨 {alert.weather.windSpeed} km/h</span>
                  <span>☁️ {alert.weather.condition}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Alerts State */}
      {!hasActiveAlerts && (
        <div style={noAlertsStyle}>
          <div style={noAlertsIconStyle}>✅</div>
          <h4>All Clear!</h4>
          <p>No weather hazards detected for your planned destinations.</p>
          <div style={goodConditionsStyle}>
            <span>🌤️ Perfect weather for outdoor activities</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={actionsStyle}>
        <button 
          style={actionButtonStyle}
          onClick={() => checkHazards()}
        >
          🔄 Refresh Alerts
        </button>
        <button 
          style={actionButtonStyle}
          onClick={() => {/* Open preferences modal */}}
        >
          ⚙️ Settings
        </button>
      </div>
    </div>
  );

  function getHazardBackgroundColor(level) {
    const colors = {
      'extreme': '#ffebee',
      'high': '#fff3e0',
      'medium': '#f3e5f5',
      'low': '#e8f5e8'
    };
    return colors[level] || '#f5f5f5';
  }
};

// Styles
const alertSystemStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  padding: '16px',
  fontFamily: 'Arial, sans-serif',
  width: '100%',
  boxSizing: 'border-box'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '2px solid #f0f0f0'
};

const titleSectionStyle = {
  flex: 1
};

const titleStyle = {
  margin: '0 0 2px 0',
  fontSize: '1.3rem',
  fontWeight: '600',
  color: '#2c3e50'
};

const statusStyle = {
  fontSize: '0.9rem',
  opacity: 0.7
};

const updateInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '8px'
};

const lastUpdateStyle = {
  fontSize: '0.8rem',
  opacity: 0.6
};

const refreshButtonStyle = {
  backgroundColor: '#2196f3',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '6px 12px',
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
};

const globalHazardsStyle = {
  marginBottom: '16px'
};

const sectionTitleStyle = {
  margin: '0 0 10px 0',
  fontSize: '1rem',
  fontWeight: '600',
  color: '#2c3e50'
};

const hazardsListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const globalHazardItemStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e0e0e0',
  borderLeft: '4px solid',
  borderRadius: '8px',
  padding: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
};

const hazardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '8px'
};

const hazardIconStyle = {
  fontSize: '1.2rem'
};

const hazardInfoStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const hazardTypeStyle = {
  fontSize: '0.8rem',
  opacity: 0.7,
  fontWeight: '500'
};

const dismissButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: '1rem',
  cursor: 'pointer',
  opacity: 0.5,
  padding: '4px',
  borderRadius: '4px',
  transition: 'opacity 0.3s ease'
};

const hazardMessageStyle = {
  margin: '0',
  fontSize: '0.9rem',
  lineHeight: '1.4',
  color: '#333'
};

const attractionAlertsStyle = {
  marginBottom: '16px'
};

const attractionAlertStyle = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px'
};

const attractionNameStyle = {
  margin: '0 0 12px 0',
  fontSize: '1rem',
  fontWeight: '600',
  color: '#2196f3'
};

const hazardItemStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '12px',
  borderRadius: '6px',
  marginBottom: '8px'
};

const hazardContentStyle = {
  flex: 1
};

const hazardTitleStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#333',
  marginBottom: '4px'
};

const weatherSummaryStyle = {
  display: 'flex',
  gap: '16px',
  fontSize: '0.8rem',
  marginTop: '8px',
  padding: '8px',
  backgroundColor: '#f0f0f0',
  borderRadius: '4px'
};

const noAlertsStyle = {
  textAlign: 'center',
  padding: '30px 16px',
  color: '#4caf50'
};

const noAlertsIconStyle = {
  fontSize: '3rem',
  marginBottom: '16px'
};

const goodConditionsStyle = {
  marginTop: '16px',
  fontSize: '0.9rem',
  opacity: 0.8
};

const actionsStyle = {
  display: 'flex',
  gap: '12px',
  justifyContent: 'center',
  marginTop: '16px',
  paddingTop: '12px',
  borderTop: '1px solid #f0f0f0'
};

const actionButtonStyle = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '8px 16px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease'
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

export default HazardAlertSystem;
