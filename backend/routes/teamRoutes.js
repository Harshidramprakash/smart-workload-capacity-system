// routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const { getTeams, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, getTeamMembers } = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getTeams);
router.post('/', authorize('Admin', 'Project Manager'), createTeam);
router.put('/:id', authorize('Admin', 'Project Manager'), updateTeam);
router.delete('/:id', authorize('Admin'), deleteTeam);
router.get('/:id/members', getTeamMembers);
router.post('/:id/members', authorize('Admin', 'Project Manager'), addTeamMember);
router.delete('/:id/members/:userId', authorize('Admin', 'Project Manager'), removeTeamMember);

module.exports = router;
