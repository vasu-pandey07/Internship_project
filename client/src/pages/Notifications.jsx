import { useEffect, useState } from 'react';
import API from '../api';
import { FiCheck, FiBell } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/notifications').then((r) => {
      setNotifications(r.data.data.notifications);
      setUnread(r.data.data.unreadCount);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (e) {}
  };

  const typeColors = {
    enrollment: '#6366f1', course_approved: '#10b981', course_rejected: '#f43f5e',
    quiz_result: '#f59e0b', payment: '#0ea5e9', general: '#94a3b8',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container-narrow" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Notifications</h1>
          {unread > 0 && <p>{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary btn-sm">
            <FiCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <FiBell size={36} style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }} />
          <h3>No notifications yet</h3>
          <p>You'll see updates about your courses, enrollments, and more here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {notifications.map((n) => (
            <div key={n._id} className="list-item" style={{
              background: n.read ? 'var(--bg-surface)' : 'var(--primary-soft)',
              padding: 'var(--space-4)',
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: typeColors[n.type] || '#94a3b8',
                marginTop: '6px', flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{n.message}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px' }}>
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button onClick={() => markRead(n._id)} className="btn btn-icon btn-secondary btn-sm" title="Mark as read">
                  <FiCheck size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
