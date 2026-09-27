// services/task-service/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const { getTasks, createTask, getTask, updateTask, deleteTask, assignTask, reassignTask, getMyTasks } = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/my', getMyTasks);
router.get('/', getTasks);
router.post('/', authorize('Admin', 'Project Manager'), createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', authorize('Admin', 'Project Manager'), deleteTask);
router.post('/:id/assign', authorize('Admin', 'Project Manager'), assignTask);
router.post('/:id/reassign', authorize('Admin', 'Project Manager'), reassignTask);

module.exports = router;
