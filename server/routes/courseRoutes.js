const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
  submitCourse,
  getRecommendations,
  getInstructorAnalytics,
} = require('../controllers/courseController');
const { auth, rbac } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

// Import sub-routes
const lessonRoutes = require('./lessonRoutes');
const quizRoutes = require('./quizRoutes');
const reviewRoutes = require('./reviewRoutes');
const questionRoutes = require('./questionRoutes');
const assignmentRoutes = require('./assignmentRoutes');

// Re-route to sub-routes
router.use('/:courseId/lessons', lessonRoutes);
router.use('/:courseId/quizzes', quizRoutes);
router.use('/:courseId/reviews', reviewRoutes);
router.use('/:courseId/questions', questionRoutes);
router.use('/:courseId/assignments', assignmentRoutes);

// Public routes
router.get('/', getCourses);
router.get('/recommendations', auth, rbac('student'), getRecommendations);
router.get('/my-courses', auth, rbac('instructor'), getMyCourses);
router.get('/instructor-analytics', auth, rbac('instructor'), getInstructorAnalytics);
router.get('/:id', getCourse);

// Instructor routes
router.post('/', auth, rbac('instructor'), uploadImage.single('thumbnail'), createCourse);
router.put('/:id', auth, rbac('instructor'), uploadImage.single('thumbnail'), updateCourse);
router.delete('/:id', auth, rbac('instructor'), deleteCourse);
router.put('/:id/submit', auth, rbac('instructor'), submitCourse);

module.exports = router;
