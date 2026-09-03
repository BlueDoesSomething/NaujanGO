import { execute } from '../db.js';

// DEPRECATED: Use attractionsController.getMapMarkers instead
// This endpoint is kept for backward compatibility
export const getPois = async (req, res) => {
  try {
    // Redirect to unified attractions endpoint
    const [rows] = await execute(
      'SELECT id AS poi_id, name, description, category, latitude, longitude FROM attractions WHERE category IN ("attraction", "poi", "landmark") AND (archived IS NULL OR archived = 0) ORDER BY name ASC'
    );
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching POIs:', error);
    res.json([]);
  }
};
