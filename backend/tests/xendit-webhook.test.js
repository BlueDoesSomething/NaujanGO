import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyXenditWebhook } from '../services/paymentProviders.js';
import crypto from 'crypto';

test('Xendit webhook verification', async (t) => {
  // Set up environment
  process.env.XENDIT_WEBHOOK_TOKEN = 'test_webhook_token_12345';

  await t.test('should verify valid Xendit webhook signature', () => {
    const payload = {
      id: 'charge_id_123',
      status: 'COMPLETED',
      amount: 1250,
      currency: 'PHP'
    };
    
    const rawBody = JSON.stringify(payload);
    
    // Calculate what the signature should be
    const hmac = crypto.createHmac('sha256', process.env.XENDIT_WEBHOOK_TOKEN);
    hmac.update(rawBody);
    const validSignature = hmac.digest('hex');
    
    const result = verifyXenditWebhook(rawBody, validSignature);
    assert.equal(result.valid, true);
  });

  await t.test('should reject invalid Xendit webhook signature', () => {
    const payload = {
      id: 'charge_id_456',
      status: 'FAILED',
      amount: 500,
      currency: 'PHP'
    };
    
    const rawBody = JSON.stringify(payload);
    const invalidSignature = 'invalid_signature_xyz123';
    
    const result = verifyXenditWebhook(rawBody, invalidSignature);
    assert.equal(result.valid, false);
    assert.match(result.reason, /Signature mismatch|mismatch/i);
  });

  await t.test('should reject webhook when token not configured', () => {
    process.env.XENDIT_WEBHOOK_TOKEN = 'your_xendit_webhook_token_here';
    
    const payload = {
      id: 'charge_id_789',
      status: 'COMPLETED'
    };
    
    const result = verifyXenditWebhook(JSON.stringify(payload), 'any_signature');
    assert.equal(result.valid, false);
    assert.match(result.reason, /not configured/i);
  });

  await t.test('should reject webhook with missing signature header', () => {
    process.env.XENDIT_WEBHOOK_TOKEN = 'test_webhook_token_12345';
    
    const payload = {
      id: 'charge_id_999',
      status: 'COMPLETED'
    };
    
    const result = verifyXenditWebhook(JSON.stringify(payload), null);
    assert.equal(result.valid, false);
    assert.match(result.reason, /Missing|signature/i);
  });
});
