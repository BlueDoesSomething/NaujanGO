import { execute } from './db.js';

// Expands the attractions table with the detail fields the public page
// renders and a JSON gallery column. Idempotent: each column is added only
// if information_schema says it is missing.
// Run manually: node run_migration_expand_attractions.js

const COLUMNS = [
  { name: 'opening_hours',       ddl: 'VARCHAR(255) NULL AFTER image_url' },
  { name: 'entrance_fee',        ddl: 'DECIMAL(10,2) NULL AFTER opening_hours' },
  { name: 'visit_duration',      ddl: 'VARCHAR(100) NULL AFTER entrance_fee' },
  { name: 'best_time_to_visit',  ddl: 'VARCHAR(255) NULL AFTER visit_duration' },
  { name: 'difficulty_level',    ddl: 'VARCHAR(50) NULL AFTER best_time_to_visit' },
  { name: 'category_tags',       ddl: 'JSON NULL AFTER difficulty_level' },
  { name: 'dangerous_animals',   ddl: 'TEXT NULL AFTER category_tags' },
  { name: 'image_urls',          ddl: 'JSON NULL AFTER image_url' },
];

(async () => {
  try {
    const [rows] = await execute(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'attractions'`
    );
    const existing = new Set(rows.map((r) => (r.column_name || r.COLUMN_NAME || '').toLowerCase()));

    for (const col of COLUMNS) {
      if (existing.has(col.name)) {
        console.log(`- ${col.name}: already present, skipping`);
        continue;
      }
      console.log(`+ adding ${col.name}...`);
      await execute(`ALTER TABLE attractions ADD COLUMN \`${col.name}\` ${col.ddl}`);
    }

    const [updated] = await execute(
      `UPDATE attractions SET municipality = 'Naujan' WHERE municipality IS NULL`
    );
    console.log(`✓ backfilled municipality on ${updated.affectedRows} row(s)`);

    console.log('✓ attractions expansion complete');
    process.exit(0);
  } catch (error) {
    const detail = error.code || error.sqlMessage || error.message || JSON.stringify(error);
    console.error('❌ Migration failed:', detail);
    process.exit(1);
  }
})();
