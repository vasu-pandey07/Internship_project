const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Question cannot exceed 1000 characters'],
    },
    answer: {
      type: String,
      default: '',
      trim: true,
      maxlength: [3000, 'Answer cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'answered'],
      default: 'open',
    },
    answeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

questionSchema.index({ course: 1, student: 1, createdAt: -1 });
questionSchema.index({ instructor: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Question', questionSchema);