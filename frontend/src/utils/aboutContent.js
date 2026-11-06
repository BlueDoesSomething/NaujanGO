export const ABOUT_NUMBERS = [
  ['population', 'Population', true], ['land_area_sq_km', 'Land area (km²)', false], ['density_per_sq_km', 'Density per km²', false], ['num_barangays', 'Number of barangays', true],
  ...[2022, 2023, 2024, 2025].map(year => [`visitor_arrivals_${year}`, `Visitor arrivals ${year}`, true]),
  ['tourism_total_employment', 'Total tourism employment', true], ['tourism_female_employed', 'Female employed', true], ['tourism_male_employed', 'Male employed', true],
  ['tourism_attractions_count', 'Attractions count', true], ['tourism_accommodation_count', 'Accommodations count', true]
];
export const aboutNumber = value => value == null || value === '' || !Number.isFinite(Number(value)) ? 'Not available' : Number(value).toLocaleString('en-PH', { maximumFractionDigits: 2 });
export const aboutGrowth = (current, previous) => {
  if (current == null || current === '' || previous == null || previous === '' || !Number.isFinite(Number(current)) || !Number.isFinite(Number(previous)) || Number(previous) <= 0) return 'Not available';
  const rate = (Number(current) - Number(previous)) / Number(previous) * 100;
  return `${rate > 0 ? '+' : ''}${rate.toFixed(2)}%`;
};
export const validateAboutSettings = data => {
  const errors = [];
  for (const [key, label] of [['overview_text', 'Overview'], ['vision_text', 'Vision']]) if (typeof data[key] !== 'string' || !data[key].trim()) errors.push(`${label} text is required.`);
  if (!Array.isArray(data.mission_text?.points) || !data.mission_text.points.length || data.mission_text.points.some(point => typeof point !== 'string' || !point.trim())) errors.push('Enter at least one mission point; remove blank points.');
  for (const [key, label, integer] of ABOUT_NUMBERS) {
    const value = data[key];
    if (value === '' || value == null || !Number.isFinite(Number(value)) || Number(value) < 0 || integer && !Number.isSafeInteger(Number(value))) errors.push(`${label} must be a non-negative ${integer ? 'whole number' : 'number'}.`);
  }
  if (Number(data.population) === 0) errors.push('Population must be greater than zero.');
  return errors;
};
export const setCurrentLeader = (items, id, current) => {
  const target = items.find(item => item.id === id);
  return items.map(item => item.id === id ? { ...item, current } : current && item.role === target?.role ? { ...item, current: false } : item);
};
