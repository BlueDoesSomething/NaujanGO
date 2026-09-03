import { execute } from '../db.js';
import { getTranslationsForEntities } from '../services/translations.js';
import { getTranslationWithFallback } from '../services/machineTranslate.js';

/**
 * Get all restaurants with optional filtering
 * Query params:
 *   - featured: 1 (returns only featured restaurants)
 *   - limit: number (limit results, default 8)
 *   - municipality: filter by municipality
 *   - cuisine: filter by cuisine type
 *   - sort: 'rating' or 'newest' (default: rating)
 */
export const getRestaurants = async (req, res) => {
  try {
    const language = req.language || 'en';
    const { featured, limit = 8, municipality, cuisine, sort = 'rating' } = req.query;
    
    let query = 'SELECT * FROM restaurants WHERE 1=1';
    const params = [];
    
    if (featured === '1') {
      query += ' AND featured = 1';
    }
    
    if (municipality) {
      query += ' AND municipality = ?';
      params.push(municipality);
    }
    
    if (cuisine) {
      query += ' AND cuisine_type = ?';
      params.push(cuisine);
    }
    
    // Sorting
    if (sort === 'newest') {
      query += ' ORDER BY created_at DESC';
    } else {
      query += ' ORDER BY rating DESC, review_count DESC';
    }
    
    query += ' LIMIT ?';
    params.push(parseInt(limit));
    
    let [results] = await execute(query, params);
    
    // Apply translations if non-English locale requested
    if (language && language !== 'en' && results && results.length > 0) {
      const ids = results.map(r => r.restaurant_id);
      const translationsMap = await getTranslationsForEntities('restaurants', ids, ['name', 'description', 'cuisine_type'], language);
      
      // Apply translations
      results = await Promise.all((results || []).map(async r => {
        const tr = translationsMap[String(r.restaurant_id)] || {};
        return {
          ...r,
          name: tr.name || await getTranslationWithFallback('restaurants', r.restaurant_id, 'name', language) || r.name,
          description: tr.description || await getTranslationWithFallback('restaurants', r.restaurant_id, 'description', language) || r.description,
          cuisine_type: tr.cuisine_type || r.cuisine_type
        };
      }));
    }
    
    res.json({
      success: true,
      data: results || [],
      language: language
    });
  } catch (error) {
    console.error('Error in getRestaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get single restaurant by ID
 */
export const getRestaurantById = async (req, res) => {
  try {
    const language = req.language || 'en';
    const { id } = req.params;
    
    const [results] = await execute('SELECT * FROM restaurants WHERE restaurant_id = ?', [id]);
    
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    let restaurant = results[0];
    
    // Apply translations if non-English locale requested
    if (language && language !== 'en') {
      const tr = (await getTranslationsForEntities('restaurants', [restaurant.restaurant_id], ['name', 'description', 'cuisine_type'], language))[String(restaurant.restaurant_id)] || {};
      restaurant = {
        ...restaurant,
        name: tr.name || await getTranslationWithFallback('restaurants', restaurant.restaurant_id, 'name', language) || restaurant.name,
        description: tr.description || await getTranslationWithFallback('restaurants', restaurant.restaurant_id, 'description', language) || restaurant.description,
        cuisine_type: tr.cuisine_type || restaurant.cuisine_type
      };
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error('Error in getRestaurantById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get featured restaurants (for homepage)
 */
export const getFeaturedRestaurants = async (req, res) => {
  try {
    const language = req.language || 'en';
    const limit = req.query.limit || 4;
    
    let [results] = await execute(
      'SELECT * FROM restaurants WHERE featured = 1 ORDER BY rating DESC, review_count DESC LIMIT ?',
      [parseInt(limit)]
    );
    
    // Apply translations if non-English locale requested
    if (language && language !== 'en' && results && results.length > 0) {
      const ids = results.map(r => r.restaurant_id);
      const translationsMap = await getTranslationsForEntities('restaurants', ids, ['name', 'description', 'cuisine_type'], language);
      
      results = await Promise.all((results || []).map(async r => {
        const tr = translationsMap[String(r.restaurant_id)] || {};
        return {
          ...r,
          name: tr.name || await getTranslationWithFallback('restaurants', r.restaurant_id, 'name', language) || r.name,
          description: tr.description || await getTranslationWithFallback('restaurants', r.restaurant_id, 'description', language) || r.description,
          cuisine_type: tr.cuisine_type || r.cuisine_type
        };
      }));
    }
    
    res.json(results || []);
  } catch (error) {
    console.error('Error in getFeaturedRestaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get restaurants by cuisine type
 */
export const getRestaurantsByCuisine = async (req, res) => {
  try {
    const { cuisine } = req.params;
    const limit = req.query.limit || 8;
    
    const [results] = await execute(
      'SELECT * FROM restaurants WHERE cuisine_type = ? ORDER BY rating DESC LIMIT ?',
      [cuisine, parseInt(limit)]
    );
    
    res.json(results || []);
  } catch (error) {
    console.error('Error in getRestaurantsByCuisine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Search restaurants by name
 */
export const searchRestaurants = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = req.query.limit || 10;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchTerm = `%${q}%`;
    
    const [results] = await execute(
      'SELECT * FROM restaurants WHERE name LIKE ? OR description LIKE ? OR cuisine_type LIKE ? ORDER BY rating DESC LIMIT ?',
      [searchTerm, searchTerm, searchTerm, parseInt(limit)]
    );
    
    res.json(results || []);
  } catch (error) {
    console.error('Error in searchRestaurants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
