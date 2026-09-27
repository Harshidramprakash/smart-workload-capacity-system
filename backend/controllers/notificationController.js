// controllers/notificationController.js - Notification Controller
const notificationService = require('../services/notificationService');

/**
 * GET /api/notifications - Get notifications for current user
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user._id);
    const unreadCount = await notificationService.getUnreadCount(req.user._id);
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/:id/read - Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.params.id);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/notifications/read-all - Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
