import axios from 'axios';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const auth = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

// Test GrabPay with the corrected structure
const grabpayPayload = {
  data: {
    attributes: {
      type: 'grab_pay',  // NOT source_type!
      amount: 100000, // ₱1000 in cents
      currency: 'PHP',
      description: 'GrabPay Payment',
      redirect: {
        success: 'https://localhost:3000/payments/grabpay/success',
        failed: 'https://localhost:3000/payments/grabpay/failed'
      }
    }
  }
};

console.log('📤 Testing CORRECTED GrabPay payload (type instead of source_type):');
console.log(JSON.stringify(grabpayPayload, null, 2));

try {
  const response = await axios.post(
    'https://api.paymongo.com/v1/sources',
    grabpayPayload,
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('\n✅ SUCCESS! GrabPay source created:');
  console.log(JSON.stringify(response.data, null, 2));
  console.log('\n🎉 Checkout URL:', response.data.data.attributes.redirect.checkout_url);
} catch (error) {
  const errorDetail = error.response?.data?.errors?.[0];
  console.log('\n🔴 ERROR:');
  console.log('Status:', error.response?.status);
  console.log('Detail:', errorDetail);
}
