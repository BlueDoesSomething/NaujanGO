import mysql from 'mysql2';
import dotenv from 'dotenv';
import { normalizeSqlParams } from './utils/sqlParams.js';

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
  // Never allow a web request to execute stacked SQL statements. The remaining
  // parameterized query() calls must not expand objects into `column = value`.
  multipleStatements: false,
  stringifyObjects: true
});

// Use real server-side binding. Missing optional values retain query()'s NULL
// behavior, while objects/lists must be serialized/expanded explicitly.
export const execute = async (sql, params = []) => pool.promise().execute(sql, normalizeSqlParams(params));

export default pool;
