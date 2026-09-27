// services/capacity-service/controllers/workloadController.js
const Employee = require('../../../shared/models/Employee');
const Workload = require('../../../shared/models/Workload');
const TeamMember = require('../../../shared/models/TeamMember');
const capacityService = require('../services/capacityService');

const getEmployeeWorkload = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.employeeId).populate('user_id', 'name email');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    const workload = await capacityService.calculateWorkload(employee._id, null, employee.user_id.email);
    await capacityService.saveWorkloadRecord(employee._id, workload);
    res.json({ employee: { name: employee.user_id.name, email: employee.user_id.email }, ...workload });
  } catch (error) { next(error); }
};

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
      const workload = await capacityService.calculateWorkload(emp._id, null, emp.user_id.email);
      results.push({ employee_id: emp._id, name: emp.user_id.name, email: emp.user_id.email, designation: emp.designation, ...workload });
    }
    res.json(results);
  } catch (error) { next(error); }
};

const getWorkloadHistory = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.employee_id) filter.employee_id = req.query.employee_id;
    if (req.query.start_date || req.query.end_date) {
      filter.date = {};
      if (req.query.start_date) filter.date.$gte = new Date(req.query.start_date);
      if (req.query.end_date) filter.date.$lte = new Date(req.query.end_date);
    }
    const records = await Workload.find(filter).populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } }).sort({ date: -1 }).limit(200);
    res.json(records);
  } catch (error) { next(error); }
};

const recalculateEmployeeWorkload = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId).populate('user_id', 'name email');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const workload = await capacityService.calculateWorkload(employee._id, null, employee.user_id.email);
    await capacityService.saveWorkloadRecord(employee._id, workload);

    // If Overloaded, notify via Notification Service through internal API
    if (workload.utilizationStatus === 'Overloaded') {
      try {
        const notifUrl = `http://localhost:${process.env.PORT_NOTIFICATION_SERVICE || 5006}/api/notifications`;
        await fetch(notifUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-service': 'true'
          },
          body: JSON.stringify({
            user_id: employee.user_id._id,
            title: 'Workload Alert: Overloaded',
            message: `Your current workload is at ${workload.workloadPercentage}% (exceeds 100% capacity). Please discuss task priorities with your manager.`,
            type: 'overloaded'
          })
        });
      } catch (notifErr) {
        console.error('[Capacity Service] Could not notify on overload:', notifErr.message);
      }
    }

    res.json({ message: 'Workload recalculated successfully', workload });
  } catch (error) { next(error); }
};

module.exports = { getEmployeeWorkload, getTeamWorkload, getWorkloadHistory, recalculateEmployeeWorkload };
