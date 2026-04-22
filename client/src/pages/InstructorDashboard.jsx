import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyCourses } from '../features/courseSlice';
import API from '../api';
import { FiPlus, FiEdit, FiTrash2, FiSend, FiBook, FiUsers, FiStar, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { myCourses } = useSelector((s) => s.courses);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Web Development', level: 'Beginner', price: 0, tags: '' });
  const [creating, setCreating] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    dispatch(fetchMyCourses());
    API.get('/courses/instructor-analytics')
      .then((res) => setAnalytics(res.data.data.analytics))
      .catch(() => setAnalytics(null));
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      await API.post('/courses', payload);
      dispatch(fetchMyCourses());
      setShowCreate(false);
      setForm({ title: '', description: '', category: 'Web Development', level: 'Beginner', price: 0, tags: '' });
    } catch (e) { alert(e.response?.data?.message || 'Error creating course'); }
    setCreating(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await API.delete(`/courses/${id}`); dispatch(fetchMyCourses()); } catch { alert('Delete failed'); }
  };

  const handleSubmit = async (id) => {
    try { await API.put(`/courses/${id}/submit`); dispatch(fetchMyCourses()); } catch (err) { alert(err.response?.data?.message || 'Submit failed'); }
  };

  const statusMap = {
    draft: { cls: 'badge-neutral', text: 'Draft' },
    pending: { cls: 'badge-warning', text: 'Pending' },
    approved: { cls: 'badge-success', text: 'Approved' },
    rejected: { cls: 'badge-danger', text: 'Rejected' },
  };

  const cats = ['Web Development','Mobile Development','Data Science','Machine Learning','Cloud Computing','DevOps','Cybersecurity','UI/UX Design','Business','Other'];

  const statItems = [
    { icon: FiBook, label: 'Total Courses', value: analytics?.totalCourses ?? myCourses.length, color: '#6366f1' },
    { icon: FiEye, label: 'Published', value: analytics?.publishedCourses ?? myCourses.filter(c => c.status === 'approved').length, color: '#10b981' },
    { icon: FiUsers, label: 'Total Students', value: analytics?.totalStudents ?? myCourses.reduce((a, c) => a + (c.totalStudents || 0), 0), color: '#ec4899' },
    { icon: FiStar, label: 'Avg Rating', value: (analytics?.averageRating ?? 0).toFixed(1), color: '#f59e0b' },
    { icon: FiUsers, label: 'Revenue', value: `$${(analytics?.totalRevenue ?? 0).toFixed(2)}`, color: '#0ea5e9' },
  ];

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Instructor Dashboard</h1>
          <p>Manage your courses and track performance</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary btn-md">
          <FiPlus size={15} /> New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid-stats stagger" style={{ marginBottom: 'var(--space-8)' }}>
        {statItems.map(({ icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: `${color}12` }}>
              {icon({ size: 18, style: { color } })}
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card animate-slideDown" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-5)', fontSize: '1.05rem' }}>Create New Course</h3>
          <form onSubmit={handleCreate} className="form-grid">
            <div className="full-width">
              <label className="label">Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required className="input" placeholder="Course title" />
            </div>
            <div className="full-width">
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} required rows={3} className="input" placeholder="Course description" />
            </div>
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input select">
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Level</label>
              <select value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="input select">
                {['Beginner','Intermediate','Advanced'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price ($)</label>
              <input type="number" min={0} value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} className="input" />
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="input" placeholder="react, javascript, web" />
            </div>
            <div className="full-width form-actions">
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary btn-md">Cancel</button>
              <button type="submit" disabled={creating} className="btn btn-primary btn-md">
                {creating ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course List */}
      <div className="section-header">
        <h2>Your Courses</h2>
      </div>

      {myCourses.length === 0 ? (
        <div className="empty-state" style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
          <div className="empty-state-icon">📝</div>
          <h3>No courses yet</h3>
          <p>Click "New Course" to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {myCourses.map((c) => {
            const status = statusMap[c.status] || statusMap.draft;
            return (
              <div key={c._id} className="list-item">
                <div className="list-thumb" style={{
                  backgroundImage: c.thumbnail ? `url(${c.thumbnail})` : undefined,
                  background: !c.thumbnail ? 'var(--bg-inset)' : undefined,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate-1" style={{ fontWeight: 600, fontSize: '0.92rem' }}>{c.title}</div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{c.lessons?.length || 0} lessons</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{c.totalStudents || 0} students</span>
                    <span className={`badge ${status.cls}`}>{status.text}</span>
                  </div>
                  {c.status === 'rejected' && c.rejectedReason && (
                    <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#be123c' }}>
                      Rejection reason: {c.rejectedReason}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <button onClick={() => navigate(`/instructor/courses/${c._id}`)} className="btn btn-secondary btn-sm" title="Edit">
                    <FiEdit size={13} /> Edit
                  </button>
                  {(c.status === 'draft' || c.status === 'rejected') && (
                    <button onClick={() => handleSubmit(c._id)} className="btn btn-icon btn-secondary btn-sm" title="Submit for review">
                      <FiSend size={13} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(c._id)} className="btn btn-icon btn-danger btn-sm" title="Delete">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
