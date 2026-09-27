// models/Workload.js - Employee Workload Model
const mongoose = require('mongoose');

const workloadSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  effective_capacity: {
    type: Number,
    default: 0
  },
  workload_percentage: {
    type: Number,
    default: 0
  },
  utilization_status: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Overloaded'],
    default: 'Low'
  }
});

workloadSchema.index({ employee_id: 1, date: -1 });

module.exports = mongoose.model('Workload', workloadSchema);
