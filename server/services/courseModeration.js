const { GoogleGenAI } = require('@google/genai');

const PLACEHOLDER_GEMINI_KEY = 'your_gemini_api_key_here';

const toPlainText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const truncate = (value, max = 800) => {
  const text = toPlainText(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const getVerdictFromScore = (score) => {
  if (score >= 70) return 'likely_legit';
  if (score >= 45) return 'needs_manual_review';
  return 'likely_spam';
};

const getRecommendedAction = (verdict) => {
  if (verdict === 'likely_legit') return 'approve';
  if (verdict === 'likely_spam') return 'reject';
  return 'manual-review';
};

const getFriendlyFallbackReason = (rawReason) => {
  const msg = toPlainText(rawReason).toLowerCase();
  if (!msg) return 'AI review was temporarily unavailable; heuristic checks were used.';

  if (msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate limit')) {
    return 'AI review is temporarily rate-limited; heuristic checks were used.';
  }

  if (msg.includes('api key') || msg.includes('permission') || msg.includes('unauthorized')) {
    return 'AI configuration/auth issue detected; heuristic checks were used.';
  }

  if (msg.includes('timeout') || msg.includes('network') || msg.includes('unavailable')) {
    return 'AI service was unreachable; heuristic checks were used.';
  }

  return 'AI review failed; heuristic checks were used.';
};

const heuristicModeration = (course, lessons, fallbackReason) => {
  let score = 65;
  const reasons = [];
  const redFlags = [];

  const title = toPlainText(course?.title);
  const description = toPlainText(course?.description);
  const tagText = Array.isArray(course?.tags) ? course.tags.join(' ') : '';
  const lessonText = (lessons || [])
    .map((lesson) => `${lesson.title || ''} ${lesson.content || ''}`)
    .join(' ');
  const combined = `${title} ${description} ${tagText} ${lessonText}`.toLowerCase();

  if (description.length < 80) {
    score -= 20;
    redFlags.push('Course description is very short for meaningful review.');
  } else {
    reasons.push('Description has enough detail for learners to understand the topic.');
  }

  if (!Array.isArray(lessons) || lessons.length === 0) {
    score -= 25;
    redFlags.push('No lessons were added to the course.');
  } else {
    reasons.push(`Course includes ${lessons.length} lesson(s).`);
  }

  const suspiciousPatterns = [
    /lorem ipsum/gi,
    /asdf|qwer|zxcv/gi,
    /free money|earn fast|click here/gi,
    /nonsense|blah blah/gi,
    /(.)\1{5,}/g,
  ];

  const suspiciousHits = suspiciousPatterns.reduce((total, pattern) => {
    const matches = combined.match(pattern);
    return total + (matches ? matches.length : 0);
  }, 0);

  if (suspiciousHits > 0) {
    score -= Math.min(25, suspiciousHits * 8);
    redFlags.push('Detected suspicious or low-quality text patterns.');
  }

  const words = combined.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  if (words.length > 25) {
    const uniquenessRatio = uniqueWords.size / words.length;
    if (uniquenessRatio < 0.25) {
      score -= 15;
      redFlags.push('Text appears highly repetitive, which can indicate spam content.');
    }
  }

  const verdict = getVerdictFromScore(score);
  const confidence = Math.max(35, Math.min(90, Math.round(Math.abs(score - 50) + 40)));

  if (reasons.length === 0) {
    reasons.push('Heuristic checks were applied due to unavailable AI response.');
  }

  if (fallbackReason) {
    reasons.push(getFriendlyFallbackReason(fallbackReason));
  }

  return {
    verdict,
    confidence,
    summary:
      verdict === 'likely_legit'
        ? 'Content appears coherent and suitable for manual approval review.'
        : verdict === 'needs_manual_review'
          ? 'Content has mixed quality signals; manual review is recommended.'
          : 'Content shows multiple low-quality signals and should be reviewed carefully.',
    reasons,
    redFlags,
    recommendedAction: getRecommendedAction(verdict),
    model: 'heuristic',
  };
};

const normalizeAiOutput = (raw) => {
  const allowedVerdicts = new Set(['likely_legit', 'needs_manual_review', 'likely_spam']);
  const allowedActions = new Set(['approve', 'manual-review', 'reject']);

  const verdict = allowedVerdicts.has(raw?.verdict) ? raw.verdict : 'needs_manual_review';
  const recommendedAction = allowedActions.has(raw?.recommendedAction)
    ? raw.recommendedAction
    : getRecommendedAction(verdict);

  const reasons = Array.isArray(raw?.reasons)
    ? raw.reasons.map((item) => toPlainText(item)).filter(Boolean).slice(0, 5)
    : [];
  const redFlags = Array.isArray(raw?.redFlags)
    ? raw.redFlags.map((item) => toPlainText(item)).filter(Boolean).slice(0, 5)
    : [];

  return {
    verdict,
    confidence: Math.max(1, Math.min(100, Number(raw?.confidence) || 55)),
    summary: truncate(raw?.summary || 'AI review completed.', 320),
    reasons,
    redFlags,
    recommendedAction,
    model: 'gemini-2.5-flash',
  };
};

const evaluateCourseLegitimacy = async (course, lessons = []) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === PLACEHOLDER_GEMINI_KEY) {
    return heuristicModeration(course, lessons, 'Missing GEMINI_API_KEY.');
  }

  const compactLessons = (lessons || []).slice(0, 20).map((lesson) => ({
    title: truncate(lesson?.title, 120),
    content: truncate(lesson?.content, 380),
    duration: Number(lesson?.duration) || 0,
  }));

  const payload = {
    title: truncate(course?.title, 160),
    description: truncate(course?.description, 1600),
    category: toPlainText(course?.category),
    level: toPlainText(course?.level),
    language: toPlainText(course?.language || 'English'),
    tags: Array.isArray(course?.tags) ? course.tags.slice(0, 20) : [],
    lessonCount: lessons.length,
    lessons: compactLessons,
  };

  const prompt = `You are an LMS trust and quality reviewer. Analyze this course data and detect if the content is legitimate educational material or likely nonsense/spam.

Return ONLY raw JSON with this exact schema:
{
  "verdict": "likely_legit" | "needs_manual_review" | "likely_spam",
  "confidence": number,
  "summary": "string",
  "reasons": ["string"],
  "redFlags": ["string"],
  "recommendedAction": "approve" | "manual-review" | "reject"
}

Rules:
- Use evidence from title, description, and lessons.
- Flag gibberish, repeated filler, scammy phrases, or off-topic content.
- If uncertain, choose "needs_manual_review".
- Confidence must be 1-100.

Course data:
${JSON.stringify(payload)}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const rawText = String(response?.text || '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(rawText);

    return normalizeAiOutput(parsed);
  } catch (error) {
    return heuristicModeration(course, lessons, error?.message || 'AI request failed.');
  }
};

module.exports = { evaluateCourseLegitimacy };