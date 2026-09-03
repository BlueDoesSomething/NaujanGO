import db from '../db.js';

let reviewsItineraryColumnSupportPromise;
let itineraryAttractionColumnsPromise;

const hasReviewsItineraryColumn = async () => {
  if (!reviewsItineraryColumnSupportPromise) {
    reviewsItineraryColumnSupportPromise = db.promise().query(
      `SELECT COUNT(*) AS column_count
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'reviews'
         AND column_name = 'itinerary_id'`
    )
      .then(([rows]) => Number(rows?.[0]?.column_count || 0) > 0)
      .catch(() => false);
  }

  return reviewsItineraryColumnSupportPromise;
};

const getItineraryAttractionColumns = async () => {
  if (!itineraryAttractionColumnsPromise) {
    itineraryAttractionColumnsPromise = db.promise().query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'itinerary_attractions'`
    )
      .then(([rows]) => new Set((rows || []).map((row) => row.column_name)))
      .catch(() => new Set());
  }

  return itineraryAttractionColumnsPromise;
};

const hasItineraryAttractionColumn = async (columnName) => {
  const columns = await getItineraryAttractionColumns();
  return columns.has(columnName);
};

export const getItineraries = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM itineraries WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.user_id]
    );
    
    res.json({
      success: true,
      data: rows || []
    });
  } catch (err) {
    console.error('Failed to fetch itineraries:', err);
    res.status(500).json({ error: 'Failed to fetch itineraries' });
  }
};

export const createItinerary = async (req, res) => {
  const { name, description, start_date, end_date, items, attractions, totalDistance, totalTime, totalBudget } = req.body;

  if (!name) return res.status(400).json({ error: 'Itinerary name is required' });

  const itemsToSave = items || attractions;
  if (!itemsToSave || itemsToSave.length === 0) {
    return res.status(400).json({ error: 'At least one item is required' });
  }

  try {

    const [result] = await db.promise().query(
      'INSERT INTO itineraries (user_id, name, description, start_date, end_date, total_distance, total_time, total_budget, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.user_id, name, description || null, start_date || null, end_date || null, totalDistance || 0, totalTime || 0, totalBudget || 0, 'planning']
    );

    const itineraryId = result.insertId;

    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        try {
          await db.promise().query(
            `INSERT INTO itinerary_attractions
            (itinerary_id, attraction_id, order_sequence, estimated_duration, estimated_cost,
             day_number, duration_minutes, item_type, custom_name, custom_location,
             latitude, longitude, priority, weather_dependent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              itineraryId,
              item.attraction_id || item.id,
              item.order_in_day ?? item.order_sequence ?? i + 1,
              item.estimated_duration || item.duration_minutes || 120,
              item.estimated_cost || 0,
              item.day_number || 1,
              item.duration_minutes || 120,
              item.item_type || 'attraction',
              item.custom_name || null,
              item.custom_location || null,
              item.latitude || null,
              item.longitude || null,
              item.priority || 'medium',
              item.weather_dependent || false
            ]
          );
        } catch (insertError) {
          console.log('Enhanced columns not available, using basic insert');
          await db.promise().query(
            `INSERT INTO itinerary_attractions
            (itinerary_id, attraction_id, order_sequence, estimated_duration)
            VALUES (?, ?, ?, ?)`,
            [
              itineraryId,
              item.attraction_id || item.id,
              item.order_in_day ?? item.order_sequence ?? i + 1,
              item.estimated_duration || item.duration_minutes || 120
            ]
          );
        }
      }
    } else {
      for (let i = 0; i < attractions.length; i++) {
        await db.promise().query(
          'INSERT INTO itinerary_attractions (itinerary_id, attraction_id, order_sequence) VALUES (?, ?, ?)',
          [itineraryId, attractions[i].id, i + 1]
        );
      }
    }

    res.json({ success: true, itinerary_id: itineraryId });
  } catch (err) {
    console.error('Save itinerary error:', err);
    res.status(500).json({ error: 'Failed to save itinerary: ' + err.message });
  }
};

