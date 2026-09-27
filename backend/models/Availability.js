// models/Availability.js - Employee Availability Model
const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  available_hours: {
    type: Number,
    default: 8,
    min: 0,
    max: 24
  },
  meeting_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  leave_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  non_project_hours: {
    type: Number,
    default: 0,
    min: 0
  },
  remarks: {
    type: String,
    default: ''
  }
});

// Index for quick lookup by employee and date
availabilitySchema.index({ employee_id: 1, date: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
