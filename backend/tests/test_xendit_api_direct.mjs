import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as paymentProviders from '../services/paymentProviders.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Test Xendit eWallet API directly
const testXenditEWallet = async () => {
  console.log('\n🧪 Testing Xendit eWallet API...\n');
  console.log('Environment:');
  console.log('  XENDIT_SECRET_KEY:', process.env.XENDIT_SECRET_KEY?.substring(0, 20) + '...');
  console.log('  XENDIT_PUBLIC_KEY:', process.env.XENDIT_PUBLIC_KEY?.substring(0, 20) + '...');
  console.log('  WEBHOOK_BASE_URL:', process.env.WEBHOOK_BASE_URL);
  console.log('');

  try {
    const result = await paymentProviders.processXenditEWallet({
      amount: 1250,
      currency: 'PHP',
      customerName: 'Test Guest',
      customerPhone: '+639171234567',
      ewalletType: 'PH_GCASH',  // Xendit requires PH_ prefix
      description: 'Test GCash payment'
    });

    console.log('✅ API Call Successful!\n');
    console.log('Response:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.checkout_url) {
      console.log('\n✅ Checkout URL Available:');
      console.log(result.checkout_url);
    } else if (result.error_code === 'CALLBACK_URL_NOT_CONFIGURED') {
      console.log('\n⚠️  Webhook Not Configured');
      console.log('Solution: Add callback URL in Xendit Dashboard');
      console.log('  1. Go to Xendit Dashboard > Settings > Developers > Webhooks');
      console.log('  2. Add webhook URL: https://yourdomain.com/api/payments/webhook/xendit');
      console.log('  3. Select events: charge.succeeded, charge.failed, charge.expired');
    }

  } catch (error) {
    console.error('❌ API Call Failed!\n');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testXenditEWallet();
