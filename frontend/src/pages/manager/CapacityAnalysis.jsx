// src/pages/manager/CapacityAnalysis.jsx - Capacity Analysis View
import { useState, useEffect } from 'react';
import api from '../../services/api';

const CapacityAnalysis = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/capacity/analyze', {});
      setResults(res.data.results || []);
      setAnalyzed(true);
    } catch (err) {
      console.error(err);
      setError('Unable to run capacity analysis. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => { runAnalysis(); }, []);

  const statusBadge = (s) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[s] || '';
  };

  // Summary stats
  const overloaded = results.filter(r => r.utilizationStatus === 'Overloaded').length;
  const high = results.filter(r => r.utilizationStatus === 'High').length;
  const available = results.filter(r => r.utilizationStatus === 'Low' || r.utilizationStatus === 'Normal').length;
  const avgUtil = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.workloadPercentage, 0) / results.length) : 0;

  return (
    <div>
      <div className="page-header-row">
        <div className="page-header">
          <h1>Capacity Analysis</h1>
          <p>Analyze employee capacity and workload distribution</p>
        </div>
        <button className="btn btn-accent" onClick={runAnalysis} disabled={loading}>
          {loading ? '⏳ Analyzing...' : '🔄 Refresh Analysis'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {analyzed && (
        <>
          {/* Summary KPI Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div className="stat-info"><h3>{results.length}</h3><p>Total Employees</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">📊</div>
              <div className="stat-info"><h3>{avgUtil}%</h3><p>Avg. Utilization</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div className="stat-info"><h3>{available}</h3><p>Available</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">⚠️</div>
              <div className="stat-info"><h3>{overloaded + high}</h3><p>High / Overloaded</p></div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="card">
            <div className="card-header"><h3>Employee Capacity Breakdown</h3></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Effective Capacity</th>
                    <th>Assigned Effort</th>
                    <th>Remaining</th>
                    <th>Utilization</th>
                    <th>Status</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => (
                    <tr key={r.employee_id}>
                      <td><strong>{r.name}</strong></td>
                      <td>{r.designation}</td>
                      <td>{r.effectiveCapacity} hrs</td>
                      <td>{r.assignedEffort} hrs</td>
                      <td><strong>{r.remainingCapacity.toFixed(1)} hrs</strong></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="capacity-bar" style={{ width: '100px' }}>
                            <div className={`capacity-bar-fill ${r.utilizationStatus?.toLowerCase()}`} style={{ width: `${Math.min(100, r.workloadPercentage)}%` }}>
                              {r.workloadPercentage >= 20 && <span className="capacity-bar-label">{r.workloadPercentage}%</span>}
                            </div>
                          </div>
                          {r.workloadPercentage < 20 && <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.workloadPercentage}%</span>}
                        </div>
                      </td>
                      <td><span className={`badge ${statusBadge(r.utilizationStatus)}`}>{r.utilizationStatus}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-light)', maxWidth: '200px' }}>{r.recommendation}</td>
                    </tr>
                  ))}
                  {results.length === 0 && <tr><td colSpan="8" className="empty-state"><p>No employees found for analysis</p></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CapacityAnalysis;
