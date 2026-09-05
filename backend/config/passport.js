import passport from 'passport';
import LocalStrategy from 'passport-local';
import GoogleStrategy from 'passport-google-oauth20';
import JWTStrategy from 'passport-jwt';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { JWT_SECRET } from './security.js';
const extractJwt = JWTStrategy.ExtractJwt;

// Detect column names to handle preferred_language vs language_preference and phone vs phone_number
let userColumnCache = null;
const getUserColumns = async () => {
  if (userColumnCache) return userColumnCache;
  const targetColumns = ['preferred_language', 'language_preference', 'phone', 'phone_number'];
  const [rows] = await db.promise().query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'users'
       AND column_name IN (?, ?, ?, ?)`,
    targetColumns
  );

  const present = new Set(rows.map((r) => r.COLUMN_NAME));
  userColumnCache = {
    lang: present.has('preferred_language') ? 'preferred_language' : present.has('language_preference') ? 'language_preference' : null,
    phone: present.has('phone') ? 'phone' : present.has('phone_number') ? 'phone_number' : null
  };
  return userColumnCache;
};

// Helper function to find or create user from OAuth provider
const findOrCreateOAuthUser = async (provider, profile) => {
  try {
    const { lang } = await getUserColumns();
    const selectLang = lang ? `${lang} AS preferred_language` : `'en' AS preferred_language`;
    
    // Check if user already exists
    const [existingUser] = await db.promise().query(
      `SELECT user_id, email, username, role, ${selectLang}, first_name, last_name, profile_picture FROM users WHERE email = ?`,
      [profile.emails?.[0]?.value]
    );

    if (existingUser.length > 0) {
      return {
        user_id: existingUser[0].user_id,
        username: existingUser[0].username,
        email: existingUser[0].email,
        role: existingUser[0].role || 'user',
        preferred_language: existingUser[0].preferred_language || 'en',
        first_name: existingUser[0].first_name,
        last_name: existingUser[0].last_name,
        profile_picture: existingUser[0].profile_picture
      };
    }

    // Create new user
    const username = profile.displayName?.replace(/\s+/g, '_') || `${provider}_${Date.now()}`;
    const email = profile.emails?.[0]?.value || `${provider}_${Date.now()}@example.com`;
    const profilePicture = profile.photos?.[0]?.value || null;
    const [firstName = '', lastName = ''] = (profile.displayName || '').split(' ');

    const columns = ['username', 'email', 'profile_picture', 'password_hash', 'first_name', 'last_name'];
    const values = [username, email, profilePicture, 'oauth_no_password', firstName || username, lastName || username];

    if (lang) {
      columns.splice(3, 0, lang); // insert language column after email/profile_picture
      values.splice(3, 0, 'en');
    }

    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`;
    const [result] = await db.promise().query(insertSql, values);

    return {
      user_id: result.insertId,
      username,
      email,
      role: 'user',
      preferred_language: 'en',
      first_name: firstName || username,
      last_name: lastName || username,
      profile_picture: profilePicture
    };
  } catch (err) {
    console.error('Error in findOrCreateOAuthUser:', err);
    throw err;
  }
};

// Local Strategy for username/password authentication
passport.use(
  'local',
  new LocalStrategy.Strategy(
    {
      usernameField: 'emailOrUsername',
      passwordField: 'password'
    },
    async (emailOrUsername, password, done) => {
      try {
        const { lang } = await getUserColumns();
        const selectLang = lang ? `${lang} AS preferred_language` : `'en' AS preferred_language`;

        const [rows] = await db.promise().query(
          `SELECT user_id, username, email, password_hash, ${selectLang} FROM users WHERE email = ? OR username = ?`,
          [emailOrUsername, emailOrUsername]
        );
        
        if (rows.length === 0) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Google Strategy - Only configure if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Determine callback URL: use GOOGLE_CALLBACK_HOST if set, otherwise localhost.
  // Match the backend's actual protocol so the browser does not block the redirect.
  const callbackHost = process.env.GOOGLE_CALLBACK_HOST?.trim() || 'localhost';
  const protocol = process.env.USE_HTTPS === 'true' ? 'https' : 'http';
  const googleCallbackUrl = `${protocol}://${callbackHost}:3000/auth/google/callback`;
  
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || googleCallbackUrl
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser('google', profile);
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// JWT Strategy for verifying tokens
passport.use(
  'jwt',
  new JWTStrategy.Strategy(
    {
      jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET
    },
    async (payload, done) => {
      try {
        const [rows] = await db.promise().query(
          'SELECT user_id, username, email FROM users WHERE user_id = ?',
          [payload.user_id]
        );
        if (rows.length > 0) {
          return done(null, rows[0]);
        }
        return done(null, false);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

// Deserialize user
passport.deserializeUser((user_id, done) => {
  getUserColumns()
    .then(({ lang }) => {
      const selectLang = lang ? `${lang} AS preferred_language` : `'en' AS preferred_language`;
      return db.promise().query(
        `SELECT user_id, username, email, profile_picture, ${selectLang} FROM users WHERE user_id = ?`,
        [user_id]
      );
    })
    .then(([rows]) => {
      if (rows.length > 0) {
        done(null, rows[0]);
      } else {
        done(null, false);
      }
    })
    .catch((err) => done(err));
});

export default passport;
