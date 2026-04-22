const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { asyncHandler, ApiError } = require('../utils/helpers');
const { evaluateEnrollmentCertificateEligibility } = require('../services/certificateEligibility');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

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

  const enrollmentsWithEligibility = await Promise.all(
    enrollments.map(async (enrollment) => {
      const quizzes = await Quiz.find({ course: enrollment.course?._id }).select('_id').lean();
      const quizIds = quizzes.map((quiz) => quiz._id);
      const attemptedQuizIds = quizIds.length > 0
        ? await QuizAttempt.find({
            student: req.user._id,
            quiz: { $in: quizIds },
          }).distinct('quiz')
        : [];
      const passedQuizIds = quizIds.length > 0
        ? await QuizAttempt.find({
            student: req.user._id,
            quiz: { $in: quizIds },
            passed: true,
          }).distinct('quiz')
        : [];

      const eligibility = await evaluateEnrollmentCertificateEligibility({
        courseId: enrollment.course?._id,
        studentId: req.user._id,
        progress: enrollment.progress,
      });

      const item = enrollment.toObject();
      item.certificateEligibility = eligibility;
      item.quizProgress = {
        quizzesRequired: quizIds.length,
        attemptedQuizzes: attemptedQuizIds.length,
        attemptedQuizIds: attemptedQuizIds.map(String),
        passedQuizzes: passedQuizIds.length,
        passedQuizIds: passedQuizIds.map(String),
      };
      return item;
    })
  );

  res.status(200).json({
    success: true,
    data: { enrollments: enrollmentsWithEligibility },
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

  const eligibility = await evaluateEnrollmentCertificateEligibility({
    courseId: enrollment.course,
    studentId: enrollment.student,
    progress: enrollment.progress,
  });

  // Completed date and notification only after lessons + quizzes requirements are met.
  if (eligibility.eligible && !enrollment.completedAt) {
    enrollment.completedAt = new Date();

    // Notify student about unlocked certificate.
    await Notification.create({
      user: req.user._id,
      message: `Great work! You've completed all lessons and quizzes. Your certificate is ready!`,
      type: 'general',
      link: `/student/enrollments/${enrollment._id}/certificate`,
    });
  } else if (!eligibility.eligible) {
    enrollment.completedAt = null;
  }

  await enrollment.save();

  const responseEnrollment = enrollment.toObject();
  responseEnrollment.certificateEligibility = eligibility;

  res.status(200).json({
    success: true,
    message: 'Progress updated',
    data: { enrollment: responseEnrollment },
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

  const eligibility = await evaluateEnrollmentCertificateEligibility({
    courseId: enrollment.course._id,
    studentId: enrollment.student._id,
    progress: enrollment.progress,
  });

  if (!eligibility.eligible) {
    throw new ApiError(
      `Certificate locked. Complete all lessons and pass all quizzes first (${eligibility.completedLessons}/${eligibility.totalLessons} lessons, ${eligibility.passedQuizzesCount}/${eligibility.quizzesRequired} quizzes).`,
      400
    );
  }

  if (!enrollment.completedAt) {
    enrollment.completedAt = new Date();
    await enrollment.save();
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

/**
 * @desc    Download certificate for completed course
 * @route   GET /api/v1/enrollments/:id/certificate/download
 * @access  Student
 */
const getCertificateDownload = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('course', 'title')
    .populate('student', 'name email');

  if (!enrollment) throw new ApiError('Enrollment not found', 404);
  if (enrollment.student._id.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const eligibility = await evaluateEnrollmentCertificateEligibility({
    courseId: enrollment.course._id,
    studentId: enrollment.student._id,
    progress: enrollment.progress,
  });

  if (!eligibility.eligible) {
    throw new ApiError('Certificate locked. Complete all lessons and quizzes first.', 400);
  }

  if (!enrollment.completedAt) {
    enrollment.completedAt = new Date();
    await enrollment.save();
  }

  const certificateId = `CERT-${enrollment._id.toString().slice(-8).toUpperCase()}`;
  const content = [
    'EduPlatform Certificate of Completion',
    '------------------------------------',
    `Student: ${enrollment.student.name}`,
    `Email: ${enrollment.student.email}`,
    `Course: ${enrollment.course.title}`,
    `Completed At: ${new Date(enrollment.completedAt).toLocaleString()}`,
    `Certificate ID: ${certificateId}`,
    '',
    'This certificate confirms successful completion of all lessons and quizzes.',
  ].join('\n');

  const filename = `${certificateId}.txt`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(content);
});

/**
 * @desc    Get personalized student analytics
 * @route   GET /api/v1/enrollments/analytics
 * @access  Student
 */
const getStudentAnalytics = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).populate('course', 'title');

  const totalCourses = enrollments.length;
  const totalLessons = enrollments.reduce((sum, e) => sum + (e.progress?.length || 0), 0);
  const completedLessons = enrollments.reduce(
    (sum, e) => sum + (e.progress?.filter((p) => p.completed).length || 0),
    0
  );

  const completionRate = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const courseIds = enrollments.map((e) => e.course?._id).filter(Boolean);
  const quizzes = await Quiz.find({ course: { $in: courseIds } }).select('_id course passingScore').lean();
  const quizIds = quizzes.map((q) => q._id);

  const attempts = await QuizAttempt.find({ student: req.user._id, quiz: { $in: quizIds } })
    .select('quiz score passed createdAt')
    .sort('-createdAt')
    .lean();

  const latestAttemptByQuiz = new Map();
  attempts.forEach((attempt) => {
    const key = String(attempt.quiz);
    if (!latestAttemptByQuiz.has(key)) {
      latestAttemptByQuiz.set(key, attempt);
    }
  });

  const latestAttempts = Array.from(latestAttemptByQuiz.values());
  const quizzesAttempted = latestAttempts.length;
  const quizzesPassed = latestAttempts.filter((a) => a.passed).length;
  const avgQuizScore = quizzesAttempted
    ? Math.round(latestAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / quizzesAttempted)
    : 0;
  const totalQuizzesRequired = quizIds.length;

  const eligibleCount = (
    await Promise.all(
      enrollments.map((e) =>
        evaluateEnrollmentCertificateEligibility({
          courseId: e.course?._id,
          studentId: req.user._id,
          progress: e.progress,
        })
      )
    )
  ).filter((item) => item.eligible).length;

  res.status(200).json({
    success: true,
    data: {
      analytics: {
        totalCourses,
        totalLessons,
        completedLessons,
        completionRate,
        totalQuizzesRequired,
        quizzesAttempted,
        quizzesPassed,
        avgQuizScore,
        certificatesReady: eligibleCount,
      },
    },
  });
});

/**
 * @desc    Restart course progress for student
 * @route   POST /api/v1/enrollments/:id/restart
 * @access  Student
 */
const restartCourse = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) throw new ApiError('Enrollment not found', 404);
  if (enrollment.student.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  enrollment.progress = enrollment.progress.map((item) => ({
    lesson: item.lesson,
    completed: false,
    watchedAt: null,
  }));
  enrollment.completionPercentage = 0;
  enrollment.completedAt = null;
  enrollment.certificateUrl = '';
  await enrollment.save();

  const courseQuizIds = await Quiz.find({ course: enrollment.course }).distinct('_id');
  if (courseQuizIds.length > 0) {
    await QuizAttempt.deleteMany({ student: req.user._id, quiz: { $in: courseQuizIds } });
  }

  const eligibility = await evaluateEnrollmentCertificateEligibility({
    courseId: enrollment.course,
    studentId: enrollment.student,
    progress: enrollment.progress,
  });

  const responseEnrollment = enrollment.toObject();
  responseEnrollment.certificateEligibility = eligibility;
  responseEnrollment.quizProgress = {
    quizzesRequired: courseQuizIds.length,
    attemptedQuizzes: 0,
    attemptedQuizIds: [],
    passedQuizzes: 0,
    passedQuizIds: [],
  };

  res.status(200).json({
    success: true,
    message: 'Course restarted successfully',
    data: { enrollment: responseEnrollment },
  });
});

module.exports = {
  enroll,
  getMyEnrollments,
  updateProgress,
  getCertificate,
  getCertificateDownload,
  getStudentAnalytics,
  restartCourse,
};
