import { execute } from '../db.js';

export const createMapRoute = async (req, res) => {
  try {
    const { user_id, start_location, end_location, route_data } = req.body;

    await execute(
      'INSERT INTO map_routes (user_id, start_location, end_location, route_data, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, start_location, end_location, JSON.stringify(route_data)]
    );

    res.status(201).json({ message: 'Route saved successfully' });
  } catch (error) {
    console.error('Error saving route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserMapRoutes = async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT route_id, user_id, start_location, end_location, route_data, created_at FROM map_routes WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );

    const routes = rows.map(route => ({
      ...route,
      route_data: route.route_data ? JSON.parse(route.route_data) : null
    }));

    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMapRoutes = async (req, res) => {
  try {
    const [rows] = await execute(
      'SELECT route_id, user_id, start_location, end_location, route_data, created_at FROM map_routes ORDER BY created_at DESC LIMIT 100'
    );

    const routes = rows.map(route => ({
      ...route,
      route_data: route.route_data ? JSON.parse(route.route_data) : null
    }));

    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