export const getItineraryById = async (req, res) => {
  const { id } = req.params;

  try {
    const [itineraries] = await db.promise().query(
      `SELECT i.*, u.username as creator_name
       FROM itineraries i
       LEFT JOIN users u ON i.user_id = u.user_id
       WHERE i.itinerary_id = ? AND i.user_id = ?`,
      [id, req.user.user_id]
    );

    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = itineraries[0];

    const itineraryColumns = await getItineraryAttractionColumns();
    const hasDayNumber = itineraryColumns.has('day_number');
    const hasEstimatedCost = itineraryColumns.has('estimated_cost');
    const hasDurationMinutes = itineraryColumns.has('duration_minutes');
    const hasItemType = itineraryColumns.has('item_type');
    const hasCustomName = itineraryColumns.has('custom_name');
    const hasCustomLocation = itineraryColumns.has('custom_location');
    const hasLatitude = itineraryColumns.has('latitude');
    const hasLongitude = itineraryColumns.has('longitude');
    const hasPriority = itineraryColumns.has('priority');
    const hasWeatherDependent = itineraryColumns.has('weather_dependent');
    const hasCompleted = itineraryColumns.has('completed');
    const hasStartTime = itineraryColumns.has('start_time');
    const hasNotes = itineraryColumns.has('notes');
    const hasActualCost = itineraryColumns.has('actual_cost');
    const hasCostCategory = itineraryColumns.has('cost_category');

    const itemSelectFields = [
      'ia.id',
      'ia.itinerary_id',
      'ia.attraction_id',
      'ia.order_sequence',
      'ia.estimated_duration',
      `${hasDayNumber ? 'ia.day_number' : '1'} AS day_number`,
      `${hasEstimatedCost ? 'ia.estimated_cost' : '0'} AS estimated_cost`,
      `${hasDurationMinutes ? 'ia.duration_minutes' : 'COALESCE(ia.estimated_duration, 120)'} AS duration_minutes`,
      `${hasItemType ? 'ia.item_type' : "'attraction'"} AS item_type`,
      `${hasCustomName ? 'ia.custom_name' : 'NULL'} AS custom_name`,
      `${hasCustomLocation ? 'ia.custom_location' : 'NULL'} AS custom_location`,
      `${hasLatitude ? 'ia.latitude' : 'NULL'} AS latitude`,
      `${hasLongitude ? 'ia.longitude' : 'NULL'} AS longitude`,
      `${hasPriority ? 'ia.priority' : "'medium'"} AS priority`,
      `${hasWeatherDependent ? 'ia.weather_dependent' : '0'} AS weather_dependent`,
      `${hasCompleted ? 'ia.completed' : '0'} AS completed`,
      `${hasStartTime ? 'ia.start_time' : 'NULL'} AS start_time`,
      `${hasNotes ? 'ia.notes' : 'NULL'} AS notes`,
      `${hasActualCost ? 'ia.actual_cost' : '0'} AS actual_cost`,
      `${hasCostCategory ? 'ia.cost_category' : 'NULL'} AS cost_category`,
      'a.name as attraction_name',
      'a.description as attraction_description',
      'a.location as attraction_location',
      'a.image_url as attraction_image',
      'a.latitude as attraction_latitude',
      'a.longitude as attraction_longitude'
    ];

    const orderByClause = hasDayNumber
      ? 'ORDER BY COALESCE(ia.day_number, 1), ia.order_sequence'
      : 'ORDER BY ia.order_sequence';

    const [items] = await db.promise().query(
      `SELECT ${itemSelectFields.join(', ')}
       FROM itinerary_attractions ia
       LEFT JOIN attractions a ON ia.attraction_id = a.id
       WHERE ia.itinerary_id = ?
       ${orderByClause}`,
      [id]
    );

    itinerary.items = items;
    itinerary.attractions = items;

    // Calculate totals from items if not already set
    if (!itinerary.total_budget || itinerary.total_budget === 0) {
      itinerary.total_budget = items.reduce((sum, item) => sum + (parseFloat(item.estimated_cost) || 0), 0);
    }
    
    if (!itinerary.total_time || itinerary.total_time === 0) {
      itinerary.total_time = items.reduce((sum, item) => sum + (parseInt(item.duration_minutes) || 0), 0);
    }
    
    if (!itinerary.total_distance || itinerary.total_distance === 0) {
      itinerary.total_distance = items.reduce((sum, item) => sum + (parseFloat(item.distance_km) || 0), 0);
    }

    res.json(itinerary);
  } catch (err) {
    console.error('Failed to fetch itinerary:', err);
    res.status(500).json({ error: 'Failed to load itinerary' });
  }
};

