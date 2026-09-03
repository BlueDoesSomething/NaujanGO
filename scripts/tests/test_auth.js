// Test script for authentication
import axios from 'axios';
import bcrypt from 'bcryptjs';

const API_URL = 'http://localhost:3000';

const testUser = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'TestPassword123!'
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testRegistration() {
  console.log('\n=== Testing Registration ===');
  try {
    const response = await api.post('/auth/register', testUser);
    console.log('✓ Registration successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data.token;
  } catch (error) {
    console.error('✗ Registration failed:', error.response?.data || error.message);
    return null;
  }
}

async function testLogin() {
  console.log('\n=== Testing Login ===');
  try {
    const response = await api.post('/auth/login', {
      emailOrUsername: testUser.email,
      password: testUser.password
    });
    console.log('✓ Login successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data.token;
  } catch (error) {
    console.error('✗ Login failed:', error.response?.data || error.message);
  }
}

async function testLoginWithUsername() {
  console.log('\n=== Testing Login with Username ===');
  try {
    const response = await api.post('/auth/login', {
      emailOrUsername: testUser.username,
      password: testUser.password
    });
    console.log('✓ Login with username successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data.token;
  } catch (error) {
    console.error('✗ Login with username failed:', error.response?.data || error.message);
  }
}

async function testInvalidCredentials() {
  console.log('\n=== Testing Invalid Credentials ===');
  try {
    const response = await api.post('/auth/login', {
      emailOrUsername: testUser.email,
      password: 'wrongpassword'
    });
    console.log('✗ Should have failed but succeeded:', response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected invalid credentials');
      console.log('Error:', error.response.data);
    } else {
      console.error('✗ Unexpected error:', error.response?.data || error.message);
    }
  }
}

async function testBcryptHash() {
  console.log('\n=== Testing Bcrypt Hash/Compare ===');
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testUser.password, salt);
    console.log('Generated hash:', hash);
    
    const isMatch = await bcrypt.compare(testUser.password, hash);
    console.log('✓ Password comparison result:', isMatch);
    
    const isWrongMatch = await bcrypt.compare('wrongpassword', hash);
    console.log('✓ Wrong password comparison result:', isWrongMatch);
  } catch (error) {
    console.error('✗ Bcrypt test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('Starting authentication tests...');
  
  await testBcryptHash();
  await testRegistration();
  await testLogin();
  await testLoginWithUsername();
  await testInvalidCredentials();
  
  console.log('\n=== Tests Complete ===');
}

runAllTests().catch(console.error);
