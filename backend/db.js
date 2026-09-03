import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const dbPassword = process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: dbPassword,
  database: process.env.DB_NAME || 'naujango',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

export const execute = (sql, params = []) => pool.promise().query(sql, params);

export default pool;
