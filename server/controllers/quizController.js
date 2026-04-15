const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { asyncHandler, ApiError } = require('../utils/helpers');
const { GoogleGenAI } = require('@google/genai');

/**
 * @desc    Create a quiz for a course
 * @route   POST /api/v1/courses/:courseId/quizzes
 * @access  Instructor (owner)
 */
const createQuiz = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  req.body.course = course._id;
  const quiz = await Quiz.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Quiz created successfully',
    data: { quiz },
  });
});

/**
 * @desc    Get quizzes for a course
 * @route   GET /api/v1/courses/:courseId/quizzes
 * @access  Enrolled Student / Instructor
 */
const getQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await Quiz.find({ course: req.params.courseId });

  res.status(200).json({
    success: true,
    data: { quizzes },
  });
});

/**
 * @desc    Get a single quiz
 * @route   GET /api/v1/courses/:courseId/quizzes/:id
 * @access  Enrolled Student / Instructor
 */
const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError('Quiz not found', 404);

  // For students, don't reveal correct answers
  let quizData = quiz.toObject();
  if (req.user.role === 'student') {
    quizData.questions = quizData.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      // correctAnswer omitted for students
    }));
  }

  res.status(200).json({
    success: true,
    data: { quiz: quizData },
  });
});

/**
 * @desc    Submit a quiz attempt
 * @route   POST /api/v1/courses/:courseId/quizzes/:id/attempt
 * @access  Enrolled Student
 */
const submitAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) throw new ApiError('Quiz not found', 404);

  // Verify student is enrolled
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
  });
  if (!enrollment) throw new ApiError('You must be enrolled to take this quiz', 403);

  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    throw new ApiError('Please provide answers array', 400);
  }

  // Grade the quiz
  let totalCorrect = 0;
  const totalQuestions = quiz.questions.length;

  quiz.questions.forEach((question, index) => {
    if (answers[index] === question.correctAnswer) {
      totalCorrect++;
    }
  });

  const score = Math.round((totalCorrect / totalQuestions) * 100);
  const passed = score >= quiz.passingScore;

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    quiz: quiz._id,
    answers,
    score,
    passed,
    totalCorrect,
    totalQuestions,
  });

  // Notify student about result
  await Notification.create({
    user: req.user._id,
    message: `You ${passed ? 'passed' : 'failed'} the quiz "${quiz.title}" with ${score}%`,
    type: 'quiz_result',
    link: `/student/courses/${req.params.courseId}`,
  });

  res.status(201).json({
    success: true,
    message: passed ? 'Congratulations! You passed!' : 'You did not pass. Try again!',
    data: {
      attempt,
      correctAnswers: quiz.questions.map((q) => q.correctAnswer), // Show correct answers after attempt
    },
  });
});


/**
 * @desc    Generate Quiz using Gemini AI
 * @route   POST /api/v1/courses/:courseId/quizzes/generate
 * @access  Instructor (owner)
 */
const generateAIQuiz = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('lessons');
  if (!course) throw new ApiError('Course not found', 404);
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const { topic, difficulty, numQuestions = 3 } = req.body;

  // Fallback mock if no API key is provided
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    const mockQuestions = [];
    for (let i = 0; i < numQuestions; i++) {
      mockQuestions.push({
        question: `[Mock AI] What is the core concept of ${topic || course.title} - Question ${i + 1}?`,
        options: ['Option A (Correct)', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 0
      });
    }
    return res.status(200).json({
      success: true,
      data: { questions: mockQuestions }
    });
  }

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `You are an expert ${course.category} instructor. Generate a multiple-choice quiz about "${topic || course.title}".
The difficulty level should be ${difficulty || course.level}.
Include exactly ${numQuestions} questions.
Provide the output exactly as a JSON array of objects with the following schema:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": number
  }
]
Do not include markdown formatting or backticks, return ONLY raw JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = (response.text || '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(rawText);
    const generatedQuestions = (Array.isArray(parsed) ? parsed : [])
      .map((q) => ({
        question: q?.question || '',
        options: Array.isArray(q?.options) ? q.options.slice(0, 4) : [],
        correctAnswer: Number.isInteger(q?.correctAnswer) ? q.correctAnswer : 0,
      }))
      .filter((q) => q.question && q.options.length === 4);

    if (!generatedQuestions.length) {
      throw new Error('AI returned empty or invalid quiz payload');
    }

    res.status(200).json({
      success: true,
      data: { questions: generatedQuestions }
    });
  } catch (error) {
    console.warn('CRITICAL AI ERROR:', error.message);
    if (error.stack) console.error(error.stack);
    
    // Graceful fallback to mock quiz if API key is invalid or quota exceeded
    const mockQuestions = [];
    for (let i = 0; i < numQuestions; i++) {
      mockQuestions.push({
        question: `[Mock AI Fallback] What is the core concept of ${topic || course.title} - Question ${i + 1}?`,
        options: ['Correct Option', 'Wrong Option 1', 'Wrong Option 2', 'Wrong Option 3'],
        correctAnswer: 0
      });
    }
    return res.status(200).json({
      success: true,
      data: { questions: mockQuestions }
    });
  }
});

module.exports = { createQuiz, getQuizzes, getQuiz, submitAttempt, generateAIQuiz };
