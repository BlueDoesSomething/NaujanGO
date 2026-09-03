const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'naujan_go'
};

const samplePOIs = [
  {
    name: 'Naujan Lake National Park',
    description: 'Beautiful freshwater lake perfect for boating and fishing',
    category: 'attraction',
    latitude: 13.3167,
    longitude: 121.2833
  },
  {
    name: 'Naujan Public Market',
    description: 'Local market with fresh produce and local goods',
    category: 'market',
    latitude: 13.3333,
    longitude: 121.3000
  },
  {
    name: 'Malaking Ilog Beach',
    description: 'Pristine beach with clear waters and white sand',
    category: 'beach',
    latitude: 13.2833,
    longitude: 121.3167
  },
  {
    name: 'Mount Halcon Base Camp',
    description: 'Starting point for Mount Halcon hiking adventures',
    category: 'mountain',
    latitude: 13.3500,
    longitude: 121.2500
  },
  {
    name: 'Naujan Town Plaza',
    description: 'Central town plaza for community events',
    category: 'landmark',
    latitude: 13.3340,
    longitude: 121.3010
  }
];

const sampleRoutes = [
  {
    user_id: 1,
    start_location: '13.3333,121.3000',
    end_location: '13.3167,121.2833',
    route_data: JSON.stringify({
      waypoints: [[13.3333, 121.3000], [13.3250, 121.2917], [13.3167, 121.2833]],
      distance: 5.2,
      duration: 15
    })
  },
  {
    user_id: 1,
    start_location: '13.3333,121.3000',
    end_location: '13.2833,121.3167',
    route_data: JSON.stringify({
      waypoints: [[13.3333, 121.3000], [13.3083, 121.3083], [13.2833, 121.3167]],
      distance: 8.1,
      duration: 25
    })
  }
];

async function seedMapData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database');

    // Insert POIs
    console.log('Inserting Points of Interest...');
    for (const poi of samplePOIs) {
      await connection.execute(
        'INSERT INTO points_of_interest (name, description, category, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
        [poi.name, poi.description, poi.category, poi.latitude, poi.longitude]
      );
    }

    // Insert Routes
    console.log('Inserting Routes...');
    for (const route of sampleRoutes) {
      await connection.execute(
        'INSERT INTO map_routes (user_id, start_location, end_location, route_data) VALUES (?, ?, ?, ?)',
        [route.user_id, route.start_location, route.end_location, route.route_data]
      );
    }

    console.log('Map data seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding map data:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedMapData();