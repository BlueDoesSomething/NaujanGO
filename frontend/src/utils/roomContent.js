export const ROOM_CONTENT_SECTIONS = [
  {
    key: 'perfect_for', title: 'Perfect For', maxItems: 4,
    itemLabel: 'Guest category', addLabel: 'Add guest category',
    fields: [
      { key: 'label', label: 'Category', maxLength: 80, required: true },
      { key: 'detail', label: 'Description (optional)', maxLength: 160 }
    ]
  },
  {
    key: 'common_questions', title: 'Common Questions', maxItems: 10,
    itemLabel: 'Question', addLabel: 'Add question',
    fields: [
      { key: 'question', label: 'Question', maxLength: 200, required: true },
      { key: 'answer', label: 'Answer', maxLength: 1000, required: true, multiline: true }
    ]
  }
];

const normalizeEntry = (entry, section) => {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error(`${section.title}: invalid entry.`);
  }
  return Object.fromEntries(section.fields.map(field => {
    const value = entry[field.key] === undefined && !field.required ? '' : entry[field.key];
    if (typeof value !== 'string' || (field.required && !value.trim())) {
      throw new Error(`${section.title}: please complete the ${field.label.toLowerCase()}.`);
    }
    const text = value.trim();
    if (text.length > field.maxLength) {
      throw new Error(`${section.title}: ${field.label} must be at most ${field.maxLength} characters.`);
    }
    return [field.key, text];
  }));
};

// Only show complete owner-provided entries. Missing or malformed data is hidden.
export const getRoomContentItems = (value, key) => {
  const section = ROOM_CONTENT_SECTIONS.find(item => item.key === key);
  if (!section || !Array.isArray(value)) return [];
  return value.flatMap(entry => {
    try {
      return [normalizeEntry(entry, section)];
    } catch {
      return [];
    }
  }).slice(0, section.maxItems);
};

export const prepareRoomGuestContent = (room) => Object.fromEntries(ROOM_CONTENT_SECTIONS.map(section => {
  const entries = room[section.key] ?? [];
  if (!Array.isArray(entries)) throw new Error(`${section.title}: invalid list.`);
  // An untouched blank draft does not publish content or block an unrelated edit.
  const filled = entries.filter(entry => section.fields.some(({ key }) => {
    const value = entry?.[key];
    return typeof value === 'string' ? Boolean(value.trim()) : value != null;
  }));
  if (filled.length > section.maxItems) {
    throw new Error(`${section.title} allows up to ${section.maxItems} entries.`);
  }
  return [section.key, filled.map(entry => normalizeEntry(entry, section))];
}));
