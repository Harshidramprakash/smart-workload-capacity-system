// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { getReports, generateWorkloadReport, generateCapacityReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getReports);
router.post('/workload', authorize('Admin', 'Project Manager', 'HR Manager'), generateWorkloadReport);
router.post('/capacity', authorize('Admin', 'Project Manager', 'HR Manager'), generateCapacityReport);

module.exports = router;
