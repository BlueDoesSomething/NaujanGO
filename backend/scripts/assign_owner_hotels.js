import db from '../db.js';

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const run = async () => {
  const connection = await db.promise().getConnection();
  try {
    const [owners] = await connection.query(
      "SELECT user_id FROM users WHERE role = 'owner' ORDER BY user_id"
    );
    const [hotels] = await connection.query('SELECT hotel_id FROM hotels ORDER BY hotel_id');

    if (owners.length === 0) {
      console.log('No owners found.');
      return;
    }

    if (hotels.length === 0) {
      console.log('No hotels found.');
      return;
    }

    const baseHotels = shuffle(hotels);
    let hotelIndex = 0;
    let assigned = 0;

    await connection.beginTransaction();
    await connection.query('DELETE FROM hotel_owners');

    for (const owner of owners) {
      if (hotelIndex >= baseHotels.length) {
        hotelIndex = 0;
      }

      const hotel = baseHotels[hotelIndex];
      hotelIndex += 1;

      await connection.query(
        'INSERT INTO hotel_owners (user_id, hotel_id) VALUES (?, ?)',
        [owner.user_id, hotel.hotel_id]
      );
      assigned += 1;
    }

    await connection.commit();
    console.log(`Assigned ${assigned} owners to ${baseHotels.length} hotels.`);
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError.message);
    }
    console.error('Assignment failed:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    db.end();
  }
};

run();
