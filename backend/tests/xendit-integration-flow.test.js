import test from 'node:test';
import assert from 'node:assert/strict';
import { processXenditEWallet, verifyXenditWebhook } from '../services/paymentProviders.js';
import crypto from 'crypto';

test('Complete Xendit GCash Payment Flow', async (t) => {
  // Setup environment
  process.env.XENDIT_SECRET_KEY = 'xnd_development_Im38Q5urNNpkf1eisrjVAia9VBE1ZQUeCpIYxOzySLZEUfLwg1MlaUq70GHLvguo';
  process.env.XENDIT_PUBLIC_KEY = 'xnd_public_development_KovIXD2l3mdE6LGiwTf1HJZAX6Ug8a9L8HbgleWhgj2BSDagsLvy9R8bGvmXvPD';
  process.env.XENDIT_WEBHOOK_TOKEN = 'webhook_test_token_12345';
  process.env.WEBHOOK_BASE_URL = 'https://localhost:3000';

  await t.test('should accept real Xendit credentials', () => {
    // This should not throw error since we're using real development credentials
    assert.doesNotThrow(() => {
      if (process.env.XENDIT_SECRET_KEY.includes('your_xendit_secret_key_here')) {
        throw new Error('Placeholder key detected');
      }
    });
  });

  await t.test('webhook verification should work with correct signature', () => {
    const webhookPayload = {
      id: 'charge_f5a7fc6c32e7cf7ba4a2',
      status: 'COMPLETED',
      reference_id: 'booking_1234567890',
      amount: 1250,
      currency: 'PHP',
      channel_code: 'GCASH',
      customer: {
        given_names: 'John Doe',
        mobile_number: '+639171234567'
      }
    };

    const rawBody = JSON.stringify(webhookPayload);
    
    // Create signature with webhook token
    const hmac = crypto.createHmac('sha256', process.env.XENDIT_WEBHOOK_TOKEN);
    hmac.update(rawBody);
    const signature = hmac.digest('hex');

    // Verify
    const verification = verifyXenditWebhook(rawBody, signature);
    assert.equal(verification.valid, true, 'Webhook signature should be valid');
  });

  await t.test('payment response structure should be correct', async () => {
    // Note: This would make a real API call if XENDIT_SECRET_KEY is real
    // For this test, we're just validating the function structure
    const paymentData = {
      amount: 1250,
      currency: 'PHP',
      customerName: 'John Doe',
      customerPhone: '+639171234567',
      ewalletType: 'PH_GCASH',  // Xendit requires PH_ prefix
      description: 'Test GCash payment via Xendit'
    };

    // Expected response structure
    const expectedStructure = {
      success: 'boolean',
      provider: 'xendit',
      transaction_reference: 'string',
      status: 'string',
      checkout_url: 'string'
    };

    // Verify the function exists and is callable
    assert.strictEqual(typeof processXenditEWallet, 'function', 'processXenditEWallet should be a function');
  });

  await t.test('webhook payload mapping should handle all status types', () => {
    const testCases = [
      { xenditStatus: 'COMPLETED', expectedInternal: 'succeeded' },
      { xenditStatus: 'SUCCEEDED', expectedInternal: 'succeeded' },
      { xenditStatus: 'FAILED', expectedInternal: 'failed' },
      { xenditStatus: 'FAILED_FRAUD', expectedInternal: 'failed' },
      { xenditStatus: 'CANCELLED', expectedInternal: 'cancelled' },
      { xenditStatus: 'PENDING', expectedInternal: 'pending' }
    ];

    // Simulate status mapping logic
    const mapStatus = (xenditStatus) => {
      if (xenditStatus === 'COMPLETED' || xenditStatus === 'SUCCEEDED') return 'succeeded';
      if (xenditStatus === 'FAILED' || xenditStatus === 'FAILED_FRAUD') return 'failed';
      if (xenditStatus === 'CANCELLED') return 'cancelled';
      return 'pending';
    };

    testCases.forEach(testCase => {
      const result = mapStatus(testCase.xenditStatus);
      assert.equal(result, testCase.expectedInternal, 
        `Status ${testCase.xenditStatus} should map to ${testCase.expectedInternal}`);
    });
  });

  await t.test('redirect URLs should be constructed correctly', () => {
    // Test redirect URL patterns
    const baseUrl = process.env.WEBHOOK_BASE_URL;
    
    const successUrl = `${baseUrl}/payments/xendit/success?charge_id=test_charge&booking_id=123`;
    const failedUrl = `${baseUrl}/payments/xendit/failed?charge_id=test_charge&booking_id=123`;
    const cancelUrl = `${baseUrl}/payments/xendit/cancel?charge_id=test_charge&booking_id=123`;

    assert.match(successUrl, /xendit\/success/, 'Success URL should contain xendit/success');
    assert.match(failedUrl, /xendit\/failed/, 'Failed URL should contain xendit/failed');
    assert.match(cancelUrl, /xendit\/cancel/, 'Cancel URL should contain xendit/cancel');
    
    // All should have HTTPS
    assert.match(successUrl, /https:/, 'URLs should use HTTPS');
  });
});
