import db from './db.js';

const checkItineraries = async () => {
  try {
    const [rows] = await db.promise().query(`
      SELECT i.itinerary_id, i.name, i.user_id, COUNT(ia.attraction_id) as item_count 
      FROM itineraries i 
      LEFT JOIN itinerary_attractions ia ON i.itinerary_id = ia.itinerary_id 
      GROUP BY i.itinerary_id 
      ORDER BY i.created_at DESC 
      LIMIT 10
    `);
    
    console.log('Saved Itineraries in Database:');
    if (rows.length === 0) {
      console.log('  ❌ NO ITINERARIES FOUND');
    } else {
      rows.forEach(r => {
        console.log(`  - ID: ${r.itinerary_id}, User: ${r.user_id}, Name: "${r.name}", Items: ${r.item_count}`);
      });
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkItineraries();
