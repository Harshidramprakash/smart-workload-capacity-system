// src/pages/Register.jsx - Registration Page
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'Employee' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>⚡ Create Account</h1>
        <p className="subtitle">Register for Smart Workload System</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name <span className="required">*</span></label>
            <input name="name" className="form-control" placeholder="Enter your name" value={form.name} onChange={handleChange} required autoComplete="name" />
          </div>
          <div className="form-group">
            <label>Email Address <span className="required">*</span></label>
            <input name="email" type="email" className="form-control" placeholder="Enter your email" value={form.email} onChange={handleChange} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Password <span className="required">*</span></label>
            <input name="password" type="password" className="form-control" placeholder="Min 6 characters" value={form.password} onChange={handleChange} required autoComplete="new-password" />
            <div className="form-hint">Must be at least 6 characters long</div>
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" className="form-control" placeholder="Phone number" value={form.phone} onChange={handleChange} autoComplete="tel" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value="Employee">Employee / Developer</option>
              <option value="Project Manager">Project Manager</option>
              <option value="HR Manager">HR Manager</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
