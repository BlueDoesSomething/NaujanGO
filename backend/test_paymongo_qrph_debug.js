#!/usr/bin/env node
/**
 * Test PayMongo Available Source Types
 * Find out what payment methods PayMongo actually supports
 */

import 'dotenv/config';
import axios from 'axios';

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1';
const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

const testSourceType = async (type) => {
  try {
    const auth = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');
    
    const response = await axios.post(
      `${PAYMONGO_API_BASE}/sources`,
      {
        data: {
          attributes: {
            type: type,
            amount: 10000, // 100 PHP
            currency: 'PHP',
            description: `Test ${type}`,
            redirect: {
              success: 'https://localhost:3000/payments/success',
              failed: 'https://localhost:3000/payments/failed'
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return { type, success: true, data: response.data.data };
  } catch (error) {
    return { 
      type, 
      success: false, 
      error: error.response?.data?.errors?.[0]?.detail || error.message 
    };
  }
};

const testPayMongoSourceTypes = async () => {
  try {
    console.log('\n📊 === Testing PayMongo Source Types ===\n');
    console.log('Testing credentials:');
    console.log(`- Secret Key: ${PAYMONGO_SECRET_KEY?.substring(0, 10)}...\n`);

    // Test common e-wallet types
    const typesToTest = ['gcash', 'grabpay', 'qrph', 'card', 'alipay', 'dd_ubp', 'dd_bdo'];
    
    console.log('🧪 Testing source types:\n');
    
    for (const type of typesToTest) {
      const result = await testSourceType(type);
      
      if (result.success) {
        console.log(`✅ ${type.toUpperCase()} - SUPPORTED`);
        console.log(`   Source ID: ${result.data.id}`);
        console.log(`   Status: ${result.data.attributes.status}`);
        console.log(`   Has checkout_url: ${!!result.data.attributes.redirect?.checkout_url}`);
        if (result.data.attributes.redirect?.checkout_url) {
          console.log(`   URL: ${result.data.attributes.redirect.checkout_url.substring(0, 80)}...`);
        }
      } else {
        console.log(`❌ ${type.toUpperCase()} - NOT SUPPORTED`);
        console.log(`   Error: ${result.error}`);
      }
      console.log();
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
  }
};

testPayMongoSourceTypes();
