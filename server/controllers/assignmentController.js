const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Notification = require('../models/Notification');
const { asyncHandler, ApiError } = require('../utils/helpers');

const resolveUploadedFileUrl = (req, file) => {
  if (!file) return '';
  if (typeof file.path === 'string' && /^https?:\/\//i.test(file.path)) {
    return file.path;
  }
  return `${req.protocol}://${req.get('host')}/uploads/documents/${file.filename}`;
};

const createAssignment = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const { title, description, dueDate } = req.body;
  if (!String(title || '').trim()) throw new ApiError('Title is required', 400);

  const assignment = await Assignment.create({
    course: course._id,
    instructor: req.user._id,
    title: String(title).trim(),
    description: String(description || '').trim(),
    dueDate: dueDate || null,
    fileUrl: resolveUploadedFileUrl(req, req.file),
    filePublicId: req.file?.filename || '',
  });

  res.status(201).json({
    success: true,
    message: 'Assignment created',
    data: { assignment },
  });
});

const getAssignments = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);

  let isInstructor = false;
  if (req.user?.role === 'instructor' && course.instructor.toString() === req.user._id.toString()) {
    isInstructor = true;
  }

  if (!isInstructor) {
    const enrollment = await Enrollment.findOne({ course: course._id, student: req.user._id });
    if (!enrollment) throw new ApiError('You must be enrolled to view assignments', 403);
  }

  const assignments = await Assignment.find({ course: course._id }).sort('-createdAt').lean();

  if (!isInstructor) {
    const submissions = await AssignmentSubmission.find({
      course: course._id,
      student: req.user._id,
    }).lean();
    const submissionMap = new Map(submissions.map((s) => [String(s.assignment), s]));
    const withSubmission = assignments.map((item) => ({
      ...item,
      mySubmission: submissionMap.get(String(item._id)) || null,
    }));

    res.status(200).json({ success: true, data: { assignments: withSubmission } });
    return;
  }

  res.status(200).json({ success: true, data: { assignments } });
});

const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId).populate('course', 'title instructor');
  if (!assignment) throw new ApiError('Assignment not found', 404);

  const enrollment = await Enrollment.findOne({
    course: assignment.course._id,
    student: req.user._id,
  });
  if (!enrollment) throw new ApiError('You must be enrolled to submit assignment', 403);

  if (!req.file?.path) throw new ApiError('Please upload your solution file', 400);

  const notes = String(req.body.notes || '').trim();

  const submission = await AssignmentSubmission.findOneAndUpdate(
    { assignment: assignment._id, student: req.user._id },
    {
      assignment: assignment._id,
      course: assignment.course._id,
      student: req.user._id,
      fileUrl: resolveUploadedFileUrl(req, req.file),
      filePublicId: req.file.filename || '',
      notes,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Notification.create({
    user: assignment.course.instructor,
    message: `${req.user.name} submitted assignment "${assignment.title}"`,
    type: 'general',
    link: `/instructor/courses/${assignment.course._id}`,
  });

  res.status(200).json({
    success: true,
    message: 'Assignment submitted successfully',
    data: { submission },
  });
});

const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId).populate('course', 'instructor');
  if (!assignment) throw new ApiError('Assignment not found', 404);
  if (assignment.course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
    .populate('student', 'name email')
    .sort('-updatedAt');

  res.status(200).json({ success: true, data: { submissions } });
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId).populate('course', 'instructor');
  if (!assignment) throw new ApiError('Assignment not found', 404);
  if (assignment.course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  await Promise.all([
    AssignmentSubmission.deleteMany({ assignment: assignment._id }),
    Assignment.findByIdAndDelete(assignment._id),
  ]);

  res.status(200).json({
    success: true,
    message: 'Assignment deleted successfully',
  });
});

module.exports = {
  createAssignment,
  getAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  deleteAssignment,
};