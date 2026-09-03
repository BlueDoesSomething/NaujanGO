/**
 * Weather-Based Alternative Destinations Component
 * Suggests safer alternatives when weather conditions are unfavorable
 */

import React, { useState, useEffect } from 'react';
import { weatherService } from '../services/weatherService';
import WeatherWidget from './WeatherWidget';
import { getApiBaseUrl } from '../api';

const API_BASE_URL = getApiBaseUrl();

const AlternativeDestinations = ({ 
  originalAttraction,
  currentWeather,
  onSelectAlternative,
  showWeatherComparison = true,
  style = {}
}) => {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState({
    maxDistance: 50, // km
    minSafetyScore: 70,
    preferredTypes: ['indoor', 'covered', 'cultural']
  });

  useEffect(() => {
    if (originalAttraction) {
      fetchAlternatives();
    }
  }, [originalAttraction, filterCriteria, fetchAlternatives]);

  const fetchAlternatives = async () => {
    setLoading(true);
    setError(null);

    try {
      let alternatives = [];

      if (originalAttraction.id) {
        // Fetch from backend API
        const response = await fetch(
          `${API_BASE_URL}/api/weather/alternatives/${originalAttraction.id}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.needsAlternative) {
            alternatives = data.alternatives || [];
          }
        }
      }

      // If no predefined alternatives or using coordinates only, generate smart alternatives
      if (alternatives.length === 0) {
        alternatives = await generateSmartAlternatives();
      }

      // Filter by distance and criteria
      const filteredAlternatives = alternatives.filter(alt => {
        const distance = calculateDistance(
          originalAttraction.latitude,
          originalAttraction.longitude,
          alt.latitude,
          alt.longitude
        );
        return distance <= filterCriteria.maxDistance;
      });

      // Get weather data for alternatives
      const alternativesWithWeather = await Promise.all(
        filteredAlternatives.map(async (alt) => {
          try {
            let weather;
            if (alt.attractionId) {
              const weatherResponse = await fetch(
                `${API_BASE_URL}/api/weather/current/${alt.attractionId}`
              );
              if (weatherResponse.ok) {
                weather = await weatherResponse.json();
              }
            } else if (alt.latitude && alt.longitude) {
              weather = await weatherService.getCurrentWeather(
                alt.latitude, 
                alt.longitude, 
                alt.name
              );
            }

            const safetyScore = weather ? weatherService.getTravelSafetyScore(weather) : 0;
            const hazards = weather ? weatherService.analyzeHazards(weather) : [];

            return {
              ...alt,
              weather,
              safetyScore,
              hazards,
              distance: calculateDistance(
                originalAttraction.latitude,
                originalAttraction.longitude,
                alt.latitude,
                alt.longitude
              )
            };
          } catch (err) {
            console.warn(`Failed to get weather for ${alt.name}:`, err);
            return { ...alt, weather: null, safetyScore: 0, hazards: [] };
          }
        })
      );

      // Filter by minimum safety score and sort by suitability
      const safeAlternatives = alternativesWithWeather
        .filter(alt => alt.safetyScore >= filterCriteria.minSafetyScore)
        .sort((a, b) => {
          // Primary sort: safety score
          if (b.safetyScore !== a.safetyScore) {
            return b.safetyScore - a.safetyScore;
          }
          // Secondary sort: distance (closer is better)
          return a.distance - b.distance;
        });

      setAlternatives(safeAlternatives);

      // Create weather comparison data would go here if needed
      // const comparison = {};

    } catch (err) {
      console.error('Failed to fetch alternatives:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSmartAlternatives = async () => {
    // This would typically query a database of attractions
    // For now, return some common safe alternatives for Naujan
    const commonAlternatives = [
      {
        attractionId: 3,
        name: 'Naujan Town Plaza',
        description: 'Central town plaza with covered areas and indoor facilities',
        latitude: 13.3333,
        longitude: 121.3000,
        reason: 'Indoor and covered areas provide shelter from weather',
        suitabilityScore: 90,
        type: 'cultural',
        features: ['indoor', 'covered', 'accessible']
      },
      {
        attractionId: null,
        name: 'Local Shopping Center',
        description: 'Climate-controlled shopping and dining complex',
        latitude: 13.3350,
        longitude: 121.3020,
        reason: 'Fully enclosed with air conditioning',
        suitabilityScore: 95,
        type: 'commercial',
        features: ['indoor', 'climate-controlled', 'dining', 'shopping']
      },
      {
        attractionId: null,
        name: 'Naujan Cultural Center',
        description: 'Indoor cultural exhibitions and performances',
        latitude: 13.3320,
        longitude: 121.2990,
        reason: 'Educational indoor activities perfect for any weather',
        suitabilityScore: 88,
        type: 'cultural',
        features: ['indoor', 'educational', 'cultural']
      },
      {
        attractionId: null,
        name: 'Local Museum',
        description: 'Historical artifacts and local heritage displays',
        latitude: 13.3340,
        longitude: 121.3010,
        reason: 'Climate-controlled environment with interesting exhibits',
        suitabilityScore: 85,
        type: 'educational',
        features: ['indoor', 'historical', 'educational']
      }
    ];

    return commonAlternatives;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const isBetterWeatherCondition = (alternative, original) => {
    const conditionPriority = {
      'Clear': 5,
      'Clouds': 4,
      'Mist': 3,
      'Rain': 2,
      'Thunderstorm': 1,
      'Snow': 1
    };
    
    return (conditionPriority[alternative] || 3) > (conditionPriority[original] || 3);
  };

  const handleSelectAlternative = (alternative) => {
    setSelectedAlternative(alternative);
    if (onSelectAlternative) {
      onSelectAlternative(alternative);
    }
  };

  const getSafetyScoreColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#8bc34a';
    if (score >= 70) return '#ffc107';
    if (score >= 60) return '#ff9800';
    return '#ff5722';
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      'indoor': '🏢',
      'covered': '⛱️',
      'accessible': '♿',
      'climate-controlled': '❄️',
      'dining': '🍽️',
      'shopping': '🛍️',
      'educational': '📚',
      'cultural': '🎭',
      'historical': '🏛️'
    };
    return icons[feature] || '✨';
  };

  if (loading) {
    return (
      <div style={{...containerStyle, ...style}}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          <span>Finding safer alternatives...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{...containerStyle, ...style}}>
        <div style={errorStyle}>
          <span>⚠️ Unable to load alternatives</span>
          <button style={retryButtonStyle} onClick={fetchAlternatives}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (alternatives.length === 0) {
    return (
      <div style={{...containerStyle, ...style}}>
        <div style={noAlternativesStyle}>
          <span style={noAlternativesIconStyle}>✅</span>
          <h4>No Alternatives Needed</h4>
          <p>Weather conditions at {originalAttraction.name} are suitable for travel.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{...containerStyle, ...style}}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleSectionStyle}>
          <h3 style={titleStyle}>🏃‍♀️ Weather-Safe Alternatives</h3>
          <p style={subtitleStyle}>
            Better options than {originalAttraction.name} given current weather conditions
          </p>
        </div>
        <div style={filterSectionStyle}>
          <select 
            style={filterSelectStyle}
            value={filterCriteria.maxDistance}
            onChange={(e) => setFilterCriteria(prev => ({
              ...prev,
              maxDistance: parseInt(e.target.value)
            }))}
          >
            <option value={25}>Within 25km</option>
            <option value={50}>Within 50km</option>
            <option value={100}>Within 100km</option>
          </select>
        </div>
      </div>

      {/* Alternatives List */}
      <div style={alternativesListStyle}>
        {alternatives.map((alternative, index) => (
          <div 
            key={alternative.attractionId || index} 
            style={{
              ...alternativeCardStyle,
              ...(selectedAlternative === alternative ? selectedCardStyle : {})
            }}
            onClick={() => handleSelectAlternative(alternative)}
          >
            {/* Alternative Header */}
            <div style={alternativeHeaderStyle}>
              <div style={alternativeInfoStyle}>
                <h4 style={alternativeNameStyle}>{alternative.name}</h4>
                <div style={alternativeMetaStyle}>
                  <span style={distanceStyle}>
                    📍 {alternative.distance.toFixed(1)}km away
                  </span>
                  <div 
                    style={{
                      ...safetyScoreStyle,
                      backgroundColor: getSafetyScoreColor(alternative.safetyScore)
                    }}
                  >
                    Safety: {alternative.safetyScore}%
                  </div>
                </div>
              </div>
              <div style={suitabilityScoreStyle}>
                <div style={scoreCircleStyle}>
                  {alternative.suitabilityScore || alternative.safetyScore}
                </div>
                <span style={scoreLabel}>Suitable</span>
              </div>
            </div>

            {/* Description and Reason */}
            <p style={alternativeDescriptionStyle}>{alternative.description}</p>
            <div style={reasonStyle}>
              <strong>Why this is better:</strong> {alternative.reason}
            </div>

            {/* Features */}
            {alternative.features && alternative.features.length > 0 && (
              <div style={featuresStyle}>
                {alternative.features.map((feature, idx) => (
                  <span key={idx} style={featureTagStyle}>
                    {getFeatureIcon(feature)} {feature}
                  </span>
                ))}
              </div>
            )}

            {/* Weather Comparison */}
            {showWeatherComparison && alternative.weather && (
              <div style={weatherComparisonStyle}>
                <h5 style={comparisonTitleStyle}>Weather Comparison</h5>
                <div style={comparisonGridStyle}>
                  <div style={comparisonItemStyle}>
                    <span style={comparisonLabelStyle}>Temperature</span>
                    <span style={comparisonValuesStyle}>
                      <span style={originalValueStyle}>{currentWeather?.temperature}°C</span>
                      <span style={arrowStyle}>→</span>
                      <span style={betterValueStyle}>{alternative.weather.temperature}°C</span>
                    </span>
                  </div>
                  <div style={comparisonItemStyle}>
                    <span style={comparisonLabelStyle}>Condition</span>
                    <span style={comparisonValuesStyle}>
                      <span style={originalValueStyle}>{currentWeather?.condition}</span>
                      <span style={arrowStyle}>→</span>
                      <span style={betterValueStyle}>{alternative.weather.condition}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hazards (if any) */}
            {alternative.hazards && alternative.hazards.length > 0 && (
              <div style={hazardsStyle}>
                <span style={hazardsLabelStyle}>⚠️ Minor concerns:</span>
                {alternative.hazards.map((hazard, idx) => (
                  <span key={idx} style={hazardTagStyle}>
                    {hazard.icon} {hazard.type}
                  </span>
                ))}
              </div>
            )}

            {/* Action Button */}
            <button 
              style={selectButtonStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAlternative(alternative);
              }}
            >
              Select This Alternative
            </button>
          </div>
        ))}
      </div>

      {/* Selected Alternative Weather Widget */}
      {selectedAlternative && selectedAlternative.weather && (
        <div style={selectedWeatherStyle}>
          <h4 style={selectedWeatherTitleStyle}>
            Weather at {selectedAlternative.name}
          </h4>
          <WeatherWidget
            attractionId={selectedAlternative.attractionId}
            latitude={selectedAlternative.latitude}
            longitude={selectedAlternative.longitude}
            locationName={selectedAlternative.name}
            size="medium"
            showForecast={true}
          />
        </div>
      )}

      {/* Footer Actions */}
      <div style={footerActionsStyle}>
        <button style={refreshButtonStyle} onClick={fetchAlternatives}>
          🔄 Refresh Suggestions
        </button>
        <button style={expandButtonStyle}>
          🗺️ View All on Map
        </button>
      </div>
    </div>
  );
};

// Styles
const containerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
  padding: '24px',
  fontFamily: 'Arial, sans-serif',
  maxWidth: '800px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '24px',
  paddingBottom: '16px',
  borderBottom: '2px solid #f0f0f0'
};

const titleSectionStyle = {
  flex: 1
};

const titleStyle = {
  margin: '0 0 8px 0',
  fontSize: '1.5rem',
  fontWeight: '600',
  color: '#2c3e50'
};

const subtitleStyle = {
  margin: 0,
  fontSize: '0.95rem',
  opacity: 0.7,
  lineHeight: '1.4'
};

const filterSectionStyle = {
  display: 'flex',
  gap: '8px'
};

const filterSelectStyle = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #ddd',
  fontSize: '0.9rem'
};

const alternativesListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const alternativeCardStyle = {
  border: '2px solid #e0e0e0',
  borderRadius: '12px',
  padding: '20px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: '#fafafa'
};

const selectedCardStyle = {
  borderColor: '#2196f3',
  backgroundColor: '#f3f8ff',
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 24px rgba(33, 150, 243, 0.2)'
};

const alternativeHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px'
};

const alternativeInfoStyle = {
  flex: 1
};

const alternativeNameStyle = {
  margin: '0 0 8px 0',
  fontSize: '1.2rem',
  fontWeight: '600',
  color: '#2c3e50'
};

const alternativeMetaStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center'
};

const distanceStyle = {
  fontSize: '0.85rem',
  opacity: 0.7
};

const safetyScoreStyle = {
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  color: 'white',
  fontWeight: '600'
};

const suitabilityScoreStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
};

const scoreCircleStyle = {
  width: '50px',
  height: '50px',
  borderRadius: '50%',
  backgroundColor: '#4caf50',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.9rem',
  fontWeight: 'bold'
};

const scoreLabel = {
  fontSize: '0.7rem',
  opacity: 0.7
};

const alternativeDescriptionStyle = {
  margin: '0 0 12px 0',
  fontSize: '0.9rem',
  lineHeight: '1.4',
  color: '#666'
};

const reasonStyle = {
  backgroundColor: '#e8f5e8',
  padding: '12px',
  borderRadius: '6px',
  fontSize: '0.9rem',
  marginBottom: '12px',
  borderLeft: '4px solid #4caf50'
};

const featuresStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginBottom: '16px'
};

const featureTagStyle = {
  backgroundColor: '#2196f3',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: '500'
};

const weatherComparisonStyle = {
  backgroundColor: '#f8f9fa',
  padding: '12px',
  borderRadius: '6px',
  marginBottom: '16px'
};

const comparisonTitleStyle = {
  margin: '0 0 8px 0',
  fontSize: '0.9rem',
  fontWeight: '600'
};

const comparisonGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '8px'
};

const comparisonItemStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const comparisonLabelStyle = {
  fontSize: '0.8rem',
  opacity: 0.7
};

const comparisonValuesStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.85rem'
};

const originalValueStyle = {
  color: '#ff5722',
  textDecoration: 'line-through'
};

const arrowStyle = {
  color: '#2196f3'
};

const betterValueStyle = {
  color: '#4caf50',
  fontWeight: '600'
};

const hazardsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
  fontSize: '0.85rem'
};

const hazardsLabelStyle = {
  opacity: 0.7
};

const hazardTagStyle = {
  backgroundColor: '#fff3e0',
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '0.8rem'
};

const selectButtonStyle = {
  backgroundColor: '#2196f3',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '10px 20px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'background-color 0.3s ease',
  width: '100%'
};

const selectedWeatherStyle = {
  marginTop: '24px',
  padding: '16px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px'
};

const selectedWeatherTitleStyle = {
  margin: '0 0 16px 0',
  fontSize: '1.1rem',
  fontWeight: '600',
  color: '#2c3e50'
};

const footerActionsStyle = {
  display: 'flex',
  gap: '12px',
  marginTop: '24px',
  paddingTop: '16px',
  borderTop: '1px solid #f0f0f0'
};

const refreshButtonStyle = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #ddd',
  borderRadius: '6px',
  padding: '8px 16px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  flex: 1
};

const expandButtonStyle = {
  backgroundColor: '#4caf50',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 16px',
  fontSize: '0.9rem',
  cursor: 'pointer',
  flex: 1
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

const noAlternativesStyle = {
  textAlign: 'center',
  padding: '40px',
  color: '#4caf50'
};

const noAlternativesIconStyle = {
  fontSize: '3rem',
  marginBottom: '16px',
  display: 'block'
};

export default AlternativeDestinations;
