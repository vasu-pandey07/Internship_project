const express = require('express');
const router = express.Router();
const { enroll, getMyEnrollments, updateProgress, getCertificate } = require('../controllers/enrollmentController');
const { auth, rbac } = require('../middleware/auth');

router.post('/', auth, rbac('student'), enroll);
router.get('/my', auth, rbac('student'), getMyEnrollments);
router.put('/:id/progress', auth, rbac('student'), updateProgress);
router.get('/:id/certificate', auth, rbac('student'), getCertificate);

module.exports = router;
