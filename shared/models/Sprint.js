// shared/models/Sprint.js - Sprint Model
const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  sprint_name: {
    type: String,
    required: [true, 'Sprint name is required'],
    trim: true,
    maxlength: 200
  },
  start_date: {
    type: Date,
    required: [true, 'Start date is required']
  },
  end_date: {
    type: Date,
    required: [true, 'End date is required']
  },
  goal: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Planning', 'Active', 'Completed'],
    default: 'Planning'
  }
});

module.exports = mongoose.model('Sprint', sprintSchema);
