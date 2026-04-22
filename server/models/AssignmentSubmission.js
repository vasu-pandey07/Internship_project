const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    filePublicId: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      maxlength: [3000, 'Notes cannot exceed 3000 characters'],
    },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
assignmentSubmissionSchema.index({ course: 1, student: 1, createdAt: -1 });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);