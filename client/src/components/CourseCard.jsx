import { Link } from 'react-router-dom';
import { FiStar, FiUsers, FiBookmark } from 'react-icons/fi';
import { useState } from 'react';
import API from '../api';
import { useSelector } from 'react-redux';
import { getThumbnailBackground, getCategoryIcon } from '../utils/categoryThumbnails';

const CourseCard = ({ course, showBookmark = false }) => {
  const { user } = useSelector((state) => state.auth);
  const [bookmarked, setBookmarked] = useState(user?.bookmarks?.includes(course._id) || false);

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await API.post(`/bookmarks/${course._id}`);
      setBookmarked(data.data.bookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const hasCustomThumb = !!course.thumbnail;

  return (
    <Link to={`/courses/${course._id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-interactive" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Thumbnail */}
        <div style={{
          height: '175px',
          background: getThumbnailBackground(course),
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Category icon overlay (shown only when no custom thumbnail) */}
          {!hasCustomThumb && (
            <span style={{
              fontSize: '3rem',
              opacity: 0.35,
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              userSelect: 'none',
              pointerEvents: 'none',
            }}>
              {getCategoryIcon(course.category)}
            </span>
          )}

          {/* Price Badge */}
          <span className={course.price === 0 ? 'badge badge-solid-success' : 'badge badge-solid-primary'} style={{
            position: 'absolute', top: 10, right: 10,
            padding: '5px 12px', fontSize: '0.78rem',
          }}>
            {course.price === 0 ? 'Free' : `$${course.price}`}
          </span>

          {/* Category Badge */}
          <span style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(0,0,0,0.55)', color: 'white',
            padding: '4px 10px', borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem', fontWeight: 500,
            backdropFilter: 'blur(4px)',
          }}>
            {course.category}
          </span>

          {/* Bookmark */}
          {showBookmark && user?.role === 'student' && (
            <button onClick={handleBookmark} aria-label="Bookmark" style={{
              position: 'absolute', top: 10, left: 10,
              background: bookmarked ? 'var(--accent-amber)' : 'rgba(0,0,0,0.45)',
              border: 'none', borderRadius: '50%', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
              transition: 'all var(--duration-fast)',
            }}>
              <FiBookmark size={13} fill={bookmarked ? 'white' : 'none'} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 className="truncate-2" style={{
            fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)',
            marginBottom: '6px', lineHeight: 1.4,
          }}>
            {course.title}
          </h3>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: 'auto' }}>
            {course.instructor?.name || 'Unknown Instructor'}
          </p>

          {/* Rating & Students */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiStar size={13} style={{ color: 'var(--accent-amber)', fill: 'var(--accent-amber)' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {course.avgRating?.toFixed(1) || '0.0'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                ({course.totalReviews || 0})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }}>
              <FiUsers size={12} />
              <span style={{ fontSize: '0.78rem' }}>{course.totalStudents || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
