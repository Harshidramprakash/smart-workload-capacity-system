// shared/models/SystemSetting.js - System Settings Model
const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
