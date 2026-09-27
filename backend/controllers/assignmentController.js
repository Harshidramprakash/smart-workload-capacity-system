// controllers/assignmentController.js - Assignment & Time Logging Controller
const TaskAssignment = require('../models/TaskAssignment');
const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const Employee = require('../models/Employee');

/**
 * GET /api/assignments - Get assignments with filters
 */
const getAssignments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.employee_id) filter.employee_id = req.query.employee_id;
    if (req.query.task_id) filter.task_id = req.query.task_id;
    if (req.query.status) filter.status = req.query.status;

    const assignments = await TaskAssignment.find(filter)
      .populate('task_id', 'title priority estimated_effort status due_date')
      .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } })
      .populate('assigned_by', 'name')
      .sort({ assigned_date: -1 });

    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/assignments/:id/time-log - Log actual effort
 */
const createTimeLog = async (req, res, next) => {
  try {
    const { actual_hours, work_description, date } = req.body;
    const assignment = await TaskAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    if (!actual_hours || actual_hours <= 0) {
      return res.status(400).json({ message: 'Actual hours must be greater than 0.' });
    }

    const timeLog = await TimeLog.create({
      assignment_id: assignment._id,
      date: date || new Date(),
      actual_hours,
      work_description: work_description || ''
    });

    // Update actual effort on the task
    const task = await Task.findById(assignment.task_id);
    if (task) {
      // Sum all time logs for this task
      const allLogs = await TimeLog.find({
        assignment_id: { $in: await TaskAssignment.find({ task_id: task._id }).distinct('_id') }
      });
      task.actual_effort = allLogs.reduce((sum, log) => sum + log.actual_hours, 0);
      await task.save();
    }

    res.status(201).json({ message: 'Time logged successfully', timeLog });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/assignments/:id/time-logs - Get time logs for an assignment
 */
const getTimeLogs = async (req, res, next) => {
  try {
    const logs = await TimeLog.find({ assignment_id: req.params.id }).sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAssignments, createTimeLog, getTimeLogs };
