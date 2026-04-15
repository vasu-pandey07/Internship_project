const mongoose = require('mongoose');

/**
 * Review Model
 * Stores student ratings and comments for courses.
 * A student can only review a course once.
 */
const reviewSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// One review per student per course
reviewSchema.index({ student: 1, course: 1 }, { unique: true });
reviewSchema.index({ course: 1 });

module.exports = mongoose.model('Review', reviewSchema);
