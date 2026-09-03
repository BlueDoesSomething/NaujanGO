import { execute } from '../db.js';
import { getTranslationsForEntities } from '../services/translations.js';
import { getTranslationWithFallback } from '../services/machineTranslate.js';

let reviewsItineraryColumnSupportPromise;

const hasReviewsItineraryColumn = async () => {
  if (!reviewsItineraryColumnSupportPromise) {
    reviewsItineraryColumnSupportPromise = execute(
      `SELECT COUNT(*) AS column_count
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'reviews'
         AND column_name = 'itinerary_id'`
    )
      .then(([rows]) => Number(rows?.[0]?.column_count || 0) > 0)
      .catch(() => false);
  }

  return reviewsItineraryColumnSupportPromise;
};

export const getAttractionsMeta = async (req, res) => {
  try {
    const [rows] = await execute(
      `SELECT DISTINCT municipality FROM attractions
       WHERE municipality IS NOT NULL AND municipality != ''
         AND (archived IS NULL OR archived = 0)
       ORDER BY municipality ASC`
    );
    res.json({ municipalities: rows.map(r => r.municipality) });
  } catch (error) {
    console.error('Error fetching meta:', error);
    res.json({ municipalities: [] });
  }
};

export const getAttractionSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (!q.trim() || q.trim().length < 2) return res.json([]);
    const term = `%${q.trim()}%`;
    const [rows] = await execute(
      `SELECT id, name, location FROM attractions
       WHERE (name LIKE ? OR location LIKE ?)
         AND (archived IS NULL OR archived = 0)
       ORDER BY name ASC LIMIT 6`,
      [term, term]
    );
    
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.json([]);
  }
};

