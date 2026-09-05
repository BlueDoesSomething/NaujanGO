import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

const readSecret = (name, minimumLength = 32) => {
  const value = process.env[name]?.trim();

  if (isProduction && (!value || value.length < minimumLength)) {
    throw new Error(`${name} must be configured with at least ${minimumLength} characters in production`);
  }

  return value || crypto.randomBytes(minimumLength).toString('hex');
};

export const JWT_SECRET = readSecret('JWT_SECRET');
export const SESSION_SECRET = readSecret('SESSION_SECRET');