const Notification = require('../models/Notification');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * @desc    Get user's notifications
 * @route   GET /api/v1/notifications
 * @access  Auth
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const query = { user: req.user._id };
  if (unreadOnly === 'true') query.read = false;

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:id/read
 * @access  Auth
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) throw new ApiError('Notification not found', 404);

  res.status(200).json({
    success: true,
    data: { notification },
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Auth
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
