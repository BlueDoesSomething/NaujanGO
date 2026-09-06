import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  contactOwner,
  getMessages,
  getNotifications,
  markAllMessagesAsRead,
  markAllNotificationsAsRead,
  markMessageAsRead,
  markNotificationAsRead,
  sendMessage
} from '../controllers/messagesController.js';

const router = express.Router();

router.use(authenticateToken);

// Get user notifications
router.get('/notifications', getNotifications);

// Mark notification as read
router.put('/notifications/:id/read', markNotificationAsRead);
router.put('/notifications/read-all', markAllNotificationsAsRead);

// Get user messages
router.get('/messages', getMessages);

// Send message to hotel owner
router.post('/contact-owner', contactOwner);

// Send message
router.post('/messages', sendMessage);

// Mark message as read
router.put('/messages/:id/read', markMessageAsRead);
router.put('/messages/read-all', markAllMessagesAsRead);

export default router;
