import db from '../db.js';

export const getNotifications = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [notifications] = await db.promise().query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  try {
    await db.promise().query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.user_id;
  try {
    await db.promise().query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

export const getMessages = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [messages] = await db.promise().query(
      `SELECT m.*,
        sender.username as sender_name,
        receiver.username as receiver_name
       FROM messages m
       JOIN users sender ON m.sender_id = sender.user_id
       JOIN users receiver ON m.receiver_id = receiver.user_id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY m.created_at DESC`,
      [userId, userId]
    );
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const contactOwner = async (req, res) => {
  const { hotel_id, subject, message } = req.body;
  const sender_id = req.user.user_id;

  if (!hotel_id || !message) {
    return res.status(400).json({ error: 'Hotel and message are required' });
  }

  try {
    const [owners] = await db.promise().query(
      'SELECT user_id FROM hotel_owners WHERE hotel_id = ?',
      [hotel_id]
    );

    if (owners.length === 0) {
      return res.status(404).json({ error: 'Hotel owner not found' });
    }

    const receiver_id = owners[0].user_id;

    const [result] = await db.promise().query(
      'INSERT INTO messages (sender_id, receiver_id, subject, message) VALUES (?, ?, ?, ?)',
      [sender_id, receiver_id, subject || 'Hotel Inquiry', message]
    );

    await db.promise().query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES (?, 'message', 'New Hotel Inquiry', ?, ?)`,
      [receiver_id, `You have a new inquiry from ${req.user.username}`, result.insertId]
    );

    res.json({ success: true, message_id: result.insertId });
  } catch (error) {
    console.error('Contact owner error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const sendMessage = async (req, res) => {
  const { receiver_id, subject, message } = req.body;
  const sender_id = req.user.user_id;

  if (!receiver_id || !message) {
    return res.status(400).json({ error: 'Receiver and message are required' });
  }

  try {
    const [result] = await db.promise().query(
      'INSERT INTO messages (sender_id, receiver_id, subject, message) VALUES (?, ?, ?, ?)',
      [sender_id, receiver_id, subject || 'No Subject', message]
    );

    await db.promise().query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES (?, 'message', 'New Message', ?, ?)`,
      [receiver_id, `You have a new message from ${req.user.username}`, result.insertId]
    );

    res.json({ success: true, message_id: result.insertId });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export const markMessageAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.user_id;
  try {
    await db.promise().query(
      'UPDATE messages SET is_read = TRUE WHERE message_id = ? AND receiver_id = ?',
      [id, userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

export const markAllMessagesAsRead = async (req, res) => {
  const userId = req.user.user_id;
  try {
    await db.promise().query(
      'UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND is_read = FALSE',
      [userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark all messages read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};
