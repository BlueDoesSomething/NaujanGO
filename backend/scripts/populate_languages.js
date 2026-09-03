import db from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function populateLanguages() {
  try {
    console.log('Starting languages table population...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'populate_languages.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split SQL statements (basic split by semicolon)
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        await db.promise().execute(statement);
      }
    }
    
    console.log('Languages table populated successfully!');
    
    // Verify the data
    const [rows] = await db.promise().query('SELECT * FROM languages');
    console.log('Current languages in database:', rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error populating languages table:', error);
    process.exit(1);
  }
}

populateLanguages();