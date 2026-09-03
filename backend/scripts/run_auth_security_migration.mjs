import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationPath = path.join(__dirname, '..', 'migrations', '017_add_auth_security.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'naujango',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  multipleStatements: true
});

try {
  await connection.query(sql);
  console.log('Applied 017_add_auth_security.sql');
} finally {
  await connection.end();
}
