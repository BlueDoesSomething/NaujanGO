// A saved stop can override the attraction's location. Older itineraries may
// only have attraction coordinates; use those as a complete fallback pair.
const validPair = (latitude, longitude) => {
  if (latitude === '' || latitude == null || longitude === '' || longitude == null) return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
};

export const stopCoordinates = (item) =>
  validPair(item.latitude, item.longitude)
  || validPair(item.attraction_latitude, item.attraction_longitude);
