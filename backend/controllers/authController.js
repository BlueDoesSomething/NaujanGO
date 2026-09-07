import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import db from '../db.js';
import passport from '../config/passport.js';
import { authenticateToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { buildFrontendUrl, sendAuthEmail } from '../services/authMailer.js';
import { findSecurityToken, invalidateSecurityTokens, issueSecurityToken, markSecurityTokenUsed } from '../services/securityTokens.js';
import { getUserColumns } from '../services/userSchema.js';
import { JWT_SECRET } from '../config/security.js';
import { FRONTEND_URL } from '../config/publicUrls.js';

const router = express.Router();

// Frontend and backend live on different *.up.railway.app subdomains (cross-site),
// so the auth cookie needs SameSite=None + Secure in production or browsers will
// never send it. In development keep 'lax' for the localhost flow.
const AUTH_COOKIE_SAME_SITE = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
const AUTH_COOKIE_SAME_SITE_LABEL = AUTH_COOKIE_SAME_SITE === 'none' ? 'None' : 'Lax';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    return cb(null, true);
  }
});

const isStrategyAvailable = (name) => {
  return typeof passport._strategy === 'function' ? !!passport._strategy(name) : false;
};

const PASSWORD_POLICY_MESSAGE = 'Password must be at least 12 characters long and include uppercase, lowercase, number, and symbol.';

// Helper function to create JWT token
const createToken = (user_id, email, role = 'user') => {
  return jwt.sign({ user_id, email, role }, JWT_SECRET, { expiresIn: '12h' });
};

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');
const normalizeEmail = (value) => cleanString(value).toLowerCase();
const normalizeIdentifier = (value) => cleanString(value).toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,30}$/;

const validatePassword = (password) => {
  return typeof password === 'string'
    && password.length >= 12
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
};

const buildRateLimitKey = (req, suffix) => `${req.ip}::${suffix || 'anonymous'}`;

const loginLimiter = createRateLimiter({
  name: 'auth-login',
  windowMs: 10 * 60 * 1000,
  maxRequests: 7,
  message: 'Too many login attempts. Please try again later.',
  errorCode: 'LOGIN_RATE_LIMITED',
  keyGenerator: (req) => buildRateLimitKey(req, normalizeIdentifier(req.body?.emailOrUsername))
});

const registerLimiter = createRateLimiter({
  name: 'auth-register',
  windowMs: 30 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many registration attempts. Please try again later.',
  errorCode: 'REGISTER_RATE_LIMITED',
  keyGenerator: (req) => buildRateLimitKey(req, normalizeEmail(req.body?.email) || normalizeIdentifier(req.body?.username))
});

const forgotPasswordLimiter = createRateLimiter({
  name: 'auth-forgot-password',
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many reset requests. Please try again later.',
  errorCode: 'RESET_RATE_LIMITED',
  keyGenerator: (req) => buildRateLimitKey(req, normalizeIdentifier(req.body?.emailOrUsername))
});

const verificationLimiter = createRateLimiter({
  name: 'auth-verify-email',
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many verification attempts. Please try again later.',
  errorCode: 'VERIFY_RATE_LIMITED',
  keyGenerator: (req) => buildRateLimitKey(req, crypto.createHash('sha1').update(cleanString(req.body?.token) || 'empty').digest('hex'))
});

const resendVerificationLimiter = createRateLimiter({
  name: 'auth-resend-verification',
  windowMs: 15 * 60 * 1000,
  maxRequests: 4,
  message: 'Too many verification email requests. Please try again later.',
  errorCode: 'RESEND_RATE_LIMITED',
  keyGenerator: (req) => buildRateLimitKey(req, normalizeIdentifier(req.body?.emailOrUsername))
});

const resetPasswordLimiter = createRateLimiter({
  name: 'auth-reset-password',
  windowMs: 15 * 60 * 1000,
  maxRequests: 6,
  message: 'Too many password reset attempts. Please try again later.',
  errorCode: 'PASSWORD_RESET_RATE_LIMITED',
  keyGenerator: (req) => buildRateLimitKey(req, crypto.createHash('sha1').update(cleanString(req.body?.token) || 'empty').digest('hex'))
});

