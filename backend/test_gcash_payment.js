import axios from 'axios';
import https from 'https';

// Disable SSL certificate validation for self-signed certs
const agent = new https.Agent({
  rejectUnauthorized: false
});

const testPayment = async () => {
  try {
    const payload = {
      booking_id: 1,
      amount: 1000.00,
      currency: 'PHP',
      email: 'test@example.com',
      customerName: 'Test Customer',
      paymentMethod: 'gcash'
    };

    console.log('📤 Sending GCash checkout request with payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://localhost:3000/api/payments/checkout',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy-token'
        },
        httpsAgent: agent
      }
    );

    console.log('✅ Response received:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

testPayment();
