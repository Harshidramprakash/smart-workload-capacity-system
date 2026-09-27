// services/capacity-service/services/recommendationService.js - Task Allocation Recommendation Engine
const Employee = require('../../../shared/models/Employee');
const TeamMember = require('../../../shared/models/TeamMember');
const capacityService = require('./capacityService');

const getRecommendations = async (taskEffort, teamId = null) => {
  let employees = await Employee.find({ status: 'Active' }).populate('user_id', 'name email');
  if (teamId) {
    const teamMembers = await TeamMember.find({ team_id: teamId });
    const teamUserIds = teamMembers.map(m => m.user_id.toString());
    employees = employees.filter(e => teamUserIds.includes(e.user_id._id.toString()));
  }

  const recommendations = [];
  for (const employee of employees) {
    try {
      const workloadData = await capacityService.calculateWorkload(employee._id, null, employee.user_id.email);
      let projectedWorkload = 0;
      if (workloadData.effectiveCapacity > 0) {
        projectedWorkload = Math.round(((workloadData.assignedEffort + taskEffort) / workloadData.effectiveCapacity) * 100);
      } else {
        projectedWorkload = taskEffort > 0 ? 999 : 0;
      }
      const thresholds = await capacityService.getThresholds();
      const projectedStatus = capacityService.getUtilizationStatus(projectedWorkload, thresholds);
      const canAccept = workloadData.isAvailable && workloadData.remainingCapacity >= taskEffort;
      const hasPartialCapacity = workloadData.isAvailable && workloadData.remainingCapacity > 0;

      let reason = '';
      if (canAccept) {
        reason = `Has ${workloadData.remainingCapacity.toFixed(1)} hours remaining capacity. Current workload is ${workloadData.utilizationStatus}.`;
      } else if (!workloadData.isAvailable) {
        reason = 'Employee is unavailable (zero effective capacity).';
      } else if (workloadData.remainingCapacity < taskEffort) {
        reason = `Insufficient capacity. Only ${workloadData.remainingCapacity.toFixed(1)} hours available, but task needs ${taskEffort} hours.`;
      }

      recommendations.push({
        employee_id: employee._id, user_id: employee.user_id._id,
        name: employee.user_id.name, email: employee.user_id.email,
        designation: employee.designation,
        effectiveCapacity: workloadData.effectiveCapacity,
        assignedEffort: workloadData.assignedEffort,
        remainingCapacity: workloadData.remainingCapacity,
        currentWorkloadPercentage: workloadData.workloadPercentage,
        currentStatus: workloadData.utilizationStatus,
        projectedWorkloadPercentage: projectedWorkload, projectedStatus,
        canAccept, hasPartialCapacity, reason,
        score: canAccept ? workloadData.workloadPercentage : 1000 + workloadData.workloadPercentage
      });
    } catch (err) {
      console.error(`Error analyzing employee ${employee._id}:`, err.message);
    }
  }

  recommendations.sort((a, b) => a.score - b.score);
  const suitableEmployees = recommendations.filter(r => r.canAccept);
  const bestMatch = suitableEmployees.length > 0 ? suitableEmployees[0] : null;

  return {
    recommendations, bestMatch,
    noSuitable: suitableEmployees.length === 0,
    suitableCount: suitableEmployees.length,
    totalAnalyzed: recommendations.length,
    message: suitableEmployees.length === 0
      ? 'No suitable employee is currently available for this task.'
      : `Found ${suitableEmployees.length} suitable employee(s). Recommended: ${bestMatch.name}`
  };
};

module.exports = { getRecommendations };
