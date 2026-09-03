import axios from 'axios';
import jwt from 'jsonwebtoken';
import https from 'https';

// JWT Secret from backend env
const JWT_SECRET = 'supersecretjwtkey';

// Create SSL agent that ignores certificate validation
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Generate a valid JWT token for user 1
const generateToken = (userId) => {
  const token = jwt.sign(
    { user_id: userId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  return token;
};

// Test GCash checkout
const testGCashCheckout = async () => {
  const userId = 1;
  const bookingId = 80;  // Use pending booking
  const token = generateToken(userId);

  console.log('🔐 Generated JWT token for user:', userId);
  console.log('📘 Token:', token.substring(0, 50) + '...');
  console.log('\n📤 Testing GCash Checkout through backend API...\n');

  try {
    const response = await axios.post(
      'https://localhost:3000/api/payments/checkout',
      {
        booking_id: bookingId,
        payment_method: 'gcash',
        amount: 800,
        currency: 'PHP',
        customer_email: 'benedictmadrigal26@gmail.com',
        customer_phone: '+639999999999'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: agent
      }
    );

    console.log('✅ SUCCESS! GCash checkout response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Checkout URL:', response.data.checkout_url);
    return response.data;
  } catch (error) {
    console.error('❌ ERROR:');
    console.error('Status:', error.response?.status);
    console.error('Response:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

// Test GrabPay checkout
const testGrabPayCheckout = async () => {
  const userId = 1;
  const bookingId = 79;  // Use different pending booking
  const token = generateToken(userId);

  console.log('\n========================================');
  console.log('📤 Testing GrabPay Checkout through backend API...\n');

  try {
    const response = await axios.post(
      'https://localhost:3000/api/payments/checkout',
      {
        booking_id: bookingId,
        payment_method: 'grabpay',
        amount: 800,
        currency: 'PHP',
        customer_email: 'benedictmadrigal26@gmail.com',
        customer_phone: '+639999999999'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: agent
      }
    );

    console.log('✅ SUCCESS! GrabPay checkout response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Checkout URL:', response.data.checkout_url);
    return response.data;
  } catch (error) {
    console.error('❌ ERROR:');
    console.error('Status:', error.response?.status);
    console.error('Response:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
};

// Run tests
const runTests = async () => {
  try {
    await testGCashCheckout();
    await testGrabPayCheckout();
    console.log('\n========================================');
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
};

runTests();
