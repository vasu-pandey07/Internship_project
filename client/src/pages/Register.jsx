import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../features/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      const path = user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/student';
      navigate(path);
    }
  }, [user, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(register(form));
  };

  return (
    <div className="auth-layout">
      <div className="auth-card animate-fadeIn">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-lg)', margin: '0 auto var(--space-4)',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-violet))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.4rem', fontWeight: 800,
          }}>E</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Create Account</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: '6px' }}>
            Join thousands of learners
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="input-wrapper">
            <FiUser size={15} className="input-icon" />
            <input type="text" placeholder="Full Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="input input-with-icon" id="register-name" />
          </div>

          <div className="input-wrapper">
            <FiMail size={15} className="input-icon" />
            <input type="email" placeholder="Email address" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="input input-with-icon" id="register-email" />
          </div>

          <div className="input-wrapper">
            <FiLock size={15} className="input-icon" />
            <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters)"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              required minLength={6} className="input input-with-icon input-with-action" id="register-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-action" aria-label="Toggle password">
              {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>

          {/* Role Selector */}
          <div>
            <span className="label">I want to</span>
            <div className="role-selector">
              {[
                { key: 'student', emoji: '🎓', text: 'Learn' },
                { key: 'instructor', emoji: '👨‍🏫', text: 'Teach' },
                { key: 'admin', emoji: '🛡️', text: 'Manage' },
              ].map(({ key, emoji, text }) => (
                <button key={key} type="button"
                  onClick={() => setForm({ ...form, role: key })}
                  className={`role-btn ${form.role === key ? 'active' : ''}`}
                >
                  {emoji} {text}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-md btn-block" style={{ marginTop: 'var(--space-1)', padding: '12px' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
