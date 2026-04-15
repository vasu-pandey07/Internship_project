import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../features/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    dispatch(login({ email, password }));
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
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', marginTop: '6px' }}>
            Sign in to continue learning
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="input-wrapper">
            <FiMail size={15} className="input-icon" />
            <input
              type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="input input-with-icon"
              id="login-email"
            />
          </div>

          <div className="input-wrapper">
            <FiLock size={15} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'} placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              className="input input-with-icon input-with-action"
              id="login-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-action" aria-label="Toggle password">
              {showPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-md btn-block" style={{ marginTop: 'var(--space-1)', padding: '12px' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
