const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  askQuestion,
  getStudentQuestions,
  getInstructorQuestions,
  answerQuestion,
} = require('../controllers/questionController');
const { auth, rbac } = require('../middleware/auth');

router.post('/', auth, rbac('student'), askQuestion);
router.get('/my', auth, rbac('student'), getStudentQuestions);
router.get('/instructor', auth, rbac('instructor'), getInstructorQuestions);
router.put('/:id/answer', auth, rbac('instructor'), answerQuestion);

module.exports = router;