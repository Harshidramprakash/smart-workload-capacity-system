// controllers/capacityController.js - Capacity Analysis Controller
const Employee = require('../models/Employee');
const CapacityAnalysis = require('../models/CapacityAnalysis');
const capacityService = require('../services/capacityService');

/**
 * GET /api/capacity/:employeeId - Get capacity for a specific employee
 */
const getEmployeeCapacity = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).populate('user_id', 'name email');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const workload = await capacityService.calculateWorkload(employee._id);
    res.json({
      employee: { _id: employee._id, name: employee.user_id.name, email: employee.user_id.email },
      ...workload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/capacity/analyze - Analyze capacity for all or specific employees
 * This is the main capacity analysis endpoint used by Project Managers
 */
const analyzeCapacity = async (req, res, next) => {
  try {
    const { employee_ids } = req.body;
    let employees;

    if (employee_ids && employee_ids.length > 0) {
      employees = await Employee.find({ _id: { $in: employee_ids }, status: 'Active' }).populate('user_id', 'name email');
    } else {
      employees = await Employee.find({ status: 'Active' }).populate('user_id', 'name email');
    }

    const results = [];
    for (const emp of employees) {
      const workload = await capacityService.calculateWorkload(emp._id);

      // Determine recommendation
      let recommendation = '';
      if (!workload.isAvailable) {
        recommendation = 'Employee is unavailable. No tasks should be assigned.';
      } else if (workload.utilizationStatus === 'Overloaded') {
        recommendation = 'Employee is overloaded. Consider reassigning tasks.';
      } else if (workload.utilizationStatus === 'High') {
        recommendation = 'Employee has high workload. Assign with caution.';
      } else if (workload.utilizationStatus === 'Normal') {
        recommendation = 'Employee has normal workload. Can accept more tasks.';
      } else {
        recommendation = 'Employee has low workload. Available for new tasks.';
      }

      // Save analysis record
      await CapacityAnalysis.create({
        employee_id: emp._id,
        analysis_date: new Date(),
        effective_capacity: workload.effectiveCapacity,
        workload_percentage: workload.workloadPercentage,
        utilization_status: workload.utilizationStatus,
        recommendation
      });

      // Save workload record
      await capacityService.saveWorkloadRecord(emp._id, workload);

      results.push({
        employee_id: emp._id,
        name: emp.user_id.name,
        email: emp.user_id.email,
        designation: emp.designation,
        ...workload,
        recommendation
      });
    }

    res.json({
      message: `Capacity analysis completed for ${results.length} employees.`,
      results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployeeCapacity, analyzeCapacity };
