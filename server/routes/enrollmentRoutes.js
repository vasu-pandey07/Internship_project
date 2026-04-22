const express = require('express');
const router = express.Router();
const {
	enroll,
	getMyEnrollments,
	updateProgress,
	getCertificate,
	getCertificateDownload,
	getStudentAnalytics,
	restartCourse,
} = require('../controllers/enrollmentController');
const { auth, rbac } = require('../middleware/auth');

router.post('/', auth, rbac('student'), enroll);
router.get('/my', auth, rbac('student'), getMyEnrollments);
router.get('/analytics', auth, rbac('student'), getStudentAnalytics);
router.put('/:id/progress', auth, rbac('student'), updateProgress);
router.post('/:id/restart', auth, rbac('student'), restartCourse);
router.get('/:id/certificate', auth, rbac('student'), getCertificate);
router.get('/:id/certificate/download', auth, rbac('student'), getCertificateDownload);

module.exports = router;
