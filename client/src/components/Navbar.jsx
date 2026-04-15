import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useDarkMode } from '../hooks/useDarkMode';
import { useState, useEffect } from 'react';
import { FiSun, FiMoon, FiBell, FiMenu, FiX, FiBookOpen, FiLogOut, FiGrid } from 'react-icons/fi';
import API from '../api';

const Navbar = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDark, toggle } = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      API.get('/notifications?unreadOnly=true')
        .then((res) => setUnreadCount(res.data.data.unreadCount))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'instructor') return '/instructor';
    return '/student';
  };

  return (
    <nav
      className="glass"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 'var(--nav-height)',
        transition: 'box-shadow var(--duration-normal)',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-violet) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '15px', fontWeight: 800,
          }}>E</div>
          <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Edu<span style={{ color: 'var(--primary)' }}>Platform</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="desktop-nav" style={{ alignItems: 'center', gap: '6px' }}>
          <Link to="/courses" className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
            <FiBookOpen size={15} /> Courses
          </Link>

          {/* Theme Toggle */}
          <button onClick={toggle} className="btn btn-icon btn-secondary btn-sm" aria-label="Toggle theme">
            {isDark ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          {user ? (
            <>
              {/* Notifications */}
              <Link to="/notifications" className="btn btn-icon btn-ghost btn-sm" style={{ position: 'relative' }}>
                <FiBell size={17} />
                {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
              </Link>

              {/* Dashboard */}
              <Link to={getDashboardLink()} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
                <FiGrid size={14} /> Dashboard
              </Link>

              {/* Profile + Logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
                <div className="avatar avatar-md" style={{ background: 'var(--primary)' }}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '100px' }} className="truncate-1">
                  {user.name}
                </span>
                <button onClick={handleLogout} className="btn btn-icon btn-ghost btn-sm" aria-label="Logout" title="Logout">
                  <FiLogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginLeft: '4px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn btn btn-icon btn-ghost" aria-label="Menu">
          {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link>
          {user ? (
            <>
              <Link to={getDashboardLink()} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/notifications" onClick={() => setMenuOpen(false)}>
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Link>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{ color: 'var(--accent-rose)' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign Up</Link>
            </>
          )}
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-default)', marginTop: '4px' }}>
            <button onClick={() => { toggle(); setMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
