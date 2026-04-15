import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyEnrollments } from '../features/enrollmentSlice';
import { fetchRecommendations } from '../features/courseSlice';
import { Link } from 'react-router-dom';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiBookOpen, FiAward, FiTrendingUp, FiBookmark, FiArrowRight } from 'react-icons/fi';

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { list: enrollments, loading } = useSelector((s) => s.enrollments);
  const { recommendations } = useSelector((s) => s.courses);

  useEffect(() => {
    dispatch(fetchMyEnrollments());
    dispatch(fetchRecommendations());
  }, [dispatch]);

  const inProgress = enrollments.filter((e) => e.completionPercentage < 100);
  const completed = enrollments.filter((e) => e.completionPercentage === 100);

  if (loading) return <LoadingSpinner />;

  const statItems = [
    { icon: FiBookOpen, label: 'Enrolled', value: enrollments.length, color: '#6366f1' },
    { icon: FiTrendingUp, label: 'In Progress', value: inProgress.length, color: '#f59e0b' },
    { icon: FiAward, label: 'Completed', value: completed.length, color: '#10b981' },
    { icon: FiBookmark, label: 'Bookmarked', value: user?.bookmarks?.length || 0, color: '#ec4899' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      {/* Welcome */}
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p>Continue your learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid-stats stagger" style={{ marginBottom: 'var(--space-10)' }}>
        {statItems.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
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

      {/* In-Progress Courses */}
      {inProgress.length > 0 && (
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <div className="section-header">
            <h2>Continue Learning</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {inProgress.map((e) => (
              <Link key={e._id} to={`/student/courses/${e.course?._id}`} style={{ textDecoration: 'none' }}>
                <div className="list-item">
                  <div className="list-thumb" style={{
                    backgroundImage: e.course?.thumbnail ? `url(${e.course.thumbnail})` : undefined,
                  }}>
                    {!e.course?.thumbnail && <div className="list-thumb list-thumb-gradient" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate-1" style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '8px' }}>
                      {e.course?.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${e.completionPercentage}%` }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                        {e.completionPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <div className="section-header">
            <h2>Recommended for You</h2>
            <Link to="/courses">View All <FiArrowRight size={13} /></Link>
          </div>
          <div className="grid-courses stagger">
            {recommendations.slice(0, 4).map((c) => <CourseCard key={c._id} course={c} showBookmark />)}
          </div>
        </section>
      )}

      {enrollments.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No enrollments yet</h3>
          <p>Start exploring courses and begin your learning journey!</p>
          <Link to="/courses" className="btn btn-primary btn-md" style={{ marginTop: 'var(--space-5)' }}>
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
