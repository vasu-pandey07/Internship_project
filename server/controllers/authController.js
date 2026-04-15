const User = require('../models/User');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError('Email is already registered', 400);
  }

  // Allow admin registration for local testing
  const allowedRoles = ['student', 'instructor', 'admin'];
  const userRole = allowedRoles.includes(role) ? role : 'student';

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
  });

  const token = user.generateToken();

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError('Please provide email and password', 400);
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid email or password', 401);
  }

  const token = user.generateToken();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    },
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('bookmarks', 'title thumbnail price');

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, bio, avatar } = req.body;

  const updateFields = {};
  if (name) updateFields.name = name;
  if (bio !== undefined) updateFields.bio = bio;
  if (avatar) updateFields.avatar = avatar;

  const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: { user },
  });
});

module.exports = { register, login, getMe, updateMe };
