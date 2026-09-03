import jwt from 'jsonwebtoken';
import db from '../db.js';
import { getUserColumns } from '../services/userSchema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Middleware to verify JWT token and extract user
export const authenticateToken = async (req, res, next) => {
  // Check for token in HttpOnly cookie FIRST (more secure)
  let token = req.cookies?.auth_token;
  
  // Fall back to Authorization header for backwards compatibility
  if (!token) {
    const authHeader = req.headers.authorization;
    token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const columns = await getUserColumns();
    const selectArchived = columns.archived ? 'archived' : '0 AS archived';
    const selectVerified = columns.emailVerified ? 'email_verified' : '1 AS email_verified';
    const selectPasswordChangedAt = columns.passwordChangedAt ? 'password_changed_at' : 'NULL AS password_changed_at';

    const [rows] = await db.promise().query(
      `SELECT user_id, email, role, ${selectArchived}, ${selectVerified}, ${selectPasswordChangedAt}
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [decoded.user_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = rows[0];

    if (user.archived) {
      return res.status(403).json({ error: 'Account has been archived. Please contact support.' });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email address before continuing.', code: 'EMAIL_NOT_VERIFIED' });
    }

    if (user.password_changed_at && decoded.iat) {
      const changedAtSeconds = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
      if (changedAtSeconds > decoded.iat) {
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
      }
    }

    req.user = {
      ...decoded,
      email: user.email,
      role: user.role || decoded.role,
      email_verified: Boolean(user.email_verified)
    };

    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user has required role
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Middleware to check if user is admin
export const requireAdmin = requireRole('admin');

// Middleware to check if user is owner or admin
export const requireOwnerOrAdmin = requireRole('owner', 'admin');

// Middleware to check if user is authenticated (any role)
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
