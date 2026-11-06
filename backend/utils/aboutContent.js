export const ABOUT_NUMBER_FIELDS = ['population', 'land_area_sq_km', 'density_per_sq_km', 'num_barangays', 'visitor_arrivals_2022', 'visitor_arrivals_2023', 'visitor_arrivals_2024', 'visitor_arrivals_2025', 'tourism_total_employment', 'tourism_attractions_count', 'tourism_accommodation_count', 'tourism_female_employed', 'tourism_male_employed'];
const invalid = message => Object.assign(new Error(message), { status: 400 });
export const validateAboutSettings = data => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw invalid('Send the About settings as a JSON object.');
  for (const key of ['overview_text', 'vision_text']) if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > 20000) throw invalid('Overview and vision text are required and must be at most 20,000 characters.');
  let mission = data.mission_text;
  if (typeof mission === 'string') { try { mission = JSON.parse(mission); } catch { throw invalid('Mission points must be valid JSON.'); } }
  if (!Array.isArray(mission?.points) || !mission.points.length || mission.points.length > 100 || mission.points.some(point => typeof point !== 'string' || !point.trim() || point.length > 4000)) throw invalid('Provide 1–100 non-empty mission points of at most 4,000 characters each.');
  for (const key of ABOUT_NUMBER_FIELDS) {
    const value = data[key], decimal = ['land_area_sq_km', 'density_per_sq_km'].includes(key);
    if (!['string', 'number'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > (decimal ? 99999999.99 : 2147483647) || !decimal && !Number.isInteger(Number(value))) throw invalid(`${key} must be a valid non-negative ${decimal ? 'number' : 'whole number'}.`);
  }
  if (Number(data.population) === 0) throw invalid('Population must be greater than zero.');
  for (const [key, max] of [['municipal_rank', 50], ['current_mayor_name', 255], ['current_mayor_term', 50], ['current_vice_mayor_name', 255], ['current_vice_mayor_term', 50]]) if (data[key] != null && (typeof data[key] !== 'string' || data[key].length > max)) throw invalid(`${key} must be text of at most ${max} characters.`);
};
export const validateAboutList = (value, kind) => {
  if (!Array.isArray(value) || value.length > 1000) throw invalid('Provide a list of at most 1,000 entries.');
  const fields = kind === 'leaders' ? [['name', 150], ['term', 80]] : kind === 'milestones' ? [['date', 80], ['title', 180], ['description', 500]] : [['name', 150]];
  const ids = new Set();
  for (const item of value) {
    if (!item || typeof item !== 'object' || fields.some(([key, max]) => typeof item[key] !== 'string' || !item[key].trim() || item[key].length > max)) throw invalid('Complete every entry before saving. No incomplete entries have been removed.');
    if (item.id != null && (typeof item.id !== 'string' || !item.id || ids.has(item.id))) throw invalid('Each entry must have a unique text ID.');
    ids.add(item.id);
    if (kind === 'leaders' && (!['mayor', 'vice-mayor'].includes(item.role) || typeof item.current !== 'boolean')) throw invalid('Choose a valid leadership role and current-official flag.');
    if (kind === 'queens' && (!Number.isInteger(Number(item.year)) || Number(item.year) < 1 || Number(item.year) > 9999)) throw invalid('Enter a valid year for every Miss Naujan entry.');
  }
  if (kind === 'leaders') for (const role of ['mayor', 'vice-mayor']) if (value.filter(item => item.role === role && item.current).length > 1) throw invalid('Choose at most one current official per role.');
};
