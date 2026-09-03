import https from 'https';

const testData = {
  username: 'testuser' + Date.now(),
  email: 'bennokmadrigal26+verify@gmail.com',
  password: 'TestPassword123!',
  password_confirm: 'TestPassword123!'
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/auth/register-send-code',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  rejectUnauthorized: false // Allow self-signed certificates
};

console.log('📧 Testing Email Verification Registration Flow\n');
console.log('Test Data:');
console.log(`  Username: ${testData.username}`);
console.log(`  Email: ${testData.email}`);
console.log(`  Password: ${testData.password}\n`);

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n✅ Registration request successful!');
        if (response.devVerificationCode) {
          console.log(`📌 Dev Verification Code: ${response.devVerificationCode}`);
        }
        console.log('\n📧 Check your email (bennokmadrigal26@gmail.com) for the verification code!');
      } else {
        console.log('\n❌ Registration request failed:', response.message);
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

const jsonData = JSON.stringify(testData);
req.write(jsonData);
req.end();
