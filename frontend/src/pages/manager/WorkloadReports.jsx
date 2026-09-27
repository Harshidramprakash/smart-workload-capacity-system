// src/pages/manager/WorkloadReports.jsx - Workload & Capacity Reports
import { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const WorkloadReports = () => {
  const [reportType, setReportType] = useState('employee');
  const [reportData, setReportData] = useState(null);
  const [exportInfo, setExportInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    setExportInfo(null);
    try {
      let res;
      if (reportType === 'capacity') {
        res = await api.post('/reports/capacity', { exportCSV: true });
      } else {
        res = await api.post('/reports/workload', { type: reportType, exportCSV: true });
      }

      const receivedReport = res.data.report?.data || res.data.report || {};
      setReportData(receivedReport);
      if (res.data.export) {
        setExportInfo(res.data.export);
      }
      addToast('Report generated successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to generate report.', 'error');
    }
    setLoading(false);
  };

  const statusBadge = (s) => {
    const map = { Low: 'badge-low', Normal: 'badge-normal', High: 'badge-high', Overloaded: 'badge-overloaded' };
    return map[s] || '';
  };

  const isTeamReport = reportType === 'team' || reportData?.reportType === 'Team Workload';
  const rows = reportData?.data || [];

  return (
    <div>
      <div className="page-header">
        <h1>Workload & Capacity Reports</h1>
        <p>Analyze team distribution, effective capacity, and resource utilization</p>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{ width: '260px' }}
          >
            <option value="employee">Employee Workload Report</option>
            <option value="team">Team Workload Report</option>
            <option value="capacity">Capacity Utilization Report</option>
            <option value="historical">Historical Workload Report</option>
          </select>

          <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : '📊 Generate Report'}
          </button>

          {exportInfo?.file_url && (
            <a
              href={exportInfo.file_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              📥 Download CSV Export
            </a>
          )}
        </div>
      </div>

      {!reportData && !loading && (
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <div className="empty-icon">📈</div>
          <p>Select a report type and click generate to view data</p>
        </div>
      )}

      {loading && <div className="loading-container"><div className="spinner"></div><span className="loading-text">Generating report...</span></div>}

      {reportData && !loading && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{reportData.reportType || 'Report'}</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              Generated: {reportData.generatedAt ? new Date(reportData.generatedAt).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          {/* Summary for capacity report */}
          {reportData.summary && (
            <div className="stats-grid" style={{ marginBottom: '20px' }}>
              <div className="stat-card">
                <div className="stat-icon blue">👤</div>
                <div className="stat-info">
                  <h3>{reportData.summary.totalEmployees}</h3>
                  <p>Total Engineers</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">⏰</div>
                <div className="stat-info">
                  <h3>{reportData.summary.totalCapacityHours}h</h3>
                  <p>Total Capacity</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">📊</div>
                <div className="stat-info">
                  <h3>{reportData.summary.overallUtilization}%</h3>
                  <p>Overall Utilization</p>
                </div>
              </div>
            </div>
          )}

          {/* Report Data Table */}
          <div className="table-container">
            {isTeamReport ? (
              <table>
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Engineers</th>
                    <th>Average Workload %</th>
                    <th>Members Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d, i) => (
                    <tr key={i}>
                      <td><strong>{d.teamName}</strong></td>
                      <td>{d.memberCount} members</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="capacity-bar" style={{ width: '80px', marginBottom: 0 }}>
                            <div
                              className="capacity-bar-fill normal"
                              style={{ width: `${Math.min(100, Number(d.averageWorkload) || 0)}%` }}
                            ></div>
                          </div>
                          <strong>{d.averageWorkload}%</strong>
                        </div>
                      </td>
                      <td>
                        <small style={{ color: 'var(--text-light)' }}>
                          {(d.members || []).map(m => `${m.name} (${m.workloadPercentage}%)`).join(', ') || 'None'}
                        </small>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan="4" className="empty-state"><p>No team data available</p></td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Capacity</th>
                    <th>Assigned</th>
                    <th>Workload %</th>
                    <th>Status</th>
                    <th>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d, i) => {
                    const name = d.employeeName || d.name || 'Unknown';
                    const designation = d.designation || '-';
                    const capacity = d.effectiveCapacity ?? d.effective_capacity ?? '-';
                    const assigned = d.assignedEffort ?? d.totalUsedHours ?? '-';
                    const percentage = d.workloadPercentage ?? d.workload_percentage ?? '-';
                    const status = d.utilizationStatus ?? d.utilization_status ?? 'Normal';
                    const remaining = d.remainingCapacity != null ? `${Number(d.remainingCapacity).toFixed(1)}h` : '-';

                    return (
                      <tr key={i}>
                        <td><strong>{name}</strong></td>
                        <td>{designation}</td>
                        <td>{capacity}h</td>
                        <td>{assigned}h</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div className="capacity-bar" style={{ width: '60px', marginBottom: 0 }}>
                              <div
                                className={`capacity-bar-fill ${String(status).toLowerCase()}`}
                                style={{ width: `${Math.min(100, Number(percentage) || 0)}%` }}
                              ></div>
                            </div>
                            <span>{percentage}%</span>
                          </div>
                        </td>
                        <td><span className={`badge ${statusBadge(status)}`}>{status}</span></td>
                        <td><strong>{remaining}</strong></td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr><td colSpan="7" className="empty-state"><p>No records found</p></td></tr>
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

export default WorkloadReports;
