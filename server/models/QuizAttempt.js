const mongoose = require('mongoose');

/**
 * QuizAttempt Model
 * Records a student's attempt at a quiz with answers and score.
 */
const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    answers: [
      {
        type: Number, // Index of selected option for each question
      },
    ],
    score: {
      type: Number, // Percentage
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    totalCorrect: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

quizAttemptSchema.index({ student: 1, quiz: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
