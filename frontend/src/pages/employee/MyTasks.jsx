// src/pages/employee/MyTasks.jsx - Employee's Task List
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const MyTasks = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [effortState, setEffortState] = useState({});

  const fetchTasks = async () => {
    try { const res = await api.get('/tasks/my'); setTasks(res.data); }
    catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (taskId, status, title) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      addToast(`"${title}" updated to ${status}`, 'success');
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update status.', 'error');
    }
  };

  const toggleEffortInput = (taskId) => {
    setEffortState(prev => ({
      ...prev,
      [taskId]: prev[taskId] ? undefined : { hours: '', desc: '' }
    }));
  };

  const logTime = async (task) => {
    const state = effortState[task._id];
    if (!state?.hours || isNaN(state.hours) || Number(state.hours) <= 0) {
      addToast('Please enter valid hours.', 'warning');
      return;
    }
    try {
      await api.post(`/assignments/${task.assignmentId}/time-log`, {
        actual_hours: Number(state.hours),
        work_description: state.desc || 'Work logged'
      });
      addToast(`Logged ${state.hours}h for "${task.title}"`, 'success');
      setEffortState(prev => ({ ...prev, [task._id]: undefined }));
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to log time.', 'error');
    }
  };

  const getTaskStatusBadge = (status) => {
    const key = status.toLowerCase().replace(/\s+/g, '-');
    return `badge-status-${key}`;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading your tasks...</span></div>;

  return (
    <div>
      <div className="page-header"><h1>My Tasks</h1><p>View and manage your assigned tasks</p></div>

      {tasks.map(t => (
        <div className="card" key={t._id} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>{t.title}</h3>
              {t.description && <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '8px' }}>{t.description}</p>}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', alignItems: 'center' }}>
                <span>Priority: <span className={`badge badge-priority-${t.priority.toLowerCase()}`}>{t.priority}</span></span>
                <span>Effort: <strong>{t.estimated_effort}h</strong></span>
                <span>Actual: <strong>{t.actual_effort || 0}h</strong></span>
                <span>Status: <span className={`badge ${getTaskStatusBadge(t.status)}`}>{t.status}</span></span>
                {t.due_date && <span>Due: <strong>{new Date(t.due_date).toLocaleDateString()}</strong></span>}
              </div>
            </div>
            <div className="btn-group">
              {t.status === 'Assigned' && <button className="btn btn-sm btn-success" onClick={() => updateStatus(t._id, 'In Progress', t.title)}>▶ Start</button>}
              {['In Progress', 'Progress Updated'].includes(t.status) && (
                <>
                  <button className="btn btn-sm btn-accent" onClick={() => updateStatus(t._id, 'Progress Updated', t.title)}>📝 Update</button>
                  <button className="btn btn-sm btn-success" onClick={() => updateStatus(t._id, 'Completed', t.title)}>✅ Complete</button>
                  <button className="btn btn-sm btn-outline" onClick={() => toggleEffortInput(t._id)}>⏱️ Log Time</button>
                </>
              )}
            </div>
          </div>
          {/* Inline effort logging */}
          {effortState[t._id] && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                className="form-control"
                placeholder="Hours"
                value={effortState[t._id].hours}
                onChange={(e) => setEffortState(prev => ({ ...prev, [t._id]: { ...prev[t._id], hours: e.target.value } }))}
                min="0.5" step="0.5"
                style={{ width: '100px' }}
              />
              <input
                className="form-control"
                placeholder="Brief description (optional)"
                value={effortState[t._id].desc}
                onChange={(e) => setEffortState(prev => ({ ...prev, [t._id]: { ...prev[t._id], desc: e.target.value } }))}
                style={{ flex: 1, minWidth: '200px' }}
              />
              <button className="btn btn-sm btn-success" onClick={() => logTime(t)}>Log</button>
              <button className="btn btn-sm btn-outline" onClick={() => toggleEffortInput(t._id)}>Cancel</button>
            </div>
          )}
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No tasks assigned to you</p>
          <p className="empty-hint">Your manager will assign tasks to you based on capacity analysis</p>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
