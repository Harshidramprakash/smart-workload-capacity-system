// services/notification-service/services/notificationService.js - Notification Core Service
const Notification = require('../../../shared/models/Notification');
const User = require('../../../shared/models/User');
const smtpAdapter = require('../adapters/smtpAdapter');

/**
 * Create a new notification for a user (persists to DB and triggers SMTP adapter)
 */
const createNotification = async (userId, title, message, type = 'info', sendEmailAlert = true) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type
    });

    if (sendEmailAlert) {
      try {
        const user = await User.findById(userId);
        if (user && user.email) {
          await smtpAdapter.sendEmail({
            to: user.email,
            subject: `[Smart Workload Alert] ${title}`,
            text: `Hello ${user.name},\n\n${message}\n\nView details in your dashboard: http://localhost:5173\n\nSmart Workload System`,
            html: `<div style="font-family: sans-serif; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #334155;">${message}</p>
              <div style="margin-top: 20px;">
                <a href="http://localhost:5173" style="background-color: #2563eb; color: white; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">Open Dashboard</a>
              </div>
            </div>`
          });
        }
      } catch (emailErr) {
        console.error('[Notification Service] Failed to send email alert:', emailErr.message);
      }
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service] Error creating notification:', error.message);
    throw error;
  }
};

const getUserNotifications = async (userId, unreadOnly = false) => {
  const filter = { user_id: userId };
  if (unreadOnly) filter.is_read = false;
  return await Notification.find(filter).sort({ created_at: -1 }).limit(50);
};

const markAsRead = async (notificationId, userId = null) => {
  const filter = { _id: notificationId };
  if (userId) filter.user_id = userId;
  return await Notification.findOneAndUpdate(filter, { is_read: true }, { new: true });
};

const markAllAsRead = async (userId) => {
  return await Notification.updateMany({ user_id: userId, is_read: false }, { is_read: true });
};

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ user_id: userId, is_read: false });
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
