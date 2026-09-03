-- Add archived columns to hotel_payments table
ALTER TABLE hotel_payments ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;
ALTER TABLE hotel_payments ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL;

-- Add archived columns to hotel_bookings table
ALTER TABLE hotel_bookings ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;
ALTER TABLE hotel_bookings ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL;

-- Add archived columns to hotels table
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL;

-- Add archived columns to itineraries table
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL;

-- Add archived columns to attractions table
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS archived TINYINT(1) DEFAULT 0;
ALTER TABLE attractions ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL;

-- Add indexes for archived columns
CREATE INDEX IF NOT EXISTS idx_payments_archived ON hotel_payments(archived);
CREATE INDEX IF NOT EXISTS idx_bookings_archived ON hotel_bookings(archived);
CREATE INDEX IF NOT EXISTS idx_hotels_archived ON hotels(archived);
CREATE INDEX IF NOT EXISTS idx_itineraries_archived ON itineraries(archived);
CREATE INDEX IF NOT EXISTS idx_attractions_archived ON attractions(archived);
