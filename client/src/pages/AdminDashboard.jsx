import { useEffect, useState } from 'react';
import API from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUsers, FiBook, FiDollarSign, FiTrendingUp, FiCheck, FiX, FiTrash2, FiEye } from 'react-icons/fi';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pendingCourses, setPending] = useState([]);
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [reviewData, setReviewData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [a, p, ac, u] = await Promise.all([
          API.get('/admin/analytics'),
          API.get('/admin/courses/pending'),
          API.get('/courses?limit=100&sort=-createdAt'),
          API.get('/admin/users?limit=50'),
        ]);
        setAnalytics(a.data.data);
        setPending(p.data.data.courses);
        setApprovedCourses(ac.data.data.courses);
        setUsers(u.data.data.users);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const handleCourseStatus = async (id, status, reason = '') => {
    try {
      const payload = { status };
      if (status === 'rejected' && reason.trim()) {
        payload.reason = reason.trim();
      }

      await API.put(`/admin/courses/${id}/status`, payload);
      const approvedCourse = pendingCourses.find((c) => c._id === id);
      setPending((prev) => prev.filter((c) => c._id !== id));
      if (status === 'approved' && approvedCourse) {
        setApprovedCourses((prev) => [{ ...approvedCourse, status: 'approved' }, ...prev]);
      }
      if (selectedCourseId === id) {
        setSelectedCourseId('');
        setReviewData(null);
        setReviewError('');
        setRejectionReason('');
      }
      setAnalytics((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: {
            ...prev.courses,
            pending: Math.max(0, (prev.courses?.pending || 0) - 1),
            approved: status === 'approved'
              ? (prev.courses?.approved || 0) + 1
              : (prev.courses?.approved || 0),
          },
        };
      });
    } catch { alert('Failed to update'); }
  };

  const handlePreviewCourse = async (id) => {
    setSelectedCourseId(id);
    setReviewLoading(true);
    setReviewError('');
    setReviewData(null);
    setRejectionReason('');

    try {
      const response = await API.get(`/admin/courses/${id}/review`);
      setReviewData(response.data.data);
    } catch (e) {
      setReviewError(e?.response?.data?.message || 'Failed to load course review');
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Delete course "${title}"? This cannot be undone.`)) return;
    try {
      const wasPending = pendingCourses.some((c) => c._id === id);
      const wasApproved = approvedCourses.some((c) => c._id === id);
      await API.delete(`/admin/courses/${id}`);
      setPending((prev) => prev.filter((c) => c._id !== id));
      setApprovedCourses((prev) => prev.filter((c) => c._id !== id));
      if (selectedCourseId === id) {
        setSelectedCourseId('');
        setReviewData(null);
        setReviewError('');
        setRejectionReason('');
      }
      setAnalytics((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: {
            ...prev.courses,
            total: Math.max(0, (prev.courses?.total || 0) - 1),
            pending: wasPending ? Math.max(0, (prev.courses?.pending || 0) - 1) : (prev.courses?.pending || 0),
            approved: wasApproved ? Math.max(0, (prev.courses?.approved || 0) - 1) : (prev.courses?.approved || 0),
          },
        };
      });
    } catch {
      alert('Failed to delete course');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch { alert('Failed'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await API.put(`/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
    } catch { alert('Failed'); }
  };

  if (loading) return <LoadingSpinner />;

  const formatDuration = (seconds = 0) => {
    const mins = Math.floor(Number(seconds) / 60) || 0;
    const secs = Math.floor(Number(seconds) % 60) || 0;
    return `${mins}m ${secs}s`;
  };

  const getVerdictBadge = (verdict) => {
    if (verdict === 'likely_legit') {
      return { text: 'Likely Legit', bg: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)' };
    }
    if (verdict === 'likely_spam') {
      return { text: 'Likely Nonsense/Spam', bg: '#ffe4e6', color: '#be123c' };
    }
    return { text: 'Needs Manual Review', bg: '#fff7ed', color: '#c2410c' };
  };

  const tabs = ['overview', 'courses', 'users'];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and management</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab ${tab === t ? 'active' : ''}`}>{t}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && analytics && (
        <div className="animate-fadeIn">
          <div className="grid-stats stagger" style={{ marginBottom: 'var(--space-8)' }}>
            {[
              { icon: FiUsers, label: 'Total Users', value: analytics.users.total, color: '#6366f1' },
              { icon: FiBook, label: 'Total Courses', value: analytics.courses.total, color: '#ec4899' },
              { icon: FiTrendingUp, label: 'Enrollments', value: analytics.enrollments, color: '#0ea5e9' },
              { icon: FiDollarSign, label: 'Revenue', value: `$${analytics.revenue}`, color: '#10b981' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-icon" style={{ background: `${color}12` }}>
                  {icon({ size: 22, style: { color } })}
                </div>
                <div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid-cols-2 grid-auto">
            <div className="card card-body-lg">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>User Breakdown</h3>
              {[
                { l: 'Students', v: analytics.users.students, c: '#6366f1' },
                { l: 'Instructors', v: analytics.users.instructors, c: '#ec4899' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{l}</span>
                  <strong style={{ color: c }}>{v}</strong>
                </div>
              ))}
            </div>
            <div className="card card-body-lg">
              <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>Course Status</h3>
              {[
                { l: 'Approved', v: analytics.courses.approved, c: '#10b981' },
                { l: 'Pending', v: analytics.courses.pending, c: '#f59e0b' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{l}</span>
                  <strong style={{ color: c }}>{v}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {tab === 'courses' && (
        <div className="animate-fadeIn">
          <div className="section-header">
            <h2>Pending Approval</h2>
            <span className="badge badge-warning">{pendingCourses.length}</span>
          </div>
          {pendingCourses.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div className="empty-state-icon">✅</div>
              <h3>All caught up!</h3>
              <p>No courses are pending review</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {pendingCourses.map((c) => (
                <div key={c._id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      by {c.instructor?.name} — {c.instructor?.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => handlePreviewCourse(c._id)}
                      className="btn btn-sm"
                      style={{ border: '1px solid var(--border-subtle)' }}
                      title="Review course details"
                    >
                      <FiEye size={14} style={{ marginRight: 6 }} /> Review
                    </button>
                    <button onClick={() => handleCourseStatus(c._id, 'approved')}
                      className="btn btn-icon btn-sm" style={{ background: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)', border: 'none' }}
                      title="Approve">
                      <FiCheck size={15} />
                    </button>
                    <button onClick={() => handleCourseStatus(c._id, 'rejected')}
                      className="btn btn-icon btn-danger btn-sm"
                      title="Reject">
                      <FiX size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(c._id, c.title)}
                      className="btn btn-icon btn-danger btn-sm"
                      title="Delete course"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCourseId && (
            <div className="card card-body-lg" style={{ marginTop: 'var(--space-5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Course Review</h3>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setSelectedCourseId('');
                    setReviewData(null);
                    setReviewError('');
                    setRejectionReason('');
                  }}
                >
                  Close
                </button>
              </div>

              {reviewLoading && <p style={{ color: 'var(--text-secondary)' }}>Loading full course content...</p>}

              {!reviewLoading && reviewError && (
                <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
                  <h3>Could not load review</h3>
                  <p>{reviewError}</p>
                </div>
              )}

              {!reviewLoading && reviewData && (
                <>
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{reviewData.course?.title}</h4>
                    <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      by {reviewData.course?.instructor?.name} ({reviewData.course?.instructor?.email})
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div className="list-item"><strong>Category:</strong>&nbsp;{reviewData.course?.category || 'N/A'}</div>
                    <div className="list-item"><strong>Level:</strong>&nbsp;{reviewData.course?.level || 'N/A'}</div>
                    <div className="list-item"><strong>Price:</strong>&nbsp;${reviewData.course?.price || 0}</div>
                    <div className="list-item"><strong>Language:</strong>&nbsp;{reviewData.course?.language || 'N/A'}</div>
                  </div>

                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h4 style={{ fontSize: '0.92rem', marginBottom: '8px' }}>Description</h4>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {reviewData.course?.description || 'No description provided'}
                    </p>
                  </div>

                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <h4 style={{ fontSize: '0.92rem', marginBottom: '8px' }}>
                      Lessons ({reviewData.course?.lessons?.length || 0})
                    </h4>
                    {!reviewData.course?.lessons?.length ? (
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No lessons submitted.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {reviewData.course.lessons.map((lesson) => (
                          <div key={lesson._id} className="list-item" style={{ alignItems: 'flex-start', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 'var(--space-2)' }}>
                              <strong style={{ fontSize: '0.88rem' }}>{lesson.order}. {lesson.title}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatDuration(lesson.duration)}</span>
                            </div>
                            {lesson.content ? (
                              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {lesson.content.slice(0, 260)}{lesson.content.length > 260 ? '...' : ''}
                              </p>
                            ) : (
                              <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No lesson text content.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {reviewData.aiReview && (
                    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '0.92rem' }}>AI Legitimacy Review</h4>
                        <span style={{ fontSize: '0.75rem', background: getVerdictBadge(reviewData.aiReview.verdict).bg, color: getVerdictBadge(reviewData.aiReview.verdict).color, borderRadius: '999px', padding: '4px 10px', fontWeight: 600 }}>
                          {getVerdictBadge(reviewData.aiReview.verdict).text}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        {reviewData.aiReview.summary}
                      </p>
                      <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        Confidence: {reviewData.aiReview.confidence}% | Recommendation: {reviewData.aiReview.recommendedAction} | Model: {reviewData.aiReview.model}
                      </p>

                      {reviewData.aiReview.reasons?.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <strong style={{ fontSize: '0.78rem' }}>Positive signals:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                            {reviewData.aiReview.reasons.map((item) => <li key={item} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item}</li>)}
                          </ul>
                        </div>
                      )}

                      {reviewData.aiReview.redFlags?.length > 0 && (
                        <div>
                          <strong style={{ fontSize: '0.78rem', color: '#be123c' }}>Red flags:</strong>
                          <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                            {reviewData.aiReview.redFlags.map((item) => <li key={item} style={{ fontSize: '0.78rem', color: '#be123c' }}>{item}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rejection reason (optional but recommended)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="input"
                      rows={3}
                      placeholder="Example: Content appears low quality and not educational"
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleCourseStatus(reviewData.course._id, 'approved')}
                      className="btn btn-sm"
                      style={{ background: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)', border: 'none' }}
                    >
                      <FiCheck size={14} style={{ marginRight: 6 }} /> Approve Course
                    </button>
                    <button
                      onClick={() => handleCourseStatus(reviewData.course._id, 'rejected', rejectionReason)}
                      className="btn btn-danger btn-sm"
                    >
                      <FiX size={14} style={{ marginRight: 6 }} /> Reject Course
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="section-header" style={{ marginTop: 'var(--space-8)' }}>
            <h2>Approved Courses</h2>
            <span className="badge badge-neutral">{approvedCourses.length}</span>
          </div>
          {approvedCourses.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <div className="empty-state-icon">📚</div>
              <h3>No approved courses</h3>
              <p>Approved courses will appear here</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {approvedCourses.map((c) => (
                <div key={c._id} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                      by {c.instructor?.name || 'Unknown Instructor'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => handlePreviewCourse(c._id)}
                      className="btn btn-sm"
                      style={{ border: '1px solid var(--border-subtle)' }}
                      title="Review course details"
                    >
                      <FiEye size={14} style={{ marginRight: 6 }} /> Review
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(c._id, c.title)}
                      className="btn btn-icon btn-danger btn-sm"
                      title="Delete approved course"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="animate-fadeIn">
          <div className="section-header">
            <h2>Users</h2>
            <span className="badge badge-neutral">{users.length}</span>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {['Name','Email','Role','Joined','Actions'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <select value={u.role} onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="input select" style={{ padding: '4px 28px 4px 8px', fontSize: '0.78rem', borderRadius: 'var(--radius-sm)' }}>
                        {['student','instructor','admin'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => handleDeleteUser(u._id)}
                        className="btn btn-icon btn-danger btn-sm" title="Delete user">
                        <FiTrash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
