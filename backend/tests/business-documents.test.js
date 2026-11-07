import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import express from 'express';
import jwt from 'jsonwebtoken';
process.env.JWT_SECRET = 'business-document-tests-only-not-for-production';
process.env.SESSION_SECRET = 'business-document-session-tests-only';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { createBusinessDocumentRouter, protectPrivateUploadPaths } = await import('../routes/businessDocuments.js');
const { DOCUMENT_FIELDS, DOCUMENT_MAX_BYTES, DOCUMENT_SCHEMA_SQL, documentFormat, ensureBusinessDocumentSchema, saveBusinessDocument, validateDocumentReferences } = await import('../services/businessDocuments.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const actor = { user_id: 5, role: 'owner' };
const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3]);
const file = { buffer: jpg, mimetype: 'image/jpeg', originalname: 'business-permit.jpg' };
const tempRoot = process.platform === 'win32' && process.env.LOCALAPPDATA
  ? path.join(process.env.LOCALAPPDATA, 'Temp', 'opencode') : os.tmpdir();

const setup = async (t, options = {}) => {
  clearUserColumnCache();
  t.mock.method(console, 'error', () => {});
  let documents = new Map(), profile = { owner_id: 5, verification_status: 'verified', business_permit_file: '/uploads/permits/old.jpg', ...options.profile };
  const calls = [], events = [];
  const execute = async (sql, params = []) => {
    calls.push({ sql, params });
    assert.equal((sql.match(/\?/g) || []).length, params.length);
    if (sql.startsWith('INSERT INTO business_documents')) {
      if (options.schemaMissing) throw Object.assign(new Error('private database details'), { code: 'ER_NO_SUCH_TABLE' });
      documents.set(params[0], { owner_id: params[1], document_field: params[2], original_name: params[3], mime_type: params[4], byte_length: params[5], content: Buffer.from(params[6]) });
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('INSERT INTO business_profiles')) {
      if (options.writeFailure) throw new Error('private database failure');
      const field = sql.match(/owner_id, `([^`]+)`/)[1];
      profile = { ...profile, owner_id: params[0], [field]: params[1], verification_status: 'pending', verified_at: null, rejection_reason: null };
      return [{ affectedRows: 1 }];
    }
    if (sql.includes('SELECT owner_id FROM business_profiles')) {
      const allowed = DOCUMENT_FIELDS.some(field => profile[field] === params[0]) && (params[DOCUMENT_FIELDS.length] === 'admin' || Number(params[DOCUMENT_FIELDS.length + 1]) === profile.owner_id);
      return [allowed ? [{ owner_id: profile.owner_id }] : []];
    }
    if (sql.includes('FROM business_documents')) {
      if (options.schemaMissing) throw Object.assign(new Error('private table details'), { code: 'ER_NO_SUCH_TABLE' });
      const row = documents.get(params[0]);
      const matches = row && row.owner_id === Number(params[1]) && (!params[2] || row.document_field === params[2]);
      return [matches ? [row] : []];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  };
  let before;
  const connection = { execute, beginTransaction: async () => { before = { documents: new Map(documents), profile: { ...profile } }; events.push('begin'); },
    commit: async () => { events.push('commit'); },
    rollback: async () => { documents = before.documents; profile = before.profile; events.push('rollback'); },
    release: () => { events.push('release'); } };
  t.mock.method(db, 'promise', () => ({ execute, getConnection: async () => connection, query: async (sql, params = []) => {
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: params[0], role: Number(params[0]) === 1 ? 'admin' : Number(params[0]) === 7 ? 'user' : 'owner', email_verified: 1, archived: 0 }]];
    throw new Error(`Unexpected text query: ${sql}`);
  } }));
  const directory = await fs.mkdtemp(path.join(tempRoot, 'business-documents-test-'));
  const legacyDir = path.join(directory, 'permits');
  await fs.mkdir(legacyDir);
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const app = express(); app.use(express.json());
  app.use('/owner', ownerRouter);
  app.use('/uploads/permits', createBusinessDocumentRouter({ legacyDir }));
  app.use('/uploads', protectPrivateUploadPaths, express.static(directory));
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = (url, userId = 5, init = {}) => fetch(`http://127.0.0.1:${server.address().port}${url}`, {
    ...init, headers: { ...(userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET)}` } : {}), ...init.headers }
  });
  const upload = (field = 'business_permit_file', content = jpg, mime = 'image/jpeg', userId = 5) => {
    const form = new FormData();
    form.append('file', new Blob([content], { type: mime }), mime === 'application/pdf' ? 'document.pdf' : 'document.jpg');
    form.append('field', field);
    return request('/owner/profile/upload', userId, { method: 'POST', body: form });
  };
  return { calls, events, request, upload, legacyDir, profile: () => profile, documents: () => documents };
};

for (const field of DOCUMENT_FIELDS) {
  test(`${field} uploads store bytes and profile URL together, accessible to owner and admin without disk files`, async t => {
    const fixture = await setup(t);
    const response = await fixture.upload(field);
    assert.equal(response.status, 200);
    const { url } = await response.json();
    assert.match(url, /^\/uploads\/permits\/[a-f0-9-]{36}\.jpg$/);
    assert.deepEqual(fixture.events, ['begin', 'commit', 'release']);
    assert.equal(fixture.profile()[field], url);
    assert.equal(fixture.profile().verification_status, 'pending');
    assert.deepEqual(await fs.readdir(fixture.legacyDir), [], 'no ephemeral file is needed');
    for (const userId of [5, 1]) {
      const view = await fixture.request(url, userId);
      assert.equal(view.status, 200);
      assert.match(view.headers.get('cache-control'), /private, no-store/);
      assert.equal(view.headers.get('content-type'), 'image/jpeg');
      assert.match(view.headers.get('content-disposition'), /^inline;/);
      assert.deepEqual(Buffer.from(await view.arrayBuffer()), jpg);
    }
    assert.equal(fixture.calls.some(call => /hotel_bookings|hotel_payments|allowed_payment_options/.test(call.sql)), false);
  });
}

test('valid PDFs are delivered with their detected content type, not as HTML', async t => {
  const fixture = await setup(t);
  const pdf = Buffer.from('%PDF-1.4\nfixture\n%%EOF');
  const response = await fixture.upload('dot_file', pdf, 'application/pdf');
  assert.equal(response.status, 200);
  const { url } = await response.json();
  const view = await fixture.request(url);
  assert.equal(view.headers.get('content-type'), 'application/pdf');
  assert.deepEqual(Buffer.from(await view.arrayBuffer()), pdf);
});

test('documents are private: anonymous users, guest accounts and other owners cannot read or replace them', async t => {
  const fixture = await setup(t);
  const { url } = await (await fixture.upload()).json();
  for (const [userId, status] of [[null, 401], [7, 403], [6, 404]]) {
    const response = await fixture.request(url, userId);
    assert.equal(response.status, status);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  assert.equal((await fixture.upload('business_permit_file', jpg, 'image/jpeg', null)).status, 401);
  assert.equal((await fixture.upload('business_permit_file', jpg, 'image/jpeg', 7)).status, 403);
});

test('missing legacy files return a useful re-upload error instead of Cannot GET', async t => {
  const fixture = await setup(t);
  for (const userId of [5, 1]) {
    const response = await fixture.request('/uploads/permits/old.jpg', userId);
    assert.equal(response.status, 410);
    const data = await response.json();
    assert.equal(data.code, 'DOCUMENT_MISSING');
    assert.match(data.error, /upload it again/);
  }
  assert.equal(fixture.profile().verification_status, 'verified', 'viewing a missing file never changes verification');
});

test('new registration/sanitary documents remain private and cannot be attached to another document group', async t => {
  const fixture = await setup(t);
  for (const field of ['registration_file', 'sanitary_permit_file']) {
    const { url } = await (await fixture.upload(field)).json();
    assert.equal((await fixture.request(url, 6)).status, 404);
    assert.equal((await fixture.request(url, 7)).status, 403);
    assert.equal((await fixture.request(url, null)).status, 401);
    await assert.rejects(validateDocumentReferences(6, { [field]: url }), { status: 400 });
    await assert.rejects(validateDocumentReferences(5, { dot_file: url }), { status: 400 });
  }
});

test('legacy files still on disk remain viewable even before the storage migration is applied', async t => {
  const fixture = await setup(t, { schemaMissing: true });
  await fs.writeFile(path.join(fixture.legacyDir, 'old.jpg'), jpg);
  const response = await fixture.request('/uploads/permits/old.jpg');
  assert.equal(response.status, 200);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), jpg);
  assert.equal(fixture.profile().verification_status, 'verified');
});

test('a failed profile write rolls back document bytes and leaves the previously verified document untouched', async t => {
  const fixture = await setup(t, { writeFailure: true });
  const response = await fixture.upload();
  assert.equal(response.status, 500);
  assert.deepEqual(fixture.events, ['begin', 'rollback', 'release']);
  assert.equal(fixture.documents().size, 0);
  assert.equal(fixture.profile().business_permit_file, '/uploads/permits/old.jpg');
  assert.equal(fixture.profile().verification_status, 'verified');
  assert.doesNotMatch(JSON.stringify(await response.json()), /private database/);
});

test('missing durable storage fails with migration guidance and never reports a false upload success', async t => {
  const fixture = await setup(t, { schemaMissing: true });
  const response = await fixture.upload();
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /051_durable_business_documents.sql/);
  assert.equal(fixture.profile().business_permit_file, '/uploads/permits/old.jpg');
  assert.equal(fixture.documents().size, 0);
});

test('unsupported file types, fake image content, invalid fields, and oversized uploads are rejected', async t => {
  const fixture = await setup(t);
  assert.equal((await fixture.upload('business_permit_file', Buffer.from('<script>bad</script>'), 'image/jpeg')).status, 400);
  assert.equal((await fixture.upload('business_permit_file', jpg, 'image/svg+xml')).status, 400);
  assert.equal((await fixture.upload('verification_status')).status, 400);
  assert.equal((await fixture.upload('business_permit_file', Buffer.alloc(DOCUMENT_MAX_BYTES + 1))).status, 400);
  assert.equal(fixture.documents().size, 0);
});

test('normalized or encoded private paths cannot fall through to public static files', async t => {
  const fixture = await setup(t);
  await fs.writeFile(path.join(fixture.legacyDir, 'old.jpg'), jpg);
  for (const url of ['/uploads/per%6dits/old.jpg', '/uploads/%70ermits/old.jpg', '/uploads/permits/old.jpg/extra']) {
    const response = await fixture.request(url, null);
    assert.ok([400, 401, 404].includes(response.status));
    assert.notEqual(response.headers.get('content-type'), 'image/jpeg');
  }
});

test('profile saves keep unchanged legacy links but cannot attach another owners document or a script URL', async t => {
  const fixture = await setup(t);
  const { url } = await (await fixture.upload()).json();
  await validateDocumentReferences(5, { business_permit_file: url });
  await validateDocumentReferences(5, { business_permit_file: '/uploads/permits/old.jpg' }, { business_permit_file: '/uploads/permits/old.jpg' });
  await assert.rejects(validateDocumentReferences(6, { business_permit_file: url }), { status: 400 });
  await assert.rejects(validateDocumentReferences(5, { dot_file: url }), { status: 400 });
  await assert.rejects(validateDocumentReferences(5, { business_permit_file: 'javascript:alert(1)' }), { status: 400 });
});

test('format detection covers PNG and WEBP and refuses executable or empty content', () => {
  assert.equal(documentFormat(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).mime, 'image/png');
  assert.equal(documentFormat(Buffer.from('RIFF1234WEBP')).mime, 'image/webp');
  for (const value of [Buffer.alloc(0), Buffer.from('<html>oops</html>'), 'not a buffer']) assert.equal(documentFormat(value), null);
});

test('durable schema setup matches migration 051 and never rewrites verification or financial records', async t => {
  const statements = [];
  t.mock.method(db, 'promise', () => ({ query: async sql => { statements.push(sql); return [{}]; } }));
  await ensureBusinessDocumentSchema();
  await ensureBusinessDocumentSchema();
  assert.equal(statements.length, 2);
  assert.ok(statements.every(sql => sql === DOCUMENT_SCHEMA_SQL && /^CREATE TABLE IF NOT EXISTS business_documents/.test(sql)));
  const migration = await fs.readFile(new URL('../../migrations/051_durable_business_documents.sql', import.meta.url), 'utf8');
  assert.ok(migration.includes(`${DOCUMENT_SCHEMA_SQL};`));
  assert.doesNotMatch(DOCUMENT_SCHEMA_SQL, /UPDATE|DELETE|INSERT|DROP|ALTER/);
});

test('invalid direct uploads stop before a database transaction is acquired', async t => {
  let connections = 0;
  t.mock.method(db, 'promise', () => ({ getConnection: () => { connections++; throw new Error('Should not connect'); } }));
  await assert.rejects(saveBusinessDocument(actor, 'dot_file', null), { status: 400 });
  await assert.rejects(saveBusinessDocument({ user_id: 7, role: 'user' }, 'dot_file', file), { status: 403 });
  await assert.rejects(saveBusinessDocument(actor, 'dot_file', { ...file, mimetype: 'image/png' }), { status: 400 });
  assert.equal(connections, 0);
});
