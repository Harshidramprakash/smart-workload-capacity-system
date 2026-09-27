// models/TaskAssignment.js - Task Assignment Model
const mongoose = require('mongoose');

const taskAssignmentSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigned_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Reassigned'],
    default: 'Active'
  }
});

taskAssignmentSchema.index({ task_id: 1, status: 1 });
taskAssignmentSchema.index({ employee_id: 1, status: 1 });

module.exports = mongoose.model('TaskAssignment', taskAssignmentSchema);
