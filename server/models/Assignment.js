const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    fileUrl: {
      type: String,
      default: '',
    },
    filePublicId: {
      type: String,
      default: '',
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);