import test from 'node:test';
import assert from 'node:assert/strict';
import { processXenditEWallet } from '../services/paymentProviders.js';

test('processXenditEWallet throws error when real Xendit credentials not configured', async () => {
  process.env.XENDIT_SECRET_KEY = 'your_xendit_secret_key_here';
  process.env.PAYMENT_MODE = 'sandbox';
  process.env.WEBHOOK_BASE_URL = 'https://localhost:3000';

  try {
    await processXenditEWallet({
      amount: 1250,
      currency: 'PHP',
      customerName: 'Test Guest',
      customerPhone: '+639171234567',
      ewalletType: 'GCASH',
      description: 'Test booking payment'
    });
    assert.fail('Should have thrown an error');
  } catch (err) {
    assert.match(err.message, /not configured/);
  }
});
