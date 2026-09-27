// src/pages/hr/HRDashboard.jsx - HR Manager Dashboard
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const HRDashboard = () => {
  const [workload, setWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/workload/team');
        setWorkload(res.data);
      } catch (err) { 
        console.error(err); 
        addToast('Failed to load dashboard data', 'error');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const statusBadge = (s) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[s] || '';
  };

  if (loading) return <div className="loading-container"><div className="spinner"></div><span className="loading-text">Loading HR Dashboard...</span></div>;

  const overloaded = workload.filter(w => w.utilizationStatus === 'Overloaded');
  const high = workload.filter(w => w.utilizationStatus === 'High');
  const avgWorkload = workload.length > 0 ? Math.round(workload.reduce((s, w) => s + w.workloadPercentage, 0) / workload.length) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>HR Dashboard</h1>
        <p>Employee workload overview and capacity utilization</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👤</div>
          <div className="stat-info">
            <h3>{workload.length}</h3>
            <p>Total Employees</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📊</div>
          <div className="stat-info">
            <h3>{avgWorkload}%</h3>
            <p>Avg Workload</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚠️</div>
          <div className="stat-info">
            <h3>{high.length}</h3>
            <p>High Workload</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🔴</div>
          <div className="stat-info">
            <h3>{overloaded.length}</h3>
            <p>Overloaded</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Employee Workload Overview</h3>
          <Link to="/hr/workload" className="btn btn-sm btn-outline">Detailed View</Link>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Employee</th><th>Designation</th><th>Capacity</th><th>Assigned</th><th>Workload</th><th>Status</th></tr></thead>
            <tbody>
              {workload.map(w => (
                <tr key={w.employee_id}>
                  <td><strong>{w.name}</strong></td>
                  <td>{w.designation}</td>
                  <td>{w.effectiveCapacity}h</td>
                  <td>{w.assignedEffort}h</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="capacity-bar" style={{ width: '80px', marginBottom: 0 }}>
                        <div className={`capacity-bar-fill ${w.utilizationStatus?.toLowerCase()}`} style={{ width: `${Math.min(100, w.workloadPercentage)}%` }}></div>
                      </div>
                      <strong>{w.workloadPercentage}%</strong>
                    </div>
                  </td>
                  <td><span className={`badge ${statusBadge(w.utilizationStatus)}`}>{w.utilizationStatus}</span></td>
                </tr>
              ))}
              {workload.length === 0 && <tr><td colSpan="6" className="empty-state"><p>No data available</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
