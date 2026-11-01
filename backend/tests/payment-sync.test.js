import test from 'node:test';
import assert from 'node:assert/strict';
import db from '../db.js';
import { syncBookingPaymentStatus } from '../utils/paymentSync.js';

const setup = (t, options = {}) => {
  const events = [], writes = [];
  const connection = {
    beginTransaction: async () => { events.push('begin'); },
    commit: async () => { events.push('commit'); },
    rollback: async () => { events.push('rollback'); },
    release: () => { events.push('release'); },
    query: async (sql, params) => {
      if (sql.startsWith('SELECT total_amount')) {
        assert.match(sql, /FOR UPDATE$/);
        events.push('lock');
        return [options.missing ? [] : [{ total_amount: options.total ?? 500, payment_status: options.previous || 'paid' }]];
      }
      if (sql.includes('FROM hotel_payments')) {
        events.push('payments');
        return [[{ paid: options.paid ?? 250 }]];
      }
      assert.match(sql, /^UPDATE hotel_bookings/);
      assert.equal((sql.match(/\?/g) || []).length, params.length);
      events.push('update'); writes.push({ sql, params });
      if (options.fail) throw new Error('Fixture write failure');
      return [{ affectedRows: 1 }];
    }
  };
  t.mock.method(db, 'promise', () => ({ getConnection: async () => connection }));
  return { events, writes, connection };
};

test('payment confirmation locks the latest extended total and cannot settle only the original package', async t => {
  const { events, writes } = setup(t);
  const result = await syncBookingPaymentStatus(10, { confirm: true, paymentMethod: 'gcash' });
  assert.deepEqual(events, ['begin', 'lock', 'payments', 'update', 'commit', 'release']);
  assert.equal(result.payment_status, 'partial');
  assert.equal(result.amount_paid, 250);
  assert.deepEqual(writes[0].params, ['partial', 'gcash', 10]);
  assert.match(writes[0].sql, /status = 'confirmed'/);
  assert.doesNotMatch(writes[0].sql, /total_amount\s*=|INSERT|DELETE/);
});

test('recorded payments settle the extended booking only after its latest total is covered', async t => {
  setup(t, { paid: 500 });
  assert.equal((await syncBookingPaymentStatus(10)).payment_status, 'paid');
});

test('failed payment-status updates roll back and release the connection', async t => {
  const { events } = setup(t, { fail: true });
  await assert.rejects(syncBookingPaymentStatus(10), /Fixture write failure/);
  assert.deepEqual(events, ['begin', 'lock', 'payments', 'update', 'rollback', 'release']);
});

test('missing bookings do not cause payment or booking writes', async t => {
  const { events, writes } = setup(t, { missing: true });
  assert.equal(await syncBookingPaymentStatus(10), null);
  assert.deepEqual(events, ['begin', 'lock', 'commit', 'release']);
  assert.equal(writes.length, 0);
});

test('a caller-owned transaction keeps its booking lock and commit responsibility', async t => {
  const { events, connection } = setup(t, { previous: 'unpaid', paid: 0 });
  const result = await syncBookingPaymentStatus(10, { dbLike: connection });
  assert.equal(result.payment_status, 'unpaid');
  assert.deepEqual(events, ['lock', 'payments', 'update']);
});
