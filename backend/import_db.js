import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importDatabase() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'naujango.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL statements (handle GO statements and semicolons)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    let executed = 0;
    let skipped = 0;

    for (const statement of statements) {
      try {
        await db.promise().query(statement);
        executed++;
        if (executed % 10 === 0) {
          console.log(`✓ Executed ${executed}/${statements.length} statements...`);
        }
      } catch (error) {
        // Ignore "already exists" errors (1050) and similar
        if (error.errno === 1050 || error.errno === 1060 || error.errno === 1061) {
          skipped++;
        } else {
          console.warn(`⚠ Error executing statement: ${error.message}`);
          console.warn(`Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n✓ Database import completed!`);
    console.log(`  - Executed: ${executed} statements`);
    console.log(`  - Skipped: ${skipped} statements (already exist)`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error importing database:', error);
    process.exit(1);
  }
}

importDatabase();
