// services/capacity-service/routes/recommendationRoutes.js
const express = require('express');
const router = express.Router();
const { getTaskRecommendations } = require('../controllers/recommendationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('Admin', 'Project Manager'), getTaskRecommendations);
router.get('/:taskId', authorize('Admin', 'Project Manager'), getTaskRecommendations);
router.post('/:taskId', authorize('Admin', 'Project Manager'), getTaskRecommendations);
router.get('/task/:taskId', authorize('Admin', 'Project Manager'), getTaskRecommendations);
router.post('/task/:taskId', authorize('Admin', 'Project Manager'), getTaskRecommendations);

module.exports = router;

