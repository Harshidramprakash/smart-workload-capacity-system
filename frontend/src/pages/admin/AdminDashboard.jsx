// src/pages/admin/AdminDashboard.jsx - Admin Dashboard
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, employees: 0, managers: 0, teams: 0, projects: 0, tasks: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, teamsRes, projectsRes, tasksRes] = await Promise.all([
          api.get('/users'), api.get('/teams'), api.get('/projects'), api.get('/tasks')
        ]);
        setStats({
          users: usersRes.data.length,
          employees: usersRes.data.filter(u => u.role === 'Employee').length,
          managers: usersRes.data.filter(u => u.role === 'Project Manager').length,
          teams: teamsRes.data.length,
          projects: projectsRes.data.length,
          tasks: tasksRes.data.length
        });
      } catch (err) {
        console.error(err);
        setError('Unable to load system statistics.');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading system overview...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and management</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👤</div>
          <div className="stat-info"><h3>{stats.users}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💼</div>
          <div className="stat-info"><h3>{stats.employees}</h3><p>Employees</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">👥</div>
          <div className="stat-info"><h3>{stats.teams}</h3><p>Teams</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📁</div>
          <div className="stat-info"><h3>{stats.projects}</h3><p>Projects</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📝</div>
          <div className="stat-info"><h3>{stats.tasks}</h3><p>Total Tasks</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info"><h3>Active</h3><p>System Status</p></div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header"><h3>Quick Actions</h3></div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/admin/users" className="btn btn-outline">👤 Manage Users</Link>
          <Link to="/admin/teams" className="btn btn-outline">👥 Manage Teams</Link>
          <Link to="/admin/settings" className="btn btn-outline">⚙️ System Settings</Link>
          <Link to="/admin/reports" className="btn btn-outline">📋 View Reports</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
