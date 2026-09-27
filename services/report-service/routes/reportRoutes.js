// services/report-service/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const {
  getReports,
  getReportById,
  generateWorkloadReport,
  generateCapacityReport,
  downloadReportFile
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// Public file download route (via gateway)
router.get('/download/:filename', downloadReportFile);

// Protected routes (Admin, Project Manager, HR Manager)
router.use(protect);
router.use(authorize('Admin', 'Project Manager', 'HR Manager'));

router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/workload', generateWorkloadReport);
router.post('/capacity', generateCapacityReport);

module.exports = router;
