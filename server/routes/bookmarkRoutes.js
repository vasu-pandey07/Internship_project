const express = require('express');
const router = express.Router();
const { toggleBookmark, getBookmarks } = require('../controllers/bookmarkController');
const { auth, rbac } = require('../middleware/auth');

router.post('/:courseId', auth, rbac('student'), toggleBookmark);
router.get('/', auth, rbac('student'), getBookmarks);

module.exports = router;
