// services/notification-service/controllers/notificationController.js
const notificationService = require('../services/notificationService');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const unreadOnly = req.query.unread === 'true';
    const notifications = await notificationService.getUserNotifications(userId, unreadOnly);
    const unreadCount = await notificationService.getUnreadCount(userId);
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

const createNotificationHandler = async (req, res, next) => {
  try {
    const { user_id, title, message, type, sendEmail } = req.body;
    if (!user_id || !title || !message) {
      return res.status(400).json({ message: 'user_id, title, and message are required.' });
    }
    const notification = await notificationService.createNotification(
      user_id,
      title,
      message,
      type || 'info',
      sendEmail !== false
    );
    res.status(201).json({ message: 'Notification created successfully', notification });
  } catch (error) {
    next(error);
  }
};

const markReadHandler = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : req.headers['x-user-id'];
    const notification = await notificationService.markAsRead(req.params.id, userId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    next(error);
  }
};

const markAllReadHandler = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    await notificationService.markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const getUnreadCountHandler = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  createNotificationHandler,
  markReadHandler,
  markAllReadHandler,
  getUnreadCountHandler
};
