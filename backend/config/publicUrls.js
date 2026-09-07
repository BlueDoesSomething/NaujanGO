const isProduction = process.env.NODE_ENV === 'production';
const productionDefaults = {
  FRONTEND_URL: 'https://naujan-go.up.railway.app',
  BACKEND_PUBLIC_URL: 'https://backend-production-03ea.up.railway.app'
};

const readUrl = (name, developmentFallback, productionFallback = productionDefaults[name]) => {
  const raw = process.env[name]?.trim().replace(/\/$/, '');
  const value = raw || (isProduction ? productionFallback : developmentFallback);
  if (!value) return value;
  // Guarantee an absolute URL: a bare host (e.g. "naujan-go.up.railway.app") would
  // otherwise turn res.redirect() into a RELATIVE redirect, which the browser
  // resolves against the current URL and breaks OAuth/payment flows.
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

export const FRONTEND_URL = readUrl('FRONTEND_URL', 'https://localhost:4000');
export const BACKEND_PUBLIC_URL = readUrl('BACKEND_PUBLIC_URL', 'https://localhost:3000');
export const WEBHOOK_BASE_URL = readUrl('WEBHOOK_BASE_URL', BACKEND_PUBLIC_URL, BACKEND_PUBLIC_URL);
export const GOOGLE_CALLBACK_URL = readUrl(
  'GOOGLE_CALLBACK_URL',
  `${BACKEND_PUBLIC_URL}/auth/google/callback`,
  `${BACKEND_PUBLIC_URL}/auth/google/callback`
);
