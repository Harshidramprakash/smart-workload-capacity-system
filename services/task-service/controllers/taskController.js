// services/task-service/controllers/taskController.js - Task Management Controller
// Maintains strict microservice data boundaries:
// - Owns Task & TaskAssignment collections.
// - Communicates with Capacity Service and Notification Service via REST APIs.
const Task = require('../../../shared/models/Task');
const TaskAssignment = require('../../../shared/models/TaskAssignment');
const Employee = require('../../../shared/models/Employee');

// --- Inter-service communication helpers ---
const triggerCapacityRecalculation = async (employeeId, token) => {
  try {
    const url = `http://localhost:${process.env.PORT_CAPACITY_SERVICE || 5004}/api/workload/recalculate/${employeeId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service': 'true',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.workload;
    }
  } catch (err) {
    console.error(`[Task Service] Capacity Service call failed for employee ${employeeId}:`, err.message);
  }
  return null;
};

const sendNotification = async (userId, title, message, type = 'info', token) => {
  try {
    const url = `http://localhost:${process.env.PORT_NOTIFICATION_SERVICE || 5006}/api/notifications`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-service': 'true',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ user_id: userId, title, message, type })
    });
  } catch (err) {
    console.error(`[Task Service] Notification Service call failed for user ${userId}:`, err.message);
  }
};

// --- Controllers ---

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

    const result = [];
    for (const task of tasks) {
      const assignment = await TaskAssignment.findOne({ task_id: task._id, status: 'Active' })
        .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } });
      result.push({
        ...task.toObject(),
        assignedTo: assignment ? {
          assignmentId: assignment._id,
          employeeId: assignment.employee_id?._id,
          employeeName: assignment.employee_id?.user_id?.name || 'Unknown',
          employeeEmail: assignment.employee_id?.user_id?.email || ''
        } : null
      });
    }
    res.json(result);
  } catch (error) { next(error); }
};

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
  } catch (error) { next(error); }
};

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('sprint_id', 'sprint_name project_id')
      .populate('created_by', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const assignments = await TaskAssignment.find({ task_id: task._id })
      .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email' } })
      .sort({ assigned_date: -1 });

    res.json({ ...task.toObject(), assignments });
  } catch (error) { next(error); }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const activeAssignment = await TaskAssignment.findOne({ task_id: task._id, status: 'Active' })
      .populate('employee_id');

    // Security: Role-based authorization boundary
    if (req.userRole === 'Employee') {
      const ownEmp = await Employee.findOne({ user_id: req.user._id });
      if (!ownEmp || !activeAssignment || activeAssignment.employee_id._id.toString() !== ownEmp._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only update tasks assigned to you.' });
      }

      // Employees can only update progress status and actual effort
      const { status, actual_effort } = req.body;
      let statusChanged = false;
      if (status && status !== task.status) {
        task.status = status;
        statusChanged = true;
      }
      if (actual_effort !== undefined) {
        task.actual_effort = actual_effort;
      }
      await task.save();

      // Recalculate capacity via Capacity Service API
      const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
      const updatedWorkload = await triggerCapacityRecalculation(ownEmp._id, token);

      // If marked Completed, notify creator/manager
      if (statusChanged && task.status === 'Completed' && task.created_by) {
        await sendNotification(
          task.created_by,
          'Task Completed',
          `Task "${task.title}" has been completed by ${req.user.name}.`,
          'info',
          token
        );
      }

      return res.json({ message: 'Task updated successfully', task, workload: updatedWorkload });
    }

    // Managers / Admins can update all fields
    const { title, description, priority, estimated_effort, actual_effort, status, due_date } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (due_date) task.due_date = due_date;
    if (estimated_effort !== undefined) {
      task.estimated_effort = estimated_effort;
      if (estimated_effort > 0 && task.status === 'New') task.status = 'Effort Defined';
    }
    if (actual_effort !== undefined) task.actual_effort = actual_effort;
    if (status) task.status = status;

    await task.save();

    // If task has an active assignment, trigger capacity recalculation
    let updatedWorkload = null;
    if (activeAssignment && activeAssignment.employee_id) {
      const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
      updatedWorkload = await triggerCapacityRecalculation(activeAssignment.employee_id._id, token);
    }

    res.json({ message: 'Task updated successfully', task, workload: updatedWorkload });
  } catch (error) { next(error); }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    task.status = 'Cancelled';
    await task.save();

    const activeAssignments = await TaskAssignment.find({ task_id: task._id, status: 'Active' });
    await TaskAssignment.updateMany({ task_id: task._id, status: 'Active' }, { status: 'Reassigned' });

    // Recalculate capacity for affected employees via Capacity Service
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
    for (const a of activeAssignments) {
      await triggerCapacityRecalculation(a.employee_id, token);
    }

    res.json({ message: 'Task cancelled successfully.' });
  } catch (error) { next(error); }
};

