// models/Report.js - Report Model
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  generated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  report_type: {
    type: String,
    enum: ['Employee Workload', 'Team Workload', 'Capacity Utilization', 'Resource Allocation', 'Historical Workload'],
    required: true
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  file_path: {
    type: String,
    default: ''
  },
  generated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
