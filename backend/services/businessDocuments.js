import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../db.js';

export const DOCUMENT_FIELDS = ['business_permit_file', 'dot_file', 'philgeps_file', 'registration_file', 'sanitary_permit_file'];
export const DOCUMENT_MAX_BYTES = 6 * 1024 * 1024;
export const LEGACY_DOCUMENT_DIR = fileURLToPath(new URL('../uploads/permits/', import.meta.url));
const failure = (message, status, code) => Object.assign(new Error(message), { status, code });
const storageMissing = error => ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(error.code);
export const DOCUMENT_SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS business_documents (
  file_path VARCHAR(300) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  owner_id INT NOT NULL,
  document_field VARCHAR(40) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  byte_length INT UNSIGNED NOT NULL,
  content MEDIUMBLOB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_business_documents_owner (owner_id, document_field)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

export const ensureBusinessDocumentSchema = () => db.promise().query(DOCUMENT_SCHEMA_SQL);

const requireStaff = actor => {
  if (!actor || !['owner', 'admin'].includes(actor.role) || !Number.isSafeInteger(Number(actor.user_id)) || Number(actor.user_id) < 1) {
    throw failure('Only the submitting owner and administrators can view verification documents.', 403, 'DOCUMENT_ACCESS_DENIED');
  }
};

export const documentFormat = buffer => {
  if (!Buffer.isBuffer(buffer)) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { mime: 'image/jpeg', extension: 'jpg' };
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', extension: 'png' };
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', extension: 'webp' };
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return { mime: 'application/pdf', extension: 'pdf' };
  return null;
};

export const saveBusinessDocument = async (actor, field, file) => {
  requireStaff(actor);
  if (!DOCUMENT_FIELDS.includes(field)) throw failure('Invalid document field.', 400, 'INVALID_DOCUMENT_FIELD');
  if (!file?.buffer?.length) throw failure('No document uploaded.', 400, 'DOCUMENT_REQUIRED');
  if (file.buffer.length > DOCUMENT_MAX_BYTES) throw failure('File is too large (max 6MB).', 400, 'DOCUMENT_TOO_LARGE');
  const format = documentFormat(file.buffer);
  if (!format || format.mime !== file.mimetype) throw failure('Upload a valid JPG, PNG, WEBP or PDF document matching its file type.', 400, 'INVALID_DOCUMENT_TYPE');
  const url = `/uploads/permits/${crypto.randomUUID()}.${format.extension}`;
  const name = path.basename(String(file.originalname || `document.${format.extension}`).replaceAll('\\', '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255) || `document.${format.extension}`;
  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO business_documents (file_path, owner_id, document_field, original_name, mime_type, byte_length, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [url, actor.user_id, field, name, format.mime, file.buffer.length, file.buffer]);
    // The field is selected exclusively from DOCUMENT_FIELDS, never user SQL.
    // Store the bytes and profile pointer atomically; a failed upload leaves the
    // old document and verification state intact.
    await connection.execute(
      `INSERT INTO business_profiles (owner_id, \`${field}\`) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE \`${field}\` = VALUES(\`${field}\`), verification_status = 'pending',
         verified_at = NULL, rejection_reason = NULL, updated_at = NOW()`,
      [actor.user_id, url]);
    await connection.commit();
    return { url, name };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
};

// Do not let profile saves attach somebody else's document or an arbitrary URL.
// Existing external/legacy references remain valid until explicitly replaced.
export const validateDocumentReferences = async (ownerId, input, previous = {}) => {
  for (const field of DOCUMENT_FIELDS) {
    if (input[field] == null || input[field] === '' || input[field] === previous[field]) continue;
    const value = input[field];
    if (typeof value !== 'string' || !/^\/uploads\/permits\/[a-f0-9-]{36}\.(jpg|png|webp|pdf)$/.test(value)) {
      throw failure('Upload the verification document before saving its link.', 400, 'INVALID_DOCUMENT_REFERENCE');
    }
    const [rows] = await db.promise().execute(
      'SELECT file_path FROM business_documents WHERE file_path = ? AND owner_id = ? AND document_field = ?',
      [value, ownerId, field]);
    if (!rows.length) throw failure('The document does not belong to this profile and document type.', 400, 'INVALID_DOCUMENT_REFERENCE');
  }
};

export const readBusinessDocument = async (actor, filename, legacyDir = LEGACY_DOCUMENT_DIR) => {
  requireStaff(actor);
  if (typeof filename !== 'string' || filename.includes('..') || !/^[a-z0-9][a-z0-9._-]{0,220}\.(jpg|jpeg|png|webp|pdf)$/i.test(filename)) {
    throw failure('Document not found.', 404, 'DOCUMENT_NOT_FOUND');
  }
  const url = `/uploads/permits/${filename}`;
  const [profiles] = await db.promise().execute(
    `SELECT owner_id FROM business_profiles
     WHERE (${DOCUMENT_FIELDS.map(field => `${field} = ?`).join(' OR ')})
       AND (? = 'admin' OR owner_id = ?) LIMIT 1`,
    [...DOCUMENT_FIELDS.map(() => url), actor.role, actor.user_id]);
  if (!profiles.length) throw failure('Document not found or access denied.', 404, 'DOCUMENT_NOT_FOUND');
  let rows = [];
  try {
    [rows] = await db.promise().execute(
      'SELECT original_name, mime_type, byte_length, content FROM business_documents WHERE file_path = ? AND owner_id = ?',
      [url, profiles[0].owner_id]);
  } catch (error) { if (!storageMissing(error)) throw error; }
  if (rows.length) {
    const format = documentFormat(rows[0].content);
    if (!format || rows[0].content.length !== Number(rows[0].byte_length) || rows[0].content.length > DOCUMENT_MAX_BYTES) {
      throw failure('The stored document is invalid. Ask the owner to upload it again.', 409, 'DOCUMENT_INVALID');
    }
    return { buffer: rows[0].content, format, name: rows[0].original_name };
  }
  // Compatibility for submitted files that still exist on the old server disk.
  // Never manufacture a replacement or silently change verification status.
  try {
    const filePath = path.join(legacyDir, filename);
    const stat = await fs.stat(filePath);
    if (!stat.isFile() || stat.size > DOCUMENT_MAX_BYTES) throw failure('The uploaded document is invalid.', 409, 'DOCUMENT_INVALID');
    const buffer = await fs.readFile(filePath);
    const format = documentFormat(buffer);
    if (!format) throw failure('The uploaded document is invalid. Ask the owner to upload it again.', 409, 'DOCUMENT_INVALID');
    return { buffer, format, name: filename };
  } catch (error) {
    if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
    throw failure('This document file is no longer available. The owner must upload it again, or restore it from a backup.', 410, 'DOCUMENT_MISSING');
  }
};

export const respondDocumentError = (res, error) => {
  res.set('Cache-Control', 'private, no-store');
  if (storageMissing(error)) return res.status(503).json({ error: 'Verification document storage needs migrations/051_durable_business_documents.sql and credential fields need migrations/056_establishment_credentials.sql.', code: 'DOCUMENT_SCHEMA_MISSING' });
  if (error.code === 'ER_NET_PACKET_TOO_LARGE') return res.status(503).json({ error: 'Document storage rejected the file size. Contact the administrator to check the database upload limit.', code: 'DOCUMENT_STORAGE_LIMIT' });
  return res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to access this verification document.', code: error.status ? error.code : 'DOCUMENT_STORAGE_ERROR' });
};
