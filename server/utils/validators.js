const { body, validationResult } = require('express-validator');

/**
 * Middleware to check validation results — returns errors if any.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map((e) => e.msg).join('. '),
      errors: errors.array(),
    });
  }
  next();
};

// ── Auth Validators ──────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'instructor']).withMessage('Role must be student or instructor'),
];

const loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Course Validators ────────────────────────────────────────────
const createCourseRules = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('category').notEmpty().withMessage('Category is required')
    .isIn(['Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
      'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design', 'Business', 'Other'
    ]).withMessage('Invalid category'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or positive'),
];

// ── Quiz Validators ──────────────────────────────────────────────
const createQuizRules = [
  body('title').trim().notEmpty().withMessage('Quiz title is required'),
  body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
  body('questions.*.question').notEmpty().withMessage('Question text is required'),
  body('questions.*.options').isArray({ min: 2 }).withMessage('At least 2 options per question'),
  body('questions.*.correctAnswer').isInt({ min: 0 }).withMessage('Correct answer index is required'),
  body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be 0-100'),
];

// ── Review Validators ────────────────────────────────────────────
const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  createCourseRules,
  createQuizRules,
  reviewRules,
};
