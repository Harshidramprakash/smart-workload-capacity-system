// services/report-service/services/reportService.js - Report Generation Engine
const Employee = require('../../../shared/models/Employee');
const Team = require('../../../shared/models/Team');
const TeamMember = require('../../../shared/models/TeamMember');
const TaskAssignment = require('../../../shared/models/TaskAssignment');
const storageAdapter = require('../adapters/storageAdapter');

/**
 * Fetch employee workload data from Capacity Service
 */
const fetchEmployeeWorkloadFromCapacity = async (employeeId) => {
  try {
    const url = `http://localhost:${process.env.PORT_CAPACITY_SERVICE || 5004}/api/workload/${employeeId}`;
    const res = await fetch(url, { headers: { 'x-internal-service': 'true' } });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error(`[Report Service] Failed to fetch capacity for ${employeeId}:`, err.message);
  }
  return { effectiveCapacity: 8, availableHours: 8, meetingHours: 0, leaveHours: 0, nonProjectHours: 0, assignedEffort: 0, workloadPercentage: 0, utilizationStatus: 'Low', remainingCapacity: 8 };
};

/**
 * Generate Employee Workload Report
 */
const generateEmployeeWorkloadReport = async (params = {}) => {
  const employees = params.employeeId
    ? [await Employee.findById(params.employeeId).populate('user_id', 'name email')]
    : await Employee.find({ status: 'Active' }).populate('user_id', 'name email');

  const reportData = [];
  for (const emp of employees) {
    if (!emp || !emp.user_id) continue;
    const workload = await fetchEmployeeWorkloadFromCapacity(emp._id);
    const assignments = await TaskAssignment.find({
      employee_id: emp._id,
      status: 'Active'
    }).populate('task_id', 'title priority estimated_effort status');

    reportData.push({
      employeeName: emp.user_id.name,
      email: emp.user_id.email,
      designation: emp.designation,
      effectiveCapacity: workload.effectiveCapacity,
      availableHours: workload.availableHours,
      meetingHours: workload.meetingHours,
      leaveHours: workload.leaveHours,
      nonProjectHours: workload.nonProjectHours,
      assignedEffort: workload.assignedEffort,
      workloadPercentage: workload.workloadPercentage,
      utilizationStatus: workload.utilizationStatus,
      remainingCapacity: workload.remainingCapacity,
      activeTasks: assignments.length,
      tasks: assignments.map(a => ({
        title: a.task_id?.title || 'Unknown',
        priority: a.task_id?.priority || 'N/A',
        effort: a.task_id?.estimated_effort || 0,
        status: a.task_id?.status || 'N/A'
      }))
    });
  }

  return {
    reportType: 'Employee Workload',
    generatedAt: new Date(),
    totalEmployees: reportData.length,
    data: reportData
  };
};

/**
 * Generate Team Workload Report
 */
const generateTeamWorkloadReport = async (teamId = null) => {
  const teams = teamId ? [await Team.findById(teamId)] : await Team.find();
  const reportData = [];

  for (const team of teams) {
    if (!team) continue;
    const members = await TeamMember.find({ team_id: team._id }).populate('user_id', 'name email');
    const memberData = [];

    for (const member of members) {
      if (!member.user_id) continue;
      const emp = await Employee.findOne({ user_id: member.user_id._id });
      if (!emp) continue;
      const workload = await fetchEmployeeWorkloadFromCapacity(emp._id);
      memberData.push({
        name: member.user_id.name,
        email: member.user_id.email,
        effectiveCapacity: workload.effectiveCapacity,
        availableHours: workload.availableHours,
        meetingHours: workload.meetingHours,
        leaveHours: workload.leaveHours,
        nonProjectHours: workload.nonProjectHours,
        assignedEffort: workload.assignedEffort,
        workloadPercentage: workload.workloadPercentage,
        utilizationStatus: workload.utilizationStatus
      });
    }

    const avgWorkload = memberData.length > 0
      ? Math.round(memberData.reduce((sum, m) => sum + m.workloadPercentage, 0) / memberData.length)
      : 0;

    reportData.push({
      teamName: team.team_name,
      memberCount: memberData.length,
      averageWorkload: avgWorkload,
      members: memberData
    });
  }

  return {
    reportType: 'Team Workload',
    generatedAt: new Date(),
    totalTeams: reportData.length,
    data: reportData
  };
};

