// services/capacity-service/controllers/recommendationController.js
const Task = require('../../../shared/models/Task');
const recommendationService = require('../services/recommendationService');

const getTaskRecommendations = async (req, res, next) => {
  try {
    let task = null;
    let effort = 0;
    const taskId = req.params.taskId;
    if (taskId) {
      task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ message: 'Task not found.' });
      if (!task.estimated_effort || task.estimated_effort <= 0) {
        return res.status(400).json({ message: 'Please enter estimated effort before requesting recommendations.' });
      }
      effort = task.estimated_effort;
      if (['New', 'Effort Defined'].includes(task.status)) { 
        task.status = 'Analyzing Capacity'; 
        await task.save(); 
      }
    } else {
      effort = parseFloat(req.query.task_effort || req.body.task_effort || req.query.effort || 0);
      if (!effort || effort <= 0) {
        return res.status(400).json({ message: 'Please provide task_effort parameter or taskId.' });
      }
    }

    const result = await recommendationService.getRecommendations(effort, req.query.team_id || req.body.team_id || null);
    
    if (task) {
      task.status = result.noSuitable ? 'Workload Calculated' : 'Recommendation Ready';
      await task.save();
    }

    res.json({ 
      ...(task ? { task: { _id: task._id, title: task.title, estimated_effort: task.estimated_effort, priority: task.priority } } : {}), 
      ...result 
    });
  } catch (error) { next(error); }
};

module.exports = { getTaskRecommendations };

