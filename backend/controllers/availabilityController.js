// controllers/availabilityController.js - Availability Management Controller
const Availability = require('../models/Availability');
const Employee = require('../models/Employee');
const capacityService = require('../services/capacityService');

/**
 * GET /api/availability - Get availability records
 */
const getAvailability = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.employee_id) filter.employee_id = req.query.employee_id;
    if (req.query.date) {
      const d = new Date(req.query.date);
      d.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: d, $lte: endOfDay };
    }

    const records = await Availability.find(filter)
      .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } })
      .sort({ date: -1 });
    res.json(records);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/availability - Create or update availability
 */
const createAvailability = async (req, res, next) => {
  try {
    let { employee_id, date, available_hours, meeting_hours, leave_hours, non_project_hours, remarks } = req.body;

    // If employee_id not provided, use current user's employee record
    if (!employee_id) {
      const emp = await Employee.findOne({ user_id: req.user._id });
      if (!emp) return res.status(404).json({ message: 'Employee record not found.' });
      employee_id = emp._id;
    }

    if (!date) return res.status(400).json({ message: 'Date is required.' });

    // Check for existing record on this date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let record = await Availability.findOne({
      employee_id,
      date: { $gte: targetDate, $lte: endOfDay }
    });

    if (record) {
      // Update existing
      if (available_hours !== undefined) record.available_hours = available_hours;
      if (meeting_hours !== undefined) record.meeting_hours = meeting_hours;
      if (leave_hours !== undefined) record.leave_hours = leave_hours;
      if (non_project_hours !== undefined) record.non_project_hours = non_project_hours;
      if (remarks !== undefined) record.remarks = remarks;
      await record.save();
    } else {
      // Create new
      record = await Availability.create({
        employee_id,
        date: targetDate,
        available_hours: available_hours || 8,
        meeting_hours: meeting_hours || 0,
        leave_hours: leave_hours || 0,
        non_project_hours: non_project_hours || 0,
        remarks: remarks || ''
      });
    }

    // Recalculate workload after availability change
    const workloadData = await capacityService.calculateWorkload(employee_id);
    await capacityService.saveWorkloadRecord(employee_id, workloadData);

    res.status(201).json({ message: 'Availability saved successfully', record, workload: workloadData });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/availability/:id - Update availability record
 */
const updateAvailability = async (req, res, next) => {
  try {
    const record = await Availability.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ message: 'Availability record not found.' });

    // Recalculate workload
    const workloadData = await capacityService.calculateWorkload(record.employee_id);
    await capacityService.saveWorkloadRecord(record.employee_id, workloadData);

    res.json({ message: 'Availability updated successfully', record, workload: workloadData });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAvailability, createAvailability, updateAvailability };
