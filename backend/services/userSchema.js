import db from '../db.js';

let userColumnCache = null;

export const getUserColumns = async () => {
  if (userColumnCache) {
    return userColumnCache;
  }

  const targetColumns = [
    'preferred_language',
    'language_preference',
    'phone',
    'phone_number',
    'email_verified',
    'email_verified_at',
    'password_changed_at',
    'archived'
  ];

  const placeholders = targetColumns.map(() => '?').join(', ');
  const [rows] = await db.promise().query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'users'
       AND column_name IN (${placeholders})`,
    targetColumns
  );

  const present = new Set(rows.map((row) => row.COLUMN_NAME || row.column_name));

  userColumnCache = {
    lang: present.has('preferred_language')
      ? 'preferred_language'
      : present.has('language_preference')
        ? 'language_preference'
        : null,
    phone: present.has('phone') ? 'phone' : present.has('phone_number') ? 'phone_number' : null,
    emailVerified: present.has('email_verified'),
    emailVerifiedAt: present.has('email_verified_at'),
    passwordChangedAt: present.has('password_changed_at'),
    archived: present.has('archived')
  };

  return userColumnCache;
};

export const clearUserColumnCache = () => {
  userColumnCache = null;
};
