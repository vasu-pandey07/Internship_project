const mongoose = require('mongoose');

/**
 * Lesson Model
 * Represents a single lesson/lecture within a course.
 * Videos are stored on Cloudinary.
 */
const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    videoUrl: {
      type: String,
      default: '',
    },
    videoPublicId: {
      type: String, // Cloudinary public ID for deletion
      default: '',
    },
    duration: {
      type: Number, // Duration in seconds
      default: 0,
    },
    order: {
      type: Number,
      required: true,
    },
    content: {
      type: String, // Text/markdown notes for the lesson
      default: '',
    },
    isFreePreview: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
