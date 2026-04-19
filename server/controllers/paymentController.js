const stripe = require('../config/stripe');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { asyncHandler, ApiError } = require('../utils/helpers');

/**
 * @desc    Create Stripe checkout session
 * @route   POST /api/v1/payments/create-checkout
 * @access  Student
 */
const createCheckout = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const course = await Course.findById(courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.status !== 'approved') throw new ApiError('Course not available', 400);
  if (course.price === 0) throw new ApiError('This is a free course, enroll directly', 400);

  // Check if already enrolled
  const existing = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (existing) throw new ApiError('Already enrolled', 400);

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: course.title,
            description: course.description.substring(0, 200),
          },
          unit_amount: Math.round(course.price * 100), // Stripe uses cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/payment/cancel`,
    metadata: {
      courseId: course._id.toString(),
      studentId: req.user._id.toString(),
    },
  });

  // Create pending payment record
  await Payment.create({
    student: req.user._id,
    course: course._id,
    amount: course.price,
    stripeSessionId: session.id,
    status: 'pending',
  });

  res.status(200).json({
    success: true,
    data: { sessionId: session.id, url: session.url },
  });
});

/**
 * @desc    Verify payment status and auto-enroll
 * @route   GET /api/v1/payments/verify/:sessionId
 * @access  Student
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const sessionId = req.params.sessionId;

  // Retrieve session from Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    throw new ApiError('Invalid session', 400);
  }

  if (!session) throw new ApiError('Session not found', 404);

  // Find corresponding pending payment
  const payment = await Payment.findOne({
    stripeSessionId: sessionId,
    student: req.user._id,
  });

  if (!payment) throw new ApiError('Payment record not found', 404);

  // If already completed, just return success
  if (payment.status === 'completed') {
    return res.status(200).json({ success: true, data: { status: 'completed' } });
  }

  // If paid, process enrollment
  if (session.payment_status === 'paid') {
    payment.status = 'completed';
    payment.stripePaymentIntentId = session.payment_intent;
    await payment.save();

    const { courseId, studentId } = session.metadata;
    const course = await Course.findById(courseId).populate('lessons');
    
    if (course) {
      // Create progress tracker
      const progress = course.lessons.map((lesson) => ({
        lesson: lesson._id,
        completed: false,
      }));

      // Create enrollment (ignore if exists)
      const existingEnrollment = await Enrollment.findOne({ student: studentId, course: courseId });
      
      if (!existingEnrollment) {
        await Enrollment.create({
          student: studentId,
          course: courseId,
          progress,
        });

        // Update stats
        course.totalStudents += 1;
        await course.save();

        // Notify
        await Notification.create({
          user: studentId,
          message: `Payment successful! You're now enrolled in "${course.title}"`,
          type: 'payment',
          link: `/student/courses/${courseId}`,
        });
      }
    }
  }

  res.status(200).json({
    success: true,
    data: { status: payment.status },
  });
});

module.exports = { createCheckout, verifyPayment };

