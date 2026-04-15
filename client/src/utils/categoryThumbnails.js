/**
 * Category thumbnail mapping — returns a category-specific CSS gradient
 * as the fallback thumbnail when no custom thumbnail is uploaded.
 * 
 * Each category gets a unique, visually distinct gradient that represents
 * its domain aesthetically.
 */

const CATEGORY_GRADIENTS = {
  'Web Development':    'linear-gradient(135deg, #4338ca 0%, #3b82f6 50%, #06b6d4 100%)',
  'Mobile Development': 'linear-gradient(135deg, #be185d 0%, #ec4899 50%, #f97316 100%)',
  'Data Science':       'linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)',
  'Machine Learning':   'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #06b6d4 100%)',
  'Cloud Computing':    'linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #7dd3fc 100%)',
  'DevOps':             'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #fbbf24 100%)',
  'Cybersecurity':      'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #f87171 100%)',
  'UI/UX Design':       'linear-gradient(135deg, #6d28d9 0%, #a855f7 50%, #e879f9 100%)',
  'Business':           'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fbbf24 100%)',
  'Other':              'linear-gradient(135deg, #312e81 0%, #6366f1 50%, #818cf8 100%)',
};

// SVG icons per category (inline - no external files needed)
const CATEGORY_ICONS = {
  'Web Development':    '{ }',
  'Mobile Development': '📱',
  'Data Science':       '📊',
  'Machine Learning':   '🧠',
  'Cloud Computing':    '☁️',
  'DevOps':             '⚙️',
  'Cybersecurity':      '🔒',
  'UI/UX Design':       '🎨',
  'Business':           '📈',
  'Other':              '💡',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

/**
 * Get the thumbnail background CSS for a course.
 * Uses the custom thumbnail if available, otherwise a category-specific gradient.
 */
export const getThumbnailBackground = (course) => {
  if (course?.thumbnail) {
    return `url(${course.thumbnail}) center/cover`;
  }
  return CATEGORY_GRADIENTS[course?.category] || DEFAULT_GRADIENT;
};

/**
 * Get the category gradient.
 */
export const getCategoryGradient = (category) => {
  return CATEGORY_GRADIENTS[category] || DEFAULT_GRADIENT;
};

/**
 * Get the category icon.
 */
export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || '📚';
};

export default CATEGORY_GRADIENTS;
