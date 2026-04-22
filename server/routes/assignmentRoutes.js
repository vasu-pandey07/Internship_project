const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createAssignment,
  getAssignments,
  submitAssignment,
  getAssignmentSubmissions,
  deleteAssignment,
} = require('../controllers/assignmentController');
const { auth, rbac } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

const maybeUploadDocument = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    next();
    return;
  }
  uploadDocument.single('file')(req, res, next);
};

router.get('/', auth, getAssignments);
router.post('/', auth, rbac('instructor'), maybeUploadDocument, createAssignment);
router.post('/:assignmentId/submissions', auth, rbac('student'), maybeUploadDocument, submitAssignment);
router.get('/:assignmentId/submissions', auth, rbac('instructor'), getAssignmentSubmissions);
router.delete('/:assignmentId', auth, rbac('instructor'), deleteAssignment);

module.exports = router;