/**
 * Generate Capacity Utilization Report
 */
const generateCapacityReport = async () => {
  const employees = await Employee.find({ status: 'Active' }).populate('user_id', 'name email');
  const reportData = [];
  let totalCapacity = 0;
  let totalUsed = 0;

  for (const emp of employees) {
    if (!emp.user_id) continue;
    const workload = await fetchEmployeeWorkloadFromCapacity(emp._id);
    totalCapacity += workload.effectiveCapacity;
    totalUsed += workload.assignedEffort;
    reportData.push({
      name: emp.user_id.name,
      designation: emp.designation,
      effectiveCapacity: workload.effectiveCapacity,
      availableHours: workload.availableHours,
      meetingHours: workload.meetingHours,
      leaveHours: workload.leaveHours,
      nonProjectHours: workload.nonProjectHours,
      assignedEffort: workload.assignedEffort,
      workloadPercentage: workload.workloadPercentage,
      utilizationStatus: workload.utilizationStatus,
      remainingCapacity: workload.remainingCapacity
    });
  }

  return {
    reportType: 'Capacity Utilization',
    generatedAt: new Date(),
    summary: {
      totalEmployees: reportData.length,
      totalCapacityHours: totalCapacity,
      totalUsedHours: totalUsed,
      overallUtilization: totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0
    },
    data: reportData
  };
};

const fetchWorkloadHistoryFromCapacity = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.employeeId) query.set('employee_id', params.employeeId);
    if (params.startDate) query.set('start_date', params.startDate);
    if (params.endDate) query.set('end_date', params.endDate);
    const url = `http://localhost:${process.env.PORT_CAPACITY_SERVICE || 5004}/api/workload/history?${query.toString()}`;
    const res = await fetch(url, { headers: { 'x-internal-service': 'true' } });
    if (res.ok) return await res.json();
  } catch (err) {
    console.error('[Report Service] Failed to fetch workload history from Capacity:', err.message);
  }
  return [];
};

/**
 * Generate Historical Workload Report
 */
const generateHistoricalReport = async (params = {}) => {
  const records = await fetchWorkloadHistoryFromCapacity(params);

  return {
    reportType: 'Historical Workload',
    generatedAt: new Date(),
    totalRecords: records.length,
    data: records.map(r => ({
      employeeName: r.employee_id?.user_id?.name || 'Unknown',
      date: r.date,
      effectiveCapacity: r.effective_capacity,
      workloadPercentage: r.workload_percentage,
      utilizationStatus: r.utilization_status
    }))
  };
};

/**
 * Convert report data to CSV format and upload using Storage Adapter
 */
const exportReportToStorage = async (reportType, reportContent) => {
  let csvRows = [];
  const rows = reportContent.data || [];

  if (reportType === 'Team Workload') {
    csvRows.push(['Team Name', 'Members Count', 'Average Workload %'].join(','));
    for (const t of rows) {
      csvRows.push([`"${t.teamName}"`, t.memberCount, `${t.averageWorkload}%`].join(','));
    }
  } else {
    csvRows.push(['Name', 'Designation', 'Available (h)', 'Meetings (h)', 'Leave (h)', 'Non-Project (h)', 'Effective Capacity (h)', 'Assigned Effort (h)', 'Workload %', 'Status', 'Remaining Capacity (h)'].join(','));
    for (const r of rows) {
      const name = r.employeeName || r.name || 'N/A';
      const desig = r.designation || '';
      csvRows.push([`"${name}"`, `"${desig}"`, r.availableHours ?? '', r.meetingHours ?? '', r.leaveHours ?? '', r.nonProjectHours ?? '', r.effectiveCapacity ?? '', r.assignedEffort ?? '', `${r.workloadPercentage ?? ''}%`, r.utilizationStatus ?? '', r.remainingCapacity ?? ''].join(','));
    }
  }

  const csvString = csvRows.join('\n');
  const filename = `${reportType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`;
  const storageResult = await storageAdapter.uploadReport({
    filename,
    content: csvString,
    contentType: 'text/csv'
  });

  return { csvString, ...storageResult };
};

module.exports = {
  generateEmployeeWorkloadReport,
  generateTeamWorkloadReport,
  generateCapacityReport,
  generateHistoricalReport,
  exportReportToStorage
};
