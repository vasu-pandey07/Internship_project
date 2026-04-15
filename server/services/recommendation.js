const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

/**
 * Content-based recommendation service.
 * Analyzes enrolled courses' categories and tags,
 * then finds similar un-enrolled approved courses.
 *
 * Algorithm:
 * 1. Gather categories & tags from student's enrolled courses
 * 2. Score candidate courses by matching tag/category overlap
 * 3. Sort by score (descending), then by avgRating
 * 4. Return top N recommendations
 */
const getRecommendationsForUser = async (userId, limit = 10) => {
  const enrollments = await Enrollment.find({ student: userId })
    .populate('course', 'category tags');

  const enrolledIds = [];
  const categoryFreq = {};
  const tagFreq = {};

  enrollments.forEach((e) => {
    if (!e.course) return;
    enrolledIds.push(e.course._id);

    // Track category frequency
    const cat = e.course.category;
    categoryFreq[cat] = (categoryFreq[cat] || 0) + 1;

    // Track tag frequency
    e.course.tags.forEach((tag) => {
      tagFreq[tag] = (tagFreq[tag] || 0) + 1;
    });
  });

  // Get candidate courses (approved, not enrolled)
  const candidates = await Course.find({
    status: 'approved',
    _id: { $nin: enrolledIds },
  })
    .populate('instructor', 'name avatar')
    .lean();

  // Score each candidate
  const scored = candidates.map((course) => {
    let score = 0;

    // Category match (weighted by how many courses in that category)
    if (categoryFreq[course.category]) {
      score += categoryFreq[course.category] * 3;
    }

    // Tag overlap
    course.tags.forEach((tag) => {
      if (tagFreq[tag]) {
        score += tagFreq[tag] * 2;
      }
    });

    // Boost by rating
    score += (course.avgRating || 0) * 0.5;

    // Boost by popularity
    score += Math.min((course.totalStudents || 0) * 0.01, 2);

    return { ...course, _recommendationScore: score };
  });

  // Sort by score desc, then by avgRating desc
  scored.sort((a, b) => {
    if (b._recommendationScore !== a._recommendationScore) {
      return b._recommendationScore - a._recommendationScore;
    }
    return (b.avgRating || 0) - (a.avgRating || 0);
  });

  return scored.slice(0, limit);
};

module.exports = { getRecommendationsForUser };
