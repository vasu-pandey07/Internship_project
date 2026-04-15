const express = require('express');
const router = express.Router({ mergeParams: true });
const { addReview, getReviews } = require('../controllers/reviewController');
const { auth, rbac } = require('../middleware/auth');

router.post('/', auth, rbac('student'), addReview);
router.get('/', getReviews);

module.exports = router;
