import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import db from '../db.js';
import { deleteArchivedContent, reviewContentDeletion, setContentArchive } from '../services/archiveContent.js';
import { ensureDashboardArchiveSchema, dashboardArchiveSchema } from '../services/dashboardArchive.js';

const admin = { user_id: 1, role: 'admin' };
const setup = (t, options = {}) => {
  let row = { id: 30, archived: 1, name: 'Unused content', status: 'draft', is_active: 0, ...options.row };
  const calls = [];
  const audit = [];
  let deleted = false;
  let linked = Boolean(options.linked);
  const query = async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('information_schema.KEY_COLUMN_USAGE')) return [[{ table_name: 'reviews', column_name: 'attraction_id' }]];
    if (sql.includes('information_schema.COLUMNS')) return [options.metadataDenied ? [] : [
      { table_name: 'attractions', column_name: 'id' },
      { table_name: 'hotels', column_name: 'hotel_id' },
      { table_name: 'itineraries', column_name: 'itinerary_id' },
      { table_name: 'itinerary_attractions', column_name: 'attraction_id' }
    ]];
    if (sql.startsWith('SELECT * FROM')) return [row ? [row] : []];
    if (sql.startsWith('SELECT `id` FROM `attractions`')) return [row ? [{ id: 30 }] : []];
    if (sql.includes('FROM `reviews`') || sql.includes('FROM `itinerary_attractions`')) return [linked ? [{ attraction_id: 30 }] : []];
    if (sql.startsWith('UPDATE')) { row = { ...row, archived: params[0] }; return [{ affectedRows: 1 }]; }
    if (sql.includes('INSERT INTO dashboard_archive_audit')) {
      if (options.auditFailure) throw new Error('Audit unavailable');
      audit.push(params); return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('DELETE FROM')) { deleted = true; row = null; return [{ affectedRows: 1 }]; }
    throw new Error(`Unexpected content query: ${sql}`);
  };
  const connection = { query,
    beginTransaction: async () => { connection.snapshot = { row, deleted, auditCount: audit.length }; },
    commit: async () => {},
    rollback: async () => { row = connection.snapshot.row; deleted = connection.snapshot.deleted; audit.length = connection.snapshot.auditCount; },
    release: () => {}
  };
  t.mock.method(db, 'promise', () => ({ query, getConnection: async () => connection }));
  return { calls, audit, get deleted() { return deleted; }, setLinked: value => { linked = value; } };
};

test('unreferenced archived content needs typed confirmation and a reason before permanent deletion', async t => {
  const fixture = setup(t);
  const review = await reviewContentDeletion(admin, 'attraction', 30);
  assert.equal(review.can_delete, true);
  assert.equal(review.confirmation, 'DELETE ATTRACTION 30');
  await assert.rejects(deleteArchivedContent(admin, 'attraction', 30, { confirmation: 'DELETE', reason: 'short' }), { status: 400 });
  assert.equal(fixture.deleted, false);
  await deleteArchivedContent(admin, 'attraction', 30, { confirmation: review.confirmation, reason: 'Remove unused test content' });
  assert.equal(fixture.deleted, true);
  assert.equal(fixture.audit[0][4], 'permanent_delete');
  assert.ok(fixture.calls.some(call => call.sql.includes('FOR UPDATE')));
});

test('foreign keys and known logical references block deletion instead of cascading', async t => {
  const fixture = setup(t, { linked: true });
  const review = await reviewContentDeletion(admin, 'attraction', 30);
  assert.equal(review.can_delete, false);
  assert.ok(review.blockers.some(message => message.includes('reviews')));
  assert.ok(review.blockers.some(message => message.includes('itinerary_attractions')));
  await assert.rejects(deleteArchivedContent(admin, 'attraction', 30, { confirmation: review.confirmation, reason: 'Try deleting linked content' }), { status: 409 });
  assert.equal(fixture.deleted, false);
  assert.equal(fixture.audit.length, 0);
});

test('deletion rechecks dependencies rather than trusting an earlier eligible review', async t => {
  const fixture = setup(t);
  const review = await reviewContentDeletion(admin, 'attraction', 30);
  assert.equal(review.can_delete, true);
  fixture.setLinked(true);
  await assert.rejects(deleteArchivedContent(admin, 'attraction', 30, { confirmation: review.confirmation, reason: 'Dependency added after review' }), { status: 409 });
  assert.equal(fixture.deleted, false);
});

for (const [type, row] of [['attraction', { archived: 0 }], ['hotel', { is_active: 1 }], ['itinerary', { status: 'completed' }]]) {
  test(`ineligible ${type} is retained`, async t => {
    const fixture = setup(t, { row });
    assert.equal((await reviewContentDeletion(admin, type, 30)).can_delete, false);
    await assert.rejects(deleteArchivedContent(admin, type, 30, { confirmation: `DELETE ${type.toUpperCase()} 30`, reason: 'Attempt prohibited cleanup' }), { status: 409 });
    assert.equal(fixture.deleted, false);
  });
}

test('owners cannot permanently delete content; financial entity types are never eligible', async t => {
  const fixture = setup(t);
  await assert.rejects(reviewContentDeletion({ user_id: 5, role: 'owner' }, 'attraction', 30), { status: 403 });
  await assert.rejects(deleteArchivedContent({ user_id: 5, role: 'owner' }, 'attraction', 30), { status: 403 });
  for (const type of ['booking', 'payment', 'users', '__proto__']) {
    await assert.rejects(deleteArchivedContent(admin, type, 30), { status: 403 });
  }
  assert.equal(fixture.calls.length, 0);
});

test('unavailable dependency metadata fails closed', async t => {
  const fixture = setup(t, { metadataDenied: true });
  await assert.rejects(reviewContentDeletion(admin, 'attraction', 30), { status: 503 });
  assert.equal(fixture.deleted, false);
});

test('audit failure prevents both archive and permanent deletion', async t => {
  const fixture = setup(t, { auditFailure: true });
  await assert.rejects(deleteArchivedContent(admin, 'attraction', 30, { confirmation: 'DELETE ATTRACTION 30', reason: 'Remove unused test content' }), /Audit unavailable/);
  await assert.rejects(setContentArchive(admin, 'attraction', 30, false), /Audit unavailable/);
  assert.equal(fixture.deleted, false);
});

test('archive schema setup is idempotent and contains no financial row updates, deletion, or seed data', async t => {
  const statements = [];
  t.mock.method(db, 'promise', () => ({ query: async sql => { statements.push(sql); return [[]]; } }));
  await ensureDashboardArchiveSchema();
  await ensureDashboardArchiveSchema();
  assert.equal(statements[0], statements[1]);
  assert.match(statements[0], /CREATE TABLE IF NOT EXISTS dashboard_record_archives/);
  assert.match(statements[0], /CREATE TABLE IF NOT EXISTS dashboard_archive_audit/);
  assert.doesNotMatch(statements[0], /\b(?:UPDATE|DELETE|INSERT INTO)\s+(?:hotel_bookings|hotel_payments|users)\b/i);
  assert.doesNotMatch(statements[0], /ON DELETE CASCADE/i);
  const manualSql = await readFile(new URL('../../migrations/049_dashboard_archives.sql', import.meta.url), 'utf8');
  const normalize = value => value.replace(/^--.*$/gm, '').replace(/\s+/g, ' ').trim();
  assert.equal(normalize(dashboardArchiveSchema), normalize(manualSql));
});
