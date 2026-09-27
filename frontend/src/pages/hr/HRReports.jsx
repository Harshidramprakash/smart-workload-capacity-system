// src/pages/hr/HRReports.jsx - Dedicated HR Analytics & Capacity Reports
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const HRReports = () => {
  const [reportType, setReportType] = useState('capacity');
  const [reportData, setReportData] = useState(null);
  const [exportInfo, setExportInfo] = useState(null);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await api.get('/teams');
        setTeams(res.data || []);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };
    fetchTeams();
    generateHRReport('capacity');
  }, []);

  const generateHRReport = async (type = reportType, teamId = selectedTeam) => {
    setLoading(true);
    setExportInfo(null);
    try {
      let res;
      if (type === 'capacity') {
        res = await api.post('/reports/capacity', { exportCSV: true });
      } else {
        res = await api.post('/reports/workload', {
          type,
          teamId: teamId || undefined,
          exportCSV: true
        });
      }

      const received = res.data.report?.data || res.data.report || {};
      setReportData(received);
      if (res.data.export) {
        setExportInfo(res.data.export);
      }
      addToast('Report generated successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate HR analytics report.', 'error');
    }
    setLoading(false);
  };

  const statusBadge = (s) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[s] || '';
  };

  const rows = reportData?.data || [];
  const overloadedCount = rows.filter(r => (r.utilizationStatus || r.utilization_status) === 'Overloaded').length;
  const highCount = rows.filter(r => (r.utilizationStatus || r.utilization_status) === 'High').length;
  const avgWorkload = rows.length > 0
    ? Math.round(rows.reduce((sum, r) => sum + (Number(r.workloadPercentage ?? r.averageWorkload ?? 0) || 0), 0) / rows.length)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1>HR Workforce & Capacity Analytics</h1>
        <p>Organization-wide workforce health, capacity drain, and burnout prevention reports</p>
      </div>

      {/* Top High-level HR Metrics */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <h3>{rows.length}</h3>
            <p>Monitored Profiles</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📊</div>
          <div className="stat-info">
            <h3>{avgWorkload}%</h3>
            <p>Average Utilization</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⚠️</div>
          <div className="stat-info">
            <h3>{highCount}</h3>
            <p>High Load Risk (&gt;80%)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🚨</div>
          <div className="stat-info">
            <h3>{overloadedCount}</h3>
            <p>Overloaded Employees</p>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>
              REPORT CATEGORY
            </label>
            <select
              className="form-control"
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                generateHRReport(e.target.value, selectedTeam);
              }}
              style={{ width: '260px' }}
            >
              <option value="capacity">Capacity Utilization Report</option>
              <option value="employee">Employee Workload Breakdown</option>
              <option value="team">Team / Squad Aggregation</option>
              <option value="historical">Historical Trend Log</option>
            </select>
          </div>

          {reportType === 'team' && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>
                FILTER BY SQUAD
              </label>
              <select
                className="form-control"
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  generateHRReport(reportType, e.target.value);
                }}
                style={{ width: '200px' }}
              >
                <option value="">All Squads</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.team_name}</option>)}
              </select>
            </div>
          )}

          <div style={{ alignSelf: 'flex-end', display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => generateHRReport(reportType, selectedTeam)}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : '🔄 Refresh Data'}
            </button>

            {exportInfo?.file_url && (
              <a
                href={exportInfo.file_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                📥 Export HR CSV
              </a>
            )}
          </div>
        </div>
      </div>

      {loading && <div className="loading-container"><div className="spinner"></div><span className="loading-text">Generating analytics...</span></div>}

      {/* Main Report View */}
      {reportData && !loading && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{reportData.reportType || 'HR Report'}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              As of: {reportData.generatedAt ? new Date(reportData.generatedAt).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          <div className="table-container">
            {reportType === 'team' ? (
              <table>
                <thead>
                  <tr>
                    <th>Squad / Department</th>
                    <th>Headcount</th>
                    <th>Average Load</th>
                    <th>Risk Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t, idx) => {
                    const avg = Number(t.averageWorkload) || 0;
                    const risk = avg > 80 ? 'High Risk' : avg > 60 ? 'Optimal' : 'Low Utilization';
                    const riskBadge = avg > 80 ? 'badge-high' : avg > 60 ? 'badge-normal' : 'badge-low';
                    return (
                      <tr key={idx}>
                        <td><strong>{t.teamName}</strong></td>
                        <td>{t.memberCount} engineers</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="capacity-bar" style={{ width: '80px', marginBottom: 0 }}>
                              <div className="capacity-bar-fill normal" style={{ width: `${Math.min(100, avg)}%` }}></div>
                            </div>
                            <strong>{avg}%</strong>
                          </div>
                        </td>
                        <td><span className={`badge ${riskBadge}`}>{risk}</span></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan="4" className="empty-state"><p>No team data available.</p></td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Role</th>
                    <th>Effective Capacity</th>
                    <th>Active Commitments</th>
                    <th>Workload %</th>
                    <th>Health Status</th>
                    <th>Remaining Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const name = r.employeeName || r.name || 'Unknown';
                    const desig = r.designation || 'Engineer';
                    const capacity = r.effectiveCapacity ?? r.effective_capacity ?? '-';
                    const assigned = r.assignedEffort ?? r.totalUsedHours ?? '-';
                    const workload = r.workloadPercentage ?? r.workload_percentage ?? '-';
                    const status = r.utilizationStatus ?? r.utilization_status ?? 'Normal';
                    const remaining = r.remainingCapacity != null ? `${Number(r.remainingCapacity).toFixed(1)}h` : '-';

                    return (
                      <tr key={idx}>
                        <td><strong>{name}</strong></td>
                        <td>{desig}</td>
                        <td>{capacity}h / day</td>
                        <td>{assigned}h assigned</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="capacity-bar" style={{ width: '60px', marginBottom: 0 }}>
                              <div
                                className={`capacity-bar-fill ${String(status).toLowerCase()}`}
                                style={{ width: `${Math.min(100, Number(workload) || 0)}%` }}
                              ></div>
                            </div>
                            <span>{workload}%</span>
                          </div>
                        </td>
                        <td><span className={`badge ${statusBadge(status)}`}>{status}</span></td>
                        <td><strong>{remaining}</strong></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan="7" className="empty-state"><p>No records returned.</p></td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRReports;
