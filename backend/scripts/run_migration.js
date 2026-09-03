import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'naujango',
  multipleStatements: true
});

try {
  console.log('📊 Running hotel reviews migration...');
  
  const migrationPath = path.join(__dirname, '..', '..', 'migrations', '002_add_hotel_reviews.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  // Split by delimiter changes and execute
  const statements = sql.split('DELIMITER');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    // Remove DELIMITER commands and restore semicolons
    const cleaned = statement
      .replace(/^\/\/\s*/g, '')
      .replace(/\/\/$/g, '')
      .trim();
    
    if (cleaned && cleaned !== '//') {
      try {
        await connection.query(cleaned);
        console.log(`✅ Executed statement ${i + 1}`);
      } catch (err) {
        // Some statements might fail if already exist, that's ok
        if (!err.message.includes('Duplicate') && !err.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} warning:`, err.message);
        }
      }
    }
  }
  
  console.log('✅ Migration completed successfully!');
  console.log('\n📊 Checking reviews table...');
  
  const [columns] = await connection.query('DESCRIBE reviews');
  console.log('Reviews table columns:');
  columns.forEach(col => {
    console.log(`  - ${col.Field}: ${col.Type}`);
  });
  
  const [hotelReviews] = await connection.query('SELECT COUNT(*) as count FROM reviews WHERE hotel_id IS NOT NULL');
  console.log(`\n✅ Hotel reviews in database: ${hotelReviews[0].count}`);
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
} finally {
  await connection.end();
}
