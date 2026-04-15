import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourse } from '../features/courseSlice';
import { enrollInCourse } from '../features/enrollmentSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import API from '../api';
import { FiStar, FiUsers, FiClock, FiPlay, FiCheck, FiShoppingCart } from 'react-icons/fi';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: course, loading } = useSelector((s) => s.courses);
  const { user } = useSelector((s) => s.auth);
  const [reviews, setReviews] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { dispatch(fetchCourse(id)); }, [dispatch, id]);

  useEffect(() => {
    if (course) {
      API.get(`/courses/${id}/reviews`).then(r => setReviews(r.data.data.reviews)).catch(() => {});
      if (user?.role === 'student') {
        API.get('/enrollments/my').then(r => {
          const e = r.data.data.enrollments.find(e => e.course?._id === id);
          if (e) setEnrolled(true);
        }).catch(() => {});
      }
    }
  }, [course, id, user]);

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    if (course.price > 0) {
      try {
        const { data } = await API.post('/payments/create-checkout', { courseId: id });
        window.location.href = data.data.url;
      } catch (e) { alert(e.response?.data?.message || 'Payment error'); }
      return;
    }
    setEnrolling(true);
    try {
      await dispatch(enrollInCourse(id)).unwrap();
      setEnrolled(true);
    } catch (e) { alert(e); }
    setEnrolling(false);
  };

  if (loading || !course) return <LoadingSpinner />;

  const formatDuration = (s) => { const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m}m`; };

  const tabs = ['overview','curriculum','reviews'];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <div className="detail-grid animate-fadeIn">
        {/* Main Content */}
        <div>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <span className="badge badge-neutral">{course.category}</span>
            <span className="badge badge-neutral">{course.level}</span>
          </div>

          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, lineHeight: 1.3, marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
            {course.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FiStar size={14} style={{ color: 'var(--accent-amber)', fill: 'var(--accent-amber)' }} />
              <strong style={{ fontSize: '0.9rem' }}>{course.avgRating?.toFixed(1)}</strong>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>({course.totalReviews} reviews)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}><FiUsers size={14} /> {course.totalStudents} students</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}><FiClock size={14} /> {formatDuration(course.duration || 0)}</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-6)' }}>
            Created by <strong style={{ color: 'var(--text-primary)' }}>{course.instructor?.name}</strong>
          </p>

          {/* Tabs */}
          <div className="tabs">
            {tabs.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`tab ${activeTab === t ? 'active' : ''}`}>{t}</button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>About This Course</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{course.description}</p>
              {course.tags?.length > 0 && (
                <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {course.tags.map(t => <span key={t} className="badge badge-neutral">{t}</span>)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>
                Course Content — {course.lessons?.length || 0} Lessons
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {course.lessons?.map((lesson, i) => (
                  <div key={lesson._id} className="list-item" style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div className="stat-icon" style={{ background: 'var(--primary-soft)', width: 36, height: 36 }}>
                      <FiPlay size={14} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{i + 1}. {lesson.title}</div>
                      {lesson.duration > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatDuration(lesson.duration)}</div>}
                    </div>
                    {lesson.isFreePreview && <span className="badge badge-success">Free Preview</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>Student Reviews</h3>
              {reviews.length === 0 ? <p style={{ color: 'var(--text-tertiary)' }}>No reviews yet</p> :
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {reviews.map(r => (
                    <div key={r._id} className="card" style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                        <div className="avatar avatar-md" style={{ background: 'var(--primary)' }}>
                          {r.student?.name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.student?.name}</div>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {[1,2,3,4,5].map(s => <FiStar key={s} size={11} style={{ color: s<=r.rating ? 'var(--accent-amber)' : 'var(--border-default)', fill: s<=r.rating ? 'var(--accent-amber)' : 'none' }} />)}
                          </div>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-height) + var(--space-4))' }}>
          <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div style={{
              height: '200px',
              background: course.thumbnail ? `url(${course.thumbnail}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }} />
            <div className="card-body-lg">
              <div style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                {course.price === 0 ? <span style={{ color: 'var(--accent-emerald)' }}>Free</span> : `$${course.price}`}
              </div>

              {enrolled ? (
                <button onClick={() => navigate(`/student/courses/${id}`)}
                  className="btn btn-success btn-md btn-block" style={{ padding: '12px' }}>
                  <FiCheck size={16} /> Continue Learning
                </button>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling}
                  className="btn btn-primary btn-md btn-block" style={{ padding: '12px' }}>
                  {course.price > 0 ? <><FiShoppingCart size={16} /> Buy Now</> : enrolling ? 'Enrolling...' : 'Enroll Now — Free'}
                </button>
              )}

              <div style={{ marginTop: 'var(--space-5)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {[
                  ['Lessons', course.lessons?.length || 0],
                  ['Duration', formatDuration(course.duration || 0)],
                  ['Level', course.level],
                  ['Language', course.language],
                ].map(([label, value], i, arr) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
