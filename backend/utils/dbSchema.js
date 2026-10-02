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