const maybeIncludeDevLink = (key, value) => {
  if (process.env.NODE_ENV === 'production' || !value) {
    return {};
  }

  return { [key]: value };
};

const sendVerificationEmail = async ({ email, username, token }) => {
  const verificationUrl = buildFrontendUrl('/verify-email', { token });
  const subject = 'Verify your account';
  const text = `Hi ${username},\n\nVerify your account using this link:\n${verificationUrl}\n\nThis link expires in 30 minutes.`;
  const html = `<p>Hi ${username},</p><p>Verify your account using this link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>This link expires in 30 minutes.</p>`;
  const delivery = await sendAuthEmail({ to: email, subject, text, html });

  if (!delivery.delivered) {
    console.info(`Verification email fallback for ${email}: ${verificationUrl}`);
  }

  return { delivery, verificationUrl };
};

const sendPasswordResetEmail = async ({ email, username, token }) => {
  const resetUrl = buildFrontendUrl('/reset-password', { token });
  const subject = 'Reset your password';
  const text = `Hi ${username},\n\nReset your password using this link:\n${resetUrl}\n\nThis link expires in 30 minutes.`;
  const html = `<p>Hi ${username},</p><p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 30 minutes.</p>`;
  const delivery = await sendAuthEmail({ to: email, subject, text, html });

  if (!delivery.delivered) {
    console.info(`Password reset email fallback for ${email}: ${resetUrl}`);
  }

  return { delivery, resetUrl };
};

const mapUserRow = (row) => ({
  user_id: row.user_id,
  username: row.username,
  email: row.email,
  role: row.role || 'user',
  email_verified: row.email_verified === undefined ? true : Boolean(row.email_verified),
  preferred_language: row.preferred_language || row.language_preference || 'en',
  first_name: row.first_name,
  last_name: row.last_name,
  phone: row.phone ?? row.phone_number ?? null,
  // Serialize date_of_birth using LOCAL time parts so timezone offset never shifts the stored date
  date_of_birth: (() => {
    if (!row.date_of_birth) return null;
    if (row.date_of_birth instanceof Date) {
      const y = row.date_of_birth.getFullYear();
      const m = String(row.date_of_birth.getMonth() + 1).padStart(2, '0');
      const d = String(row.date_of_birth.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    // Already a string — strip any time portion
    return String(row.date_of_birth).split('T')[0].split(' ')[0];
  })(),
  // Normalize profile_picture: strip any absolute origin so it becomes a relative path
  // e.g. "https://localhost:3000/uploads/profiles/x.jpg" → "/uploads/profiles/x.jpg"
  profile_picture: row.profile_picture
    ? row.profile_picture.replace(/^https?:\/\/[^/]+(?=\/uploads\/)/, '')
    : null
});

// Google OAuth Routes
router.get('/google', (req, res, next) => {
  if (!isStrategyAvailable('google')) {
    return res.status(501).json({ error: 'Google OAuth is not configured' });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!isStrategyAvailable('google')) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
  }
  return passport.authenticate('google', { session: false })(req, res, next);
}, async (req, res) => {
  try {
    const user = req.user;
    const token = createToken(user.user_id, user.email, user.role || 'user');
    
    // Set HttpOnly cookie (matches the pattern used by /oauth-login)
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: AUTH_COOKIE_SAME_SITE,
      maxAge: 12 * 60 * 60 * 1000,
      path: '/'
    });
    
    // The browser already has the HttpOnly cookie; keep bearer tokens out of URLs and history.
    const redirectUrl = `${FRONTEND_URL}/oauth-callback?provider=google`;
    res.set('Cache-Control', 'no-store');
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
  }
});

