// controllers/recommendationController.js - Task Recommendation Controller
const Task = require('../models/Task');
const recommendationService = require('../services/recommendationService');

/**
 * POST /api/recommendations/task/:taskId - Get employee recommendations for a task
 */
const getTaskRecommendations = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (!task.estimated_effort || task.estimated_effort <= 0) {
      return res.status(400).json({ message: 'Please enter estimated effort before requesting recommendations.' });
    }

    // Update task status to show analysis is happening
    if (['New', 'Effort Defined'].includes(task.status)) {
      task.status = 'Analyzing Capacity';
      await task.save();
    }

    // Get recommendations
    const result = await recommendationService.getRecommendations(
      task.estimated_effort,
      req.query.team_id || null
    );

    // Update task status
    task.status = result.noSuitable ? 'Workload Calculated' : 'Recommendation Ready';
    await task.save();

    res.json({
      task: { _id: task._id, title: task.title, estimated_effort: task.estimated_effort, priority: task.priority },
      ...result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTaskRecommendations };
