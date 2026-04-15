const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * @desc    Get all approved courses (public, paginated, filterable)
 * @route   GET /api/v1/courses
 * @access  Public
 */
const getCourses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    level,
    search,
    sort = '-createdAt',
    minPrice,
    maxPrice,
  } = req.query;

  const query = { status: 'approved' };

  // Filters
  if (category) query.category = category;
  if (level) query.level = level;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [courses, total] = await Promise.all([
    Course.find(query)
      .populate('instructor', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit)),
    Course.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      courses,
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
 * @desc    Get single course with lessons
 * @route   GET /api/v1/courses/:id
 * @access  Public
 */
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name avatar bio')
    .populate('lessons');

  if (!course) {
    throw new ApiError('Course not found', 404);
  }

  res.status(200).json({
    success: true,
    data: { course },
  });
});

/**
 * @desc    Create a new course
 * @route   POST /api/v1/courses
 * @access  Instructor
 */
const createCourse = asyncHandler(async (req, res) => {
  req.body.instructor = req.user._id;

  // If a thumbnail was uploaded via multer
  if (req.file) {
    req.body.thumbnail = req.file.path;
  }

  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Course created successfully',
    data: { course },
  });
});

/**
 * @desc    Update a course
 * @route   PUT /api/v1/courses/:id
 * @access  Instructor (owner only)
 */
const updateCourse = asyncHandler(async (req, res) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    throw new ApiError('Course not found', 404);
  }

  // Verify ownership
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to update this course', 403);
  }

  // If a new thumbnail was uploaded
  if (req.file) {
    req.body.thumbnail = req.file.path;
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Course updated successfully',
    data: { course },
  });
});

/**
 * @desc    Delete a course
 * @route   DELETE /api/v1/courses/:id
 * @access  Instructor (owner only)
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new ApiError('Course not found', 404);
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to delete this course', 403);
  }

  // Delete associated lessons
  await Lesson.deleteMany({ course: course._id });

  // Delete associated enrollments
  await Enrollment.deleteMany({ course: course._id });

  await Course.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Course deleted successfully',
  });
});

/**
 * @desc    Get instructor's own courses
 * @route   GET /api/v1/courses/my-courses
 * @access  Instructor
 */
const getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id })
    .populate('lessons', 'title order')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: { courses },
  });
});

/**
 * @desc    Submit course for approval
 * @route   PUT /api/v1/courses/:id/submit
 * @access  Instructor (owner)
 */
const submitCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    throw new ApiError('Course not found', 404);
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  if (course.status !== 'draft' && course.status !== 'rejected') {
    throw new ApiError('Course can only be submitted from draft or rejected status', 400);
  }

  course.status = 'pending';
  await course.save();

  res.status(200).json({
    success: true,
    message: 'Course submitted for approval',
    data: { course },
  });
});

/**
 * @desc    Get recommended courses based on tags & category
 * @route   GET /api/v1/courses/recommendations
 * @access  Student (auth)
 */
const getRecommendations = asyncHandler(async (req, res) => {
  // Get student's enrolled courses
  const enrollments = await Enrollment.find({ student: req.user._id }).populate('course', 'category tags');

  // Collect categories and tags from enrolled courses
  const categories = new Set();
  const tags = new Set();

  enrollments.forEach((enrollment) => {
    if (enrollment.course) {
      categories.add(enrollment.course.category);
      enrollment.course.tags.forEach((tag) => tags.add(tag));
    }
  });

  // Find courses matching those categories/tags, excluding already enrolled
  const enrolledCourseIds = enrollments.map((e) => e.course?._id).filter(Boolean);

  let recommendations = [];

  if (categories.size > 0 || tags.size > 0) {
    const query = {
      status: 'approved',
      _id: { $nin: enrolledCourseIds },
    };

    if (categories.size > 0 && tags.size > 0) {
      query.$or = [
        { category: { $in: [...categories] } },
        { tags: { $in: [...tags] } },
      ];
    } else if (categories.size > 0) {
      query.category = { $in: [...categories] };
    } else {
      query.tags = { $in: [...tags] };
    }

    recommendations = await Course.find(query)
      .populate('instructor', 'name avatar')
      .sort('-avgRating -totalStudents')
      .limit(10);
  }

  // If no recommendations from history, show top-rated courses
  if (recommendations.length === 0) {
    recommendations = await Course.find({
      status: 'approved',
      _id: { $nin: enrolledCourseIds },
    })
      .populate('instructor', 'name avatar')
      .sort('-avgRating -totalStudents')
      .limit(10);
  }

  res.status(200).json({
    success: true,
    data: { recommendations },
  });
});

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  submitCourse,
  getRecommendations,
};
