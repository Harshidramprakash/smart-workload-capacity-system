// src/pages/Login.jsx - Login Page
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>⚡ Smart Workload</h1>
        <p className="subtitle">Sign in to your account</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" className="form-control" placeholder="Enter your email"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" className="form-control" placeholder="Enter your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>

        <div className="demo-accounts">
          <strong>Demo Accounts</strong>
          <div style={{ fontSize: '0.75rem', marginBottom: '6px', color: 'var(--text-muted)' }}>Password for all: Password@123</div>
          <div className="demo-row"><span className="demo-role">Admin</span><span>admin@example.com</span></div>
          <div className="demo-row"><span className="demo-role">Manager</span><span>manager@example.com</span></div>
          <div className="demo-row"><span className="demo-role">Employee</span><span>employee1@example.com</span></div>
          <div className="demo-row"><span className="demo-role">HR</span><span>hr@example.com</span></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
