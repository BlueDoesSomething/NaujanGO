import { execute } from '../backend/db.js';

(async () => {
  try {
    const [rows] = await execute('SELECT id, name, description FROM attractions');
    console.log('Found', rows.length, 'attractions');
    for (const r of rows) {
      const existsQuery = 'SELECT id FROM translations WHERE entity_type = ? AND entity_id = ? AND field_name = ? AND locale = ? LIMIT 1';
      const [nameExists] = await execute(existsQuery, ['attraction', r.id, 'name', 'en']);
      if (!nameExists || nameExists.length === 0) {
        await execute('INSERT INTO translations (entity_type, entity_id, field_name, locale, text) VALUES (?, ?, ?, ?, ?)', ['attraction', r.id, 'name', 'en', r.name]);
      }
      const [descExists] = await execute(existsQuery, ['attraction', r.id, 'description', 'en']);
      if (!descExists || descExists.length === 0) {
        await execute('INSERT INTO translations (entity_type, entity_id, field_name, locale, text) VALUES (?, ?, ?, ?, ?)', ['attraction', r.id, 'description', 'en', r.description]);
      }
    }
    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
