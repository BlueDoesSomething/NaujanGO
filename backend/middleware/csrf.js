import crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const constantTimeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
};

export const csrfProtection = (req, res, next) => {
  let token = req.cookies?.[CSRF_COOKIE];

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
      path: '/'
    });
  }

  if (SAFE_METHODS.has(req.method) || !req.cookies?.auth_token) {
    return next();
  }

  const headerToken = req.get('x-csrf-token');
  if (!constantTimeEqual(token, headerToken)) {
    return res.status(403).json({ error: 'Invalid CSRF token', code: 'CSRF_VALIDATION_FAILED' });
  }

  return next();
};