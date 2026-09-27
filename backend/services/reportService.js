// services/reportService.js - Report Generation Service
const Employee = require('../models/Employee');
const TaskAssignment = require('../models/TaskAssignment');
const Task = require('../models/Task');
const Workload = require('../models/Workload');
const TeamMember = require('../models/TeamMember');
const Team = require('../models/Team');
const capacityService = require('./capacityService');

/**
 * Generate Employee Workload Report
 * @param {object} params - { employeeId, startDate, endDate }
 * @returns {object} - Report data
 */
const generateEmployeeWorkloadReport = async (params = {}) => {
  const employees = params.employeeId
    ? [await Employee.findById(params.employeeId).populate('user_id', 'name email')]
    : await Employee.find({ status: 'Active' }).populate('user_id', 'name email');

  const reportData = [];
  for (const emp of employees) {
    if (!emp || !emp.user_id) continue;
    const workload = await capacityService.calculateWorkload(emp._id);
    const assignments = await TaskAssignment.find({
      employee_id: emp._id,
      status: 'Active'
    }).populate('task_id', 'title priority estimated_effort status');

    reportData.push({
      employeeName: emp.user_id.name,
      email: emp.user_id.email,
      designation: emp.designation,
      effectiveCapacity: workload.effectiveCapacity,
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
 * @param {string} teamId - Optional team ID
 * @returns {object} - Report data
 */
const generateTeamWorkloadReport = async (teamId = null) => {
  const teams = teamId
    ? [await Team.findById(teamId)]
    : await Team.find();

  const reportData = [];
  for (const team of teams) {
    if (!team) continue;
    const members = await TeamMember.find({ team_id: team._id }).populate('user_id', 'name email');
    const memberData = [];

    for (const member of members) {
      const employee = await Employee.findOne({ user_id: member.user_id._id });
      if (!employee) continue;
      const workload = await capacityService.calculateWorkload(employee._id);
      memberData.push({
        name: member.user_id.name,
        email: member.user_id.email,
        effectiveCapacity: workload.effectiveCapacity,
        assignedEffort: workload.assignedEffort,
        workloadPercentage: workload.workloadPercentage,
        utilizationStatus: workload.utilizationStatus
      });
    }

    // Calculate team averages
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
    const workload = await capacityService.calculateWorkload(emp._id);
    totalCapacity += workload.effectiveCapacity;
    totalUsed += workload.assignedEffort;
    reportData.push({
      name: emp.user_id.name,
      effectiveCapacity: workload.effectiveCapacity,
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

/**
 * Generate Historical Workload Report
 * @param {object} params - { startDate, endDate, employeeId }
 */
const generateHistoricalReport = async (params = {}) => {
  const filter = {};
  if (params.employeeId) filter.employee_id = params.employeeId;
  if (params.startDate || params.endDate) {
    filter.date = {};
    if (params.startDate) filter.date.$gte = new Date(params.startDate);
    if (params.endDate) filter.date.$lte = new Date(params.endDate);
  }

  const records = await Workload.find(filter)
    .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } })
    .sort({ date: -1 })
    .limit(500);

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

module.exports = {
  generateEmployeeWorkloadReport,
  generateTeamWorkloadReport,
  generateCapacityReport,
  generateHistoricalReport
};
