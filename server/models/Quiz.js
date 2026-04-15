const mongoose = require('mongoose');

/**
 * Quiz Model
 * A quiz attached to a course with multiple-choice questions.
 */
const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
            required: true,
          },
        ],
        correctAnswer: {
          type: Number, // Index of the correct option
          required: true,
        },
      },
    ],
    passingScore: {
      type: Number, // Percentage (0-100)
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ course: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
