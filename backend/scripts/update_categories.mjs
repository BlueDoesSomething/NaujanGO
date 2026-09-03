import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS ?? process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'naujango',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
});

const updates = [
  [1,  'hiking'],
  [2,  'waterfall'],
  [3,  'heritage'],
  [4,  'lake'],
  [5,  'heritage'],
  [6,  'park'],
  [7,  'waterfall'],
  [8,  'agri-tourism'],
  [9,  'agri-tourism'],
  [10, 'agri-tourism'],
  [11, 'agri-tourism'],
  [12, 'park'],
  [13, 'river'],
  [14, 'wellness'],
  [15, 'waterfall'],
  [16, 'waterfall'],
  [17, 'event venue'],
  [18, 'event venue'],
  [19, 'nature reserve'],
  [20, 'market'],
  [21, 'beach'],
  [23, 'landmark'],
];

for (const [id, category] of updates) {
  const [result] = await db.execute('UPDATE attractions SET category = ? WHERE id = ?', [category, id]);
  console.log(`ID ${id}: ${result.affectedRows} row(s) updated -> ${category}`);
}

await db.end();
console.log('Done.');