// OAuth login endpoint (used by frontend to exchange token)
router.post('/oauth-login', async (req, res) => {
  const { token, provider } = req.body;

  if (!token || !provider) {
    return res.status(400).json({ error: 'Token and provider are required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { lang } = await getUserColumns();
    const selectLang = lang ? `${lang} AS preferred_language` : `'en' AS preferred_language`;

    const [rows] = await db.promise().query(
      `SELECT user_id, username, email, ${selectLang} FROM users WHERE user_id = ?`,
      [decoded.user_id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Set HttpOnly cookie for OAuth
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: AUTH_COOKIE_SAME_SITE,
      maxAge: 12 * 60 * 60 * 1000,
      path: '/'
      // NOTE: Don't set domain - let Express use the request's current domain
    });
    
    res.json({ user: mapUserRow(rows[0]), provider, message: 'OAuth login successful' });
  } catch (err) {
    console.error('OAuth login error:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Register endpoint - MODIFIED to send code first
router.post('/register-send-code', registerLimiter, async (req, res) => {
  const { username, email, password, preferred_language, first_name, last_name, phone, date_of_birth, gender, user_type } = req.body;

  const normalizedUsername = cleanString(username);
  const normalizedEmail = normalizeEmail(email);
  const normalizedFirstName = cleanString(first_name);
  const normalizedLastName = cleanString(last_name);
  const normalizedPhone = cleanString(phone);

  if (!normalizedUsername || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (!usernameRegex.test(normalizedUsername)) {
    return res.status(400).json({ error: 'Username must be 3-30 characters and may only include letters, numbers, dots, underscores, and hyphens.' });
  }

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE, code: 'WEAK_PASSWORD' });
  }

  try {
    // Check if user already exists by email
    const [existingEmail] = await db.promise().query('SELECT user_id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const [existingUsername] = await db.promise().query('SELECT user_id FROM users WHERE username = ?', [normalizedUsername]);
    if (existingUsername.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Generate verification code (6 digits)
    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    
    // Store in cache/temp storage with expiration (10 minutes)
    const tempData = {
      username: normalizedUsername,
      email: normalizedEmail,
      password_hash: passwordHash,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      phone: normalizedPhone,
      date_of_birth,
      gender: gender || 'prefer_not_to_say',
      user_type: user_type || 'foreigner',
      preferred_language: preferred_language || 'en',
      code: verificationCode,
      expiresAt: Date.now() + (10 * 60 * 1000)
    };

    // Store in Redis or memory cache (using process.env.TEMP_REGISTRATIONS)
    if (!global.tempRegistrations) {
      global.tempRegistrations = {};
    }
    global.tempRegistrations[normalizedEmail] = tempData;

    // Send verification code email
    const subject = 'Your NaujangGO Verification Code';
    const text = `Hello ${normalizedUsername},\n\nYour verification code is: ${verificationCode}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`;
    const html = `<p>Hello ${normalizedUsername},</p><p>Your verification code is:</p><h2 style="letter-spacing: 0.2em; font-size: 2em;">${verificationCode}</h2><p>This code expires in 10 minutes.</p><p>Do not share this code with anyone.</p>`;
    
    const delivery = await sendAuthEmail({ to: normalizedEmail, subject, text, html });

    if (!delivery.delivered) {
      console.error(`[REGISTRATION] Failed to send verification email to ${normalizedEmail}:`, delivery);
      return res.status(503).json({
        error: 'Verification email service is temporarily unavailable. Please try again later.',
        code: 'EMAIL_DELIVERY_UNAVAILABLE'
      });
    }

    console.log(`[REGISTRATION] Sent verification code to ${normalizedEmail}. Message ID: ${delivery.messageId}`);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email. Please enter it to continue with registration.',
      ...maybeIncludeDevLink('devVerificationCode', verificationCode)
    });
  } catch (err) {
    console.error('Register send code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify code and create account
router.post('/register-verify-code', verificationLimiter, async (req, res) => {
  const { username, email, code } = req.body;

  const normalizedUsername = cleanString(username);
  const normalizedEmail = normalizeEmail(email);
  const verificationCode = cleanString(code);

  if (!normalizedUsername || !normalizedEmail || !verificationCode) {
    return res.status(400).json({ error: 'Username, email, and verification code are required' });
  }

  try {
    // Retrieve temp registration data
    if (!global.tempRegistrations || !global.tempRegistrations[normalizedEmail]) {
      return res.status(400).json({ error: 'Registration session not found. Please try again.' });
    }

    const tempData = global.tempRegistrations[normalizedEmail];

    // Check expiration
    if (Date.now() > tempData.expiresAt) {
      delete global.tempRegistrations[normalizedEmail];
      return res.status(400).json({ error: 'Verification code expired. Please register again.' });
    }

    // Verify code
    if (tempData.code !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Verify username and email match
    if (tempData.username !== normalizedUsername || tempData.email !== normalizedEmail) {
      return res.status(400).json({ error: 'Registration data mismatch' });
    }

    // Insert new user
    const { lang, phone: phoneCol, emailVerified, emailVerifiedAt } = await getUserColumns();
    const columns = ['username', 'email', 'password_hash', 'first_name', 'last_name', 'date_of_birth', 'gender', 'user_type'];
    const values = [tempData.username, tempData.email, tempData.password_hash, tempData.first_name || null, tempData.last_name || null, tempData.date_of_birth || null, tempData.gender || 'prefer_not_to_say', tempData.user_type || 'foreigner'];

    if (phoneCol) {
      columns.push(phoneCol);
      values.push(tempData.phone || null);
    }

    if (lang) {
      columns.push(lang);
      values.push(tempData.preferred_language || 'en');
    }

    if (emailVerified) {
      columns.push('email_verified');
      values.push(1); // Mark as verified since they verified the code
    }

    if (emailVerifiedAt) {
      columns.push('email_verified_at');
      values.push(new Date());
    }

    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`;
    const [result] = await db.promise().query(insertSql, values);

    // Clean up temp data
    delete global.tempRegistrations[normalizedEmail];

    res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      user: {
        user_id: result.insertId,
        username: tempData.username,
        email: tempData.email,
        email_verified: true
      }
    });
  } catch (err) {
    console.error('Register verify code error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend verification code
router.post('/register-resend-code', verificationLimiter, async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if registration session exists
    if (!global.tempRegistrations || !global.tempRegistrations[normalizedEmail]) {
      return res.status(400).json({ error: 'No pending registration found for this email. Please register again.' });
    }

    const tempData = global.tempRegistrations[normalizedEmail];

    // Check if code is expired
    if (Date.now() > tempData.expiresAt) {
      delete global.tempRegistrations[normalizedEmail];
      return res.status(400).json({ error: 'Registration session expired. Please register again.' });
    }

    // Generate new verification code
    const newVerificationCode = crypto.randomInt(100000, 1000000).toString();
    
    // Update temp data with new code and new expiration
    tempData.code = newVerificationCode;
    tempData.expiresAt = Date.now() + (10 * 60 * 1000); // Reset to 10 minutes from now

    // Send new verification code email
    const subject = 'Your NaujangGO Verification Code (Resent)';
    const text = `Hello ${tempData.username},\n\nYour new verification code is: ${newVerificationCode}\n\nThis code expires in 10 minutes.\n\nDo not share this code with anyone.`;
    const html = `<p>Hello ${tempData.username},</p><p>Your new verification code is:</p><h2 style="letter-spacing: 0.2em; font-size: 2em;">${newVerificationCode}</h2><p>This code expires in 10 minutes.</p><p>Do not share this code with anyone.</p>`;
    
    const delivery = await sendAuthEmail({ to: normalizedEmail, subject, text, html });

    if (!delivery.delivered) {
      console.error(`[REGISTRATION] Failed to send verification email to ${normalizedEmail}:`, delivery);
      return res.status(503).json({
        error: 'Verification email service is temporarily unavailable. Please try again later.',
        code: 'EMAIL_DELIVERY_UNAVAILABLE'
      });
    }

    console.log(`[REGISTRATION] Resent verification code to ${normalizedEmail}. Message ID: ${delivery.messageId}`);

    res.status(200).json({
      success: true,
      message: 'Verification code resent to your email. Please check your inbox and spam folder.',
      ...maybeIncludeDevLink('devVerificationCode', newVerificationCode)
    });
  } catch (err) {
    console.error('Resend verification code error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Original register endpoint (kept for backward compatibility)
router.post('/register', registerLimiter, async (req, res) => {
  return res.status(410).json({
    error: 'This registration endpoint has been retired. Start registration with email verification.',
    code: 'REGISTRATION_REQUIRES_EMAIL_VERIFICATION'
  });

  const { username, email, password, preferred_language, first_name, last_name, phone, date_of_birth } = req.body;

  const normalizedUsername = cleanString(username);
  const normalizedEmail = normalizeEmail(email);
  const normalizedFirstName = cleanString(first_name);
  const normalizedLastName = cleanString(last_name);
  const normalizedPhone = cleanString(phone);

  if (!normalizedUsername || !normalizedEmail || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  if (!usernameRegex.test(normalizedUsername)) {
    return res.status(400).json({ error: 'Username must be 3-30 characters and may only include letters, numbers, dots, underscores, and hyphens.' });
  }

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE, code: 'WEAK_PASSWORD' });
  }

  try {
    // Check if user already exists by email
    const [existingEmail] = await db.promise().query('SELECT user_id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const [existingUsername] = await db.promise().query('SELECT user_id FROM users WHERE username = ?', [normalizedUsername]);
    if (existingUsername.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new user using whichever columns exist in the current DB schema
    const { lang, phone: phoneCol, emailVerified, emailVerifiedAt } = await getUserColumns();
    const columns = ['username', 'email', 'password_hash', 'first_name', 'last_name', 'date_of_birth'];
    const values = [normalizedUsername, normalizedEmail, password_hash, normalizedFirstName || null, normalizedLastName || null, date_of_birth || null];

    if (phoneCol) {
      columns.push(phoneCol);
      values.push(normalizedPhone || null);
    }

    if (lang) {
      columns.push(lang);
      values.push(preferred_language || 'en');
    }

    if (emailVerified) {
      columns.push('email_verified');
      values.push(0);
    }

    if (emailVerifiedAt) {
      columns.push('email_verified_at');
      values.push(null);
    }

    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders})`;
    const [result] = await db.promise().query(insertSql, values);

    const user_id = result.insertId;

    res.status(201).json({
      success: true,
      requiresVerification: false,
      message: 'Registration successful. You can now log in.',
      user: {
        user_id,
        username: normalizedUsername,
        email: normalizedEmail,
        role: 'user',
        preferred_language: preferred_language || 'en',
        first_name: normalizedFirstName || '',
        last_name: normalizedLastName || '',
        phone: normalizedPhone || null,
        date_of_birth: date_of_birth || null,
        email_verified: false
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email or username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify-email', verificationLimiter, async (req, res) => {
  const token = cleanString(req.body?.token);

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const tokenRecord = await findSecurityToken({ token, tokenType: 'email_verification' });

    if (!tokenRecord || tokenRecord.used_at) {
      return res.status(400).json({ error: 'This verification link is invalid or has already been used.' });
    }

    if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'This verification link has expired. Please request a new one.' });
    }

    const columns = await getUserColumns();
    const updates = [];
    const values = [];

    if (columns.emailVerified) {
      updates.push('email_verified = 1');
    }

    if (columns.emailVerifiedAt) {
      updates.push('email_verified_at = NOW()');
    }

    if (updates.length > 0) {
      await db.promise().query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        [tokenRecord.user_id]
      );
    }

    await markSecurityTokenUsed(tokenRecord.id);
    return res.json({ success: true, message: 'Your email has been verified. You can now log in.' });
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/resend-verification', resendVerificationLimiter, async (req, res) => {
  const identifier = normalizeIdentifier(req.body?.emailOrUsername);
  const genericResponse = {
    success: true,
    message: 'If the account exists and still needs verification, a new email has been sent.'
  };

  if (!identifier) {
    return res.status(400).json({ error: 'Email or username is required.' });
  }

  try {
    const columns = await getUserColumns();
    const selectVerified = columns.emailVerified ? 'email_verified' : '1 AS email_verified';
    const [rows] = await db.promise().query(
      `SELECT user_id, username, email, ${selectVerified}
       FROM users
       WHERE LOWER(email) = ? OR LOWER(username) = ?
       LIMIT 1`,
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = rows[0];
    if (user.email_verified) {
      return res.json({ success: true, message: 'This account is already verified.' });
    }

    return res.json({
      success: true,
      message: 'A verification code has been sent to your email.'
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  const identifier = normalizeIdentifier(req.body?.emailOrUsername);
  const genericResponse = {
    success: true,
    message: 'If the account exists, a password reset link has been sent.'
  };

  if (!identifier) {
    return res.status(400).json({ error: 'Email or username is required.' });
  }

  try {
    const [rows] = await db.promise().query(
      `SELECT user_id, username, email
       FROM users
       WHERE LOWER(email) = ? OR LOWER(username) = ?
       LIMIT 1`,
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = rows[0];
    const { token } = await issueSecurityToken({
      userId: user.user_id,
      tokenType: 'password_reset',
      expiresInMinutes: 30
    });
    const { resetUrl } = await sendPasswordResetEmail({
      email: user.email,
      username: user.username,
      token
    });

    return res.json({
      ...genericResponse,
      ...maybeIncludeDevLink('devResetUrl', resetUrl)
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  const token = cleanString(req.body?.token);
  const password = req.body?.password;

  if (!token || !password) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE, code: 'WEAK_PASSWORD' });
  }

  try {
    const tokenRecord = await findSecurityToken({ token, tokenType: 'password_reset' });

    if (!tokenRecord || tokenRecord.used_at) {
      return res.status(400).json({ error: 'This reset link is invalid or has already been used.' });
    }

    if (new Date(tokenRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    const columns = await getUserColumns();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const updates = ['password_hash = ?'];
    const values = [passwordHash];

    if (columns.passwordChangedAt) {
      updates.push('password_changed_at = NOW()');
    }

    values.push(tokenRecord.user_id);

    await db.promise().query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    await invalidateSecurityTokens(tokenRecord.user_id, 'password_reset');
    await markSecurityTokenUsed(tokenRecord.id);

    return res.json({ success: true, message: 'Your password has been reset. Please log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', loginLimiter, async (req, res) => {
  const { emailOrUsername, password } = req.body;
  const identifier = normalizeIdentifier(emailOrUsername);

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username and password are required' });
  }

  try {
    const { lang, phone: phoneCol, emailVerified, archived } = await getUserColumns();
    const selectLang = lang ? `${lang} AS preferred_language` : `'en' AS preferred_language`;
    const selectPhone = phoneCol ? `${phoneCol} AS phone` : 'NULL AS phone';
    const selectEmailVerified = emailVerified ? 'email_verified' : '1 AS email_verified';
    const selectArchived = archived ? 'archived' : '0 AS archived';

    // Find user by email or username
    const [rows] = await db.promise().query(
      `SELECT 
        user_id, 
        username, 
        email, 
        password_hash, 
        role,
        ${selectArchived},
        ${selectEmailVerified},
        ${selectLang}, 
        first_name, 
        last_name, 
        ${selectPhone}, 
        date_of_birth, 
        profile_picture 
      FROM users 
      WHERE LOWER(email) = ? OR LOWER(username) = ?`,
      [identifier, identifier]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email address before logging in.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Create JWT
    const token = createToken(user.user_id, user.email, user.role || 'user');

    // Set HttpOnly cookie (secure against XSS/DevTools access)
    res.cookie('auth_token', token, {
      httpOnly: true,  // Inaccessible to JavaScript/DevTools
      secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
      sameSite: AUTH_COOKIE_SAME_SITE,  // Changed from 'strict' to 'lax' - allows cross-site cookie in redirects
      maxAge: 12 * 60 * 60 * 1000,  // 12 hours
      path: '/'
      // NOTE: Don't set domain - let Express use the request's current domain
    });

    // Do NOT send token in response (prevents exposure)
    res.json({ 
      user: mapUserRow(user),
      message: 'Login successful'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  console.log('[Auth] Logout POST received - clearing auth_token cookie');
  console.log('[Auth] Current cookies:', Object.keys(req.cookies));
  
  // Use the built-in clearCookie method with EXACT same options as when cookie was set
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // Match login endpoint
    sameSite: AUTH_COOKIE_SAME_SITE,  // Match login endpoint
    path: '/'  // Match login endpoint
  });
  
  // Force browser to overwrite with expired cookie as backup
  res.setHeader('Set-Cookie', `auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC; HttpOnly; SameSite=${AUTH_COOKIE_SAME_SITE_LABEL}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  
  console.log('[Auth] Cookie cleared - Set-Cookie headers:', res.getHeaders()['set-cookie']);
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get user profile endpoint
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const { lang, phone: phoneCol, emailVerified } = await getUserColumns();
    const selectLang = lang ? `${lang} AS preferred_language` : `'en' AS preferred_language`;
    const selectPhone = phoneCol ? `${phoneCol} AS phone` : 'NULL AS phone';
    const selectEmailVerified = emailVerified ? 'email_verified' : '1 AS email_verified';

    const [rows] = await db.promise().query(
      `SELECT 
        user_id, 
        username, 
        email,
        role,
        ${selectEmailVerified},
        first_name, 
        last_name, 
        ${selectPhone}, 
        date_of_birth, 
        profile_picture, 
        ${selectLang} 
      FROM users 
      WHERE user_id = ?`,
      [user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: mapUserRow(rows[0]) });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  // Return a relative path so it works from any origin (localhost, LAN IP, etc.)
  // The frontend proxies /uploads → backend so the image loads correctly everywhere
  const url = `/uploads/profiles/${req.file.filename}`;
  res.json({ url });
});

// Profile update endpoint
router.put('/profile', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, phone, date_of_birth, profile_picture, gender, user_type } = req.body;

  try {
    const user_id = req.user.user_id;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const { lang, phone: phoneCol, emailVerified } = await getUserColumns();

    const setClauses = ['first_name = ?', 'last_name = ?', 'email = ?', 'date_of_birth = ?', 'profile_picture = ?', 'gender = ?', 'user_type = ?'];
    const params = [cleanString(first_name) || null, cleanString(last_name) || null, normalizedEmail, date_of_birth || null, profile_picture || null, gender || 'prefer_not_to_say', user_type || 'foreigner'];

    if (phoneCol) {
      setClauses.push(`${phoneCol} = ?`);
      params.push(cleanString(phone) || null);
    }

    const updateSql = `UPDATE users SET ${setClauses.join(', ')} WHERE user_id = ?`;
    params.push(user_id);

    await db.promise().query(updateSql, params);

    const [rows] = await db.promise().query(
      `SELECT 
        user_id, 
        username, 
        email, 
        ${emailVerified ? 'email_verified,' : '1 AS email_verified,'}
        first_name, 
        last_name, 
        ${phoneCol ? `${phoneCol} AS phone` : 'NULL AS phone'}, 
        date_of_birth,
        gender,
        user_type, 
        profile_picture, 
        ${lang ? `${lang} AS preferred_language` : `'en' AS preferred_language`} 
      FROM users 
      WHERE user_id = ?`,
      [user_id]
    );

    res.json({ user: mapUserRow(rows[0]) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test SMTP Configuration (for debugging email issues)
router.get('/test-smtp', authenticateToken, async (req, res) => {
  try {
    // In production, restrict to admins only. In development, allow all.
    if (process.env.NODE_ENV === 'production' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const smtpConfig = {
      host: process.env.SMTP_HOST || 'not configured',
      port: process.env.SMTP_PORT || 'not configured',
      user: process.env.SMTP_USER ? '***' + process.env.SMTP_USER.slice(-10) : 'not configured',
      mailFrom: process.env.MAIL_FROM || 'not configured'
    };

    // Try to verify SMTP connection
    let smtpConnectionStatus = 'unknown';
    let smtpError = null;
    
    try {
      const testTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      
      await testTransporter.verify();
      smtpConnectionStatus = 'connected';
    } catch (err) {
      smtpConnectionStatus = 'failed';
      smtpError = err.message;
      console.error('[SMTP TEST] Connection failed:', err.message);
    }

    res.json({
      status: 'ok',
      smtpConfig,
      smtpConnectionStatus,
      smtpError,
      nodeEnv: process.env.NODE_ENV || 'development',
      frontendUrl: FRONTEND_URL,
      tip: smtpConnectionStatus === 'failed' ? 'Check SMTP credentials in .env file. For Gmail, use an App Password, not your regular password.' : null
    });
  } catch (err) {
    console.error('SMTP test error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
