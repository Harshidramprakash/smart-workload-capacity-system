// shared/models/TimeLog.js - Time Log Model
const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  assignment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskAssignment',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  actual_hours: {
    type: Number,
    required: [true, 'Actual hours is required'],
    min: 0
  },
  work_description: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('TimeLog', timeLogSchema);
