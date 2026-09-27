// src/pages/manager/ManagerDashboard.jsx - Project Manager Dashboard
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, taskRes, wlRes] = await Promise.all([
          api.get('/projects'), api.get('/tasks'), api.get('/workload/team')
        ]);
        setProjects(projRes.data);
        setTasks(taskRes.data);
        setWorkload(wlRes.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load dashboard data. Please try again.');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading dashboard...</span></div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const activeTasks = tasks.filter(t => !['Completed', 'Closed', 'Cancelled'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const unassigned = tasks.filter(t => !t.assignedTo && t.estimated_effort > 0);
  const overloaded = workload.filter(w => w.utilizationStatus === 'Overloaded');
  const highLoad = workload.filter(w => w.utilizationStatus === 'High');

  const getStatusBadge = (status) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[status] || 'badge-normal';
  };

  const getTaskStatusBadge = (status) => {
    const key = status.toLowerCase().replace(/\s+/g, '-');
    return `badge-status-${key}`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Manager Dashboard</h1>
        <p>Welcome back, {user?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📁</div>
          <div className="stat-info"><h3>{projects.length}</h3><p>Total Projects</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📝</div>
          <div className="stat-info"><h3>{activeTasks.length}</h3><p>Active Tasks</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info"><h3>{completedTasks.length}</h3><p>Completed</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info"><h3>{workload.length}</h3><p>Team Members</p></div>
        </div>
      </div>

      {/* Alert cards for overloaded / unassigned */}
      {(overloaded.length > 0 || unassigned.length > 0) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {overloaded.length > 0 && (
            <div className="alert alert-warning" style={{ flex: 1, margin: 0 }}>
              ⚠️ <strong>{overloaded.length}</strong> employee{overloaded.length > 1 ? 's' : ''} overloaded — <Link to="/manager/team-workload" style={{ fontWeight: 600 }}>View team workload</Link>
            </div>
          )}
          {unassigned.length > 0 && (
            <div className="alert alert-info" style={{ flex: 1, margin: 0 }}>
              📋 <strong>{unassigned.length}</strong> task{unassigned.length > 1 ? 's' : ''} awaiting assignment — <Link to="/manager/tasks" style={{ fontWeight: 600 }}>Assign now</Link>
            </div>
          )}
        </div>
      )}

      <div className="grid-2">
        {/* Team Workload Overview */}
        <div className="card">
          <div className="card-header">
            <h3>Team Workload</h3>
            <Link to="/manager/team-workload" className="btn btn-sm btn-outline">View All</Link>
          </div>
          {workload.length === 0 ? (
            <div className="empty-state"><p>No team workload data available</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Employee</th><th>Workload</th><th>Status</th></tr></thead>
                <tbody>
                  {workload.slice(0, 5).map(w => (
                    <tr key={w.employee_id}>
                      <td><strong>{w.name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="progress-bar-container" style={{ width: '80px' }}>
                            <div className={`progress-bar ${w.utilizationStatus?.toLowerCase()}`} style={{ width: `${Math.min(100, w.workloadPercentage)}%` }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{w.workloadPercentage}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${getStatusBadge(w.utilizationStatus)}`}>{w.utilizationStatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Tasks</h3>
            <Link to="/manager/tasks" className="btn btn-sm btn-outline">View All</Link>
          </div>
          {tasks.length === 0 ? (
            <div className="empty-state"><p>No tasks created yet</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Task</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {tasks.slice(0, 5).map(t => (
                    <tr key={t._id}>
                      <td><strong>{t.title}</strong></td>
                      <td><span className={`badge badge-priority-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                      <td><span className={`badge ${getTaskStatusBadge(t.status)}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
