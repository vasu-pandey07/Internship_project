const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * @desc    Enroll in a course
 * @route   POST /api/v1/enrollments
 * @access  Student
 */
const enroll = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId).populate('lessons');
  if (!course) throw new ApiError('Course not found', 404);
  if (course.status !== 'approved') throw new ApiError('Course is not available for enrollment', 400);

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (existingEnrollment) {
    throw new ApiError('You are already enrolled in this course', 400);
  }

  // For paid courses, payment must be completed first (handled by payment controller)
  if (course.price > 0) {
    throw new ApiError('Please complete payment to enroll in this course', 402);
  }

  // Initialize progress with all lessons set to incomplete
  const progress = course.lessons.map((lesson) => ({
    lesson: lesson._id,
    completed: false,
  }));

  const enrollment = await Enrollment.create({
    student: req.user._id,
    course: courseId,
    progress,
  });

  // Increment totalStudents
  course.totalStudents += 1;
  await course.save();

  // Create notification for instructor
  await Notification.create({
    user: course.instructor,
    message: `${req.user.name} enrolled in your course "${course.title}"`,
    type: 'enrollment',
    link: `/instructor/courses/${course._id}`,
  });

  res.status(201).json({
    success: true,
    message: 'Enrolled successfully',
    data: { enrollment },
  });
});

/**
 * @desc    Get my enrollments
 * @route   GET /api/v1/enrollments/my
 * @access  Student
 */
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate({
      path: 'course',
      select: 'title thumbnail category instructor totalStudents avgRating',
      populate: { path: 'instructor', select: 'name' },
    })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: { enrollments },
  });
});

/**
 * @desc    Update lesson progress
 * @route   PUT /api/v1/enrollments/:id/progress
 * @access  Student
 */
const updateProgress = asyncHandler(async (req, res) => {
  const { lessonId } = req.body;

  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) throw new ApiError('Enrollment not found', 404);

  if (enrollment.student.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  // Find the lesson in progress array and mark it complete
  const lessonProgress = enrollment.progress.find(
    (p) => p.lesson.toString() === lessonId
  );

  if (!lessonProgress) {
    throw new ApiError('Lesson not found in this enrollment', 404);
  }

  lessonProgress.completed = true;
  lessonProgress.watchedAt = new Date();

  // Recalculate completion percentage
  const totalLessons = enrollment.progress.length;
  const completedLessons = enrollment.progress.filter((p) => p.completed).length;
  enrollment.completionPercentage = Math.round((completedLessons / totalLessons) * 100);

  // If 100% complete, set completion date
  if (enrollment.completionPercentage === 100 && !enrollment.completedAt) {
    enrollment.completedAt = new Date();

    // Notify student about completion
    await Notification.create({
      user: req.user._id,
      message: `Congratulations! You've completed the course. Your certificate is ready!`,
      type: 'general',
      link: `/student/enrollments/${enrollment._id}/certificate`,
    });
  }

  await enrollment.save();

  res.status(200).json({
    success: true,
    message: 'Progress updated',
    data: { enrollment },
  });
});

/**
 * @desc    Get certificate for completed course
 * @route   GET /api/v1/enrollments/:id/certificate
 * @access  Student
 */
const getCertificate = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('course', 'title')
    .populate('student', 'name email');

  if (!enrollment) throw new ApiError('Enrollment not found', 404);

  if (enrollment.student._id.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  if (enrollment.completionPercentage < 100) {
    throw new ApiError('Course not yet completed. Complete all lessons first.', 400);
  }

  // Return certificate data (in production, this would generate a PDF)
  const certificateData = {
    studentName: enrollment.student.name,
    courseName: enrollment.course.title,
    completedAt: enrollment.completedAt,
    enrollmentId: enrollment._id,
    certificateId: `CERT-${enrollment._id.toString().slice(-8).toUpperCase()}`,
  };

  res.status(200).json({
    success: true,
    data: { certificate: certificateData },
  });
});

module.exports = { enroll, getMyEnrollments, updateProgress, getCertificate };
