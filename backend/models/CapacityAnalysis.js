// models/CapacityAnalysis.js - Capacity Analysis Model
const mongoose = require('mongoose');

const capacityAnalysisSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  analysis_date: {
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
  },
  recommendation: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('CapacityAnalysis', capacityAnalysisSchema);
