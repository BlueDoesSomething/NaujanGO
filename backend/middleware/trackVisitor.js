import db from '../db.js';

/**
 * Middleware to track visitor visits
 * Increments visit_count and updates last_visited_at for authenticated users
 */
export const trackVisitorCount = async (req, res, next) => {
  try {
    // Only track authenticated users
    if (req.user && req.user.user_id) {
      const userId = req.user.user_id;
      
      // Increment visit_count and update last_visited_at
      await db.promise().query(
        `UPDATE users 
         SET visit_count = visit_count + 1, 
             last_visited_at = NOW() 
         WHERE user_id = ?`,
        [userId]
      );
    }
  } catch (error) {
    console.error('Error tracking visitor count:', error);
    // Don't fail the request if tracking fails
  }
  
  next();
};

export default trackVisitorCount;
