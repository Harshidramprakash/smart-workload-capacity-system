// services/task-service/routes/assignmentRoutes.js
const express = require('express');
const router = express.Router();
const { getAssignments, createTimeLog, getTimeLogs } = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAssignments);
router.post('/:id/time-log', createTimeLog);
router.get('/:id/time-logs', getTimeLogs);

module.exports = router;
