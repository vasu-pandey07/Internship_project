const mongoose = require('mongoose');

/**
 * Notification Model
 * Stores in-app notifications for users.
 * Delivered in real-time via Socket.io, persisted in DB for history.
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'enrollment',
        'course_approved',
        'course_rejected',
        'quiz_result',
        'payment',
        'review',
        'general',
      ],
      default: 'general',
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String, // Optional deep-link URL
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
