import axios from 'axios';

const testPayMongoAPI = async () => {
  const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
  const auth = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

  const payload = {
    data: {
      attributes: {
        source_type: 'gcash',
        amount: 100000, // ₱1000 in cents
        currency: 'PHP',
        redirect: {
          success: 'https://localhost:3000/payments/gcash/success',
          failed: 'https://localhost:3000/payments/gcash/failed'
        }
      }
    }
  };

  console.log('📤 Sending to PayMongo /sources endpoint:');
  console.log('  URL: https://api.paymongo.com/v1/sources');
  console.log('  Auth Header: Basic ' + auth);
  console.log('  Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(
      'https://api.paymongo.com/v1/sources',
      payload,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    const errorDetail = error.response?.data?.errors?.[0];
    console.error('\n🔴 ERROR Response:', {
      status: error.response?.status,
      errorDetail: errorDetail,
      fullResponse: JSON.stringify(error.response?.data, null, 2),
      requestData: JSON.stringify(error.config?.data, null, 2)
    });
  }
};

testPayMongoAPI();
