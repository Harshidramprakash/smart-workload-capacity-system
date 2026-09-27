// services/capacity-service/routes/workloadRoutes.js
const express = require('express');
const router = express.Router();
const { getEmployeeWorkload, getTeamWorkload, getWorkloadHistory, recalculateEmployeeWorkload } = require('../controllers/workloadController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/team', getTeamWorkload);
router.get('/history', getWorkloadHistory);
router.get('/:employeeId', getEmployeeWorkload);
router.post('/recalculate/:employeeId', recalculateEmployeeWorkload);

module.exports = router;
