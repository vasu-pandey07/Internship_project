const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

const evaluateEnrollmentCertificateEligibility = async ({
  courseId,
  studentId,
  progress = [],
}) => {
  const totalLessons = Array.isArray(progress) ? progress.length : 0;
  const completedLessons = Array.isArray(progress)
    ? progress.filter((item) => item.completed).length
    : 0;
  const allLessonsCompleted = totalLessons === 0 ? true : completedLessons === totalLessons;

  const quizzes = await Quiz.find({ course: courseId }).select('_id').lean();
  const quizIds = quizzes.map((quiz) => quiz._id);

  let passedQuizzesCount = 0;
  if (quizIds.length > 0) {
    const passedQuizIds = await QuizAttempt.find({
      student: studentId,
      quiz: { $in: quizIds },
      passed: true,
    }).distinct('quiz');
    passedQuizzesCount = passedQuizIds.length;
  }

  const quizzesRequired = quizIds.length;
  const allQuizzesPassed = quizzesRequired === 0 ? true : passedQuizzesCount === quizzesRequired;
  const eligible = allLessonsCompleted && allQuizzesPassed;

  return {
    eligible,
    allLessonsCompleted,
    completedLessons,
    totalLessons,
    allQuizzesPassed,
    passedQuizzesCount,
    quizzesRequired,
  };
};

module.exports = { evaluateEnrollmentCertificateEligibility };