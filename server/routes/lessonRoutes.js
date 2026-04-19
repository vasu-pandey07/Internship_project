const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams for :courseId
const { addLesson, updateLesson, deleteLesson, askAITutor } = require('../controllers/lessonController');
const { auth, rbac } = require('../middleware/auth');
const { uploadVideo } = require('../middleware/upload');

const maybeUploadVideo = (req, res, next) => {
	if (!req.is('multipart/form-data')) {
		next();
		return;
	}
	uploadVideo.single('video')(req, res, next);
};

router.post('/:id/ai-tutor', auth, askAITutor);

// All lesson routes require instructor auth
router.post('/', auth, rbac('instructor'), maybeUploadVideo, addLesson);
router.put('/:id', auth, rbac('instructor'), maybeUploadVideo, updateLesson);
router.delete('/:id', auth, rbac('instructor'), deleteLesson);

module.exports = router;
