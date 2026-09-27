// controllers/teamController.js - Team Management Controller
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');

/**
 * GET /api/teams - Get all teams
 */
const getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find();
    const teamsWithMembers = [];
    for (const team of teams) {
      const memberCount = await TeamMember.countDocuments({ team_id: team._id });
      teamsWithMembers.push({ ...team.toObject(), memberCount });
    }
    res.json(teamsWithMembers);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teams - Create a team
 */
const createTeam = async (req, res, next) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/teams/:id - Update a team
 */
const updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    res.json({ message: 'Team updated successfully', team });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/teams/:id - Delete a team
 */
const deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });
    await TeamMember.deleteMany({ team_id: req.params.id });
    res.json({ message: 'Team deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teams/:id/members - Add member to team
 */
const addTeamMember = async (req, res, next) => {
  try {
    const { user_id, role_in_team } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const existingMember = await TeamMember.findOne({ team_id: req.params.id, user_id });
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this team.' });
    }

    const member = await TeamMember.create({
      team_id: req.params.id,
      user_id,
      role_in_team: role_in_team || 'Member'
    });

    res.status(201).json({ message: 'Member added successfully', member });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/teams/:id/members/:userId - Remove member from team
 */
const removeTeamMember = async (req, res, next) => {
  try {
    const result = await TeamMember.findOneAndDelete({
      team_id: req.params.id,
      user_id: req.params.userId
    });
    if (!result) return res.status(404).json({ message: 'Member not found in team.' });
    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/teams/:id/members - Get team members
 */
const getTeamMembers = async (req, res, next) => {
  try {
    const members = await TeamMember.find({ team_id: req.params.id })
      .populate('user_id', 'name email status');
    res.json(members);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeams, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, getTeamMembers };
