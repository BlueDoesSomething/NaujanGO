import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Create a test token for user 1
const token = jwt.sign({ user_id: 1 }, JWT_SECRET, { expiresIn: '1h' });

const testAPI = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/itinerary', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ API Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ API Error:');
    console.log('  Status:', error.response?.status);
    console.log('  Message:', error.response?.data?.error || error.message);
  }
};

testAPI();
