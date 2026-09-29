// src/pages/hr/EmployeeWorkload.jsx - Detailed Employee Workload (HR)
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const EmployeeWorkload = () => {
  const [workload, setWorkload] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState({ team: '', status: '' });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = {};
        if (filter.team) params.team_id = filter.team;
        const [wlRes, teamsRes] = await Promise.all([api.get('/workload/team', { params }), api.get('/teams')]);
        let data = wlRes.data;
        if (filter.status) data = data.filter(w => w.utilizationStatus === filter.status);
        setWorkload(data);
        setTeams(teamsRes.data);
      } catch (err) { 
        console.error(err);
        addToast('Failed to load workload data', 'error');
      }
      setLoading(false);
    };
    fetchData();
  }, [filter]);

  const statusBadge = (s) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[s] || '';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading employee workload...</span></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Employee Workload</h1>
        <p>Detailed workload and capacity information for all employees</p>
      </div>

      <div className="filter-bar">
        <label>Filter by:</label>
        <select className="form-control" value={filter.team} onChange={(e) => setFilter({ ...filter, team: e.target.value })}>
          <option value="">All Teams</option>
          {teams.map(t => <option key={t._id} value={t._id}>{t.team_name}</option>)}
        </select>
        <select className="form-control" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option><option value="Overloaded">Overloaded</option>
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Designation</th><th>Available</th><th>Meetings</th><th>Leave</th><th>Non-Project</th><th>Effective Capacity</th><th>Assigned</th><th>Remaining</th><th>Workload %</th><th>Status</th></tr></thead>
            <tbody>
              {workload.map(w => (
                <tr key={w.employee_id}>
                  <td><strong>{w.name}</strong></td>
                  <td>{w.designation}</td>
                  <td>{w.availableHours}h</td>
                  <td>{w.meetingHours}h</td>
                  <td>{w.leaveHours}h</td>
                  <td>{w.nonProjectHours}h</td>
                  <td>{w.effectiveCapacity}h</td>
                  <td>{w.assignedEffort}h</td>
                  <td><strong>{w.remainingCapacity?.toFixed(1)}h</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="capacity-bar" style={{ width: '60px', marginBottom: 0 }}>
                        <div className={`capacity-bar-fill ${w.utilizationStatus?.toLowerCase()}`} style={{ width: `${Math.min(100, w.workloadPercentage)}%` }}></div>
                      </div>
                      <span>{w.workloadPercentage}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${statusBadge(w.utilizationStatus)}`}>{w.utilizationStatus}</span></td>
                </tr>
              ))}
              {workload.length === 0 && <tr><td colSpan="10" className="empty-state"><p>No records match your filters</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeWorkload;
