const Review = require('../models/Review');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * @desc    Add a review to a course
 * @route   POST /api/v1/courses/:courseId/reviews
 * @access  Enrolled Student
 */
const addReview = asyncHandler(async (req, res) => {
  const courseId = req.params.courseId;

  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (!enrollment) {
    throw new ApiError('You must be enrolled to review this course', 403);
  }

  // Check for existing review
  const existingReview = await Review.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (existingReview) {
    throw new ApiError('You have already reviewed this course', 400);
  }

  const review = await Review.create({
    student: req.user._id,
    course: courseId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  // Recalculate average rating
  const stats = await Review.aggregate([
    { $match: { course: review.course } },
    {
      $group: {
        _id: '$course',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: { review },
  });
});

/**
 * @desc    Get reviews for a course
 * @route   GET /api/v1/courses/:courseId/reviews
 * @access  Public
 */
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find({ course: req.params.courseId })
      .populate('student', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments({ course: req.params.courseId }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

module.exports = { addReview, getReviews };
