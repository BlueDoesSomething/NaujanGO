import { execute } from './db.js';

// Creates the system_logs table used by the admin "System Logs" page.
// Run manually: node run_migration_system_logs.js
(async () => {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT(11) PRIMARY KEY AUTO_INCREMENT,
        level ENUM('info','warn','error') NOT NULL DEFAULT 'info',
        source VARCHAR(64) NOT NULL DEFAULT 'app',
        message TEXT NOT NULL,
        meta TEXT NULL,
        user_id INT(11) NULL,
        ip VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_level_created (level, created_at),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    console.log('Creating system_logs table...');
    await execute(createTableSql);
    console.log('✓ system_logs table created successfully');

    process.exit(0);
  } catch (error) {
    const detail = error.code || error.sqlMessage || error.message || JSON.stringify(error);
    console.error('❌ Migration failed:', detail);
    process.exit(1);
  }
})();
