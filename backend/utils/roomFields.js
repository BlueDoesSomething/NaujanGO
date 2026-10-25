// Multipart form fields arrive as JSON strings; mysql2 may return either a JSON
// string (TEXT) or an already-decoded array (JSON). Never split JSON as CSV:
// doing so re-encodes it on each save and can overflow primary_image_url.
const normalizeList = (value, depth = 0) => {
  if (depth > 32) throw new Error('Room list is nested too deeply');
  if (value === null || value === undefined || value === '') return [];

  if (Array.isArray(value)) {
    // Recover legacy arrays whose JSON text was split on commas before storage.
    if (value.length && value.every(item => typeof item === 'string')) {
      const joined = value.join(',').trim();
      if (joined.startsWith('[') && joined.endsWith(']')) {
        try {
          const decoded = JSON.parse(joined);
          if (Array.isArray(decoded)) return normalizeList(decoded, depth + 1);
        } catch {
          // It may instead be an ordinary list containing a JSON-encoded item.
        }
      }
    }
    return value.flatMap(item => {
      if (Array.isArray(item)) return normalizeList(item, depth + 1);
      if (typeof item !== 'string') throw new Error('Room list items must be text');
      const trimmed = item.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
        try {
          const decoded = JSON.parse(trimmed);
          if (Array.isArray(decoded) || typeof decoded === 'string') {
            return normalizeList(decoded, depth + 1);
          }
        } catch {
          // Preserve ordinary text that merely starts with a bracket or quote.
        }
      }
      return [trimmed];
    });
  }

  if (typeof value !== 'string') throw new Error('Room list must be an array or text');
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
    return normalizeList(JSON.parse(trimmed), depth + 1);
  }
  return trimmed.split(',').map(item => item.trim()).filter(Boolean);
};

// Tolerate old, repeatedly encoded data on reads without changing the database.
export const parseRoomListColumn = (value) => {
  try {
    return normalizeList(value);
  } catch {
    return [];
  }
};

// Missing fields in a partial update are left untouched. An explicit empty list
// is serialized as '[]', so removing all amenities/features/images works too.
export const serializeRoomListInput = (value, field) => {
  if (value === undefined || value === null) return null;
  try {
    const list = normalizeList(value);
    if (field === 'image_urls' && list.some(url =>
      url.length > 500 || !/^(https?:\/\/|\/(?!\/))/i.test(url)
    )) {
      throw new Error('Invalid image URL');
    }
    return JSON.stringify(list);
  } catch {
    const error = new Error(field === 'image_urls'
      ? 'Room images must be HTTP(S) or site-relative URLs of at most 500 characters.'
      : `${field} must be a list of text values.`);
    error.status = 400;
    throw error;
  }
};
