export default function detectLanguage(req, res, next) {
  // Priority: query param `?lang=`, then `x-language` header, then Accept-Language, else 'en'
  const q = (req.query && req.query.lang) ? String(req.query.lang).split(',')[0].trim().toLowerCase() : null;
  const headerLang = req.headers['x-language'] || req.headers['x-lang'];
  const accept = req.headers['accept-language'];
  let lang = q || (headerLang ? String(headerLang).split(',')[0].trim().toLowerCase() : null) || null;
  if (!lang && accept) {
    // parse Accept-Language like: en-US,en;q=0.9,tl;q=0.8
    const parts = String(accept).split(',').map(p => p.split(';')[0].trim());
    if (parts && parts.length > 0) lang = parts[0].split('-')[0].toLowerCase();
  }
  if (!lang) lang = 'en';
  req.language = lang;
  next();
}
