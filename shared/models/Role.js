// shared/models/Role.js - Role Model
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    enum: ['Admin', 'Project Manager', 'Employee', 'HR Manager'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Role', roleSchema);
