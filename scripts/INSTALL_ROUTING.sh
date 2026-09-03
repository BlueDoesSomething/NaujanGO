#!/bin/bash

# Install Leaflet Routing Machine for turn-by-turn navigation
cd frontend

echo "📦 Installing leaflet-routing-machine..."
npm install leaflet-routing-machine

echo "✅ Installation complete!"
echo ""
echo "🗺️  Leaflet Routing Machine has been installed."
echo "Features added to InteractiveMap:"
echo "  - Turn-by-turn navigation from your location to attractions"
echo "  - Real-time route display with distance and duration"
echo "  - Alternative routes visualization"
echo "  - OSRM (Open Source Routing Machine) integration"
echo ""
echo "Usage:"
echo "  1. Click GPS button to get your location"
echo "  2. Click on an attraction marker"
echo "  3. Click 'Navigate' to see the route with directions"
echo ""
