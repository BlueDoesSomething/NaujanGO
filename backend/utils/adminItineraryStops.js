// Keep the admin stop editor limited to existing stops. Never accept a new id
// or silently drop a stop while changing its day, order, time or map position.
export class AdminItineraryValidationError extends Error {}

export function validateAdminStops(stops, existing, maxDay) {
  if (!Array.isArray(stops) || stops.length !== existing.length) {
    throw new AdminItineraryValidationError('All existing stops must be included exactly once.');
  }
  const allowed = new Set(existing.map((stop) => Number(stop.id)));
  const seen = new Set();
  return stops.map((stop) => {
    const id = Number(stop.id);
    const day = Number(stop.day_number);
    const lat = stop.latitude === '' || stop.latitude == null ? null : Number(stop.latitude);
    const lng = stop.longitude === '' || stop.longitude == null ? null : Number(stop.longitude);
    const time = stop.start_time === '' || stop.start_time == null ? null : String(stop.start_time);
    if (!Number.isSafeInteger(id) || !allowed.has(id) || seen.has(id)) throw new AdminItineraryValidationError('Invalid or duplicate stop.');
    if (!Number.isInteger(day) || day < 1 || day > maxDay) throw new AdminItineraryValidationError('A stop has an invalid day.');
    if (time && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) throw new AdminItineraryValidationError('A stop has an invalid time.');
    if ((lat === null) !== (lng === null) || (lat !== null && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180))) {
      throw new AdminItineraryValidationError('Stop coordinates must be a valid latitude and longitude pair.');
    }
    seen.add(id);
    return { id, day, time, lat, lng };
  });
}

export function itineraryDateDays(start, end) {
  if (Boolean(start) !== Boolean(end)) throw new AdminItineraryValidationError('Provide both a start date and an end date.');
  if (!start || !end) return null;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(start) || !datePattern.test(end)) throw new AdminItineraryValidationError('Invalid itinerary dates.');
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)
    || new Date(startMs).toISOString().slice(0, 10) !== start
    || new Date(endMs).toISOString().slice(0, 10) !== end
    || endMs < startMs) throw new AdminItineraryValidationError('End date must be on or after start date.');
  const days = Math.round((endMs - startMs) / 86400000) + 1;
  if (days > 365) throw new AdminItineraryValidationError('Itineraries may not exceed 365 days.');
  return days;
}
