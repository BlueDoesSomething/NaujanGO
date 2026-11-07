import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'credential-tests-only-not-for-production';
process.env.SESSION_SECRET = 'credential-session-tests-only';
const { default: db } = await import('../db.js');
const { JWT_SECRET } = await import('../config/security.js');
const { clearUserColumnCache } = await import('../services/userSchema.js');
const { default: adminRouter } = await import('../controllers/adminController.js');
const { default: ownerRouter } = await import('../controllers/ownerController.js');
const { CREDENTIAL_TYPES, credentialDate, philippineDate, profileCredentials, serializeCredentialProfile, validateCredentialInput, parseCredentialFlags } = await import('../utils/businessCredentials.js');
const { CREDENTIAL_EVENT_SCHEMA, attachHotelCredentialSummaries } = await import('../services/businessCredentials.js');
const { computeAuthorization } = await import('../utils/legitimacy.js');

const fixture = (patch = {}) => ({ id: 10, owner_id: 5, hotel_id: 8, business_name: 'Fixture Inn', verification_status: 'verified', registration_authority: 'DTI',
  ...Object.fromEntries(CREDENTIAL_TYPES.flatMap(({ prefix }) => [[`${prefix}_no`, `${prefix}-TEST`], [`${prefix}_expiry`, '2099-12-31'], [`${prefix}_file`, `/uploads/permits/${prefix}.pdf`]])), ...patch });
