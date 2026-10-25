import test from 'node:test';
import assert from 'node:assert/strict';
import db from '../db.js';
import { ensureRoomGuestContentSchema } from '../utils/dbSchema.js';

for (const existing of [[], ['perfect_for'], ['perfect_for', 'common_questions']]) {
  test(`guest content schema only adds absent columns (${existing.length} already present)`, async t => {
    const columns = new Set(existing);
    const writes = [];
    t.mock.method(console, 'log', () => {});
    t.mock.method(db, 'promise', () => ({ query: async (sql, params) => {
      if (sql.startsWith('SHOW COLUMNS')) return [columns.has(params[0]) ? [{ Field: params[0] }] : []];
      assert.match(sql, /^ALTER TABLE `rooms` ADD COLUMN `(perfect_for|common_questions)` TEXT NULL$/);
      columns.add(sql.match(/ADD COLUMN `([^`]+)`/)[1]);
      writes.push(sql);
      return [{}];
    } }));
    await ensureRoomGuestContentSchema();
    assert.equal(writes.length, 2 - existing.length);
    await ensureRoomGuestContentSchema();
    assert.equal(writes.length, 2 - existing.length);
    assert.deepEqual([...columns], ['perfect_for', 'common_questions']);
  });
}
