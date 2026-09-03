import axios from 'axios';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const auth = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

// Test different payload structures
const structures = [
  {
    name: "Current (data.attributes.source_type)",
    payload: {
      data: {
        attributes: {
          source_type: 'gcash',
          amount: 100000,
          currency: 'PHP',
          redirect: {
            success: 'https://localhost:3000/payments/gcash/success',
            failed: 'https://localhost:3000/payments/gcash/failed'
          }
        }
      }
    }
  },
  {
    name: "Try 1: source_type at data level",
    payload: {
      data: {
        source_type: 'gcash',
        attributes: {
          amount: 100000,
          currency: 'PHP',
          redirect: {
            success: 'https://localhost:3000/payments/gcash/success',
            failed: 'https://localhost:3000/payments/gcash/failed'
          }
        }
      }
    }
  },
  {
    name: "Try 2: Flat structure with all fields",
    payload: {
      data: {
        type: 'source',
        attributes: {
          type: 'source',
          source_type: 'gcash',
          amount: 100000,
          currency: 'PHP',
          redirect: {
            success: 'https://localhost:3000/payments/gcash/success',
            failed: 'https://localhost:3000/payments/gcash/failed'
          }
        }
      }
    }
  },
  {
    name: "Try 3: Minimal structure",
    payload: {
      source_type: 'gcash',
      amount: 100000,
      currency: 'PHP',
      redirect: {
        success: 'https://localhost:3000/payments/gcash/success',
        failed: 'https://localhost:3000/payments/gcash/failed'
      }
    }
  }
];

const testPayMongoStructures = async () => {
  for (const structure of structures) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${structure.name}`);
    console.log(`Payload:`, JSON.stringify(structure.payload, null, 2));
    
    try {
      const response = await axios.post(
        'https://api.paymongo.com/v1/sources',
        structure.payload,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ SUCCESS!');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      const errorDetail = error.response?.data?.errors?.[0];
      console.log('🔴 FAILED');
      console.log('Error Detail:', errorDetail);
    }
  }
};

testPayMongoStructures();
