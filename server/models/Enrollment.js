const mongoose = require('mongoose');

/**
 * Enrollment Model
 * Tracks a student's enrollment and progress in a course.
 */
const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    progress: [
      {
        lesson: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lesson',
        },
        completed: {
          type: Boolean,
          default: false,
        },
        watchedAt: {
          type: Date,
        },
      },
    ],
    completionPercentage: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    certificateUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// A student can only enroll once in a course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
