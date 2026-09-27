// shared/models/TeamMember.js - Team Membership Model
const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joined_at: {
    type: Date,
    default: Date.now
  },
  role_in_team: {
    type: String,
    default: 'Member',
    trim: true
  }
});

// Prevent duplicate team memberships
teamMemberSchema.index({ team_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
