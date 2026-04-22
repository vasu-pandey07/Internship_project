const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Question = require('../models/Question');
const Notification = require('../models/Notification');
const { asyncHandler, ApiError } = require('../utils/helpers');

const askQuestion = asyncHandler(async (req, res) => {
  const { question, lessonId } = req.body;
  const normalizedQuestion = String(question || '').trim();
  if (!normalizedQuestion) throw new ApiError('Question is required', 400);

  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
  });
  if (!enrollment) throw new ApiError('You must be enrolled to ask questions', 403);

  const item = await Question.create({
    course: course._id,
    lesson: lessonId || null,
    student: req.user._id,
    instructor: course.instructor,
    question: normalizedQuestion,
  });

  await Notification.create({
    user: course.instructor,
    message: `${req.user.name} asked a question in "${course.title}"`,
    type: 'general',
    link: `/instructor/courses/${course._id}`,
  });

  const populated = await Question.findById(item._id).populate('student', 'name');

  res.status(201).json({
    success: true,
    message: 'Question sent to instructor',
    data: { question: populated },
  });
});

const getStudentQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find({
    course: req.params.courseId,
    student: req.user._id,
  })
    .populate('instructor', 'name')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: { questions },
  });
});

const getInstructorQuestions = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const questions = await Question.find({ course: course._id })
    .populate('student', 'name email')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { questions } });
});

const answerQuestion = asyncHandler(async (req, res) => {
  const normalizedAnswer = String(req.body.answer || '').trim();
  if (!normalizedAnswer) throw new ApiError('Answer is required', 400);

  const item = await Question.findById(req.params.id).populate('course', 'title instructor');
  if (!item) throw new ApiError('Question not found', 404);
  if (item.course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  item.answer = normalizedAnswer;
  item.status = 'answered';
  item.answeredAt = new Date();
  await item.save();

  await Notification.create({
    user: item.student,
    message: `Your question in "${item.course.title}" has been answered`,
    type: 'general',
    link: `/student/courses/${item.course._id}`,
  });

  res.status(200).json({
    success: true,
    message: 'Answer sent',
    data: { question: item },
  });
});

module.exports = {
  askQuestion,
  getStudentQuestions,
  getInstructorQuestions,
  answerQuestion,
};