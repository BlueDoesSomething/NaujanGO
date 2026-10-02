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
