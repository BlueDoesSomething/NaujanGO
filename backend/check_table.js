import 'dotenv/config.js';
import mysql from 'mysql2/promise';

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'naujango'
  });

  try {
    const [rows] = await connection.query('SHOW TABLES LIKE ?', ['itinerary_attractions']);
    console.log('✓ Table exists:', rows.length > 0);
    if (rows.length > 0) {
      console.log('Table found:', rows[0]);
      const [columns] = await connection.query('DESCRIBE itinerary_attractions');
      console.log('\nColumns:');
      columns.forEach(col => console.log(`  - ${col.Field}: ${col.Type}`));
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTable();
