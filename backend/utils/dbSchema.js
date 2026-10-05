import db from '../db.js';

// Keeps the flexible-payment columns present even when the SQL migration was
// not applied by hand (Railway). Every statement is conditional and idempotent.

const ensureColumn = async (table, column, definition) => {
  const [rows] = await db.promise().query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
  if (rows.length === 0) {
    await db.promise().query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`Schema: added ${table}.${column}`);
  }
};

const ensurePaymentOptionEnum = async () => {
  const [rows] = await db.promise().query(
    "SHOW COLUMNS FROM `hotel_bookings` LIKE 'payment_status'"
  );
  if (rows.length === 0) return;
  const type = String(rows[0].Type || '');
  if (!type.includes('partial')) {
    await db.promise().query(
      "ALTER TABLE `hotel_bookings` MODIFY COLUMN `payment_status` ENUM('unpaid','pending','partial','paid','failed','refunded') DEFAULT 'unpaid'"
    );
    console.log('Schema: extended hotel_bookings.payment_status with partial');
  }
};

export const ensureFlexiblePaymentSchema = async () => {
  try {
    await ensureColumn('hotels', 'reservation_fee', 'DECIMAL(10,2) NULL DEFAULT NULL AFTER `allowed_payment_methods`');
    await ensureColumn('hotel_bookings', 'payment_option', "ENUM('reservation','half','full') NOT NULL DEFAULT 'full' AFTER `payment_method`");
    await ensurePaymentOptionEnum();
  } catch (error) {
    console.error('Schema ensure (flexible payments) failed:', error.message);
  }
};

export const ensureHotelPolicySchema = async () => {
  try {
    await ensureColumn('hotels', 'cancellation_type', "ENUM('free_until','partial','non_refundable') NOT NULL DEFAULT 'free_until' AFTER `reservation_fee`");
    await ensureColumn('hotels', 'free_cancellation_days', 'INT NULL DEFAULT 1 AFTER `cancellation_type`');
    await ensureColumn('hotels', 'custom_policy_text', 'TEXT NULL AFTER `free_cancellation_days`');
    await ensureColumn('hotels', 'house_rules', 'TEXT NULL AFTER `custom_policy_text`');
    await ensureColumn('hotels', 'check_in_time', "TIME NOT NULL DEFAULT '14:00' AFTER `house_rules`");
    await ensureColumn('hotels', 'check_out_time', "TIME NOT NULL DEFAULT '12:00' AFTER `check_in_time`");
    await ensureColumn('hotels', 'balance_due_days', 'INT NULL DEFAULT 1 AFTER `check_out_time`');
    await ensureColumn('hotel_bookings', 'policy_snapshot', 'TEXT NULL AFTER `payment_option`');
  } catch (error) {
    console.error('Schema ensure (hotel policies) failed:', error.message);
  }
};

// Legitimacy & accreditation (migration 042): business permit / DOT / PhilGEPS
// details on business_profiles. The table itself is created here too so a fresh
// database works before migrations are applied by hand.
export const ensureBusinessLegitimacySchema = async () => {
  try {
    await db.promise().query(
      `CREATE TABLE IF NOT EXISTS \`business_profiles\` (
        \`id\` INT(11) PRIMARY KEY AUTO_INCREMENT,
        \`owner_id\` INT(11) NOT NULL UNIQUE,
        \`business_name\` VARCHAR(255) DEFAULT NULL,
        \`business_email\` VARCHAR(255) DEFAULT NULL,
        \`business_phone\` VARCHAR(20) DEFAULT NULL,
        \`business_address\` TEXT DEFAULT NULL,
        \`tax_id\` VARCHAR(100) DEFAULT NULL,
        \`bank_account\` VARCHAR(255) DEFAULT NULL,
        \`bank_name\` VARCHAR(255) DEFAULT NULL,
        \`verification_status\` ENUM('pending','verified','rejected') DEFAULT 'pending',
        \`rejection_reason\` TEXT DEFAULT NULL,
        \`verified_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );
    await ensureColumn('business_profiles', 'business_permit_no', 'VARCHAR(150) NULL DEFAULT NULL AFTER `bank_name`');
    await ensureColumn('business_profiles', 'business_permit_expiry', 'DATE NULL DEFAULT NULL AFTER `business_permit_no`');
    await ensureColumn('business_profiles', 'business_permit_file', 'VARCHAR(500) NULL DEFAULT NULL AFTER `business_permit_expiry`');
    await ensureColumn('business_profiles', 'dot_no', 'VARCHAR(150) NULL DEFAULT NULL AFTER `business_permit_file`');
    await ensureColumn('business_profiles', 'dot_expiry', 'DATE NULL DEFAULT NULL AFTER `dot_no`');
    await ensureColumn('business_profiles', 'dot_file', 'VARCHAR(500) NULL DEFAULT NULL AFTER `dot_expiry`');
    await ensureColumn('business_profiles', 'philgeps_no', 'VARCHAR(150) NULL DEFAULT NULL AFTER `dot_file`');
    await ensureColumn('business_profiles', 'philgeps_expiry', 'DATE NULL DEFAULT NULL AFTER `philgeps_no`');
    await ensureColumn('business_profiles', 'philgeps_file', 'VARCHAR(500) NULL DEFAULT NULL AFTER `philgeps_expiry`');
  } catch (error) {
    console.error('Schema ensure (business legitimacy) failed:', error.message);
  }
};

// Room policy / detail fields (migration 043): the owner Room Management form
// collects these but the rooms table had no columns for them, so the values
// were silently dropped on save.
export const ensureRoomFieldsSchema = async () => {
  try {
    await ensureColumn('rooms', 'bed_type', 'VARCHAR(50) NULL DEFAULT NULL AFTER `room_type_name`');
    await ensureColumn('rooms', 'check_in_time', "TIME NOT NULL DEFAULT '14:00' AFTER `quantity_available`");
    await ensureColumn('rooms', 'check_out_time', "TIME NOT NULL DEFAULT '11:00' AFTER `check_in_time`");
    await ensureColumn('rooms', 'smoking_allowed', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `check_out_time`');
    await ensureColumn('rooms', 'pets_allowed', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `smoking_allowed`');
    await ensureColumn('rooms', 'events_allowed', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `pets_allowed`');
    await ensureColumn('rooms', 'room_features', 'TEXT NULL DEFAULT NULL AFTER `amenities`');
  } catch (error) {
    console.error('Schema ensure (room fields) failed:', error.message);
  }
};

// reviews.room_id (migration 024) is what the public Room Details modal uses
// to show room-specific guest quotes. createHotelReview writes it for new
// reviews; this backfills historic ones from their booking. Idempotent and
// only runs while unmatched rows remain.
export const ensureReviewRoomIdBackfill = async () => {
  try {
    await ensureColumn('reviews', 'room_id', 'INT NULL DEFAULT NULL AFTER `hotel_id`');

    const [pending] = await db.promise().query(
      `SELECT COUNT(*) AS c
       FROM reviews r
       JOIN hotel_bookings hb ON r.booking_id = hb.booking_id
       WHERE r.room_id IS NULL AND hb.room_id IS NOT NULL`
    );
    if (!pending[0].c) return;

    await db.promise().query(
      `UPDATE reviews r
       JOIN hotel_bookings hb ON r.booking_id = hb.booking_id
       SET r.room_id = hb.room_id
       WHERE r.room_id IS NULL AND hb.room_id IS NOT NULL`
    );
    console.log(`Schema: backfilled reviews.room_id for ${pending[0].c} review(s)`);
  } catch (error) {
    console.error('Schema ensure (review room_id backfill) failed:', error.message);
  }
};