const setup = async (t, options = {}) => {
  clearUserColumnCache(); t.mock.method(console, 'error', () => {});
  let profiles = options.profiles || [fixture()], audit = [], before;
  const calls = [], events = [];
  const execute = async (sql, params = []) => {
    calls.push({ sql, params }); assert.equal((sql.match(/\?/g) || []).length, params.length, sql);
    if (sql.includes('information_schema.columns')) return [[]];
    if (sql.includes('FROM users')) return [[{ user_id: params[0], role: Number(params[0]) === 1 ? 'admin' : Number(params[0]) === 9 ? 'user' : Number(params[0]) === 7 ? 'agent' : 'owner', email_verified: 1, archived: 0, first_name: 'Fixture', email: 'fixture@example.test' }]];
    if (options.missingSchema) throw Object.assign(new Error('Secret SQL'), { code: 'ER_BAD_FIELD_ERROR' });
    if (sql.includes('FROM business_profiles bp')) return [structuredClone(profiles)];
    if (sql.includes('FROM hotel_owners ho JOIN business_profiles')) return [structuredClone(profiles)];
    if (sql.includes('FROM business_profiles WHERE id')) return [structuredClone(profiles.filter(profile => profile.id === params[0]))];
    if (sql.includes('FROM business_profiles WHERE owner_id')) return [structuredClone(profiles.filter(profile => profile.owner_id === params[0]))];
    if (sql.startsWith('UPDATE business_profiles SET credential_flags')) { profiles.find(profile => profile.id === params[1]).credential_flags = params[0]; return [{ affectedRows: 1 }]; }
    if (sql.startsWith('UPDATE business_profiles')) {
      const profile = profiles.find(profile => profile.owner_id === params.at(-1));
      const fields = [...sql.matchAll(/(\w+) = \?/g)].map(match => match[1]);
      fields.slice(0, -1).forEach((field, index) => { profile[field] = params[index]; });
      if (sql.includes("verification_status = 'pending'")) profile.verification_status = 'pending';
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('UPDATE users')) return [{ affectedRows: 1 }];
    if (sql.startsWith('INSERT INTO business_credential_events')) { if (options.auditFailure) throw new Error('Private audit failure'); audit.push(params); return [{ affectedRows: 1 }]; }
    throw new Error(`Unexpected credential SQL: ${sql}`);
  };
  const connection = { execute, beginTransaction: async () => { before = { profiles: structuredClone(profiles), audit: [...audit] }; events.push('begin'); },
    commit: async () => { events.push('commit'); }, rollback: async () => { profiles = before.profiles; audit = before.audit; events.push('rollback'); }, release: () => { events.push('release'); } };
  t.mock.method(db, 'promise', () => ({ query: execute, execute, getConnection: async () => connection }));
  const app = express(); app.use(express.json()); app.use('/admin', adminRouter); app.use('/owner', ownerRouter);
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const request = async (path, method = 'GET', body, userId = 1) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(userId ? { Authorization: `Bearer ${jwt.sign({ user_id: userId, role: 'admin' }, JWT_SECRET)}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  return { request, calls, events, profiles: () => profiles, audit: () => audit };
};

test('date-only credentials use Philippine midnight and remain valid through their printed expiry day', () => {
  assert.equal(philippineDate(new Date('2026-11-07T15:59:59Z')), '2026-11-07');
  assert.equal(philippineDate(new Date('2026-11-07T16:00:00Z')), '2026-11-08');
  const profile = fixture({ business_permit_expiry: '2026-11-07' });
  const get = today => profileCredentials(profile, { today }).find(item => item.key === 'business_permit');
  assert.equal(get('2026-11-07').status, 'expiring_soon'); assert.equal(get('2026-11-08').status, 'expired');
  assert.equal(credentialDate(new Date(2026, 10, 7)), '2026-11-07');
  for (const value of ['2026-02-30', '0000-00-00', '2026-2-1', 'tomorrow', '2026-12-31; DROP TABLE users', new Date('bad')]) assert.equal(credentialDate(value), null);
});

test('unknown expiries, missing uploads, unreviewed profiles and flags cannot receive current badges', () => {
  const get = patch => profileCredentials(fixture(patch), { today: '2026-11-07' });
  assert.equal(get({ registration_expiry: null })[0].status, 'expiry_unknown');
  assert.equal(get({ registration_authority: 'SEC', registration_expiry: null })[0].status, 'expiry_unknown', 'do not invent an SEC expiry or claim indefinite validity');
  assert.equal(get({ business_permit_file: null })[1].status, 'incomplete');
  assert.equal(get({ verification_status: 'pending' })[1].status, 'pending');
  assert.equal(get({ verification_status: 'pending', dot_expiry: '2020-01-01' })[3].status, 'expired');
  assert.equal(get({ sanitary_permit_expiry: '2026-12-07' })[2].status, 'expiring_soon');
  assert.equal(get({ sanitary_permit_expiry: '2026-12-08' })[2].status, 'current');
  assert.deepEqual(profileCredentials({}).map(item => item.status), ['missing', 'missing', 'missing', 'missing']);
});

test('strict dates, registration authorities, number lengths and corrupt follow-up data are validated', () => {
  validateCredentialInput({ registration_authority: 'DTI', registration_no: 'REG' });
  for (const input of [{ sanitary_permit_expiry: '2026-02-30' }, { registration_authority: 'OTHER' }, { registration_no: 'REG' }, { dot_no: {} }, { business_permit_no: 'x'.repeat(151) }]) assert.throws(() => validateCredentialInput(input), { status: 400 });
  assert.throws(() => parseCredentialFlags('{broken'), { status: 503 });
  assert.throws(() => parseCredentialFlags({ dot: { flagged: true } }), { status: 503 });
});

test('admin filters apply type and expiry to the same credential; unknown and flagged are independently selectable', async t => {
  const profiles = [fixture({ id: 10, business_permit_expiry: '2020-01-01' }), fixture({ id: 11, owner_id: 6, sanitary_permit_expiry: '2020-01-01', registration_expiry: null })];
  const { request } = await setup(t, { profiles });
  const response = await request('/admin/business-profiles?credential_type=sanitary_permit&credential_state=expired');
  assert.equal(response.status, 200); assert.deepEqual(response.body.data.map(item => item.id), [11]);
  assert.equal((await request('/admin/business-profiles?credential_type=registration&credential_state=unknown')).body.data.length, 1);
  assert.equal((await request('/admin/business-profiles?credential_type=garbage')).status, 400);
  assert.equal((await request('/admin/business-profiles?credential_state=garbage')).status, 400);
});

test('administrators can flag/resolve with a reason and audit, while expiration and existing booking authorization stay unchanged', async t => {
  const f = await setup(t, { profiles: [fixture({ dot_expiry: '2020-01-01' })] });
  const before = computeAuthorization(f.profiles()[0]);
  const flagged = await f.request('/admin/business-profiles/10/credentials/dot/flag', 'PUT', { flagged: true, expected_version: 0, reason: 'Request renewed certificate' });
  assert.equal(flagged.status, 200); assert.equal(flagged.body.credentials[3].flagged, true);
  assert.equal(flagged.body.credentials[3].status, 'expired'); assert.equal(f.audit().length, 1);
  assert.equal((await f.request('/admin/business-profiles?credential_state=flagged')).body.data.length, 1);
  const resolved = await f.request('/admin/business-profiles/10/credentials/dot/flag', 'PUT', { flagged: false, expected_version: 1, reason: 'Follow-up acknowledged; date unchanged' });
  assert.equal(resolved.status, 200); assert.equal(resolved.body.credentials[3].status, 'expired');
  assert.deepEqual(computeAuthorization(f.profiles()[0]), before); assert.equal(f.profiles()[0].verification_status, 'verified');
  assert.equal(f.audit().length, 2); assert.ok(f.calls.every(call => !/hotel_bookings|hotel_payments|UPDATE hotels|DELETE|DROP/.test(call.sql)));
});

test('anonymous users, owners, agents and forged token roles cannot alter admin follow-up decisions', async t => {
  const f = await setup(t);
  for (const [user, status] of [[null, 401], [5, 403], [7, 403], [9, 403]]) {
    assert.equal((await f.request('/admin/business-profiles', 'GET', undefined, user)).status, status);
    assert.equal((await f.request('/admin/business-profiles/10/credentials/dot/flag', 'PUT', { flagged: true, expected_version: 0, reason: 'Forged' }, user)).status, status);
  }
  assert.equal(f.audit().length, 0);
});

test('stale/repeated flag writes are rejected and audit failures roll back instead of losing the prior decision', async t => {
  const f = await setup(t);
  const body = { flagged: true, expected_version: 0, reason: 'Renewal requested' };
  assert.equal((await f.request('/admin/business-profiles/10/credentials/dot/flag', 'PUT', body)).status, 200);
  assert.equal((await f.request('/admin/business-profiles/10/credentials/dot/flag', 'PUT', body)).status, 409);
  assert.equal(f.audit().length, 1);
  for (const patch of [{ reason: '' }, { reason: 'x'.repeat(1001) }, { flagged: 'true' }, { expected_version: -1 }]) assert.equal((await f.request('/admin/business-profiles/10/credentials/dot/flag', 'PUT', { ...body, ...patch })).status, 400);
  const broken = await setup(t, { auditFailure: true });
  const response = await broken.request('/admin/business-profiles/10/credentials/dot/flag', 'PUT', body);
  assert.equal(response.status, 500); assert.equal(broken.profiles()[0].credential_flags, undefined); assert.deepEqual(broken.audit(), []);
  assert.doesNotMatch(JSON.stringify(response.body), /Private audit/);
});

test('owner profile saves round-trip new fields, reset review and cannot erase administrator flags', async t => {
  const flags = JSON.stringify({ sanitary_permit: { flagged: true, version: 1, reason: 'Renew this', updated_at: '2026-01-01' } });
  const f = await setup(t, { profiles: [fixture({ credential_flags: flags, registration_no: null })] });
  const response = await f.request('/owner/profile', 'PUT', { businessName: 'Fixture Inn', registration_authority: 'SEC', registration_no: 'NEW-REG', sanitary_permit_no: 'SAN-NEW', sanitary_permit_expiry: '2027-12-31', credential_flags: '{}' }, 5);
  assert.equal(response.status, 200); assert.equal(f.profiles()[0].registration_no, 'NEW-REG'); assert.equal(f.profiles()[0].verification_status, 'pending');
  assert.equal(f.profiles()[0].credential_flags, flags);
  const read = await f.request('/owner/profile', 'GET', undefined, 5);
  assert.equal(read.body.businessProfile.sanitary_permit_expiry, '2027-12-31');
  assert.equal(read.body.businessProfile.credentials[2].flagged, true);
  const before = f.calls.length;
  assert.equal((await f.request('/owner/profile', 'PUT', { sanitary_permit_expiry: '2027-02-30' }, 5)).status, 400);
  assert.ok(f.calls.slice(before).every(call => !/^(UPDATE|INSERT)/.test(call.sql)));
});

test('public summaries disclose only statuses/dates, choose one coherent owner profile, and never publish files or private follow-up reasons', async t => {
  const f = await setup(t, { profiles: [fixture({ credential_flags: JSON.stringify({ dot: { flagged: true, version: 1, reason: 'PRIVATE-REASON', actor_id: 1 } }) }), fixture({ owner_id: 6, registration_no: 'ANOTHER-OWNER' })] });
  const hotels = [{ id: 8, name: 'Fixture Inn' }];
  await attachHotelCredentialSummaries(hotels);
  assert.equal(hotels[0].credentials.length, 4);
  assert.doesNotMatch(JSON.stringify(hotels), /PRIVATE-REASON|uploads|TEST|actor_id|flag_version|ANOTHER-OWNER/);
  assert.equal(hotels[0].credentials[3].flagged, true);
  assert.ok(f.calls.every(call => !/UPDATE|INSERT/.test(call.sql)));
});

test('missing migration data produces an actionable failure, not fabricated valid or missing credentials', async t => {
  const f = await setup(t, { missingSchema: true });
  const response = await f.request('/admin/business-profiles');
  assert.equal(response.status, 503); assert.match(response.body.error, /056_establishment_credentials/);
  const hotels = [{ id: 8 }]; await attachHotelCredentialSummaries(hotels); assert.equal(hotels[0].credentials, null);
});

test('migration adds nullable tracking only and does not rewrite credentials, authorizations or operational history', async () => {
  const sql = await fs.readFile(new URL('../../migrations/056_establishment_credentials.sql', import.meta.url), 'utf8');
  assert.ok(sql.includes(`${CREDENTIAL_EVENT_SCHEMA};`));
  assert.doesNotMatch(sql, /\b(?:UPDATE|DELETE|DROP|TRUNCATE|RENAME)\s+(?:TABLE\s+)?[`\w]+/i);
  assert.doesNotMatch(sql, /ALTER TABLE `(?:hotels|hotel_bookings|hotel_payments)`/);
  const serialized = serializeCredentialProfile(fixture({ registration_expiry: new Date(2026, 10, 7) }));
  assert.equal(serialized.registration_expiry, '2026-11-07');
});
