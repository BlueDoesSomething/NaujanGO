import axios from 'axios';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY;
const auth = Buffer.from(PAYMONGO_SECRET_KEY).toString('base64');

console.log('🔐 Secret Key:', PAYMONGO_SECRET_KEY);
console.log('🔐 Public Key:', PUBLIC_KEY);
console.log('🔐 Base64 Auth:', auth);

// More test structures
const structures = [
  {
    name: "With type at root data level",
    payload: {
      data: {
        type: 'source',
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
    name: "All fields in root, no nesting",
    payload: {
      data: {
        attributes: {
          source_type: 'gcash',
          amount: 100000,
          currency: 'PHP',
          success_redirect_url: 'https://localhost:3000/payments/gcash/success',
          failed_redirect_url: 'https://localhost:3000/payments/gcash/failed'
        }
      }
    }
  },
  {
    name: "With description field",
    payload: {
      data: {
        attributes: {
          type: 'gcash',
          amount: 100000,
          currency: 'PHP',
          redirect: {
            success: 'https://localhost:3000/payments/gcash/success',
            failed: 'https://localhost:3000/payments/gcash/failed'
          },
          description: 'Hotel Booking Payment'
        }
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
