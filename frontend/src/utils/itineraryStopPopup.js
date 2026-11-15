const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

// Leaflet popups accept HTML, so all stop data must be escaped before binding.
export const itineraryStopPopup = (item, number) => {
  const name = item.custom_name || item.attraction_name || 'Unnamed stop';
  const location = item.custom_location || item.attraction_location || 'Location not specified';
  const time = item.start_time ? String(item.start_time).slice(0, 5) : 'Time not set';
  const minutes = Number(item.duration_minutes || item.estimated_duration);
  const cost = Number(item.estimated_cost);
  return `<div class="itin-map-popup">
    <span class="itin-map-popup-label">Stop ${number}</span>
    <strong>${escapeHtml(name)}</strong>
    <span>${escapeHtml(time)}${minutes > 0 ? ` · ${Math.round(minutes)} min` : ''}</span>
    <span>${escapeHtml(location)}</span>
    ${cost > 0 ? `<small>Estimated cost: ₱${cost.toFixed(2)}</small>` : ''}
    <small class="itin-map-popup-tip">More details and directions below the map</small>
  </div>`;
};
