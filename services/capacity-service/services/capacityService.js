// services/capacity-service/services/capacityService.js - Core Capacity Calculation Engine
const Availability = require('../../../shared/models/Availability');
const TaskAssignment = require('../../../shared/models/TaskAssignment');
const Task = require('../../../shared/models/Task');
const Workload = require('../../../shared/models/Workload');
const SystemSetting = require('../../../shared/models/SystemSetting');
const calendarAdapter = require('../adapters/calendarAdapter');
const hrmsAdapter = require('../adapters/hrmsAdapter');

const getThresholds = async () => {
  const defaults = { low: 60, normal: 80, high: 100 };
  try {
    const l = await SystemSetting.findOne({ key: 'workload_low_threshold' });
    const n = await SystemSetting.findOne({ key: 'workload_normal_threshold' });
    const h = await SystemSetting.findOne({ key: 'workload_high_threshold' });
    return { low: l ? parseInt(l.value) : defaults.low, normal: n ? parseInt(n.value) : defaults.normal, high: h ? parseInt(h.value) : defaults.high };
  } catch { return defaults; }
};

const getUtilizationStatus = (percentage, thresholds) => {
  if (percentage <= thresholds.low) return 'Low';
  if (percentage <= thresholds.normal) return 'Normal';
  if (percentage <= thresholds.high) return 'High';
  return 'Overloaded';
};

/**
 * Calculate effective capacity for an employee on a given date
 * Integrates with Calendar and HRMS adapters for external data
 */
const calculateEffectiveCapacity = async (employeeId, date = null, employeeEmail = null) => {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

  const availability = await Availability.findOne({ employee_id: employeeId, date: { $gte: startOfDay, $lte: endOfDay } });

  let availableHours = availability ? availability.available_hours : 8;
  let meetingHours = availability ? availability.meeting_hours : 0;
  let leaveHours = availability ? availability.leave_hours : 0;
  let nonProjectHours = availability ? availability.non_project_hours : 0;

  // Attempt to enrich with external data if email is provided
  if (employeeEmail) {
    try {
      const calendarData = await calendarAdapter.getMeetingHours(employeeEmail, targetDate);
      if (calendarData.synced && calendarData.meetingHours > 0) {
        meetingHours = calendarData.meetingHours;
      }
    } catch (err) { console.error('[Calendar Adapter Error]', err.message); }

    try {
      const leaveData = await hrmsAdapter.getLeaveData(employeeEmail, targetDate);
      if (leaveData.synced && leaveData.leaveHours > 0) {
        leaveHours = leaveData.leaveHours;
      }
    } catch (err) { console.error('[HRMS Adapter Error]', err.message); }
  }

  const effectiveCapacity = Math.max(0, availableHours - meetingHours - leaveHours - nonProjectHours);

  return { effectiveCapacity, availableHours, meetingHours, leaveHours, nonProjectHours };
};

const calculateAssignedEffort = async (employeeId) => {
  const activeAssignments = await TaskAssignment.find({ employee_id: employeeId, status: 'Active' }).populate('task_id');
  let totalEffort = 0;
  for (const assignment of activeAssignments) {
    if (assignment.task_id && assignment.task_id.estimated_effort) {
      if (!['Completed', 'Closed', 'Cancelled'].includes(assignment.task_id.status)) {
        totalEffort += assignment.task_id.estimated_effort;
      }
    }
  }
  return totalEffort;
};

const calculateWorkload = async (employeeId, date = null, employeeEmail = null) => {
  const thresholds = await getThresholds();
  const capacityData = await calculateEffectiveCapacity(employeeId, date, employeeEmail);
  const assignedEffort = await calculateAssignedEffort(employeeId);

  let workloadPercentage = 0;
  if (capacityData.effectiveCapacity <= 0) {
    workloadPercentage = assignedEffort > 0 ? 100 : 0;
  } else {
    workloadPercentage = Math.round((assignedEffort / capacityData.effectiveCapacity) * 100);
  }

  const utilizationStatus = getUtilizationStatus(workloadPercentage, thresholds);
  const remainingCapacity = Math.max(0, capacityData.effectiveCapacity - assignedEffort);

  return {
    employee_id: employeeId,
    effectiveCapacity: capacityData.effectiveCapacity,
    availableHours: capacityData.availableHours,
    meetingHours: capacityData.meetingHours,
    leaveHours: capacityData.leaveHours,
    nonProjectHours: capacityData.nonProjectHours,
    assignedEffort, remainingCapacity, workloadPercentage, utilizationStatus,
    isAvailable: capacityData.effectiveCapacity > 0
  };
};

const saveWorkloadRecord = async (employeeId, workloadData) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today); endOfDay.setHours(23, 59, 59, 999);
  await Workload.findOneAndUpdate(
    { employee_id: employeeId, date: { $gte: today, $lte: endOfDay } },
    { employee_id: employeeId, date: new Date(), effective_capacity: workloadData.effectiveCapacity, workload_percentage: workloadData.workloadPercentage, utilization_status: workloadData.utilizationStatus },
    { upsert: true, new: true }
  );
};

module.exports = { calculateEffectiveCapacity, calculateAssignedEffort, calculateWorkload, saveWorkloadRecord, getThresholds, getUtilizationStatus };
