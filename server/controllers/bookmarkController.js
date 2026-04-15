const User = require('../models/User');
const Course = require('../models/Course');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * @desc    Toggle bookmark on a course
 * @route   POST /api/v1/bookmarks/:courseId
 * @access  Student
 */
const toggleBookmark = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;
  const user = await User.findById(req.user._id);

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError('Course not found', 404);

  const bookmarkIndex = user.bookmarks.indexOf(courseId);

  if (bookmarkIndex > -1) {
    // Remove bookmark
    user.bookmarks.splice(bookmarkIndex, 1);
    await user.save();
    return res.status(200).json({
      success: true,
      message: 'Bookmark removed',
      data: { bookmarked: false },
    });
  }

  // Add bookmark
  user.bookmarks.push(courseId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Course bookmarked',
    data: { bookmarked: true },
  });
});

/**
 * @desc    Get bookmarked courses
 * @route   GET /api/v1/bookmarks
 * @access  Student
 */
const getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'bookmarks',
    select: 'title thumbnail price category avgRating instructor totalStudents',
    populate: { path: 'instructor', select: 'name' },
  });

  res.status(200).json({
    success: true,
    data: { bookmarks: user.bookmarks },
  });
});

module.exports = { toggleBookmark, getBookmarks };
