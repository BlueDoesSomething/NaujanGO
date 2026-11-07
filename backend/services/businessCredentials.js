import db from '../db.js';
import { sqlPlaceholders } from '../utils/sqlParams.js';
import { CREDENTIAL_TYPES, CREDENTIAL_FIELDS, credentialError, parseCredentialFlags, profileCredentials } from '../utils/businessCredentials.js';

export const CREDENTIAL_EVENT_SCHEMA = `CREATE TABLE IF NOT EXISTS business_credential_events (
  event_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  credential_type VARCHAR(40) NOT NULL,
  flagged TINYINT(1) NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  actor_id INT NOT NULL,
  version INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_credential_events_profile (profile_id, credential_type, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

export const flagBusinessCredential = async (actor, profileId, key, input = {}) => {
  if (actor?.role !== 'admin') throw credentialError('Administrator access required.', 403);
  if (!Number.isSafeInteger(Number(profileId)) || Number(profileId) < 1 || !CREDENTIAL_TYPES.some(type => type.key === key)) throw credentialError('Invalid profile or credential type.');
  if (typeof input.flagged !== 'boolean' || !Number.isSafeInteger(input.expected_version) || input.expected_version < 0) throw credentialError('A flag decision and current flag version are required.');
  if (typeof input.reason !== 'string' || input.reason.trim().length < 3 || input.reason.trim().length > 1000) throw credentialError('Enter a follow-up or resolution reason of 3–1,000 characters.');
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT * FROM business_profiles WHERE id = ? FOR UPDATE', [Number(profileId)]);
    if (!rows.length) throw credentialError('Business profile not found.', 404);
    const profile = rows[0], flags = parseCredentialFlags(profile.credential_flags);
    if ((flags[key]?.version || 0) !== input.expected_version) throw credentialError('This flag changed in another session. Refresh credentials before trying again.', 409);
    flags[key] = { flagged: input.flagged, reason: input.reason.trim(), version: input.expected_version + 1, actor_id: actor.user_id, updated_at: new Date().toISOString() };
    await connection.execute('UPDATE business_profiles SET credential_flags = ? WHERE id = ?', [JSON.stringify(flags), Number(profileId)]);
    await connection.execute('INSERT INTO business_credential_events (profile_id, credential_type, flagged, reason, actor_id, version) VALUES (?, ?, ?, ?, ?, ?)',
      [Number(profileId), key, input.flagged ? 1 : 0, flags[key].reason, actor.user_id, flags[key].version]);
    await connection.commit();
    return { success: true, credentials: profileCredentials({ ...profile, credential_flags: flags }) };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};

// One existing owner profile supplies a property's set of badges. Never combine
// credentials from different owners into a manufactured compliant profile.
export const attachHotelCredentialSummaries = async hotels => {
  const ids = [...new Set(hotels.map(hotel => Number(hotel.id)).filter(id => Number.isSafeInteger(id) && id > 0))];
  if (!ids.length) return;
  try {
    const fields = CREDENTIAL_FIELDS.map(field => `bp.${field}`).join(', ');
    const [rows] = await db.promise().execute(
      `SELECT ho.hotel_id, bp.owner_id, bp.verification_status, bp.credential_flags, ${fields}
       FROM hotel_owners ho JOIN business_profiles bp ON bp.owner_id = ho.user_id
       WHERE ho.hotel_id IN (${sqlPlaceholders(ids)})
       ORDER BY (bp.verification_status = 'verified') DESC, bp.updated_at DESC, bp.owner_id ASC`, ids);
    const profiles = new Map();
    for (const row of rows) if (!profiles.has(Number(row.hotel_id))) profiles.set(Number(row.hotel_id), row);
    for (const hotel of hotels) hotel.credentials = profileCredentials(profiles.get(Number(hotel.id)) || {}, { publicView: true });
  } catch (error) {
    console.error('Credential summaries unavailable:', error.code || error.status || 'LOOKUP_FAILED');
    for (const hotel of hotels) hotel.credentials = null; // Not a fabricated missing/valid result.
  }
};

export const respondCredentialError = (res, error) => {
  const missing = ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code);
  return res.status(missing ? 503 : error.status || 500).json({ error: missing
    ? 'Credential tracking storage is not ready. Ask the administrator to apply migrations/056_establishment_credentials.sql to the backend database.'
    : error.status ? error.message : 'Could not update credential tracking. Your saved records have been retained.' });
};
