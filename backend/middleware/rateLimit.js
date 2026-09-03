const stores = new Map();

const getStore = (name) => {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }

  return stores.get(name);
};

const pruneEntries = (store, now, windowMs) => {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now - windowMs) {
      store.delete(key);
    }
  }
};

export const createRateLimiter = ({
  name,
  windowMs,
  maxRequests,
  message,
  errorCode,
  keyGenerator
}) => {
  const store = getStore(name);

  return (req, res, next) => {
    const now = Date.now();
    pruneEntries(store, now, windowMs);

    const key = keyGenerator(req);
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    store.set(key, current);

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: message,
        code: errorCode || 'RATE_LIMITED',
        retryAfter: retryAfterSeconds
      });
    }

    return next();
  };
};
