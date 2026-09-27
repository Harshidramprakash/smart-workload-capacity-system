// src/pages/manager/Tasks.jsx - Task List & Management
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const Tasks = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', priority: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [filter]);

  const openAssign = (task) => {
    setSelectedTask(task);
    setRecommendations(null);
    setShowAssignModal(true);
    setError('');
  };

  const analyzeCapacity = async () => {
    setAnalyzing(true); setError('');
    try {
      const res = await api.post(`/recommendations/task/${selectedTask._id}`);
      setRecommendations(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed.');
    }
    setAnalyzing(false);
  };

  const assignTask = async (employeeId) => {
    try {
      await api.post(`/tasks/${selectedTask._id}/assign`, { employee_id: employeeId });
      addToast('Task assigned successfully!', 'success');
      setShowAssignModal(false);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed.');
    }
  };

  const reassignTask = async (task) => {
    setSelectedTask(task);
    setRecommendations(null);
    setShowAssignModal(true);
    setError('');
  };

  const doReassign = async (employeeId) => {
    try {
      await api.post(`/tasks/${selectedTask._id}/reassign`, { employee_id: employeeId });
      addToast('Task reassigned successfully!', 'success');
      setShowAssignModal(false);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Reassignment failed.');
    }
  };

  const statusBadge = (s) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[s] || '';
  };

  const getTaskStatusBadge = (status) => {
    const key = status.toLowerCase().replace(/\s+/g, '-');
    return `badge-status-${key}`;
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading tasks...</span></div>;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Tasks</h1>
          <p>Manage and assign tasks to team members</p>
        </div>
        <Link to="/manager/create-task" className="btn btn-primary">+ Create Task</Link>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <label>Filter by:</label>
        <select className="form-control" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          {['New','Effort Defined','Assigned','In Progress','Completed','Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-control" value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
          <option value="">All Priorities</option>
          {['Low','Medium','High','Critical'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Task</th><th>Priority</th><th>Effort</th><th>Status</th><th>Assigned To</th><th>Due Date</th><th>Actions</th></tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t._id}>
                  <td><strong>{t.title}</strong></td>
                  <td><span className={`badge badge-priority-${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                  <td>{t.estimated_effort}h</td>
                  <td><span className={`badge ${getTaskStatusBadge(t.status)}`}>{t.status}</span></td>
                  <td>{t.assignedTo ? t.assignedTo.employeeName : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                  <td style={{ fontSize: '0.8rem' }}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="btn-group">
                      {!t.assignedTo && t.estimated_effort > 0 && (
                        <button className="btn btn-sm btn-accent" onClick={() => openAssign(t)}>Assign</button>
                      )}
                      {t.assignedTo && !['Completed','Closed','Cancelled'].includes(t.status) && (
                        <button className="btn btn-sm btn-warning" onClick={() => reassignTask(t)}>Reassign</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan="7" className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No tasks found</p>
                  <p className="empty-hint">Try adjusting your filters or create a new task</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign/Reassign Modal - THE KEY SCREEN */}
      {showAssignModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>{selectedTask.assignedTo ? 'Reassign' : 'Assign'} Task: {selectedTask.title}</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(false)} aria-label="Close">✕</button>
            </div>

            <div className="kpi-row">
              <div className="kpi-item"><span className="kpi-label">Priority:</span> <span className={`badge badge-priority-${selectedTask.priority.toLowerCase()}`}>{selectedTask.priority}</span></div>
              <div className="kpi-item"><span className="kpi-label">Effort:</span> <span className="kpi-value">{selectedTask.estimated_effort}h</span></div>
              <div className="kpi-item"><span className="kpi-label">Due:</span> <span className="kpi-value">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'N/A'}</span></div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-accent" onClick={analyzeCapacity} disabled={analyzing} style={{ marginBottom: '16px' }}>
              {analyzing ? '⏳ Analyzing...' : '📊 Analyze Employee Capacity'}
            </button>

            {recommendations && (
              <>
                {/* Recommendation Card */}
                {recommendations.bestMatch ? (
                  <div className="recommendation-card">
                    <div className="rec-label">System Recommendation</div>
                    <h3>⭐ Recommended: {recommendations.bestMatch.name}</h3>
                    <dl className="recommendation-details">
                      <dt>Current Workload</dt><dd>{recommendations.bestMatch.currentWorkloadPercentage}%</dd>
                      <dt>Effective Capacity</dt><dd>{recommendations.bestMatch.effectiveCapacity} hrs</dd>
                      <dt>Remaining Capacity</dt><dd>{recommendations.bestMatch.remainingCapacity.toFixed(1)} hrs</dd>
                      <dt>Task Effort</dt><dd>{selectedTask.estimated_effort} hrs</dd>
                      <dt>Projected Workload</dt><dd>{recommendations.bestMatch.projectedWorkloadPercentage}%</dd>
                      <dt>Projected Status</dt><dd><span className={`badge ${statusBadge(recommendations.bestMatch.projectedStatus)}`}>{recommendations.bestMatch.projectedStatus}</span></dd>
                    </dl>
                    <div style={{ marginTop: '12px' }}>
                      <button className="btn btn-success" onClick={() => selectedTask.assignedTo ? doReassign(recommendations.bestMatch.employee_id) : assignTask(recommendations.bestMatch.employee_id)}>
                        ✅ Assign to {recommendations.bestMatch.name}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning">{recommendations.message}</div>
                )}

                {/* Full Capacity Table */}
                <div className="card" style={{ marginTop: '16px' }}>
                  <div className="card-header"><h3>Employee Capacity Analysis ({recommendations.totalAnalyzed} employees)</h3></div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Employee</th><th>Effective Capacity</th><th>Current Workload</th><th>Utilization</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead>
                      <tbody>
                        {recommendations.recommendations.map(r => (
                          <tr key={r.employee_id} style={{ opacity: r.canAccept ? 1 : 0.6 }}>
                            <td><strong>{r.name}</strong><br/><small style={{ color: 'var(--text-light)' }}>{r.designation}</small></td>
                            <td>{r.effectiveCapacity} hrs</td>
                            <td>{r.assignedEffort} hrs</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div className="capacity-bar" style={{ width: '80px' }}>
                                  <div className={`capacity-bar-fill ${r.currentStatus?.toLowerCase()}`} style={{ width: `${Math.min(100, r.currentWorkloadPercentage)}%` }}></div>
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.currentWorkloadPercentage}%</span>
                              </div>
                            </td>
                            <td>{r.remainingCapacity.toFixed(1)} hrs</td>
                            <td><span className={`badge ${statusBadge(r.currentStatus)}`}>{r.currentStatus}</span></td>
                            <td>
                              {r.canAccept ? (
                                <button className="btn btn-sm btn-success" onClick={() => selectedTask.assignedTo ? doReassign(r.employee_id) : assignTask(r.employee_id)}>
                                  Assign
                                </button>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unavailable</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAssignModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
