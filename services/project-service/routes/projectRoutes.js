// services/project-service/routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const { getProjects, createProject, getProject, updateProject } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getProjects);
router.post('/', authorize('Admin', 'Project Manager'), createProject);
router.get('/:id', getProject);
router.put('/:id', authorize('Admin', 'Project Manager'), updateProject);

module.exports = router;