export const getAttractions = async (req, res) => {
  try {
    const language = req.language || 'en';
    console.log('[getAttractions] Requested language:', language, 'Headers:', req.headers['x-language'], 'Query:', req.query.lang);

    const [colCheck] = await execute(
      `SELECT COUNT(*) AS c FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'attractions' AND column_name = 'entrance_fee'`
    );
    const hasEntranceFee = Number(colCheck?.[0]?.c || 0) > 0;

    const [rows] = await execute(
      `SELECT a.id, a.name, a.description, a.municipality, a.location,
              a.image_url, a.latitude, a.longitude, a.category,
              ${hasEntranceFee ? 'COALESCE(a.entrance_fee, 0)' : '0'} AS entrance_fee,
              COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
              COUNT(r.review_id) AS review_count
       FROM attractions a
       LEFT JOIN reviews r ON r.attraction_id = a.id AND r.moderated = 1
       WHERE (a.archived IS NULL OR a.archived = 0)
       GROUP BY a.id
       ORDER BY a.id ASC`
    );

    if (language && language !== 'en' && rows && rows.length > 0) {
      const ids = rows.map(r => r.id);
      console.log('[getAttractions] Fetching translations for', ids.length, 'attractions in', language);
      const translationsMap = await getTranslationsForEntities('attractions', ids, ['name', 'description'], language);
      console.log('[getAttractions] Translations found:', Object.keys(translationsMap).length, 'attractions');
      
      // Try MT fallback for missing translations (async, in parallel)
      const adapted = await Promise.all((rows || []).map(async r => {
        const tr = translationsMap[String(r.id)] || {}; // Convert ID to string for map lookup
        let name = tr.name || await getTranslationWithFallback('attractions', r.id, 'name', language) || r.name;
        let description = tr.description || await getTranslationWithFallback('attractions', r.id, 'description', language) || r.description;
        return {
          ...r,
          name,
          description
        };
      }));

      return res.json({
        success: true,
        data: adapted,
        language
      });
    }

    res.json({
      success: true,
      data: rows || [],
      language: 'en'
    });
  } catch (error) {
    console.error('Error fetching attractions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAttractionReviews = async (req, res) => {
  try {
    const { itinerary_id } = req.query;
    let query = 'SELECT r.*, u.username FROM reviews r LEFT JOIN users u ON r.user_id = u.user_id WHERE r.attraction_id = ? AND r.moderated = 1';
    const params = [req.params.id];

    // If itinerary_id filter is provided, add it to the query
    if (itinerary_id) {
      query += ' AND r.itinerary_id = ?';
      params.push(itinerary_id);
    }

    query += ' ORDER BY r.review_date DESC';

    const [rows] = await execute(query, params);
    res.json(rows || []);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.json([]);
  }
};

export const createAttractionReview = async (req, res) => {
  try {
    const { rating, comment, itinerary_id } = req.body;
    const user_id = req.user.user_id; // From authenticated session
    const poiId = req.params.id;
    const supportsItineraryLink = await hasReviewsItineraryColumn();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Validate comment
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const inappropriateWords = ['spam', 'fake', 'scam', 'hate', 'awful', 'terrible', 'worst'];
    const isInappropriate = inappropriateWords.some(word =>
      comment.toLowerCase().includes(word)
    );

    const moderated = isInappropriate ? 0 : 1;

    if (!itinerary_id) {
      return res.status(400).json({ message: 'A completed itinerary is required to review this attraction' });
    }

    const [itineraries] = await execute(
      `SELECT itinerary_id, end_date, status
       FROM itineraries
       WHERE itinerary_id = ?
         AND user_id = ?
         AND (
           LOWER(TRIM(status)) IN ('completed', 'finished', 'done', 'visited', 'closed')
           OR (end_date IS NOT NULL AND end_date <= CURDATE())
         )
       LIMIT 1`,
      [itinerary_id, user_id]
    );

    if (!itineraries || itineraries.length === 0) {
      return res.status(403).json({ message: 'You can only review attractions after completing a trip' });
    }

    const validatedItineraryId = itinerary_id;

    // Check if user already reviewed this attraction in this specific itinerary
    const [existingItineraryReview] = supportsItineraryLink
      ? await execute(
          'SELECT review_id FROM reviews WHERE user_id = ? AND attraction_id = ? AND itinerary_id = ?',
          [user_id, poiId, itinerary_id]
        )
      : await execute(
          'SELECT review_id FROM reviews WHERE user_id = ? AND attraction_id = ?',
          [user_id, poiId]
        );

    if (existingItineraryReview && existingItineraryReview.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this attraction for this trip' });
    }

    if (supportsItineraryLink) {
      await execute(
        'INSERT INTO reviews (user_id, attraction_id, rating, comment, review_date, moderated, itinerary_id) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
        [user_id, poiId, rating, comment, moderated, validatedItineraryId]
      );
    } else {
      await execute(
        'INSERT INTO reviews (user_id, attraction_id, rating, comment, review_date, moderated) VALUES (?, ?, ?, ?, NOW(), ?)',
        [user_id, poiId, rating, comment, moderated]
      );
    }

    const message = moderated ? 'Review submitted successfully' : 'Review submitted for moderation';
    res.status(201).json({ message, moderated, itinerary_id: validatedItineraryId });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAttractionAverageRating = async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT AVG(rating) as average, COUNT(*) as total FROM reviews WHERE attraction_id = ? AND moderated = 1',
      [req.params.id]
    );
    res.json({ average: parseFloat(rows[0].average || 0).toFixed(1), total: rows[0].total });
  } catch (error) {
    console.error('Error calculating average rating:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// New unified endpoint for all map markers (attractions + POI)
export const getMapMarkers = async (req, res) => {
  try {
    const { category = null } = req.query;
    let query = `SELECT a.id, a.name, a.description, a.category, a.latitude, a.longitude,
                        COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
                        COUNT(r.review_id) AS review_count
                 FROM attractions a
                 LEFT JOIN reviews r ON r.attraction_id = a.id AND r.moderated = 1
                 WHERE (a.archived IS NULL OR a.archived = 0)`;
    let params = [];
    
    if (category) {
      query += ` AND a.category = ?`;
      params.push(category);
    }
    
    query += ` GROUP BY a.id ORDER BY a.id ASC`;
    
    const [rows] = await execute(query, params);
    res.json({
      success: true,
      data: rows || []
    });
  } catch (error) {
    console.error('Error fetching map markers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete attraction (soft delete - archive)
export const deleteAttraction = async (req, res) => {
  try {
    const attractionId = req.params.id;
    // Allow clients to pass hardDelete either in the request body or as a query param
    let hardDelete = false;
    if (req.body && typeof req.body.hardDelete !== 'undefined') {
      hardDelete = req.body.hardDelete === true || req.body.hardDelete === 'true' || req.body.hardDelete === 1;
    } else if (typeof req.query.hardDelete !== 'undefined') {
      hardDelete = req.query.hardDelete === 'true' || req.query.hardDelete === '1';
    }

    if (hardDelete) {
      // Hard delete - remove completely
      const [result] = await execute('DELETE FROM attractions WHERE id = ?', [attractionId]);
      // Some DB drivers return affectedRows in result. Check and respond accordingly.
      const affected = result?.affectedRows ?? result?.affectedRows === 0 ? result.affectedRows : undefined;
      if (typeof affected !== 'undefined' && affected === 0) {
        return res.status(404).json({ success: false, message: 'Attraction not found' });
      }
      return res.json({ success: true, message: 'Attraction permanently deleted' });
    } else {
      // Soft delete - archive
      const [result] = await execute(
        'UPDATE attractions SET archived = 1, archived_at = NOW() WHERE id = ?',
        [attractionId]
      );
      const affected = result?.affectedRows ?? result?.affectedRows === 0 ? result.affectedRows : undefined;
      if (typeof affected !== 'undefined' && affected === 0) {
        return res.status(404).json({ success: false, message: 'Attraction not found' });
      }
      return res.json({ success: true, message: 'Attraction archived successfully' });
    }
  } catch (error) {
    console.error('Error deleting attraction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Restore archived attraction
export const restoreAttraction = async (req, res) => {
  try {
    const attractionId = req.params.id;
    const [result] = await execute(
      'UPDATE attractions SET archived = 0, archived_at = NULL WHERE id = ?',
      [attractionId]
    );
    const affected = result?.affectedRows ?? result?.affectedRows === 0 ? result.affectedRows : undefined;
    if (typeof affected !== 'undefined' && affected === 0) {
      return res.status(404).json({ success: false, message: 'Attraction not found' });
    }
    res.json({ success: true, message: 'Attraction restored successfully' });
  } catch (error) {
    console.error('Error restoring attraction:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
