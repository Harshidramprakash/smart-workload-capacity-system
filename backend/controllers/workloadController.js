// controllers/workloadController.js - Workload Viewing Controller
const Employee = require('../models/Employee');
const Workload = require('../models/Workload');
const TeamMember = require('../models/TeamMember');
const capacityService = require('../services/capacityService');

/**
 * GET /api/workload/:employeeId - Get workload for a specific employee
 */
const getEmployeeWorkload = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).populate('user_id', 'name email');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const workload = await capacityService.calculateWorkload(employee._id);
    await capacityService.saveWorkloadRecord(employee._id, workload);

    res.json({ employee: { name: employee.user_id.name, email: employee.user_id.email }, ...workload });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workload/team - Get team workload overview
 */
const getTeamWorkload = async (req, res, next) => {
  try {
    let employees;

    if (req.query.team_id) {
      const members = await TeamMember.find({ team_id: req.query.team_id });
      const userIds = members.map(m => m.user_id);
      employees = await Employee.find({ user_id: { $in: userIds }, status: 'Active' }).populate('user_id', 'name email');
    } else {
      employees = await Employee.find({ status: 'Active' }).populate('user_id', 'name email');
    }

    const results = [];
    for (const emp of employees) {
      const workload = await capacityService.calculateWorkload(emp._id);
      results.push({
        employee_id: emp._id,
        name: emp.user_id.name,
        email: emp.user_id.email,
        designation: emp.designation,
        ...workload
      });
    }

    res.json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/workload/history - Get historical workload
 */
const getWorkloadHistory = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.employee_id) filter.employee_id = req.query.employee_id;
    if (req.query.start_date || req.query.end_date) {
      filter.date = {};
      if (req.query.start_date) filter.date.$gte = new Date(req.query.start_date);
      if (req.query.end_date) filter.date.$lte = new Date(req.query.end_date);
    }

    const records = await Workload.find(filter)
      .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } })
      .sort({ date: -1 })
      .limit(200);

    res.json(records);
  } catch (error) {
    next(error);
  }
};

module.exports = { getEmployeeWorkload, getTeamWorkload, getWorkloadHistory };
