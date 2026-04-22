const express = require('express');
const router = express.Router({ mergeParams: true });
const { createQuiz, getQuizzes, getQuiz, deleteQuiz, submitAttempt, generateAIQuiz } = require('../controllers/quizController');
const { auth, rbac } = require('../middleware/auth');

router.post('/', auth, rbac('instructor'), createQuiz);
router.post('/generate', auth, rbac('instructor'), generateAIQuiz);
router.get('/', auth, getQuizzes);
router.get('/:id', auth, getQuiz);
router.delete('/:id', auth, rbac('instructor'), deleteQuiz);
router.post('/:id/attempt', auth, rbac('student'), submitAttempt);

module.exports = router;
