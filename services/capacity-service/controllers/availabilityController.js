// services/capacity-service/controllers/availabilityController.js
const Availability = require('../../../shared/models/Availability');
const Employee = require('../../../shared/models/Employee');
const capacityService = require('../services/capacityService');

const getAvailability = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.employee_id) filter.employee_id = req.query.employee_id;
    if (req.query.date) {
      const d = new Date(req.query.date); d.setHours(0,0,0,0);
      const eod = new Date(d); eod.setHours(23,59,59,999);
      filter.date = { $gte: d, $lte: eod };
    }
    const records = await Availability.find(filter).populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } }).sort({ date: -1 });
    res.json(records);
  } catch (error) { next(error); }
};

const createAvailability = async (req, res, next) => {
  try {
    let { employee_id, date, available_hours, meeting_hours, leave_hours, non_project_hours, remarks } = req.body;
    
    // Security: Employees can only manage their own availability
    if (req.userRole === 'Employee') {
      const ownEmp = await Employee.findOne({ user_id: req.user._id });
      if (!ownEmp) return res.status(404).json({ message: 'Employee record not found.' });
      employee_id = ownEmp._id;
    } else if (!employee_id) {
      const emp = await Employee.findOne({ user_id: req.user._id });
      if (!emp) return res.status(404).json({ message: 'Employee record not found.' });
      employee_id = emp._id;
    }

    if (!date) return res.status(400).json({ message: 'Date is required.' });

    const targetDate = new Date(date); targetDate.setHours(0,0,0,0);
    const eod = new Date(targetDate); eod.setHours(23,59,59,999);
    let record = await Availability.findOne({ employee_id, date: { $gte: targetDate, $lte: eod } });

    if (record) {
      if (available_hours !== undefined) record.available_hours = available_hours;
      if (meeting_hours !== undefined) record.meeting_hours = meeting_hours;
      if (leave_hours !== undefined) record.leave_hours = leave_hours;
      if (non_project_hours !== undefined) record.non_project_hours = non_project_hours;
      if (remarks !== undefined) record.remarks = remarks;
      await record.save();
    } else {
      record = await Availability.create({ employee_id, date: targetDate, available_hours: available_hours || 8, meeting_hours: meeting_hours || 0, leave_hours: leave_hours || 0, non_project_hours: non_project_hours || 0, remarks: remarks || '' });
    }

    const workloadData = await capacityService.calculateWorkload(employee_id);
    await capacityService.saveWorkloadRecord(employee_id, workloadData);
    res.status(201).json({ message: 'Availability saved successfully', record, workload: workloadData });
  } catch (error) { next(error); }
};

const updateAvailability = async (req, res, next) => {
  try {
    const existing = await Availability.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Availability record not found.' });

    // Security: Employees can only modify their own availability
    if (req.userRole === 'Employee') {
      const ownEmp = await Employee.findOne({ user_id: req.user._id });
      if (!ownEmp || existing.employee_id.toString() !== ownEmp._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only update your own availability.' });
      }
    }

    const { available_hours, meeting_hours, leave_hours, non_project_hours, remarks } = req.body;
    if (available_hours !== undefined) existing.available_hours = available_hours;
    if (meeting_hours !== undefined) existing.meeting_hours = meeting_hours;
    if (leave_hours !== undefined) existing.leave_hours = leave_hours;
    if (non_project_hours !== undefined) existing.non_project_hours = non_project_hours;
    if (remarks !== undefined) existing.remarks = remarks;
    await existing.save();

    const workloadData = await capacityService.calculateWorkload(existing.employee_id);
    await capacityService.saveWorkloadRecord(existing.employee_id, workloadData);
    res.json({ message: 'Availability updated successfully', record: existing, workload: workloadData });
  } catch (error) { next(error); }
};

module.exports = { getAvailability, createAvailability, updateAvailability };
