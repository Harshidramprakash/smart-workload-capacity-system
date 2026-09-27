// services/recommendationService.js - Task Allocation Recommendation Engine
const Employee = require('../models/Employee');
const TeamMember = require('../models/TeamMember');
const capacityService = require('./capacityService');

/**
 * Recommend suitable employees for a task based on capacity analysis
 * 
 * Algorithm (rule-based, NOT AI):
 * 1. Get all active employees
 * 2. Optionally filter by team membership
 * 3. For each employee, calculate effective capacity and current workload
 * 4. Filter out unavailable employees (zero capacity)
 * 5. Check if remaining capacity >= task effort
 * 6. Sort by lowest workload percentage (prefer least loaded)
 * 7. Return ranked recommendations with projected workload
 * 
 * @param {number} taskEffort - Estimated effort for the task (hours)
 * @param {string} teamId - Optional team ID to filter by
 * @returns {object} - { recommendations: [...], bestMatch, noSuitable }
 */
const getRecommendations = async (taskEffort, teamId = null) => {
  // Get all active employees
  let employees = await Employee.find({ status: 'Active' }).populate('user_id', 'name email');

  // If team is specified, filter by team membership
  if (teamId) {
    const teamMembers = await TeamMember.find({ team_id: teamId });
    const teamUserIds = teamMembers.map(m => m.user_id.toString());
    employees = employees.filter(e => teamUserIds.includes(e.user_id._id.toString()));
  }

  const recommendations = [];

  for (const employee of employees) {
    try {
      // Calculate current workload for this employee
      const workloadData = await capacityService.calculateWorkload(employee._id);

      // Calculate projected workload after assigning this task
      let projectedWorkload = 0;
      if (workloadData.effectiveCapacity > 0) {
        projectedWorkload = Math.round(
          ((workloadData.assignedEffort + taskEffort) / workloadData.effectiveCapacity) * 100
        );
      } else {
        projectedWorkload = taskEffort > 0 ? 999 : 0; // Very high if no capacity
      }

      const projectedStatus = capacityService.getUtilizationStatus(
        projectedWorkload,
        await capacityService.getThresholds()
      );

      // Determine suitability
      const canAccept = workloadData.isAvailable && workloadData.remainingCapacity >= taskEffort;
      const hasPartialCapacity = workloadData.isAvailable && workloadData.remainingCapacity > 0;

      // Generate reason
      let reason = '';
      if (canAccept) {
        reason = `Has ${workloadData.remainingCapacity.toFixed(1)} hours remaining capacity. Current workload is ${workloadData.utilizationStatus}.`;
      } else if (!workloadData.isAvailable) {
        reason = 'Employee is unavailable (zero effective capacity).';
      } else if (workloadData.remainingCapacity < taskEffort) {
        reason = `Insufficient capacity. Only ${workloadData.remainingCapacity.toFixed(1)} hours available, but task needs ${taskEffort} hours.`;
      }

      recommendations.push({
        employee_id: employee._id,
        user_id: employee.user_id._id,
        name: employee.user_id.name,
        email: employee.user_id.email,
        designation: employee.designation,
        effectiveCapacity: workloadData.effectiveCapacity,
        assignedEffort: workloadData.assignedEffort,
        remainingCapacity: workloadData.remainingCapacity,
        currentWorkloadPercentage: workloadData.workloadPercentage,
        currentStatus: workloadData.utilizationStatus,
        projectedWorkloadPercentage: projectedWorkload,
        projectedStatus,
        canAccept,
        hasPartialCapacity,
        reason,
        // Score for sorting: lower is better (prefer lower workload)
        score: canAccept ? workloadData.workloadPercentage : 1000 + workloadData.workloadPercentage
      });
    } catch (err) {
      console.error(`Error analyzing employee ${employee._id}:`, err.message);
    }
  }

  // Sort by score (lowest workload first, suitable employees first)
  recommendations.sort((a, b) => a.score - b.score);

  // Find best match
  const suitableEmployees = recommendations.filter(r => r.canAccept);
  const bestMatch = suitableEmployees.length > 0 ? suitableEmployees[0] : null;

  return {
    recommendations,
    bestMatch,
    noSuitable: suitableEmployees.length === 0,
    suitableCount: suitableEmployees.length,
    totalAnalyzed: recommendations.length,
    message: suitableEmployees.length === 0
      ? 'No suitable employee is currently available for this task.'
      : `Found ${suitableEmployees.length} suitable employee(s). Recommended: ${bestMatch.name}`
  };
};

module.exports = { getRecommendations };
