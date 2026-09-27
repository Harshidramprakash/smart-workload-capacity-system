// src/pages/employee/UpdateAvailability.jsx - Update Availability (Employee)
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const UpdateAvailability = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    available_hours: 8, meeting_hours: 0, leave_hours: 0, non_project_hours: 0, remarks: ''
  });
  const [workload, setWorkload] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    try {
      if (user?.employeeId) {
        const res = await api.get(`/availability?employee_id=${user.employeeId}`);
        setHistory(res.data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const res = await api.post('/availability', { ...form, available_hours: Number(form.available_hours), meeting_hours: Number(form.meeting_hours), leave_hours: Number(form.leave_hours), non_project_hours: Number(form.non_project_hours) });
      setWorkload(res.data.workload);
      addToast('Availability updated successfully!', 'success');
      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update.');
    }
    setSubmitting(false);
  };

  const effectiveCapacity = Math.max(0, Number(form.available_hours) - Number(form.meeting_hours) - Number(form.leave_hours) - Number(form.non_project_hours));

  return (
    <div>
      <div className="page-header"><h1>Update Availability</h1><p>Set your daily availability, meetings, leave, and non-project activities</p></div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3>Set Availability</h3></div>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Date <span className="required">*</span></label>
              <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Available Hours</label>
                <input type="number" className="form-control" value={form.available_hours} onChange={(e) => setForm({ ...form, available_hours: e.target.value })} min="0" max="24" step="0.5" />
              </div>
              <div className="form-group">
                <label>Meeting Hours</label>
                <input type="number" className="form-control" value={form.meeting_hours} onChange={(e) => setForm({ ...form, meeting_hours: e.target.value })} min="0" step="0.5" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Leave Hours</label>
                <input type="number" className="form-control" value={form.leave_hours} onChange={(e) => setForm({ ...form, leave_hours: e.target.value })} min="0" step="0.5" />
              </div>
              <div className="form-group">
                <label>Non-Project Hours</label>
                <input type="number" className="form-control" value={form.non_project_hours} onChange={(e) => setForm({ ...form, non_project_hours: e.target.value })} min="0" step="0.5" />
              </div>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input className="form-control" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="e.g. Sprint planning meeting" />
            </div>

            {/* Live capacity preview */}
            <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 'var(--radius)', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Effective Capacity</strong>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: effectiveCapacity > 0 ? 'var(--accent)' : 'var(--danger)' }}>
                  {effectiveCapacity.toFixed(1)} hours
                </span>
              </div>
              <div className="capacity-bar">
                <div className="capacity-bar-fill normal" style={{ width: `${Math.min(100, (effectiveCapacity / 8) * 100)}%` }}>
                  {effectiveCapacity >= 2 && <span className="capacity-bar-label">{effectiveCapacity.toFixed(1)}h</span>}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : '💾 Save Availability'}
            </button>
          </form>
        </div>

        {/* Recent Availability History */}
        <div className="card">
          <div className="card-header"><h3>Recent History</h3></div>
          {workload && (
            <div className="alert alert-info" style={{ marginBottom: '12px' }}>
              Updated workload: <strong>{workload.workloadPercentage}%</strong> ({workload.utilizationStatus})
            </div>
          )}
          <div className="table-container">
            <table>
              <thead><tr><th>Date</th><th>Available</th><th>Meetings</th><th>Leave</th><th>Remarks</th></tr></thead>
              <tbody>
                {history.slice(0, 10).map(h => (
                  <tr key={h._id}>
                    <td>{new Date(h.date).toLocaleDateString()}</td>
                    <td>{h.available_hours}h</td>
                    <td>{h.meeting_hours}h</td>
                    <td>{h.leave_hours}h</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{h.remarks || '-'}</td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px' }}>No records yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateAvailability;
