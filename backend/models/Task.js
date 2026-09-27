// models/Task.js - Task Model
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  sprint_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
    required: [true, 'Sprint is required']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 300
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  estimated_effort: {
    type: Number, // in hours
    default: 0,
    min: 0
  },
  actual_effort: {
    type: Number, // in hours
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: [
      'New',
      'Effort Defined',
      'Analyzing Capacity',
      'Workload Calculated',
      'Recommendation Ready',
      'Assigned',
      'In Progress',
      'Progress Updated',
      'Completed',
      'Closed',
      'Cancelled',
      'Reassigned'
    ],
    default: 'New'
  },
  due_date: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);
