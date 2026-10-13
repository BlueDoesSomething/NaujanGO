// Shared probe for optional hotels columns.
//
// These columns come from SQL migrations that were never applied to every
// environment by hand (Railway in particular). A missing column makes the
// backend silently discard whatever was written to it, so every write path
// checks here and reports the problem instead of pretending to have saved.

import db from '../db.js';

export const GALLERY_COLUMN_WARNING =
  'Gallery images were NOT saved: the hotels.image_urls column is missing from this database. '
  + 'Run migrations/008_add_hotel_gallery.sql, then restart the server (a boot-time check creates it automatically).';

let cache = null;

export const getHotelColumns = async () => {
  if (cache) return cache;

  const [rows] = await db.promise().query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'hotels'
       AND column_name IN ('image_urls', 'allowed_payment_methods', 'reservation_fee')`
  );

  const present = new Set(rows.map((row) => row.COLUMN_NAME));
  cache = {
    imageUrls: present.has('image_urls'),
    allowedPaymentMethods: present.has('allowed_payment_methods'),
    reservationFee: present.has('reservation_fee')
  };

  if (!cache.imageUrls) {
    console.warn('Hotels: image_urls column is missing — gallery images will not persist. See migrations/008_add_hotel_gallery.sql');
  }

  return cache;
};

// Test seam: drop the memoised probe.
export const resetHotelColumnsCache = () => { cache = null; };