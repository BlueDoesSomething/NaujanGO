import { execute } from '../backend/db.js';

const tables = [
  { table: 'attractions', entity_type: 'attraction', id_col: 'id', text_cols: ['name', 'description'] },
  { table: 'hotels', entity_type: 'hotel', id_col: 'hotel_id', text_cols: ['name', 'description'] }
];

(async () => {
  try {
    let totalSeeded = 0;
    for (const cfg of tables) {
      const [rows] = await execute(`SELECT ${cfg.id_col}, ${cfg.text_cols.join(', ')} FROM ${cfg.table}`);
      console.log(`Seeding ${cfg.entity_type}s (${rows.length} rows)...`);
      
      for (const row of rows) {
        for (const col of cfg.text_cols) {
          const id = row[cfg.id_col];
          const text = row[col];
          if (!text) continue;
          
          const [exists] = await execute(
            'SELECT id FROM translations WHERE entity_type = ? AND entity_id = ? AND field_name = ? AND locale = ? LIMIT 1',
            [cfg.entity_type, id, col, 'en']
          );
          
          if (!exists || exists.length === 0) {
            await execute(
              'INSERT INTO translations (entity_type, entity_id, field_name, locale, text) VALUES (?, ?, ?, ?, ?)',
              [cfg.entity_type, id, col, 'en', text]
            );
            totalSeeded++;
          }
        }
      }
    }
    
    console.log(`✓ Seeding complete: ${totalSeeded} translations created`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
