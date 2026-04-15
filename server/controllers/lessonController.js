const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { asyncHandler, ApiError } = require('../utils/helpers');
const { GoogleGenAI } = require('@google/genai');

const decodeXmlEntities = (text = '') =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractYouTubeVideoId = (url = '') => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const fetchYoutubeTranscript = async (videoId) => {
  if (!videoId) return '';

  const endpointCandidates = [
    `https://video.google.com/timedtext?lang=en&v=${videoId}`,
    `https://video.google.com/timedtext?lang=en-US&v=${videoId}`,
    `https://video.google.com/timedtext?lang=hi&v=${videoId}`,
  ];

  for (const endpoint of endpointCandidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) continue;
      const xml = await response.text();
      if (!xml || !xml.includes('<text')) continue;

      const chunks = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((m) =>
        decodeXmlEntities(m[1]).replace(/\s+/g, ' ').trim()
      );

      const transcript = chunks.filter(Boolean).join(' ').trim();
      if (transcript) {
        // Keep prompt bounded for speed and token cost.
        return transcript.slice(0, 12000);
      }
    } catch (err) {
      // Try the next language candidate.
    }
  }

  return '';
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseErrorMessage = (error) => {
  try {
    if (!error) return 'Unknown error';
    if (typeof error.message === 'string') return error.message;
    return JSON.stringify(error.message || error);
  } catch {
    return 'Unknown error';
  }
};

const isSummaryQuestion = (question = '') =>
  /\b(summary|summarize|summarise|overview|brief|recap)\b/i.test(question);

const classifyAiIssue = (rawMessage = '') => {
  const msg = String(rawMessage || '').toLowerCase();
  if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted')) {
    return 'rate limit reached for the AI provider';
  }
  if (msg.includes('api key') || msg.includes('permission') || msg.includes('unauthorized')) {
    return 'AI credentials are invalid or missing permissions';
  }
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch')) {
    return 'network timeout while contacting the AI provider';
  }
  return 'the AI provider is temporarily unavailable';
};

const buildBestEffortSummary = ({ lessonTitle, compactContext, question }) => {
  const title = lessonTitle || 'this lesson';
  const context = (compactContext || '').slice(0, 180);
  const summaryLead = `Brief video summary (best effort): This lesson introduces ${title} and its core idea in a beginner-friendly way.`;

  if (!context) {
    return `${summaryLead}\n\nI do not have enough lesson notes or captions yet to add specifics.\n\nQuestion: "${question}"`;
  }

  return `${summaryLead}\n\nAvailable clue from lesson content: "${context}"\n\nQuestion: "${question}"`;
};

const buildLocalTutorFallback = ({ lessonTitle, lessonContent, transcriptText, question }) => {
  const source = (lessonContent || transcriptText || '').trim();
  if (!source) {
    if (isSummaryQuestion(question)) {
      return buildBestEffortSummary({
        lessonTitle,
        compactContext: '',
        question,
      });
    }

    return `AI tutor is temporarily busy, and there is no lesson text or transcript available yet.\n\nQuestion: "${question}"\n\nPlease add lesson notes or enable video captions, then try again.`;
  }

  const compact = source.replace(/\s+/g, ' ').trim();
  if (compact.length < 120) {
    if (isSummaryQuestion(question)) {
      return buildBestEffortSummary({
        lessonTitle,
        compactContext: compact,
        question,
      });
    }

    return `AI tutor is temporarily busy. I found very limited lesson context for "${lessonTitle}" (not enough for a meaningful summary).\n\nAvailable context: "${compact}"\n\nQuestion: "${question}"\n\nPlease add more lesson notes or use a video with captions.`;
  }

  const preview = compact.slice(0, 700);
  return `AI tutor is temporarily busy, so here is a quick local summary of "${lessonTitle}":\n\n${preview}${compact.length > 700 ? '...' : ''}\n\nQuestion asked: "${question}"`;
};

const isNonAnswerResponse = (text = '') => {
  const t = text.toLowerCase();
  return (
    t.includes('i apologize') ||
    t.includes('cannot provide a summary') ||
    t.includes('cannot summarize') ||
    t.includes('transcript for this') ||
    t.includes('no transcript available')
  );
};

/**
 * @desc    Add a lesson to a course
 * @route   POST /api/v1/courses/:courseId/lessons
 * @access  Instructor (owner)
 */
const addLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    throw new ApiError('Course not found', 404);
  }

  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized to add lessons to this course', 403);
  }

  // Auto-set order if not provided
  if (!req.body.order) {
    const lastLesson = await Lesson.findOne({ course: course._id }).sort('-order');
    req.body.order = lastLesson ? lastLesson.order + 1 : 1;
  }

  req.body.course = course._id;

  // If a video was uploaded via multer
  if (req.file) {
    req.body.videoUrl = req.file.path;
    req.body.videoPublicId = req.file.filename;
  }

  const lesson = await Lesson.create(req.body);

  // Add lesson to course's lessons array
  course.lessons.push(lesson._id);

  // Update total duration
  if (lesson.duration) {
    course.duration += lesson.duration;
  }

  await course.save();

  res.status(201).json({
    success: true,
    message: 'Lesson added successfully',
    data: { lesson },
  });
});

/**
 * @desc    Update a lesson
 * @route   PUT /api/v1/courses/:courseId/lessons/:id
 * @access  Instructor (owner)
 */
const updateLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  // If a new video was uploaded
  if (req.file) {
    req.body.videoUrl = req.file.path;
    req.body.videoPublicId = req.file.filename;
  }

  const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!lesson) throw new ApiError('Lesson not found', 404);

  res.status(200).json({
    success: true,
    message: 'Lesson updated',
    data: { lesson },
  });
});

/**
 * @desc    Delete a lesson
 * @route   DELETE /api/v1/courses/:courseId/lessons/:id
 * @access  Instructor (owner)
 */
const deleteLesson = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);
  if (course.instructor.toString() !== req.user._id.toString()) {
    throw new ApiError('Not authorized', 403);
  }

  const lesson = await Lesson.findByIdAndDelete(req.params.id);
  if (!lesson) throw new ApiError('Lesson not found', 404);

  // Remove from course's lessons array
  course.lessons = course.lessons.filter(
    (id) => id.toString() !== req.params.id
  );

  // Update duration
  if (lesson.duration) {
    course.duration = Math.max(0, course.duration - lesson.duration);
  }

  await course.save();

  res.status(200).json({
    success: true,
    message: 'Lesson deleted',
  });
});

/**
 * @desc    Ask AI tutor about a lesson
 * @route   POST /api/v1/courses/:courseId/lessons/:id/ai-tutor
 * @access  Enrolled Student / Instructor (owner)
 */
const askAITutor = asyncHandler(async (req, res) => {
  const { question, history = [] } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new ApiError('Question is required', 400);
  }

  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError('Lesson not found', 404);

  const course = await Course.findById(req.params.courseId);
  if (!course) throw new ApiError('Course not found', 404);

  const isOwnerInstructor =
    req.user.role === 'instructor' && course.instructor.toString() === req.user._id.toString();

  let isEnrolledStudent = false;
  if (req.user.role === 'student') {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: req.params.courseId,
    });
    isEnrolledStudent = Boolean(enrollment);
  }

  if (!isOwnerInstructor && !isEnrolledStudent) {
    throw new ApiError('Not authorized to use AI tutor for this lesson', 403);
  }

  const trimmedHistory = Array.isArray(history)
    ? history
        .slice(-8)
        .map((m) => ({
          role: m?.role === 'assistant' ? 'assistant' : 'user',
          text: String(m?.text || '').slice(0, 1200),
        }))
        .filter((m) => m.text)
    : [];

  const videoId = extractYouTubeVideoId(lesson.videoUrl || '');
  const transcriptText = videoId ? await fetchYoutubeTranscript(videoId) : '';
  const transcriptStatus = transcriptText
    ? 'Transcript captured from YouTube captions.'
    : 'Transcript unavailable (captions may be disabled/private/not public).';

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(200).json({
      success: true,
      data: {
        answer: `Tutor mode is active, but live AI is disabled because GEMINI_API_KEY is missing.\n\nLesson: "${lesson.title}"\n${transcriptStatus}\n\nQuestion: "${question.trim()}"`,
      },
    });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const compactLessonNotes = String(lesson.content || '').slice(0, 3000);
  const compactTranscript = String(transcriptText || '').slice(0, 6000);

  const prompt = `You are a helpful AI tutor for an online course.
Course title: "${course.title}"
Lesson title: "${lesson.title}"
Lesson notes/context:
${compactLessonNotes || 'No notes provided.'}

Video transcript context:
${compactTranscript || 'No YouTube transcript available for this lesson video.'}

Transcript status:
${transcriptStatus}

Recent conversation:
${trimmedHistory.map((m) => `${m.role.toUpperCase()}: ${m.text}`).join('\n') || 'No previous conversation.'}

Student question:
${question.trim()}

Respond with:
1) A direct answer
2) A short practical example
3) A quick 1-question check for understanding
Keep it concise and clear.`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  let lastError = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: 450,
            temperature: 0.3,
          },
        });

        const answer = (response.text || '').trim();
        if (!answer) throw new Error('Empty AI response');

        if (isNonAnswerResponse(answer)) {
          const upgradedFallback = buildLocalTutorFallback({
            lessonTitle: lesson.title,
            lessonContent: lesson.content,
            transcriptText,
            question: question.trim(),
          });
          return res.status(200).json({
            success: true,
            data: {
              answer: `${upgradedFallback}\n\n(Used smart fallback because AI returned an incomplete response.)`,
            },
          });
        }

        return res.status(200).json({
          success: true,
          data: { answer },
        });
      } catch (error) {
        lastError = error;
        const msg = parseErrorMessage(error);
        console.warn(`AI tutor error on ${model} attempt ${attempt}:`, msg);
        if (attempt < 2) {
          await sleep(1000 * attempt);
        } else if (attempt < 3) {
          await sleep(1800);
        }
      }
    }
  }

  const fallbackAnswer = buildLocalTutorFallback({
    lessonTitle: lesson.title,
    lessonContent: lesson.content,
    transcriptText,
    question: question.trim(),
  });

  const reason = parseErrorMessage(lastError);
  const friendlyReason = classifyAiIssue(reason);
  return res.status(200).json({
    success: true,
    data: {
      answer: `${fallbackAnswer}\n\n(Temporary AI issue: ${friendlyReason}. Please try again shortly.)`,
    },
  });
});

module.exports = { addLesson, updateLesson, deleteLesson, askAITutor };
