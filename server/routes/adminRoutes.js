const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  deleteUser,
  getPendingCourses,
  updateCourseStatus,
  deleteCourse,
  getAnalytics,
} = require('../controllers/adminController');
const { auth, rbac } = require('../middleware/auth');

// All admin routes require admin role
router.use(auth, rbac('admin'));

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/courses/pending', getPendingCourses);
router.put('/courses/:id/status', updateCourseStatus);
router.delete('/courses/:id', deleteCourse);
router.get('/analytics', getAnalytics);

module.exports = router;
