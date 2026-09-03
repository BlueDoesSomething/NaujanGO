import { execute } from './db.js';

(async () => {
  try {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS restaurants (
        restaurant_id INT(11) PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        cuisine_type VARCHAR(100),
        municipality VARCHAR(100),
        location VARCHAR(255),
        phone VARCHAR(20),
        email VARCHAR(255),
        price_range VARCHAR(50),
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INT DEFAULT 0,
        image_url VARCHAR(500),
        featured TINYINT(1) DEFAULT 0,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        opening_hours VARCHAR(100),
        closing_hours VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_featured (featured),
        INDEX idx_municipality (municipality),
        INDEX idx_rating (rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    console.log('Creating restaurants table...');
    await execute(createTableSql);
    console.log('✓ Restaurants table created successfully');

    // Insert sample data
    const insertSql = `
      INSERT INTO restaurants (name, description, cuisine_type, municipality, location, phone, email, price_range, rating, review_count, image_url, featured, latitude, longitude, opening_hours, closing_hours) VALUES
      ('Arsenia''s Hapag Kainan sa Kabukiran', 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 'Filipino', 'Calapan City', 'Mountain View Road, Calapan', '09171234567', 'arsenia@email.com', '$$', 4.8, 156, 'https://images.unsplash.com/photo-1543521521-7c8b9c6c5c1f?w=400&h=300&fit=crop', 1, 13.3333, 121.3000, '11:00', '22:00'),
      ('Dine at Log Grill and Resto', 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 'Filipino-Asian Fusion', 'Pinamalayan', 'Beach Road, Pinamalayan', '09187654321', 'dineatllog@email.com', '$$$', 4.6, 98, 'https://images.unsplash.com/photo-1537457985212-8c5a5f5f5f5f?w=400&h=300&fit=crop', 1, 13.2833, 121.3167, '12:00', '23:00'),
      ('Luca Cucina Italiana', 'Authentic Italian restaurant with homemade pasta and premium imported ingredients. Perfect for romantic dinners.', 'Italian', 'Puerto Galera', 'Main Street, Puerto Galera', '09198765432', 'luca@email.com', '$$$', 4.7, 132, 'https://images.unsplash.com/photo-1552566626-5e751f6a6a2f?w=400&h=300&fit=crop', 1, 13.2500, 121.2833, '11:30', '22:30'),
      ('Red Tomato Resto Farm', 'Farm-to-table dining with organic produce from our own farm. Fresh seafood and local specialties.', 'Seafood & Filipino', 'Roxas', 'Farm Road, Roxas', '09165432109', 'redtomato@email.com', '$$', 4.5, 87, 'https://images.unsplash.com/photo-1504674900923-2cc92358e5a7?w=400&h=300&fit=crop', 1, 13.1833, 121.3500, '10:00', '21:00'),
      ('Casa del Mar Seafood', 'Beachfront dining with fresh daily catch. Specializing in grilled seafood and Asian-inspired dishes.', 'Seafood', 'Pola', 'Beach View, Pola', '09179876543', 'casadelmar@email.com', '$$', 4.4, 76, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 0, 13.0833, 121.4000, '12:00', '21:30'),
      ('Kalesa Cafe & Bistro', 'Cozy cafe with local pastries, coffee, and light meals. Great for breakfast and casual lunch.', 'Cafe & Bistro', 'Naujan', 'Town Center, Naujan', '09156789012', 'kalesa@email.com', '$', 4.3, 64, 'https://images.unsplash.com/photo-1514432324607-b174f8a68bb3?w=400&h=300&fit=crop', 0, 13.3340, 121.3010, '07:00', '18:00'),
      ('Bahay Kubo Restaurant', 'Traditional Filipino comfort food in a beautiful garden setting. Famous for their fried chicken and fried fish.', 'Filipino', 'Baco', 'Garden View, Baco', '09143210987', 'bahaykubo@email.com', '$$', 4.5, 95, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 0, 13.4000, 121.2500, '11:00', '20:30'),
      ('Sushi & Sake House', 'Contemporary Japanese restaurant with sushi bar and private dining rooms. Fresh fish delivered daily.', 'Japanese', 'Calapan City', 'Business District, Calapan', '09171112233', 'sushi@email.com', '$$$', 4.6, 108, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', 0, 13.3350, 121.2950, '11:30', '22:00')
    `;

    console.log('Inserting sample restaurant data...');
    await execute(insertSql);
    console.log('✓ Sample data inserted successfully');

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
})();
