// routes/capacityRoutes.js
const express = require('express');
const router = express.Router();
const { getEmployeeCapacity, analyzeCapacity } = require('../controllers/capacityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/analyze', authorize('Admin', 'Project Manager', 'HR Manager'), analyzeCapacity);
router.get('/:employeeId', getEmployeeCapacity);

module.exports = router;