const assignTask = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (!employee_id) return res.status(400).json({ message: 'Employee ID is required.' });

    const employee = await Employee.findById(employee_id).populate('user_id', 'name email');
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });

    const existing = await TaskAssignment.findOne({ task_id: task._id, status: 'Active' });
    if (existing) return res.status(400).json({ message: 'Task is already assigned. Use reassign instead.' });

    const assignment = await TaskAssignment.create({
      task_id: task._id,
      employee_id: employee._id,
      assigned_by: req.user._id,
      status: 'Active'
    });

    task.status = 'Assigned';
    await task.save();

    // Call Capacity Service via API to recalculate and store updated workload
    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];
    const workloadData = await triggerCapacityRecalculation(employee._id, token);

    // Call Notification Service via API to notify employee
    await sendNotification(
      employee.user_id._id,
      'New Task Assigned',
      `You have been assigned the task: "${task.title}" (Priority: ${task.priority}, Effort: ${task.estimated_effort}h)`,
      'task_assigned',
      token
    );

    res.status(201).json({
      message: `Task assigned to ${employee.user_id.name} successfully.`,
      assignment,
      workload: workloadData
    });
  } catch (error) { next(error); }
};

const reassignTask = async (req, res, next) => {
  try {
    const { employee_id } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (!employee_id) return res.status(400).json({ message: 'New employee ID is required.' });

    const newEmployee = await Employee.findById(employee_id).populate('user_id', 'name email');
    if (!newEmployee) return res.status(404).json({ message: 'Employee not found.' });

    const token = req.headers.authorization?.split(' ')[1] || req.headers['x-auth-token'];

    // Mark current assignment as Reassigned
    const current = await TaskAssignment.findOne({ task_id: task._id, status: 'Active' })
      .populate({ path: 'employee_id', populate: { path: 'user_id', select: 'name email _id' } });

    if (current) {
      current.status = 'Reassigned';
      await current.save();

      // Recalculate capacity for previous employee via API
      await triggerCapacityRecalculation(current.employee_id._id, token);

      // Notify previous employee via Notification Service API
      await sendNotification(
        current.employee_id.user_id._id,
        'Task Reassigned',
        `Task "${task.title}" has been reassigned to another team member.`,
        'task_reassigned',
        token
      );
    }

    // Create new assignment
    const newAssignment = await TaskAssignment.create({
      task_id: task._id,
      employee_id: newEmployee._id,
      assigned_by: req.user._id,
      status: 'Active'
    });

    task.status = 'Reassigned';
    await task.save();

    // Recalculate capacity for new employee via API
    const newWorkload = await triggerCapacityRecalculation(newEmployee._id, token);

    // Notify new employee via Notification Service API
    await sendNotification(
      newEmployee.user_id._id,
      'Task Reassigned to You',
      `You have been assigned the task: "${task.title}" (Priority: ${task.priority}, Effort: ${task.estimated_effort}h)`,
      'task_reassigned',
      token
    );

    res.json({
      message: `Task reassigned to ${newEmployee.user_id.name} successfully.`,
      assignment: newAssignment,
      workload: newWorkload
    });
  } catch (error) { next(error); }
};

const getMyTasks = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user_id: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Employee record not found.' });

    const assignments = await TaskAssignment.find({ employee_id: employee._id, status: 'Active' })
      .populate({
        path: 'task_id',
        populate: [
          {
            path: 'sprint_id',
            select: 'sprint_name project_id',
            populate: { path: 'project_id', select: 'project_name' }
          },
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
  } catch (error) { next(error); }
};

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  reassignTask,
  getMyTasks
};
