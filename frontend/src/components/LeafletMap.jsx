import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Animated "marching ants" dashed overlay for the active route line, plus
// styling for clustered pins.
if (typeof document !== 'undefined') {
  const routeStyleEl = document.createElement('style');
  routeStyleEl.textContent = `
    @keyframes imap-route-dash {
      to { stroke-dashoffset: -18; }
    }
    .imap-route-ants {
      stroke-dasharray: 4 14 !important;
      animation: imap-route-dash 0.8s linear infinite;
    }
    .imap-cluster {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(22, 163, 74, 0.92);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.8rem;
      border: 3px solid rgba(255, 255, 255, 0.9);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
      box-sizing: border-box;
    }
    .imap-cluster-wrap { background: transparent; border: none; }
  `;
  document.head.appendChild(routeStyleEl);
}

const LeafletMap = ({
  center,
  zoom = 14,
  markers = [],
  routes = [],
  pois = [],
  style,
  tileLayerUrl,
  onMarkerClick,
  onMarkerDrag,
  onMarkerDragMove,
  onMapClick,
  onRouteClick,
  userLocation = null,
  userHeading = null,
  onRoutingChange = null,
  onReroutingChange = null,
  navTarget = null,
  autoRouteWaypoints = [],
  followUserLocation = true,
  rerouteDistanceThresholdM = 50,
  rerouteIntervalMs = 5000,
  clusterMarkers = false,
  selectedRouteIndex = 0
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerGroupRef = useRef(null);
  const routeLayersRef = useRef([]);
  const poiLayersRef = useRef([]);
  const routePolylineRef = useRef(null);
  const routeRequestIdRef = useRef(0);
  const routeAlternativesRef = useRef([]);
  const selectedRouteIndexRef = useRef(selectedRouteIndex || 0);
  const lastRouteContextRef = useRef({ routeLabel: 'Route', destinationWaypoint: null });
  const userMarkerRef = useRef(null);
  const navTargetRef = useRef(navTarget);
  const lastRerouteOriginRef = useRef(null);
  const lastRerouteTimeRef = useRef(0);
  const lastUserPosRef = useRef(null);
  const [routingActive, setRoutingActive] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  // Initialize map once on mount
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with zoom controls disabled (will add explicit control)
    mapInstanceRef.current = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      touchZoom: true
    }).setView(center, zoom);

    // Add single zoom control buttons (no duplicate)
    L.control.zoom({ position: 'topleft' }).addTo(mapInstanceRef.current);

    // Add tile layer
    const defaultUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    tileLayerRef.current = L.tileLayer(tileLayerUrl || defaultUrl, {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Pan to a new location only when explicitly requested (e.g., from attraction click)
  // Use panTo instead of setView to allow user panning/zooming without interruption
  useEffect(() => {
    if (!mapInstanceRef.current || !center) return;
    
    const currentCenter = mapInstanceRef.current.getCenter();
    const distance = Math.sqrt(
      Math.pow(center[0] - currentCenter.lat, 2) + 
      Math.pow(center[1] - currentCenter.lng, 2)
    );
    
    // Only pan if the requested center is significantly different (user action)
    if (distance > 0.01) {
      mapInstanceRef.current.panTo(center, { animate: true, duration: 0.5 });
    }
  }, [center]);

  // Update tile layer when URL changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerUrl) return;

    // Remove old tile layer
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    // Add new tile layer
    tileLayerRef.current = L.tileLayer(tileLayerUrl, {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);
  }, [tileLayerUrl]);

  // Handle fullscreen mode - invalidate map size when entering/exiting fullscreen
  useEffect(() => {
    const mapContainer = mapRef.current;
    if (!mapContainer || !mapInstanceRef.current) return;

    const handleFullscreenChange = () => {
      // Wait for the DOM to finish updating
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: true });
          console.log('Map size invalidated for fullscreen mode');
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Recompute the Leaflet map size whenever its container's dimensions change
  // (sidebar toggle, breakpoint/responsive reflow, layout shifts). Leaflet only
  // listens to window resize natively, which misses these container-level changes.
  useEffect(() => {
    const container = mapRef.current;
    if (!container || !mapInstanceRef.current) return;

    let frame = null;
    const invalidate = () => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.invalidateSize({ pan: false, debounceMoveend: true });
    };
    const scheduleInvalidate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(invalidate);
    };

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => scheduleInvalidate());
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', scheduleInvalidate);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', scheduleInvalidate);
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove previously created marker layer/group
    if (markerGroupRef.current) {
      map.removeLayer(markerGroupRef.current);
      markerGroupRef.current = null;
    } else {
      // Clear existing markers except user location marker
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer !== userMarkerRef.current) {
          map.removeLayer(layer);
        }
      });
    }

    // When clustering is enabled, add markers to a cluster group so dense areas
    // collapse into count bubbles that spiderfy / expand as you zoom in.
    let addTarget = map;
    if (clusterMarkers) {
      addTarget = L.markerClusterGroup({
        maxClusterRadius: 55,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 16,
        chunkedLoading: true,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          const size = count < 10 ? 38 : count < 100 ? 46 : 54;
          return L.divIcon({
            html: `<div class="imap-cluster" style="width:${size}px;height:${size}px;">${count}</div>`,
            className: 'imap-cluster-wrap',
            iconSize: [size, size]
          });
        }
      });
      markerGroupRef.current = addTarget;
      map.addLayer(addTarget);
    }

    console.log('Adding markers:', markers.length);

    // Add new markers
    markers.forEach((marker, index) => {
      if (marker.lat && marker.lng && mapInstanceRef.current) {
        let icon;
        if (marker.iconHtml && !marker.draggable) {
          icon = L.divIcon({
            html: marker.iconHtml,
            className: 'imap-pin-wrap',
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -30]
          });
        }

        const leafletMarker = L.marker([marker.lat, marker.lng], {
          draggable: !!marker.draggable,
          ...(icon ? { icon } : {})
        });
        addTarget.addLayer(leafletMarker);

        if (marker.popup) {
          leafletMarker.bindPopup(marker.popup);
        } else if (marker.imageUrl || marker.image_url) {
          const imageUrl = marker.imageUrl || marker.image_url;
          const title = marker.title || marker.name || marker.data?.name || 'Location';
          const location = marker.location || marker.data?.location || marker.data?.municipality || '';
          const popupHtml = `
            <div style="min-width: 220px; max-width: 260px;">
              <div style="width: 100%; height: 130px; border-radius: 12px; overflow: hidden; background: #f3f4f6; margin-bottom: 10px;">
                <img src="${imageUrl}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
              </div>
              <strong style="display:block; margin-bottom: 4px;">${title}</strong>
              ${location ? `<small style="color:#6b7280;">${location}</small>` : ''}
            </div>
          `;
          leafletMarker.bindPopup(popupHtml);
        }

        if (onMarkerClick && marker.type !== 'user') {
          leafletMarker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onMarkerClick(marker);
          });
        }

        if (marker.draggable && onMarkerDrag) {
          leafletMarker.on('dragend', (event) => {
            const position = event.target.getLatLng();
            onMarkerDrag(marker, position);
            if (onMarkerDragMove) onMarkerDragMove(null);
          });
          if (onMarkerDragMove) {
            leafletMarker.on('drag', (event) => {
              const position = event.target.getLatLng();
              onMarkerDragMove({ marker, position });
            });
          }
        }
      }
    });
  }, [markers, onMarkerClick, onMarkerDrag, clusterMarkers]);

  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return;
    const handleClick = (event) => {
      onMapClick(event.latlng);
    };

    mapInstanceRef.current.on('click', handleClick);
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off('click', handleClick);
      }
    };
  }, [onMapClick]);

  // Handle routes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing routes
    routeLayersRef.current.forEach(layer => {
      mapInstanceRef.current.removeLayer(layer);
    });
    routeLayersRef.current = [];

    // Add routes
    routes.forEach(route => {
      if (route.route_data) {
        try {
          const routeData = typeof route.route_data === 'string' 
            ? JSON.parse(route.route_data) 
            : route.route_data;
          
          // Handle different route data formats
          let coordinates;
          if (routeData.waypoints && Array.isArray(routeData.waypoints)) {
            coordinates = routeData.waypoints;
          } else if (Array.isArray(routeData)) {
            coordinates = routeData;
          } else {
            console.warn('Unknown route data format:', routeData);
            return;
          }
          
          const polyline = L.polyline(coordinates, {
            color: '#2e7d32',
            weight: 4,
            opacity: 0.8
          }).addTo(mapInstanceRef.current);

          const distance = routeData.distance ? `${routeData.distance} km` : 'N/A';
          const duration = routeData.duration ? `${routeData.duration} min` : 'N/A';

          polyline.bindPopup(`
            <div style="min-width: 200px;">
              <strong>Saved Route</strong><br/>
              <small>From: ${route.start_location || 'Unknown'}</small><br/>
              <small>To: ${route.end_location || 'Unknown'}</small><br/>
              <small>Distance: ${distance}</small><br/>
              <small>Duration: ${duration}</small><br/>
              <small>Created: ${new Date(route.created_at).toLocaleDateString()}</small>
            </div>
          `);

          if (onRouteClick) {
            polyline.on('click', () => onRouteClick(route));
          }

          routeLayersRef.current.push(polyline);
        } catch (error) {
          console.error('Failed to parse route data:', error);
        }
      }
    });
  }, [routes, onRouteClick]);

  // Handle POIs
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing POIs
    poiLayersRef.current.forEach(layer => {
      mapInstanceRef.current.removeLayer(layer);
    });
    poiLayersRef.current = [];

    // POI category icons
    const poiIcons = {
      restaurant: '🍽️',
      hotel: '🏨',
      attraction: '🎯',
      beach: '🏖️',
      mountain: '⛰️',
      default: '📍'
    };

    // Add POIs
    pois.forEach(poi => {
      const icon = L.divIcon({
        html: `<div style="background: white; border-radius: 50%; padding: 4px; border: 2px solid #2e7d32; font-size: 16px;">
          ${poiIcons[poi.category] || poiIcons.default}
        </div>`,
        className: 'poi-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([poi.latitude, poi.longitude], { icon })
        .addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div>
          <strong>${poi.name}</strong><br/>
          <em>${poi.category}</em><br/>
          ${poi.description || ''}
        </div>
      `);

      poiLayersRef.current.push(marker);
    });
  }, [pois]);

  // Handle user location marker (shows an arrow pointing in the facing direction)
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Remove old user marker if exists
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    // Compute facing direction: prefer the device-provided heading, otherwise
    // derive it from movement between consecutive GPS fixes (only if we moved).
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
    const bearingBetween = (from, to) => {
      const dLon = toRad(to[1] - from[1]);
      const y = Math.sin(dLon) * Math.cos(toRad(to[0]));
      const x =
        Math.cos(toRad(from[0])) * Math.sin(toRad(to[0])) -
        Math.sin(toRad(from[0])) * Math.cos(toRad(to[0])) * Math.cos(dLon);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    };

    let heading = null;
    if (userHeading != null && !Number.isNaN(Number(userHeading))) {
      heading = Number(userHeading);
    } else if (lastUserPosRef.current) {
      const moved = haversineMeters(lastUserPosRef.current, userLocation);
      if (moved >= 6) {
        heading = bearingBetween(lastUserPosRef.current, userLocation);
      }
    }
    lastUserPosRef.current = userLocation;

    const innerIcon =
      heading != null
        ? `<div style="position:relative;z-index:2;width:24px;height:24px;transform:rotate(${Math.round(heading)}deg);filter:drop-shadow(0 2px 3px rgba(0,0,0,0.45));">
             <svg viewBox='0 0 24 24' width='24' height='24'>
               <path d='M12 2 L19.5 20 L12 15.6 L4.5 20 Z' fill='#1976d2' stroke='#ffffff' stroke-width='1.4' stroke-linejoin='round'/>
               <circle cx='12' cy='13.6' r='2.4' fill='#ffffff'/>
             </svg>
           </div>`
        : `<div style="position:relative;z-index:2;background:#1976d2;border-radius:50%;width:20px;height:20px;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`;

    // Add user location marker with pulsing rings + directional arrow when heading is known
    const userIcon = L.divIcon({
      html: `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
          <!-- Pulsing rings -->
          <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:rgba(25,118,210,0.15);animation:gps-pulse 1.8s ease-out infinite;"></div>
          <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(25,118,210,0.2);animation:gps-pulse 1.8s ease-out infinite 0.6s;"></div>
          <!-- Facing-direction arrow (rotates with heading) -->
          ${innerIcon}
          <style>
            @keyframes gps-pulse {
              0% { transform: scale(0.5); opacity: 0.8; }
              100% { transform: scale(1.4); opacity: 0; }
            }
          </style>
        </div>`,
      className: 'user-location-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    userMarkerRef.current = L.marker(userLocation, { icon: userIcon })
      .addTo(mapInstanceRef.current);

    userMarkerRef.current.bindPopup(
      heading != null
        ? `🧭 Your GPS Location — facing ${Math.round(heading)}°`
        : '📡 Your GPS Location'
    );

    if (followUserLocation) {
      mapInstanceRef.current.panTo(userLocation, { animate: true, duration: 0.5 });
    }
  }, [userLocation, userHeading]);

  const clearRouting = () => {
    if (routePolylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    setRerouting(false);
    setRoutingActive(false);
  };

  const setRerouting = (value) => {
    setIsRerouting(!!value);
    if (onReroutingChange) onReroutingChange(!!value);
  };

  const haversineMeters = (from, to) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(to[0] - from[0]);
    const dLng = toRad(to[1] - from[1]);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(from[0])) * Math.cos(toRad(to[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const computeRouteDistanceKm = (latLngs) => {
    let meters = 0;
    for (let i = 1; i < latLngs.length; i++) {
      meters += haversineMeters(latLngs[i - 1], latLngs[i]);
    }
    return Number((meters / 1000).toFixed(2));
  };

  const destIcon = L.divIcon({
    html: `
      <svg width="28" height="36" viewBox="0 0 24 30" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));">
        <path d="M12 1 C7 1 3 5 3 10 c0 8 9 19 9 19 s9 -11 9 -19 C21 5 17 1 12 1 z" fill="#1976d2" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="12" cy="10" r="4.2" fill="#ffffff"/>
      </svg>`,
    className: 'imap-route-dest',
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  });

  // Builds a layered, clearly visible route: dark glow + white casing + colored
  // line + animated "marching ants" overlay, plus a destination pin.
  const buildRouteLayer = (latLngs, { color = '#1976d2', animated = true } = {}) => {
    const group = L.layerGroup();

    // Outer glow
    L.polyline(latLngs, {
      color: '#065f46',
      weight: 10,
      opacity: 0.18,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(group);

    // White casing so the line pops against any basemap
    L.polyline(latLngs, {
      color: '#ffffff',
      weight: 6,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(group);

    // Main colored line
    const main = L.polyline(latLngs, {
      color,
      weight: 4.5,
      opacity: 1,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(group);

    // Directional marching-ants overlay
    if (animated) {
      L.polyline(latLngs, {
        color: '#b3e5fc',
        weight: 2.5,
        opacity: 0.9,
        dashArray: '4 14',
        className: 'imap-route-ants',
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(group);
    }

    const destMarker = L.marker(latLngs[latLngs.length - 1], { icon: destIcon }).addTo(group);

    return { group, main, destMarker };
  };

  const routeAlternativesForPayload = (alts) =>
    alts.map((a) => ({ index: a.index, distance: a.distanceKm, duration: a.durationMin }));

  const renderRouteAlternative = (alt, { routeLabel, keepView = true } = {}) => {
    if (!mapInstanceRef.current || !alt?.latLngs?.length) return;

    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    const routeLayer = buildRouteLayer(alt.latLngs, { color: '#1976d2', animated: true });
    routePolylineRef.current = routeLayer.group;
    routeLayer.group.addTo(mapInstanceRef.current);

    routeLayer.main.bindPopup(`
      <div style="min-width: 200px;">
        <strong>${routeLabel}</strong><br/>
        <small>Distance: ${alt.distanceKm} km</small><br/>
        <small>Duration: ${alt.durationMin} min</small>
      </div>
    `);

    if (!keepView) {
      mapInstanceRef.current.fitBounds(routeLayer.group.getBounds(), {
        padding: [30, 30],
        animate: true
      });
    }
  };

  const drawRouteFromWaypoints = async (waypoints, routeLabel = 'Route', opts = {}) => {
    const { keepView = false, rerouting = false } = opts;
    if (!mapInstanceRef.current || !Array.isArray(waypoints) || waypoints.length < 2) {
      clearRouting();
      return;
    }

    const normalizedWaypoints = waypoints
      .map((point) => {
        const lat = Number(point?.lat ?? point?.latitude);
        const lng = Number(point?.lng ?? point?.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { lat, lng };
      })
      .filter(Boolean);

    if (normalizedWaypoints.length < 2) {
      clearRouting();
      return;
    }

    const currentRequestId = ++routeRequestIdRef.current;
    clearRouting();
    if (rerouting) setRerouting(true);

    const destinationWaypoint = {
      ...normalizedWaypoints[normalizedWaypoints.length - 1],
      name: waypoints[waypoints.length - 1]?.name
    };
    lastRouteContextRef.current = { routeLabel, destinationWaypoint };

    try {
      const coordinateString = normalizedWaypoints.map((point) => `${point.lng},${point.lat}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson&steps=true&alternatives=true`
      );

      if (!response.ok) {
        throw new Error(`Routing request failed with ${response.status}`);
      }

      const data = await response.json();
      if (currentRequestId !== routeRequestIdRef.current) return;

      const routes = Array.isArray(data?.routes) ? data.routes : [];
      const alternatives = routes
        .filter((r) => r?.geometry?.coordinates?.length)
        .map((r, i) => ({
          index: i,
          distanceKm: Number((r.distance / 1000).toFixed(2)),
          durationMin: Math.max(1, Math.round(r.duration / 60)),
          latLngs: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
          steps: (r.legs || [])
            .flatMap((leg) => leg.steps || [])
            .map((s, si) => ({
              index: si,
              type: s.maneuver?.type || 'continue',
              modifier: s.maneuver?.modifier || '',
              name: s.name || '',
              distanceKm: Number((s.distance / 1000).toFixed(2)),
              durationMin: Math.round(s.duration / 60),
              lat: s.maneuver?.location?.[1] ?? null,
              lng: s.maneuver?.location?.[0] ?? null
            }))
        }));

      if (alternatives.length === 0) {
        throw new Error('No route geometry returned');
      }

      routeAlternativesRef.current = alternatives;
      const selected = alternatives[Math.min(selectedRouteIndexRef.current, alternatives.length - 1)];

      renderRouteAlternative(selected, { routeLabel, keepView });

      if (onRoutingChange) {
        onRoutingChange({
          distance: selected.distanceKm,
          duration: selected.durationMin,
          destination: destinationWaypoint,
          rerouting,
          steps: selected.steps,
          alternatives: routeAlternativesForPayload(alternatives),
          selectedIndex: selected.index
        });
      }

      setRoutingActive(true);
    } catch (error) {
      if (currentRequestId !== routeRequestIdRef.current) return;
      console.error('Error drawing route:', error);

      // Fallback: draw a direct line so the route is still visible, and report
      // estimated stats so the banner always updates.
      routeAlternativesRef.current = [];
      const straightLine = normalizedWaypoints.map((point) => [point.lat, point.lng]);
      const straightDistanceKm = computeRouteDistanceKm(straightLine);
      const straightDurationMin = Math.max(1, Math.round((straightDistanceKm / 30) * 60));
      const routeLayer = buildRouteLayer(straightLine, { color: '#16a34a', animated: false });
      routePolylineRef.current = routeLayer.group;
      routeLayer.group.addTo(mapInstanceRef.current);

      routeLayer.main.bindPopup(`
        <div style="min-width: 200px;">
          <strong>${routeLabel}</strong><br/>
          <small>Direct route (road map unavailable): ${straightDistanceKm} km</small><br/>
          <small>Estimated duration: ≈ ${straightDurationMin} min</small>
        </div>
      `);

      if (!keepView) {
        mapInstanceRef.current.fitBounds(routeLayer.group.getBounds(), {
          padding: [30, 30],
          animate: true
        });
      }

      if (onRoutingChange) {
        onRoutingChange({
          distance: straightDistanceKm,
          duration: straightDurationMin,
          destination: destinationWaypoint,
          rerouting,
          steps: [],
          alternatives: [],
          selectedIndex: 0
        });
      }

      setRoutingActive(true);
    } finally {
      if (currentRequestId === routeRequestIdRef.current) {
        setRerouting(false);
      }
    }
  };

  // Switch between route alternatives without refetching.
  useEffect(() => {
    selectedRouteIndexRef.current = selectedRouteIndex || 0;
    const alts = routeAlternativesRef.current;
    if (!alts || alts.length === 0) return;
    const selected = alts[Math.min(selectedRouteIndex || 0, alts.length - 1)];
    if (!selected) return;
    const { routeLabel, destinationWaypoint } = lastRouteContextRef.current;
    renderRouteAlternative(selected, { routeLabel, keepView: true });
    if (onRoutingChange) {
      onRoutingChange({
        distance: selected.distanceKm,
        duration: selected.durationMin,
        destination: destinationWaypoint,
        rerouting: false,
        steps: selected.steps,
        alternatives: routeAlternativesForPayload(alts),
        selectedIndex: selected.index
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRouteIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('LeafletMap unmounting - cleaning up map instance');
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.error('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }
      tileLayerRef.current = null;
      routeLayersRef.current = [];
      poiLayersRef.current = [];
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, []);

  // Keep navTarget in a ref so throttled re-routing always sees the latest destination
  useEffect(() => {
    navTargetRef.current = navTarget;
  }, [navTarget]);

  const destFromTarget = (target) => {
    if (!target) return null;
    const lat = Number(target?.lat ?? target?.latitude);
    const lng = Number(target?.lng ?? target?.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng, name: target?.name };
  };

  // Listen for manual navigation requests (backward compatible with event-based consumers).
  useEffect(() => {
    const handleNavigationEvent = (event) => {
      console.log('🗺️ Navigation event received:', event.detail);
      const { latitude, longitude, name } = event.detail;

      // Inline update of the mirror ref so re-routing works even when the parent
      // does not pass navTarget as a prop.
      if (latitude != null && longitude != null) {
        navTargetRef.current = {
          lat: Number(latitude),
          lng: Number(longitude),
          name: name || 'Route to destination'
        };
      }

      if (!userLocation) {
        console.warn('⚠️ User location not available for routing');
        return;
      }

      const dest = destFromTarget(navTargetRef.current);
      if (!dest) return;

      lastRerouteOriginRef.current = [userLocation[0], userLocation[1]];
      lastRerouteTimeRef.current = Date.now();
      drawRouteFromWaypoints(
        [
          { lat: userLocation[0], lng: userLocation[1] },
          { lat: dest.lat, lng: dest.lng, name: dest.name }
        ],
        dest.name || 'Route to destination',
        { keepView: false }
      );
    };

    window.addEventListener('startNavigation', handleNavigationEvent);
    return () => window.removeEventListener('startNavigation', handleNavigationEvent);
  }, [userLocation]);

  // Listen for clear-navigation requests (dispatched by Stop button)
  useEffect(() => {
    const handleClearNavigation = () => {
      navTargetRef.current = null;
      lastRerouteOriginRef.current = null;
      clearRouting();
    };
    window.addEventListener('clearNavigation', handleClearNavigation);
    return () => window.removeEventListener('clearNavigation', handleClearNavigation);
  }, []);

  // Immediate route draw when the destination / itinerary changes (fit bounds).
  useEffect(() => {
    const hasAutoRoute = Array.isArray(autoRouteWaypoints) && autoRouteWaypoints.length >= 2;

    if (hasAutoRoute) {
      lastRerouteOriginRef.current = null;
      lastRerouteTimeRef.current = 0;
      drawRouteFromWaypoints(autoRouteWaypoints, 'Itinerary Route');
      return;
    }

    if (!navTarget) {
      navTargetRef.current = null;
      lastRerouteOriginRef.current = null;
      clearRouting();
      return;
    }

    const dest = destFromTarget(navTarget);
    if (!dest || !userLocation) {
      if (!userLocation) return;
      clearRouting();
      return;
    }

    lastRerouteOriginRef.current = [userLocation[0], userLocation[1]];
    lastRerouteTimeRef.current = Date.now();
    drawRouteFromWaypoints(
      [
        { lat: userLocation[0], lng: userLocation[1] },
        { lat: dest.lat, lng: dest.lng, name: dest.name }
      ],
      dest.name || 'Destination route',
      { keepView: false }
    );
  }, [navTarget, autoRouteWaypoints]);

  // Live re-routing: when navigating and the user's GPS moves enough (and enough
  // time has passed), recompute the route from the current position to the destination.
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    const dest = destFromTarget(navTargetRef.current);
    if (!dest) return;

    const now = Date.now();
    const lastOrigin = lastRerouteOriginRef.current;
    const movedFromLast = lastOrigin
      ? haversineMeters(lastOrigin, userLocation)
      : Number.POSITIVE_INFINITY;

    const timeSinceLast = now - lastRerouteTimeRef.current;
    const isInitialDraw = !lastOrigin;
    const enoughMoved = movedFromLast >= rerouteDistanceThresholdM;
    const enoughTime = timeSinceLast >= rerouteIntervalMs;

    if (isInitialDraw || (enoughMoved && enoughTime)) {
      lastRerouteOriginRef.current = [userLocation[0], userLocation[1]];
      lastRerouteTimeRef.current = now;
      drawRouteFromWaypoints(
        [
          { lat: userLocation[0], lng: userLocation[1] },
          { lat: dest.lat, lng: dest.lng, name: dest.name }
        ],
        dest.name || 'Destination route',
        { keepView: !isInitialDraw, rerouting: true }
      );
    }
  }, [userLocation]);

  return <div ref={mapRef} style={{ ...style, pointerEvents: 'auto', touchAction: 'auto' }} />;
};

export default LeafletMap;
