/**
 * Vehicle recommendation logic for Naujan, Oriental Mindoro navigation.
 * Returns an ordered list of suitable transport options based on distance
 * and destination terrain/type.
 */

const VEHICLES = {
  walk:       { id: 'walk',       label: 'Walking',         color: '#16a34a', speedKmh: 4.5 },
  bike:       { id: 'bike',       label: 'Bicycle / E-bike', color: '#2563eb', speedKmh: 14 },
  tricycle:   { id: 'tricycle',   label: 'Tricycle',         color: '#d97706', speedKmh: 20 },
  motorcycle: { id: 'motorcycle', label: 'Motorcycle / Habal-habal', color: '#dc2626', speedKmh: 28 },
  car:        { id: 'car',        label: 'Car / Jeepney',    color: '#7c3aed', speedKmh: 30 },
  fourwd:     { id: '4x4',        label: '4×4 / ATV',        color: '#92400e', speedKmh: 16 },
  boat:       { id: 'boat',       label: 'Boat / Bangka',    color: '#0891b2', speedKmh: 15 },
};

const TERRAIN = {
  water:    /lake|river|falls|waterfall|island|bay|coast|beach|sea|marine|lagoon|mangrove|wetland/i,
  mountain: /mountain|peak|summit|highland|forest|trail|cliff|ridge|volcano|upland|hill/i,
  rough:    /cave|underground|canyon|gorge|ravine|wilderness|jungle/i,
  urban:    /park|garden|plaza|church|market|mall|museum|heritage|resort|shrine|cathedral|town/i,
};

/**
 * @param {number|string} distanceKm  - Route distance in kilometres
 * @param {object}        destination - { name, type, category, ... }
 * @returns {Array<{ id, label, icon, color, status: 'best'|'good'|'possible', reason }>}
 */
export function getVehicleRecommendations(distanceKm, destination) {
  const dist = parseFloat(distanceKm) || 0;
  const name = destination?.name || '';
  const category = (destination?.category || '').toLowerCase();
  const type = (destination?.type || '').toLowerCase();

  const isWater    = TERRAIN.water.test(name)    || category === 'beach' || category === 'lake';
  const isMountain = TERRAIN.mountain.test(name) || category === 'mountain';
  const isRough    = TERRAIN.rough.test(name)    || category === 'cave';
  const isUrban    = TERRAIN.urban.test(name)    || type === 'hotel'     || category === 'park';

  const recs = [];

  // ── Walking ──────────────────────────────────────────────────────────────
  if (dist < 1.5 && !isRough) {
    recs.push({
      ...VEHICLES.walk,
      status: dist <= 0.5 ? 'best' : 'good',
      reason: dist <= 0.5
        ? 'Very short distance — the quickest option on foot'
        : 'Comfortably walkable (under 1.5 km)',
    });
  }

  // ── Bicycle / E-bike ─────────────────────────────────────────────────────
  if (dist < 10 && !isMountain && !isRough) {
    recs.push({
      ...VEHICLES.bike,
      status: dist <= 3 ? 'best' : 'good',
      reason: isUrban
        ? 'Ideal for flat urban roads and short trips'
        : 'Efficient for moderate distances on paved roads',
    });
  }

  // ── Tricycle ─────────────────────────────────────────────────────────────
  if (dist < 12) {
    recs.push({
      ...VEHICLES.tricycle,
      status: dist <= 5 ? 'good' : 'possible',
      reason: 'Readily available locally — great for short to medium trips',
    });
  }

  // ── Motorcycle / Habal-habal ─────────────────────────────────────────────
  if (isMountain || isRough || dist > 3) {
    recs.push({
      ...VEHICLES.motorcycle,
      status: (isMountain || isRough) ? 'best' : 'good',
      reason: isMountain
        ? 'Habal-habal highly recommended for mountain / rough-road access'
        : isRough
        ? 'Best way to reach remote trail access points'
        : 'Fast and flexible for medium-distance roads',
    });
  }

  // ── Car / Jeepney ────────────────────────────────────────────────────────
  if (dist > 2) {
    recs.push({
      ...VEHICLES.car,
      status: dist > 10 && !isMountain ? 'best' : 'good',
      reason: dist > 10
        ? 'Most comfortable choice for longer distances'
        : 'Good for 2 km+ trips, jeepney or private vehicle',
    });
  }

  // ── 4×4 / ATV ────────────────────────────────────────────────────────────
  if (isMountain || isRough) {
    recs.push({
      ...VEHICLES.fourwd,
      status: 'possible',
      reason: 'Useful for steep or unpaved trails; check road conditions first',
    });
  }

  // ── Boat / Bangka ────────────────────────────────────────────────────────
  if (isWater) {
    recs.push({
      ...VEHICLES.boat,
      status: 'best',
      reason: 'Water access required — rent a bangka (outrigger boat) locally',
    });
  }

  // Fallback
  if (recs.length === 0) {
    recs.push({
      ...VEHICLES.tricycle,
      status: 'good',
      reason: 'Common local transport suitable for most destinations',
    });
  }

  // Sort: best → good → possible, keep original order within each status
  const order = { best: 0, good: 1, possible: 2 };
  recs.sort((a, b) => order[a.status] - order[b.status]);

  // Estimate each vehicle's travel time based on the route distance
  for (const rec of recs) {
    if (dist > 0 && rec.speedKmh) {
      const mins = (dist / rec.speedKmh) * 60;
      rec.etaMinutes = mins < 1 ? 1 : Math.round(mins);
    } else {
      rec.etaMinutes = null;
    }
  }

  return recs;
}
