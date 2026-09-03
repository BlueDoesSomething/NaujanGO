-- Add archived column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS archived_by INT NULL;

-- Add index for archived column
CREATE INDEX IF NOT EXISTS idx_users_archived ON users(archived);
