// services/capacityService.js - Core Capacity Calculation Engine
const Availability = require('../models/Availability');
const TaskAssignment = require('../models/TaskAssignment');
const Task = require('../models/Task');
const Employee = require('../models/Employee');
const Workload = require('../models/Workload');
const SystemSetting = require('../models/SystemSetting');

/**
 * Get configurable workload thresholds from system settings
 * Falls back to defaults if not configured
 */
const getThresholds = async () => {
  const defaults = { low: 60, normal: 80, high: 100 };
  try {
    const lowSetting = await SystemSetting.findOne({ key: 'workload_low_threshold' });
    const normalSetting = await SystemSetting.findOne({ key: 'workload_normal_threshold' });
    const highSetting = await SystemSetting.findOne({ key: 'workload_high_threshold' });
    return {
      low: lowSetting ? parseInt(lowSetting.value) : defaults.low,
      normal: normalSetting ? parseInt(normalSetting.value) : defaults.normal,
      high: highSetting ? parseInt(highSetting.value) : defaults.high
    };
  } catch {
    return defaults;
  }
};

/**
 * Determine utilization status based on workload percentage
 * @param {number} percentage - Workload percentage
 * @param {object} thresholds - { low, normal, high }
 * @returns {string} - Low, Normal, High, or Overloaded
 */
const getUtilizationStatus = (percentage, thresholds) => {
  if (percentage <= thresholds.low) return 'Low';
  if (percentage <= thresholds.normal) return 'Normal';
  if (percentage <= thresholds.high) return 'High';
  return 'Overloaded';
};

/**
 * Calculate effective capacity for an employee on a given date
 * Formula: Effective Capacity = Available Hours - Meeting Hours - Leave Hours - Non-Project Hours
 * 
 * @param {string} employeeId - Employee ObjectId
 * @param {Date} date - Date to calculate for (defaults to today)
 * @returns {object} - { effectiveCapacity, availableHours, meetingHours, leaveHours, nonProjectHours }
 */
const calculateEffectiveCapacity = async (employeeId, date = null) => {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find availability record for the date
  const availability = await Availability.findOne({
    employee_id: employeeId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  // Default values if no availability record exists
  const availableHours = availability ? availability.available_hours : 8;
  const meetingHours = availability ? availability.meeting_hours : 0;
  const leaveHours = availability ? availability.leave_hours : 0;
  const nonProjectHours = availability ? availability.non_project_hours : 0;

  // Core formula
  const effectiveCapacity = Math.max(0, availableHours - meetingHours - leaveHours - nonProjectHours);

  return {
    effectiveCapacity,
    availableHours,
    meetingHours,
    leaveHours,
    nonProjectHours
  };
};

/**
 * Calculate total assigned effort for an employee (active assignments only)
 * @param {string} employeeId - Employee ObjectId
 * @returns {number} - Total estimated effort hours
 */
const calculateAssignedEffort = async (employeeId) => {
  // Find all active task assignments for this employee
  const activeAssignments = await TaskAssignment.find({
    employee_id: employeeId,
    status: 'Active'
  }).populate('task_id');

  let totalEffort = 0;
  for (const assignment of activeAssignments) {
    if (assignment.task_id && assignment.task_id.estimated_effort) {
      // Only count tasks that are not completed, closed, or cancelled
      const excludeStatuses = ['Completed', 'Closed', 'Cancelled'];
      if (!excludeStatuses.includes(assignment.task_id.status)) {
        totalEffort += assignment.task_id.estimated_effort;
      }
    }
  }
  return totalEffort;
};

/**
 * Calculate full workload analysis for an employee
 * Returns effective capacity, workload percentage, and utilization status
 * 
 * @param {string} employeeId - Employee ObjectId
 * @param {Date} date - Date to calculate for
 * @returns {object} - Complete workload analysis
 */
const calculateWorkload = async (employeeId, date = null) => {
  const thresholds = await getThresholds();
  const capacityData = await calculateEffectiveCapacity(employeeId, date);
  const assignedEffort = await calculateAssignedEffort(employeeId);

  // Calculate workload percentage with edge case handling
  let workloadPercentage = 0;
  if (capacityData.effectiveCapacity <= 0) {
    // Employee has no capacity - mark as overloaded if they have any assignments
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
    assignedEffort,
    remainingCapacity,
    workloadPercentage,
    utilizationStatus,
    isAvailable: capacityData.effectiveCapacity > 0
  };
};

/**
 * Save/update workload record in the database
 * @param {string} employeeId - Employee ObjectId
 * @param {object} workloadData - Calculated workload data
 */
const saveWorkloadRecord = async (employeeId, workloadData) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  await Workload.findOneAndUpdate(
    { employee_id: employeeId, date: { $gte: today, $lte: endOfDay } },
    {
      employee_id: employeeId,
      date: new Date(),
      effective_capacity: workloadData.effectiveCapacity,
      workload_percentage: workloadData.workloadPercentage,
      utilization_status: workloadData.utilizationStatus
    },
    { upsert: true, new: true }
  );
};

module.exports = {
  calculateEffectiveCapacity,
  calculateAssignedEffort,
  calculateWorkload,
  saveWorkloadRecord,
  getThresholds,
  getUtilizationStatus
};
