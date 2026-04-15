import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchCourses } from '../features/courseSlice';
import CourseCard from '../components/CourseCard';
import { SkeletonCard } from '../components/LoadingSpinner';
import { FiArrowRight, FiBook, FiAward, FiUsers, FiPlay } from 'react-icons/fi';

const Home = () => {
  const dispatch = useDispatch();
  const { list: courses, loading } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCourses({ limit: 8 }));
  }, [dispatch]);

  const stats = [
    { icon: FiBook, value: '500+', label: 'Courses', color: '#6366f1' },
    { icon: FiUsers, value: '10K+', label: 'Students', color: '#ec4899' },
    { icon: FiAward, value: '200+', label: 'Instructors', color: '#0ea5e9' },
    { icon: FiPlay, value: '5K+', label: 'Hours of Content', color: '#10b981' },
  ];

  const categories = [
    { name: 'Web Development', emoji: '🌐' },
    { name: 'Data Science', emoji: '📊' },
    { name: 'Mobile Development', emoji: '📱' },
    { name: 'Machine Learning', emoji: '🤖' },
    { name: 'Cloud Computing', emoji: '☁️' },
    { name: 'UI/UX Design', emoji: '🎨' },
  ];

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="hero-gradient" style={{ padding: 'var(--space-16) 0', color: 'white' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '640px' }} className="animate-fadeInUp">
            <span className="badge" style={{
              background: 'rgba(99,102,241,0.25)', color: '#a5b4fc',
              padding: '7px 16px', fontSize: '0.82rem', marginBottom: 'var(--space-5)',
              border: '1px solid rgba(99,102,241,0.25)', display: 'inline-block',
            }}>
              🚀 Start Learning Today
            </span>

            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800,
              lineHeight: 1.12, marginBottom: 'var(--space-5)', marginTop: 'var(--space-5)',
              letterSpacing: '-0.03em',
            }} className="text-gradient">
              Unlock Your Potential with World-Class Courses
            </h1>

            <p style={{
              fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.7,
              marginBottom: 'var(--space-8)', maxWidth: '520px',
            }}>
              Learn from industry experts. Build real-world skills. Get certified and advance your career with our curated learning paths.
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <Link to={user ? '/courses' : '/register'} className="btn btn-lg" style={{
                background: 'white', color: '#4f46e5', fontWeight: 700,
                borderColor: 'white',
              }}>
                {user ? 'Explore Courses' : 'Get Started Free'} <FiArrowRight size={16} />
              </Link>
              <Link to="/courses" className="btn btn-lg" style={{
                background: 'rgba(255,255,255,0.08)', color: 'white',
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
              }}>
                Browse Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="container" style={{ marginTop: '-44px', position: 'relative', zIndex: 2 }}>
        <div className="grid-stats stagger" style={{
          background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6)', boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
        }}>
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)' }}>
              <div className="stat-icon" style={{ background: `${color}12` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────── */}
      <section className="container page-section">
        <div className="page-header">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Explore Categories</h2>
          <p>Find courses in your area of interest</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 'var(--space-3)' }} className="stagger">
          {categories.map(({ name, emoji }) => (
            <Link key={name} to={`/courses?category=${encodeURIComponent(name)}`} className="category-card">
              <div style={{ fontSize: '1.6rem', marginBottom: 'var(--space-2)' }}>{emoji}</div>
              <span>{name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────────────────── */}
      <section className="container" style={{ paddingBottom: 'var(--space-16)' }}>
        <div className="section-header">
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>Featured Courses</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Top-rated courses from our instructors</p>
          </div>
          <Link to="/courses">View All <FiArrowRight size={13} /></Link>
        </div>

        {loading ? (
          <div className="grid-courses">
            {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid-courses stagger">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} showBookmark />
            ))}
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>No courses available yet</h3>
            <p>Be the first instructor to create a course!</p>
          </div>
        )}
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      {!user && (
        <section style={{
          background: 'linear-gradient(135deg, #0c0f1a 0%, #312e81 100%)',
          padding: 'var(--space-16) var(--space-6)', textAlign: 'center', color: 'white',
        }}>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: 'var(--space-3)', letterSpacing: '-0.02em' }}>
            Ready to Start Learning?
          </h2>
          <p style={{ fontSize: '1.05rem', opacity: 0.85, maxWidth: '480px', margin: '0 auto var(--space-8)', lineHeight: 1.7 }}>
            Join thousands of learners and start building the skills you need today.
          </p>
          <Link to="/register" className="btn btn-lg" style={{
            background: 'white', color: '#4f46e5', borderColor: 'white', fontWeight: 700,
          }}>
            Create Free Account <FiArrowRight size={16} />
          </Link>
        </section>
      )}
    </div>
  );
};

export default Home;
