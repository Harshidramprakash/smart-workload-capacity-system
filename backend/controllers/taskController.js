// controllers/taskController.js - Task Management Controller
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Employee = require('../models/Employee');
const capacityService = require('../services/capacityService');
const notificationService = require('../services/notificationService');

/**
 * GET /api/tasks - Get tasks with filters
 */
const getTasks = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.sprint_id) filter.sprint_id = req.query.sprint_id;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.created_by) filter.created_by = req.query.created_by;

    const tasks = await Task.find(filter)
      .populate('sprint_id', 'sprint_name project_id')
      .populate('created_by', 'name email')
      .sort({ created_at: -1 });

    // Attach assignment info to each task
    const tasksWithAssignments = [];
    for (const task of tasks) {
      const assignment = await TaskAssignment.findOne({ task_id: task._id, status: 'Active' })
        .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } });
      tasksWithAssignments.push({
        ...task.toObject(),
        assignedTo: assignment ? {
          assignmentId: assignment._id,
          employeeId: assignment.employee_id?._id,
          employeeName: assignment.employee_id?.user_id?.name || 'Unknown',
          employeeEmail: assignment.employee_id?.user_id?.email || ''
        } : null
      });
    }

    res.json(tasksWithAssignments);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks - Create a task
 */
const createTask = async (req, res, next) => {
  try {
    const { sprint_id, title, description, priority, estimated_effort, due_date } = req.body;

    if (!title) return res.status(400).json({ message: 'Task title is required.' });
    if (!sprint_id) return res.status(400).json({ message: 'Sprint is required.' });

    let status = 'New';
    if (estimated_effort && estimated_effort > 0) status = 'Effort Defined';

    const task = await Task.create({
      sprint_id,
      created_by: req.user._id,
      title,
      description,
      priority: priority || 'Medium',
      estimated_effort: estimated_effort || 0,
      due_date,
      status
    });

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/:id - Get task details
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('sprint_id', 'sprint_name project_id')
      .populate('created_by', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    // Get all assignments (history)
    const assignments = await TaskAssignment.find({ task_id: task._id })
      .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } })
      .sort({ assigned_date: -1 });

    res.json({ ...task.toObject(), assignments });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tasks/:id - Update a task
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const { title, description, priority, estimated_effort, actual_effort, status, due_date } = req.body;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (due_date) task.due_date = due_date;

    if (estimated_effort !== undefined) {
      task.estimated_effort = estimated_effort;
      if (estimated_effort > 0 && task.status === 'New') {
        task.status = 'Effort Defined';
      }
    }

    if (actual_effort !== undefined) task.actual_effort = actual_effort;
    if (status) task.status = status;

    await task.save();
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tasks/:id - Cancel a task
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    task.status = 'Cancelled';
    await task.save();

    // Cancel active assignments
    await TaskAssignment.updateMany(
      { task_id: task._id, status: 'Active' },
      { status: 'Reassigned' }
    );

    res.json({ message: 'Task cancelled successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks/:id/assign - Assign task to an employee
 */
const assignTask = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (!employee_id) return res.status(400).json({ message: 'Employee ID is required.' });

    const employee = await Employee.findById(employee_id).populate('user_id', 'name email');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    // Check if task is already assigned
    const existingAssignment = await TaskAssignment.findOne({ task_id: task._id, status: 'Active' });
    if (existingAssignment) {
      return res.status(400).json({ message: 'Task is already assigned. Use reassign instead.' });
    }

    // Create assignment
    const assignment = await TaskAssignment.create({
      task_id: task._id,
      employee_id: employee._id,
      assigned_by: req.user._id,
      status: 'Active'
    });

    // Update task status
    task.status = 'Assigned';
    await task.save();

    // Update workload record
    const workloadData = await capacityService.calculateWorkload(employee._id);
    await capacityService.saveWorkloadRecord(employee._id, workloadData);

    // Send notification to employee
    await notificationService.createNotification(
      employee.user_id._id,
      'New Task Assigned',
      `You have been assigned the task: "${task.title}" (Priority: ${task.priority}, Effort: ${task.estimated_effort}h)`,
      'task_assigned'
    );

    // Notify if overloaded
    if (workloadData.utilizationStatus === 'Overloaded') {
      await notificationService.createNotification(
        employee.user_id._id,
        'Workload Alert',
        `Your workload is above 100% (${workloadData.workloadPercentage}%). Please discuss with your manager.`,
        'overloaded'
      );
    }

    res.status(201).json({
      message: `Task assigned to ${employee.user_id.name} successfully.`,
      assignment,
      workload: workloadData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tasks/:id/reassign - Reassign task to another employee
 */
const reassignTask = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (!employee_id) return res.status(400).json({ message: 'New employee ID is required.' });

    const newEmployee = await Employee.findById(employee_id).populate('user_id', 'name email');
    if (!newEmployee) return res.status(404).json({ message: 'Employee not found.' });

    // Mark current assignment as reassigned
    const currentAssignment = await TaskAssignment.findOne({ task_id: task._id, status: 'Active' })
      .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email _id' } });

    if (currentAssignment) {
      currentAssignment.status = 'Reassigned';
      await currentAssignment.save();

      // Recalculate old employee workload
      const oldWorkload = await capacityService.calculateWorkload(currentAssignment.employee_id._id);
      await capacityService.saveWorkloadRecord(currentAssignment.employee_id._id, oldWorkload);

      // Notify old employee
      await notificationService.createNotification(
        currentAssignment.employee_id.user_id._id,
        'Task Reassigned',
        `Task "${task.title}" has been reassigned to another team member.`,
        'task_reassigned'
      );
    }

    // Create new assignment
    const newAssignment = await TaskAssignment.create({
      task_id: task._id,
      employee_id: newEmployee._id,
      assigned_by: req.user._id,
      status: 'Active'
    });

    // Update task status
    task.status = 'Reassigned';
    await task.save();

    // Update new employee workload
    const newWorkload = await capacityService.calculateWorkload(newEmployee._id);
    await capacityService.saveWorkloadRecord(newEmployee._id, newWorkload);

    // Notify new employee
    await notificationService.createNotification(
      newEmployee.user_id._id,
      'Task Reassigned to You',
      `You have been assigned the task: "${task.title}" (Priority: ${task.priority}, Effort: ${task.estimated_effort}h)`,
      'task_reassigned'
    );

    res.json({
      message: `Task reassigned to ${newEmployee.user_id.name} successfully.`,
      assignment: newAssignment,
      workload: newWorkload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tasks/my - Get tasks assigned to current user (Employee)
 */
const getMyTasks = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user_id: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Employee record not found.' });

    const assignments = await TaskAssignment.find({ employee_id: employee._id, status: 'Active' })
      .populate({
        path: 'task_id',
        populate: [
          { path: 'sprint_id', select: 'sprint_name project_id', populate: { path: 'project_id', select: 'project_name' } },
          { path: 'created_by', select: 'name' }
        ]
      });

    const tasks = assignments
      .filter(a => a.task_id)
      .map(a => ({
        assignmentId: a._id,
        ...a.task_id.toObject(),
        assigned_date: a.assigned_date
      }));

    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, assignTask, reassignTask, getMyTasks };
