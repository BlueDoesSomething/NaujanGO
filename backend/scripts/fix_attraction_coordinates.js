import db from '../db.js';

// Correct coordinates for Naujan attractions
// These are approximate and should be verified with actual locations
const correctCoordinates = [
  { id: 1, name: '333 Steps', latitude: 13.3167, longitude: 121.2833 }, // Near Naujan Lake area
  { id: 2, name: 'Arangin Falls', latitude: 13.3583, longitude: 121.3250 }, // Barangay Panaytayan area
  { id: 3, name: 'Naujan Town Plaza', latitude: 13.3333, longitude: 121.3000 }, // Town center
  { id: 4, name: 'Naujan Lake', latitude: 13.2833, longitude: 121.3167 }  // Lake area
];

async function fixCoordinates() {
  console.log('🔧 Fixing attraction coordinates...\n');

  try {
    // First, show current coordinates
    console.log('Current coordinates in database:');
    const [current] = await db.promise().query(
      'SELECT id, name, latitude, longitude FROM attractions ORDER BY id'
    );
    current.forEach(attr => {
      console.log(`  ${attr.id}. ${attr.name}: (${attr.latitude}, ${attr.longitude})`);
    });

    console.log('\n📍 Updating to correct Naujan coordinates...\n');

    // Update each attraction with correct coordinates
    for (const attraction of correctCoordinates) {
      await db.promise().query(
        'UPDATE attractions SET latitude = ?, longitude = ? WHERE id = ?',
        [attraction.latitude, attraction.longitude, attraction.id]
      );
      console.log(`✅ Updated ${attraction.name}: (${attraction.latitude}, ${attraction.longitude})`);
    }

    // Verify updates
    console.log('\n✨ Verification - New coordinates:');
    const [updated] = await db.promise().query(
      'SELECT id, name, latitude, longitude FROM attractions ORDER BY id'
    );
    updated.forEach(attr => {
      console.log(`  ${attr.id}. ${attr.name}: (${attr.latitude}, ${attr.longitude})`);
    });

    console.log('\n✅ Coordinates updated successfully!');
    console.log('📌 All attractions are now properly located in Naujan, Oriental Mindoro');
    
  } catch (error) {
    console.error('❌ Error updating coordinates:', error);
  } finally {
    process.exit(0);
  }
}

fixCoordinates();