export const getItineraryStatistics = async (req, res) => {
  const { id } = req.params;

  try {
    const [itineraries] = await db.promise().query(
      'SELECT * FROM itineraries WHERE itinerary_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const hasCompleted = await hasItineraryAttractionColumn('completed');
    const hasEstimatedCost = await hasItineraryAttractionColumn('estimated_cost');
    const hasActualCost = await hasItineraryAttractionColumn('actual_cost');
    const hasCostCategory = await hasItineraryAttractionColumn('cost_category');

    const [items] = await db.promise().query(
      `SELECT
         COUNT(*) as total_items,
         ${hasCompleted ? 'SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END)' : '0'} as completed_items
       FROM itinerary_attractions
       WHERE itinerary_id = ?`,
      [id]
    );

    const [budgetRows] = await db.promise().query(
      `SELECT
         ${hasCostCategory ? 'COALESCE(cost_category, \"uncategorized\")' : '\"uncategorized\"'} as cost_category,
         ${hasEstimatedCost ? 'COALESCE(SUM(estimated_cost), 0)' : '0'} as estimated_total,
         ${hasActualCost ? 'COALESCE(SUM(actual_cost), 0)' : '0'} as actual_total,
         COUNT(*) as item_count
       FROM itinerary_attractions
       WHERE itinerary_id = ?
       ${hasCostCategory ? 'GROUP BY COALESCE(cost_category, \"uncategorized\")' : ''}`,
      [id]
    );

    const itinerary = itineraries[0];
    const statistics = {
      total_items: items[0].total_items,
      total_distance: itinerary.total_distance,
      total_time: itinerary.total_time,
      total_budget: itinerary.total_budget,
      status: itinerary.status,
      progress: {
        total_items: Number(items[0].total_items || 0),
        completed_items: Number(items[0].completed_items || 0)
      },
      budget: (budgetRows || []).map((row) => ({
        cost_category: row.cost_category,
        estimated_total: Number(row.estimated_total || 0),
        actual_total: Number(row.actual_total || 0),
        item_count: Number(row.item_count || 0)
      }))
    };

    res.json(statistics);
  } catch (err) {
    console.error('Failed to fetch statistics:', err);
    res.status(500).json({ error: 'Failed to load statistics' });
  }
};

export const updateItinerary = async (req, res) => {
  const { id } = req.params;

  try {
    const [itineraries] = await db.promise().query(
      'SELECT * FROM itineraries WHERE itinerary_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const allowedFields = ['name', 'description', 'start_date', 'end_date', 'status', 'total_distance', 'total_time', 'total_budget'];
    const updates = [];
    const values = [];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    values.push(req.user.user_id);

    await db.promise().query(
      `UPDATE itineraries SET ${updates.join(', ')} WHERE itinerary_id = ? AND user_id = ?`,
      values
    );

    if (req.body.items && Array.isArray(req.body.items)) {
      await db.promise().query(
        'DELETE FROM itinerary_attractions WHERE itinerary_id = ?',
        [id]
      );

      for (let i = 0; i < req.body.items.length; i++) {
        const item = req.body.items[i];

        try {
          await db.promise().query(
            `INSERT INTO itinerary_attractions
            (itinerary_id, attraction_id, order_sequence, estimated_duration, estimated_cost,
             day_number, duration_minutes, item_type, custom_name, custom_location,
             latitude, longitude, priority, weather_dependent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              item.attraction_id || item.id,
              item.order_in_day ?? item.order_sequence ?? i + 1,
              item.estimated_duration || item.duration_minutes || 120,
              item.estimated_cost || 0,
              item.day_number || 1,
              item.duration_minutes || 120,
              item.item_type || 'attraction',
              item.custom_name || null,
              item.custom_location || null,
              item.latitude || null,
              item.longitude || null,
              item.priority || 'medium',
              item.weather_dependent || false
            ]
          );
        } catch (insertError) {
          console.log('Enhanced columns not available, using basic insert');
          await db.promise().query(
            `INSERT INTO itinerary_attractions
            (itinerary_id, attraction_id, order_sequence, estimated_duration)
            VALUES (?, ?, ?, ?)`,
            [
              id,
              item.attraction_id || item.id,
              item.order_in_day ?? item.order_sequence ?? i + 1,
              item.estimated_duration || item.duration_minutes || 120
            ]
          );
        }
      }
    }

    res.json({ success: true, message: 'Itinerary updated successfully', itinerary_id: id });
  } catch (err) {
    console.error('Update itinerary error:', err);
    res.status(500).json({ error: 'Failed to update itinerary' });
  }
};

export const deleteItinerary = async (req, res) => {
  const { id } = req.params;

  try {
    // Archive the itinerary instead of fully deleting it
    const [result] = await db.promise().query(
      'UPDATE itineraries SET status = ?, updated_at = NOW() WHERE itinerary_id = ? AND user_id = ?',
      ['archived', id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    res.json({ success: true, message: 'Itinerary archived successfully' });
  } catch (err) {
    console.error('Archive itinerary error:', err);
    res.status(500).json({ error: 'Failed to archive itinerary' });
  }
};

export const getItineraryWeather = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM weather_data WHERE attraction_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [req.params.attractionId]
    );
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

export const saveItineraryAssumptions = async (req, res) => {
  const { id } = req.params;
  const { farePerDay = 0, foodPerDay = 0, otherPerDay = 0 } = req.body || {};

  try {
    const [itineraries] = await db.promise().query(
      'SELECT * FROM itineraries WHERE itinerary_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (itineraries.length === 0) return res.status(404).json({ error: 'Itinerary not found' });

    // Check if column exists
    const [cols] = await db.promise().query(
      `SELECT COUNT(*) AS c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'itineraries' AND column_name = 'budget_assumptions'`
    );

    if (Number(cols?.[0]?.c || 0) === 0) {
      // Try to add JSON column (safe if DB supports it)
      try {
        await db.promise().query(`ALTER TABLE itineraries ADD COLUMN budget_assumptions JSON NULL`);
      } catch (e) {
        console.warn('Failed to add budget_assumptions column:', e.message);
      }
    }

    const assumptions = { farePerDay: Number(farePerDay || 0), foodPerDay: Number(foodPerDay || 0), otherPerDay: Number(otherPerDay || 0) };

    // Try to persist as JSON string (works for MySQL 5.7+ JSON or TEXT fallback)
    await db.promise().query(
      `UPDATE itineraries SET budget_assumptions = ? WHERE itinerary_id = ? AND user_id = ?`,
      [JSON.stringify(assumptions), id, req.user.user_id]
    );

    res.json({ success: true, assumptions });
  } catch (err) {
    console.error('Failed to save itinerary assumptions:', err);
    res.status(500).json({ error: 'Failed to save assumptions' });
  }
};

export const createItineraryWeather = async (req, res) => {
  const { attraction_id, temperature, humidity, wind_speed, weather_condition, description } = req.body;

  try {
    await db.promise().query(
      'INSERT INTO weather_data (attraction_id, temperature, humidity, wind_speed, weather_condition, description) VALUES (?, ?, ?, ?, ?, ?)',
      [attraction_id, temperature, humidity, wind_speed, weather_condition, description]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save weather data' });
  }
};

export const getItineraryTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        name: 'Waterfalls & Lake Adventure',
        description: 'Chase Naujan\'s most stunning waterfalls and end the day at the serene Naujan Lake National Park — perfect for nature lovers and outdoor enthusiasts.',
        category: 'Nature',
        attractions: [2, 7, 15, 16, 4, 19],
        duration: '2 days'
      },
      {
        id: 2,
        name: 'Heritage & Culture Trail',
        description: 'Walk through Naujan\'s rich history — from the ancient Simbahang Bato ruins and Liwasang Bonifacio to the vibrant public market and Mulawin Boulevard.',
        category: 'Cultural',
        attractions: [5, 3, 12, 20, 17, 1],
        duration: '1 day'
      },
      {
        id: 3,
        name: 'Farm & Eco Experience',
        description: 'Discover Naujan\'s agri-tourism gems — organic farms, healing parks, and scenic farmhouses that showcase the municipality\'s sustainable and rural charm.',
        category: 'Eco-Tourism',
        attractions: [8, 9, 10, 14, 11, 6, 13],
        duration: '2 days'
      }
    ];
    res.json(templates);
  } catch (err) {
    console.error('Failed to fetch templates:', err);
    res.json([]);
  }
};

export const recalculateItineraryBudget = async (req, res) => {
  const { id } = req.params;
  const { farePerDay = 0, foodPerDay = 0, otherPerDay = 0 } = req.body || {};

  try {
    const [itineraries] = await db.promise().query(
      'SELECT * FROM itineraries WHERE itinerary_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = itineraries[0];
    const hasEstimatedCost = await hasItineraryAttractionColumn('estimated_cost');
    
    // Sum attraction item costs
    const [budgetResult] = await db.promise().query(
      `SELECT ${hasEstimatedCost ? 'COALESCE(SUM(estimated_cost), 0)' : '0'} as total_budget
       FROM itinerary_attractions
       WHERE itinerary_id = ?`,
      [id]
    );

    let totalBudget = parseFloat(budgetResult[0].total_budget);

    // Calculate number of days
    let numDays = itinerary.duration_days || 1;
    if (itinerary.start_date && itinerary.end_date) {
      const start = new Date(itinerary.start_date);
      const end = new Date(itinerary.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      numDays = diffDays > 0 ? diffDays : (itinerary.duration_days || 1);
    }

    // Add daily budget assumptions from the request (current UI values)
    const farePerDayVal = parseFloat(farePerDay) || 0;
    const foodPerDayVal = parseFloat(foodPerDay) || 0;
    const otherPerDayVal = parseFloat(otherPerDay) || 0;
    
    const dailyBudgetTotal = (farePerDayVal + foodPerDayVal + otherPerDayVal) * numDays;
    totalBudget += dailyBudgetTotal;

    await db.promise().query(
      'UPDATE itineraries SET total_budget = ? WHERE itinerary_id = ?',
      [totalBudget, id]
    );

    res.json({
      success: true,
      total_budget: totalBudget,
      message: 'Budget recalculated successfully from items and daily estimates'
    });
  } catch (err) {
    console.error('Failed to recalculate budget:', err);
    res.status(500).json({ error: 'Failed to recalculate budget' });
  }
};

export const getItineraryBudgetBreakdown = async (req, res) => {
  const { id } = req.params;
  const farePerDay = parseFloat(req.query.farePerDay || '0') || 0;
  const foodPerDay = parseFloat(req.query.foodPerDay || '0') || 0;
  const otherPerDay = parseFloat(req.query.otherPerDay || '0') || 0;

  try {
    const [itineraries] = await db.promise().query(
      'SELECT * FROM itineraries WHERE itinerary_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    const itinerary = itineraries[0];

    const itineraryColumns = await getItineraryAttractionColumns();
    const hasDayNumber = itineraryColumns.has('day_number');
    const hasEstimatedCost = itineraryColumns.has('estimated_cost');
    const hasDurationMinutes = itineraryColumns.has('duration_minutes');

    const itemSelectFields = [
      'ia.id',
      'ia.itinerary_id',
      'ia.attraction_id',
      'ia.order_sequence',
      'ia.estimated_duration',
      `${hasDayNumber ? 'ia.day_number' : '1'} AS day_number`,
      `${hasEstimatedCost ? 'ia.estimated_cost' : '0'} AS estimated_cost`,
      `${hasDurationMinutes ? 'ia.duration_minutes' : 'COALESCE(ia.estimated_duration, 120)'} AS duration_minutes`
    ];

    const orderByClause = hasDayNumber
      ? 'ORDER BY COALESCE(ia.day_number, 1), ia.order_sequence'
      : 'ORDER BY ia.order_sequence';

    const [items] = await db.promise().query(
      `SELECT ${itemSelectFields.join(', ')} FROM itinerary_attractions ia WHERE ia.itinerary_id = ? ${orderByClause}`,
      [id]
    );

    // Normalize items into days (infer if no explicit day_number)
    let normalized = items || [];
    const hasExplicitMultiDay = normalized.some((it) => {
      const day = Number.parseInt(it.day_number, 10);
      return !Number.isNaN(day) && day > 1;
    });

    if (!hasExplicitMultiDay) {
      // infer day breaks from non-increasing order_sequence
      let inferredDay = 1;
      let previousOrder = null;
      normalized = normalized.map((item, idx) => {
        const currOrder = Number.parseInt(item.order_sequence, 10);
        if (idx > 0 && !Number.isNaN(currOrder) && previousOrder !== null && currOrder <= previousOrder) {
          inferredDay += 1;
        }
        if (!Number.isNaN(currOrder)) previousOrder = currOrder;
        return { ...item, day_number: inferredDay };
      });
    }

    const itemsByDay = {};
    normalized.forEach(it => {
      const parsedDay = Number.parseInt(it.day_number, 10);
      const day = Number.isNaN(parsedDay) || parsedDay < 1 ? 1 : parsedDay;
      if (!itemsByDay[day]) itemsByDay[day] = [];
      itemsByDay[day].push(it);
    });

    const maxDay = Math.max(...Object.keys(itemsByDay).map(Number), 1);
    const durationDays = itinerary.duration_days || maxDay || 1;
    const perDayBudget = durationDays > 0 ? (parseFloat(itinerary.total_budget || 0) / durationDays) : 0;

    const breakdown = Array.from({ length: durationDays }, (_, i) => i + 1).map(day => {
      const estimatedNeed = farePerDay + foodPerDay + otherPerDay;
      const balance = perDayBudget - estimatedNeed;
      return {
        day,
        dayBudget: perDayBudget,
        fareCost: farePerDay,
        foodCost: foodPerDay,
        otherCost: otherPerDay,
        estimatedNeed,
        balance,
        fits: balance >= 0
      };
    });

    res.json({ perDayBudget, days: durationDays, breakdown });
  } catch (err) {
    console.error('Failed to fetch budget breakdown:', err);
    res.status(500).json({ error: 'Failed to fetch budget breakdown' });
  }
};

// Get all reviews for an itinerary with attraction details
export const getItineraryReviews = async (req, res) => {
  const { id } = req.params;

  try {
    const supportsItineraryLink = await hasReviewsItineraryColumn();

    // Verify itinerary belongs to user
    const [itineraries] = await db.promise().query(
      'SELECT itinerary_id FROM itineraries WHERE itinerary_id = ? AND user_id = ?',
      [id, req.user.user_id]
    );

    if (itineraries.length === 0) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Get all reviews for attractions in this itinerary
    const [reviews] = supportsItineraryLink
      ? await db.promise().query(
          `SELECT r.review_id, r.user_id, r.attraction_id, r.rating, r.comment, r.review_date, r.moderated, r.helpful_count,
                  a.name as attraction_name, a.location, a.image_url,
                  ia.day_number, ia.order_sequence,
                  u.username
           FROM reviews r
           JOIN itinerary_attractions ia ON r.attraction_id = ia.attraction_id AND ia.itinerary_id = ?
           JOIN attractions a ON r.attraction_id = a.id
           LEFT JOIN users u ON r.user_id = u.user_id
           WHERE r.itinerary_id = ? AND r.moderated = 1
           ORDER BY ia.day_number ASC, ia.order_sequence ASC, r.review_date DESC`,
          [id, id]
        )
      : await db.promise().query(
          `SELECT r.review_id, r.user_id, r.attraction_id, r.rating, r.comment, r.review_date, r.moderated, r.helpful_count,
                  a.name as attraction_name, a.location, a.image_url,
                  ia.day_number, ia.order_sequence,
                  u.username
           FROM reviews r
           JOIN itinerary_attractions ia ON r.attraction_id = ia.attraction_id AND ia.itinerary_id = ?
           JOIN attractions a ON r.attraction_id = a.id
           LEFT JOIN users u ON r.user_id = u.user_id
           WHERE r.moderated = 1
           ORDER BY ia.day_number ASC, ia.order_sequence ASC, r.review_date DESC`,
          [id]
        );

    res.json({
      success: true,
      data: reviews || []
    });
  } catch (err) {
    console.error('Failed to fetch itinerary reviews:', err);
    res.status(500).json({ error: 'Failed to fetch itinerary reviews' });
  }
};
