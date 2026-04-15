const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for :courseId
const { addLesson, updateLesson, deleteLesson, askAITutor } = require('../controllers/lessonController');
const { auth, rbac } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');

router.post('/:id/ai-tutor', auth, askAITutor);

// All lesson routes require instructor auth
router.post('/', auth, rbac('instructor'), uploadVideo.single('video'), addLesson);
router.put('/:id', auth, rbac('instructor'), uploadVideo.single('video'), updateLesson);
router.delete('/:id', auth, rbac('instructor'), deleteLesson);

module.exports = router;
