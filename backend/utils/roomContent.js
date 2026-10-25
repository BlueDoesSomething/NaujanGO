// Optional, owner-authored room content. Never seed guest-facing promises.
const definitions = {
  perfect_for: {
    title: 'Perfect For', maxItems: 4,
    fields: { label: { max: 80, required: true }, detail: { max: 160 } }
  },
  common_questions: {
    title: 'Common Questions', maxItems: 10,
    fields: { question: { max: 200, required: true }, answer: { max: 1000, required: true } }
  }
};

const decode = value => typeof value === 'string' ? JSON.parse(value) : value;

const normalizeItem = (item, definition) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`${definition.title} entries must be objects.`);
  }
  return Object.fromEntries(Object.entries(definition.fields).map(([key, rule]) => {
    const value = item[key] === undefined && !rule.required ? '' : item[key];
    if (typeof value !== 'string' || (rule.required && !value.trim())) {
      throw new Error(`${definition.title}: each entry requires ${key}.`);
    }
    const text = value.trim();
    if (text.length > rule.max) {
      throw new Error(`${definition.title}: ${key} must be at most ${rule.max} characters.`);
    }
    return [key, text];
  }));
};

// Reads tolerate missing/corrupt data and omit incomplete entries, rather than
// inventing answers or exposing malformed JSON to guests.
export const parseRoomContentColumn = (value, field) => {
  const definition = definitions[field];
  if (!definition) return [];
  try {
    const items = decode(value);
    if (!Array.isArray(items)) return [];
    return items.flatMap(item => {
      try {
        return [normalizeItem(item, definition)];
      } catch {
        return [];
      }
    }).slice(0, definition.maxItems);
  } catch {
    return [];
  }
};

// A missing field preserves existing content on partial updates; [] clears it.
export const serializeRoomContentInput = (value, field) => {
  if (value === undefined || value === null) return null;
  const definition = definitions[field];
  if (!definition) throw new Error('Unknown room content field');
  try {
    const items = value === '' ? [] : decode(value);
    if (!Array.isArray(items)) throw new Error(`${definition.title} must be a JSON list.`);
    if (items.length > definition.maxItems) {
      throw new Error(`${definition.title} allows up to ${definition.maxItems} entries.`);
    }
    const json = JSON.stringify(items.map(item => normalizeItem(item, definition)));
    // JSON escaping can expand control characters beyond the TEXT column limit.
    if (Buffer.byteLength(json, 'utf8') > 65535) {
      throw new Error(`${definition.title} content is too large.`);
    }
    return json;
  } catch (cause) {
    const error = new Error(cause instanceof SyntaxError
      ? `${definition.title} must be a valid JSON list.` : cause.message);
    error.status = 400;
    throw error;
  }
};
