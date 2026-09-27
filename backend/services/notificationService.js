// services/notificationService.js - In-App Notification Service
const Notification = require('../models/Notification');

/**
 * Create a new notification for a user
 * @param {string} userId - User ObjectId
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (task_assigned, task_reassigned, overloaded, deadline, info)
 */
const createNotification = async (userId, title, message, type = 'info') => {
  try {
    await Notification.create({
      user_id: userId,
      title,
      message,
      type
    });
  } catch (error) {
    console.error('Error creating notification:', error.message);
  }
};

/**
 * Get all notifications for a user
 * @param {string} userId - User ObjectId
 * @param {boolean} unreadOnly - If true, return only unread notifications
 * @returns {Array} - List of notifications
 */
const getUserNotifications = async (userId, unreadOnly = false) => {
  const filter = { user_id: userId };
  if (unreadOnly) filter.is_read = false;
  return await Notification.find(filter).sort({ created_at: -1 }).limit(50);
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ObjectId
 */
const markAsRead = async (notificationId) => {
  await Notification.findByIdAndUpdate(notificationId, { is_read: true });
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ObjectId
 */
const markAllAsRead = async (userId) => {
  await Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true });
};

/**
 * Get unread count for a user
 * @param {string} userId - User ObjectId
 * @returns {number} - Unread notification count
 */
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ user_id: userId, is_read: false });
};

// Placeholder for future email integration
const sendEmailNotification = async (email, subject, body) => {
  console.log(`[Email Placeholder] To: ${email}, Subject: ${subject}`);
  // Future: integrate with nodemailer or SendGrid
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  sendEmailNotification
};
