// services/project-service/routes/sprintRoutes.js
const express = require('express');
const router = express.Router();
const { getSprints, createSprint, updateSprint } = require('../controllers/sprintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getSprints);
router.post('/', authorize('Admin', 'Project Manager'), createSprint);
router.put('/:id', authorize('Admin', 'Project Manager'), updateSprint);

module.exports = router;
