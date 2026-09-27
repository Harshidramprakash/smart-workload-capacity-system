// routes/workloadRoutes.js
const express = require('express');
const router = express.Router();
const { getEmployeeWorkload, getTeamWorkload, getWorkloadHistory } = require('../controllers/workloadController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/team', getTeamWorkload);
router.get('/history', getWorkloadHistory);
router.get('/:employeeId', getEmployeeWorkload);

module.exports = router;
