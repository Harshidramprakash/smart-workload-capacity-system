// src/pages/employee/EmployeeDashboard.jsx - Employee Dashboard
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [taskRes] = await Promise.all([api.get('/tasks/my')]);
      setTasks(taskRes.data);

      // Get employee record and workload
      if (user?.employeeId) {
        const [wlRes] = await Promise.all([
          api.get(`/workload/${user.employeeId}`)
        ]);
        setWorkload(wlRes.data);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getTaskStatusBadge = (status) => {
    const key = status.toLowerCase().replace(/\s+/g, '-');
    return `badge-status-${key}`;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading your dashboard...</span></div>;

  const activeTasks = tasks.filter(t => !['Completed', 'Closed', 'Cancelled'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div>
      <div className="page-header">
        <h1>Employee Dashboard</h1>
        <p>Welcome, {user?.name}</p>
      </div>

      {/* Workload Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">⏰</div>
          <div className="stat-info"><h3>{workload?.effectiveCapacity || 0}h</h3><p>Effective Capacity</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📝</div>
          <div className="stat-info"><h3>{workload?.assignedEffort || 0}h</h3><p>Assigned Work</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: workload?.utilizationStatus === 'Overloaded' ? 'var(--danger-light)' : workload?.utilizationStatus === 'High' ? 'var(--warning-light)' : 'var(--success-light)' }}>
            📊
          </div>
          <div className="stat-info">
            <h3>{workload?.workloadPercentage || 0}%</h3>
            <p>Utilization</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${workload?.utilizationStatus === 'Low' ? 'green' : workload?.utilizationStatus === 'Normal' ? 'blue' : workload?.utilizationStatus === 'High' ? 'orange' : 'red'}`}>
            {workload?.utilizationStatus === 'Low' ? '🟢' : workload?.utilizationStatus === 'Normal' ? '🔵' : workload?.utilizationStatus === 'High' ? '🟠' : '🔴'}
          </div>
          <div className="stat-info"><h3>{workload?.utilizationStatus || 'N/A'}</h3><p>Workload Status</p></div>
        </div>
      </div>

      {/* Capacity Breakdown Card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header"><h3>Today's Capacity Breakdown</h3></div>
        <div className="capacity-bar" style={{ marginBottom: '16px' }}>
          <div
            className={`capacity-bar-fill ${workload?.utilizationStatus?.toLowerCase() || 'low'}`}
            style={{ width: `${Math.min(100, workload?.workloadPercentage || 0)}%` }}
          >
            {(workload?.workloadPercentage || 0) >= 15 && (
              <span className="capacity-bar-label">{workload?.workloadPercentage || 0}% utilized</span>
            )}
          </div>
        </div>
        <div className="capacity-detail-grid">
          <div className="capacity-detail-item">
            <span className="label">Available Hours</span>
            <span className="value">{workload?.availableHours || 8}h</span>
          </div>
          <div className="capacity-detail-item">
            <span className="label">Meeting Hours</span>
            <span className="value">{workload?.meetingHours || 0}h</span>
          </div>
          <div className="capacity-detail-item">
            <span className="label">Leave Hours</span>
            <span className="value">{workload?.leaveHours || 0}h</span>
          </div>
          <div className="capacity-detail-item">
            <span className="label">Non-Project</span>
            <span className="value">{workload?.nonProjectHours || 0}h</span>
          </div>
          <div className="capacity-detail-item">
            <span className="label">Effective Capacity</span>
            <span className="value" style={{ color: 'var(--accent)' }}>{workload?.effectiveCapacity || 0}h</span>
          </div>
          <div className="capacity-detail-item">
            <span className="label">Remaining</span>
            <span className="value" style={{ color: 'var(--success)' }}>{workload?.remainingCapacity?.toFixed(1) || 0}h</span>
          </div>
        </div>
      </div>

      {/* Task Summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="alert alert-info" style={{ flex: 1, margin: 0 }}>
          📋 <strong>{activeTasks.length}</strong> active task{activeTasks.length !== 1 ? 's' : ''}
        </div>
        <div className="alert alert-success" style={{ flex: 1, margin: 0 }}>
          ✅ <strong>{completedTasks.length}</strong> completed
        </div>
      </div>

      {/* Assigned Tasks */}
      <div className="card">
        <div className="card-header"><h3>My Assigned Tasks ({tasks.length})</h3></div>
        <div className="table-container">
          <table>
            <thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Effort</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t._id}>
                  <td><strong>{t.title}</strong></td>
                  <td style={{ fontSize: '0.8rem' }}>{t.sprint_id?.project_id?.project_name || '-'}</td>
                  <td><span className={`badge badge-priority-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                  <td>{t.estimated_effort}h</td>
                  <td><span className={`badge ${getTaskStatusBadge(t.status)}`}>{t.status}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                  <td>
                    {['Assigned', 'In Progress', 'Progress Updated'].includes(t.status) && (
                      <UpdateStatusButton task={t} onUpdate={fetchData} addToast={addToast} />
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan="7" className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p>No tasks assigned to you yet</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Inline status update component with proper dropdown
const UpdateStatusButton = ({ task, onUpdate, addToast }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEffortInput, setShowEffortInput] = useState(false);
  const [effortHours, setEffortHours] = useState('');

  const updateStatus = async (status) => {
    try {
      await api.put(`/tasks/${task._id}`, { status });
      setShowMenu(false);
      addToast(`Task "${task.title}" updated to ${status}`, 'success');
      onUpdate();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update task status.', 'error');
    }
  };

  const logEffort = async () => {
    if (!effortHours || isNaN(effortHours) || Number(effortHours) <= 0) {
      addToast('Please enter valid hours.', 'warning');
      return;
    }
    try {
      await api.post(`/assignments/${task.assignmentId}/time-log`, { actual_hours: Number(effortHours), work_description: 'Work logged' });
      addToast(`Logged ${effortHours}h for "${task.title}"`, 'success');
      setShowEffortInput(false);
      setEffortHours('');
      setShowMenu(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to log time.', 'error');
    }
  };

  return (
    <div className="action-menu">
      <button className="btn btn-sm btn-accent" onClick={() => { setShowMenu(!showMenu); setShowEffortInput(false); }}>
        Update ▾
      </button>
      {showMenu && (
        <div className="action-menu-dropdown">
          {task.status === 'Assigned' && (
            <button className="action-menu-item" onClick={() => updateStatus('In Progress')}>▶ Start Work</button>
          )}
          {['In Progress', 'Progress Updated'].includes(task.status) && (
            <>
              <button className="action-menu-item" onClick={() => updateStatus('Progress Updated')}>📝 Update Progress</button>
              <button className="action-menu-item" onClick={() => updateStatus('Completed')}>✅ Mark Complete</button>
              {!showEffortInput ? (
                <button className="action-menu-item" onClick={() => setShowEffortInput(true)}>⏱️ Log Effort</button>
              ) : (
                <div style={{ padding: '8px 14px', display: 'flex', gap: '6px', borderTop: '1px solid var(--border-light)' }}>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Hours"
                    value={effortHours}
                    onChange={(e) => setEffortHours(e.target.value)}
                    min="0.5"
                    step="0.5"
                    style={{ width: '80px', padding: '6px 8px' }}
                    autoFocus
                  />
                  <button className="btn btn-sm btn-success" onClick={logEffort}>Log</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
