const Notification = require('../models/Notification');
const { sendNotification } = require('../socket/socket');

/**
 * Notification Service
 * Creates a notification in the DB and pushes it via Socket.io in real-time.
 *
 * @param {string} userId - Target user ID
 * @param {string} message - Notification message
 * @param {string} type - Notification type enum
 * @param {string} link - Optional deep-link URL
 */
const createNotification = async (userId, message, type = 'general', link = '') => {
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      type,
      link,
    });

    // Push real-time via Socket.io
    sendNotification(userId.toString(), {
      _id: notification._id,
      message,
      type,
      link,
      read: false,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error('Notification service error:', error.message);
  }
};

module.exports = { createNotification };
