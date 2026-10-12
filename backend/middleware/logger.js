import db from '../db.js';

const REDACT_KEYS = ['password', 'token', 'authorization', 'cookie', 'secret', 'access_token', 'refresh_token', 'csrf'];
const MAX_MESSAGE = 4000;
const MAX_META_STRING = 600;

const redact = (value, depth = 0) => {
  if (value === null || value === undefined || depth > 4) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (REDACT_KEYS.includes(key.toLowerCase())) {
        out[key] = '[REDACTED]';
      } else if (typeof val === 'string' && val.length > MAX_META_STRING) {
        out[key] = `${val.slice(0, MAX_META_STRING)}…`;
      } else {
        out[key] = redact(val, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === 'string' && value.length > MAX_META_STRING && depth > 0) {
    return `${value.slice(0, MAX_META_STRING)}…`;
  }
  return value;
};

// Write one entry to system_logs. Fire-and-forget: never throws, never blocks
// the request. Mirrors to console so local terminals still show output.
export const logEvent = ({ level = 'info', source = 'app', message = '', meta = null, userId = null, ip = null } = {}) => {
  const text = String(message ?? '').slice(0, MAX_MESSAGE);
  const metaJson = meta ? JSON.stringify(redact(meta)) : null;

  const prefix = `[${level.toUpperCase()}] [${source}]`;
  if (level === 'error') console.error(prefix, text);
  else if (level === 'warn') console.warn(prefix, text);
  else console.log(prefix, text);

  try {
    db.promise()
      .query('INSERT INTO system_logs (level, source, message, meta, user_id, ip) VALUES (?, ?, ?, ?, ?, ?)', [
        level,
        source,
        text,
        metaJson,
        userId,
        ip
      ])
      .catch(() => {
        // Table missing or DB down — logging must never break the app.
      });
  } catch {
    // Ignore entirely.
  }
};

// Log every API/auth request once the response finishes.
// Status >= 400 is promoted to warn/error so problems surface without filters.
export const requestLogger = (req, res, next) => {
  const started = Date.now();

  res.on('finish', () => {
    try {
      const path = (req.originalUrl || req.url || '').split('?')[0];
      if (!path.startsWith('/api') && !path.startsWith('/auth')) return;
      if (req.method === 'OPTIONS') return;
      // Do not log the log viewer itself — avoids self-referential noise.
      if (req.method === 'GET' && path.startsWith('/api/admin/logs')) return;

      const status = res.statusCode;
      let level = 'info';
      if (status >= 500) level = 'error';
      else if (status >= 400) level = 'warn';

      logEvent({
        level,
        source: 'http',
        message: `${req.method} ${path} → ${status} (${Date.now() - started}ms)`,
        meta: {
          method: req.method,
          path,
          query: Object.keys(req.query || {}).length ? req.query : undefined,
          status,
          duration_ms: Date.now() - started
        },
        userId: req.user?.user_id ?? null,
        ip: req.ip || req.socket?.remoteAddress || null
      });
    } catch {
      // Never let logging break the response path.
    }
  });

  next();
};

// Drop entries older than LOG_RETENTION_DAYS (default 30). Runs on boot and
// every 24h. Errors are silent — a missing table only means no cleanup yet.
export const startRetentionSweep = () => {
  const raw = Number.parseInt(process.env.LOG_RETENTION_DAYS, 10);
  const days = Number.isFinite(raw) && raw > 0 ? raw : 30;

  const run = async () => {
    try {
      await db.promise().query(`DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL ${days} DAY`);
    } catch {
      // Table may not exist yet (migration not run).
    }
  };

  run();
  const timer = setInterval(run, 24 * 60 * 60 * 1000);
  timer.unref?.();
  return timer;
};

export default { logEvent, requestLogger, startRetentionSweep };
