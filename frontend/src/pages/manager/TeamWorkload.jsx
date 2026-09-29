// src/pages/manager/TeamWorkload.jsx - Team Workload Overview
import { useState, useEffect } from 'react';
import api from '../../services/api';

const TeamWorkload = () => {
  const [workload, setWorkload] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorkload = async () => {
    try {
      const params = {};
      if (selectedTeam) params.team_id = selectedTeam;
      const [wlRes, teamsRes] = await Promise.all([api.get('/workload/team', { params }), api.get('/teams')]);
      setWorkload(wlRes.data);
      setTeams(teamsRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchWorkload(); }, [selectedTeam]);

  const statusBadge = (s) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[s] || '';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading team workload...</span></div>;

  return (
    <div>
      <div className="page-header"><h1>Team Workload</h1><p>View workload distribution across team members</p></div>
      <div className="filter-bar">
        <label>Team:</label>
        <select className="form-control" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
          <option value="">All Teams</option>
          {teams.map(t => <option key={t._id} value={t._id}>{t.team_name}</option>)}
        </select>
      </div>

      <div className="stats-grid">
        {workload.map(w => (
          <div className="card" key={w.employee_id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1rem' }}>{w.name}</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{w.designation}</p>
              </div>
              <span className={`badge ${statusBadge(w.utilizationStatus)}`}>{w.utilizationStatus}</span>
            </div>
            <div className="capacity-bar" style={{ marginBottom: '10px' }}>
              <div className={`capacity-bar-fill ${w.utilizationStatus?.toLowerCase()}`} style={{ width: `${Math.min(100, w.workloadPercentage)}%` }}>
                {w.workloadPercentage >= 25 && <span className="capacity-bar-label">{w.workloadPercentage}%</span>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '8px' }}>
              <span>Workload: <strong style={{ color: 'var(--text)' }}>{w.workloadPercentage}%</strong></span>
              <span>Capacity: <strong style={{ color: 'var(--text)' }}>{w.effectiveCapacity}h</strong></span>
            </div>
            <div style={{ fontSize: '0.75rem', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Available:</span> <span>{w.availableHours}h</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Meetings:</span> <span>{w.meetingHours}h</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}><span>Leave:</span> <span>{w.leaveHours}h</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Non-Project:</span> <span>{w.nonProjectHours}h</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '4px', fontWeight: 600 }}><span>Effective:</span> <span>{w.effectiveCapacity}h</span></div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Assigned: <strong style={{ color: 'var(--text)' }}>{w.assignedEffort}h</strong></span>
              <span>Remaining: <strong style={{ color: 'var(--success)' }}>{w.remainingCapacity?.toFixed(1)}h</strong></span>
            </div>
          </div>
        ))}
      </div>
      {workload.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No team members found</p>
          <p className="empty-hint">Try selecting a different team or check team assignments</p>
        </div>
      )}
    </div>
  );
};

export default TeamWorkload;
