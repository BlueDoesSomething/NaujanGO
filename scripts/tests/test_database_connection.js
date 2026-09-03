// Database diagnostic script
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'naujango',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function runDiagnostics() {
  const promisePool = pool.promise();

  console.log('=== Database Diagnostic Check ===\n');
  
  console.log('Connection Settings:');
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  User: ${process.env.DB_USER || 'root'}`);
  console.log(`  Database: ${process.env.DB_NAME || 'naujango'}`);
  console.log(`  Port: ${process.env.DB_PORT || 3306}\n`);

  try {
    // Test connection
    console.log('Testing database connection...');
    const connection = await promisePool.getConnection();
    console.log('✓ Connected to database\n');
    connection.release();

    // Check users table structure
    console.log('Checking users table structure...');
    const [tableInfo] = await promisePool.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
       ORDER BY ORDINAL_POSITION`,
      [process.env.DB_NAME || 'naujango']
    );
    
    if (tableInfo.length === 0) {
      console.log('✗ users table not found!');
    } else {
      console.log('✓ users table found\n');
      console.log('Table Structure:');
      tableInfo.forEach(col => {
        const extra = col.EXTRA ? ` ${col.EXTRA}` : '';
        console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}${col.COLUMN_KEY ? ' [' + col.COLUMN_KEY + ']' : ''}${extra}`);
      });
    }

    // Check existing users
    console.log('\n\nExisting users in database:');
    const [users] = await promisePool.query('SELECT user_id, username, email, created_at FROM users');
    
    if (users.length === 0) {
      console.log('  (No users in database)');
    } else {
      users.forEach(user => {
        console.log(`  - ID: ${user.user_id}, Username: ${user.username}, Email: ${user.email}`);
      });
    }

    // Test bcrypt
    console.log('\n\nTesting bcrypt functionality...');
    const bcrypt = await import('bcryptjs');
    const testPassword = 'TestPassword123!';
    const salt = await bcrypt.default.genSalt(10);
    const hash = await bcrypt.default.hash(testPassword, salt);
    console.log(`✓ Generated bcrypt hash successfully`);
    
    const isMatch = await bcrypt.default.compare(testPassword, hash);
    console.log(`✓ Password comparison works: ${isMatch ? 'PASS' : 'FAIL'}`);

    console.log('\n=== Diagnostics Complete ===\n');
    console.log('Next steps:');
    console.log('1. Ensure database was recreated with: mysql -u root naujango < naujango.sql');
    console.log('2. Start backend: npm start (from backend folder)');
    console.log('3. Test registration and login from frontend');

  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('\nPossible solutions:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check credentials in .env file');
    console.error('3. Verify naujango database exists');
  } finally {
    pool.end();
  }
}

runDiagnostics();
