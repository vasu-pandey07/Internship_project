const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Review = require('../models/Review');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Question = require('../models/Question');
const { asyncHandler, ApiError } = require('../utils/helpers');
const { evaluateCourseLegitimacy } = require('../services/courseModeration');

/**
 * @desc    Get all users (paginated)
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const query = {};

  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-bookmarks')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
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
 * @desc    Update user role
 * @route   PUT /api/v1/admin/users/:id/role
 * @access  Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['student', 'instructor', 'admin'].includes(role)) {
    throw new ApiError('Invalid role', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  );

  if (!user) throw new ApiError('User not found', 404);

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: { user },
  });
});

/**
 * @desc    Delete a user
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError('User not found', 404);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * @desc    Get courses pending approval
 * @route   GET /api/v1/admin/courses/pending
 * @access  Admin
 */
const getPendingCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ status: 'pending' })
    .populate('instructor', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: { courses },
  });
});

/**
 * @desc    Get full course details + AI moderation review (admin)
 * @route   GET /api/v1/admin/courses/:id/review
 * @access  Admin
 */
const getCourseReview = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name email')
    .populate({
      path: 'lessons',
      select: 'title order duration content isFreePreview videoUrl createdAt',
      options: { sort: { order: 1 } },
    });

  if (!course) throw new ApiError('Course not found', 404);

  const aiReview = await evaluateCourseLegitimacy(course, course.lessons || []);

  res.status(200).json({
    success: true,
    data: { course, aiReview },
  });
});

/**
 * @desc    Approve/Reject a course
 * @route   PUT /api/v1/admin/courses/:id/status
 * @access  Admin
 */
const updateCourseStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    throw new ApiError('Status must be approved or rejected', 400);
  }

  const normalizedReason = String(reason || '').trim();
  const updatePayload = {
    status,
    rejectedReason: status === 'rejected' ? normalizedReason : '',
  };

  const course = await Course.findByIdAndUpdate(
    req.params.id,
    updatePayload,
    { new: true }
  );

  if (!course) throw new ApiError('Course not found', 404);

  // Notify instructor
  const rejectionReason =
    status === 'rejected' && normalizedReason
      ? ` Reason: ${normalizedReason}`
      : '';
  await Notification.create({
    user: course.instructor,
    message: `Your course "${course.title}" has been ${status}.${rejectionReason}`,
    type: status === 'approved' ? 'course_approved' : 'course_rejected',
    link: `/instructor/courses/${course._id}`,
  });

  res.status(200).json({
    success: true,
    message: `Course ${status}`,
    data: { course },
  });
});

/**
 * @desc    Delete a course (admin)
 * @route   DELETE /api/v1/admin/courses/:id
 * @access  Admin
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError('Course not found', 404);

  const quizzes = await Quiz.find({ course: course._id }).select('_id');
  const quizIds = quizzes.map((quiz) => quiz._id);

  await Promise.all([
    Lesson.deleteMany({ course: course._id }),
    Enrollment.deleteMany({ course: course._id }),
    Review.deleteMany({ course: course._id }),
    Payment.deleteMany({ course: course._id }),
    Quiz.deleteMany({ course: course._id }),
    Assignment.deleteMany({ course: course._id }),
    AssignmentSubmission.deleteMany({ course: course._id }),
    Question.deleteMany({ course: course._id }),
    quizIds.length > 0 ? QuizAttempt.deleteMany({ quiz: { $in: quizIds } }) : Promise.resolve(),
    User.updateMany({ bookmarks: course._id }, { $pull: { bookmarks: course._id } }),
    Course.findByIdAndDelete(course._id),
  ]);

  await Notification.create({
    user: course.instructor,
    message: `Your course "${course.title}" was deleted by admin`,
    type: 'general',
    link: '/instructor/dashboard',
  });

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
});

/**
 * @desc    Get platform analytics
 * @route   GET /api/v1/admin/analytics
 * @access  Admin
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalStudents,
    totalInstructors,
    totalCourses,
    approvedCourses,
    pendingCourses,
    totalEnrollments,
    totalRevenue,
    recentEnrollments,
    topCourses,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
    Course.countDocuments(),
    Course.countDocuments({ status: 'approved' }),
    Course.countDocuments({ status: 'pending' }),
    Enrollment.countDocuments(),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Enrollment.find()
      .populate('student', 'name')
      .populate('course', 'title')
      .sort('-createdAt')
      .limit(10),
    Course.find({ status: 'approved' })
      .sort('-totalStudents')
      .limit(5)
      .select('title totalStudents avgRating'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: { total: totalUsers, students: totalStudents, instructors: totalInstructors },
      courses: { total: totalCourses, approved: approvedCourses, pending: pendingCourses },
      enrollments: totalEnrollments,
      revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      recentEnrollments,
      topCourses,
    },
  });
});

module.exports = {
  getUsers,
  updateUserRole,
  deleteUser,
  getPendingCourses,
  getCourseReview,
  updateCourseStatus,
  deleteCourse,
  getAnalytics,
};
