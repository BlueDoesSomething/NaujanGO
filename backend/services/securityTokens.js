import crypto from 'crypto';
import { execute } from '../db.js';

export const createOpaqueToken = () => crypto.randomBytes(32).toString('hex');

export const hashOpaqueToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const invalidateSecurityTokens = async (userId, tokenType) => {
  await execute(
    `UPDATE auth_tokens
     SET used_at = COALESCE(used_at, NOW())
     WHERE user_id = ?
       AND token_type = ?
       AND used_at IS NULL`,
    [userId, tokenType]
  );
};

export const issueSecurityToken = async ({ userId, tokenType, expiresInMinutes }) => {
  await invalidateSecurityTokens(userId, tokenType);

  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await execute(
    `INSERT INTO auth_tokens (user_id, token_hash, token_type, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, tokenHash, tokenType, expiresAt]
  );

  return { token, expiresAt };
};

export const findSecurityToken = async ({ token, tokenType }) => {
  const tokenHash = hashOpaqueToken(token);
  const [rows] = await execute(
    `SELECT id, user_id, expires_at, used_at
     FROM auth_tokens
     WHERE token_hash = ?
       AND token_type = ?
     LIMIT 1`,
    [tokenHash, tokenType]
  );

  return rows[0] || null;
};

export const markSecurityTokenUsed = async (tokenId) => {
  await execute(
    'UPDATE auth_tokens SET used_at = NOW() WHERE id = ? AND used_at IS NULL',
    [tokenId]
  );
};
