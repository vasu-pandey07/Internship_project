import { useEffect, useState } from 'react';
import API from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUsers, FiBook, FiDollarSign, FiTrendingUp, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pendingCourses, setPending] = useState([]);
  const [approvedCourses, setApprovedCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

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

  const handleCourseStatus = async (id, status) => {
    try {
      await API.put(`/admin/courses/${id}/status`, { status });
      const approvedCourse = pendingCourses.find((c) => c._id === id);
      setPending((prev) => prev.filter((c) => c._id !== id));
      if (status === 'approved' && approvedCourse) {
        setApprovedCourses((prev) => [{ ...approvedCourse, status: 'approved' }, ...prev]);
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
    } catch (e) { alert('Failed to update'); }
  };

  const handleDeleteCourse = async (id, title) => {
    if (!window.confirm(`Delete course "${title}"? This cannot be undone.`)) return;
    try {
      const wasPending = pendingCourses.some((c) => c._id === id);
      const wasApproved = approvedCourses.some((c) => c._id === id);
      await API.delete(`/admin/courses/${id}`);
      setPending((prev) => prev.filter((c) => c._id !== id));
      setApprovedCourses((prev) => prev.filter((c) => c._id !== id));
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
    } catch (e) {
      alert('Failed to delete course');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
    } catch (e) { alert('Failed'); }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await API.put(`/admin/users/${id}/role`, { role });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, role } : u));
    } catch (e) { alert('Failed'); }
  };

  if (loading) return <LoadingSpinner />;

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
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-icon" style={{ background: `${color}12` }}>
                  <Icon size={22} style={{ color }} />
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
                  <button
                    onClick={() => handleDeleteCourse(c._id, c.title)}
                    className="btn btn-icon btn-danger btn-sm"
                    title="Delete approved course"
                  >
                    <FiTrash2 size={15} />
                  </button>
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
