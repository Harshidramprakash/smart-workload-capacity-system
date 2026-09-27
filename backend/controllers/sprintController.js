// controllers/sprintController.js - Sprint Management Controller
const Sprint = require('../models/Sprint');
const Project = require('../models/Project');

/**
 * GET /api/sprints - Get sprints (optionally filter by project)
 */
const getSprints = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.project_id) filter.project_id = req.query.project_id;
    const sprints = await Sprint.find(filter).populate('project_id', 'project_name').sort({ start_date: -1 });
    res.json(sprints);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/sprints - Create a sprint
 */
const createSprint = async (req, res, next) => {
  try {
    const { project_id, sprint_name, start_date, end_date, goal, status } = req.body;
    const project = await Project.findById(project_id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const sprint = await Sprint.create({ project_id, sprint_name, start_date, end_date, goal, status });
    res.status(201).json({ message: 'Sprint created successfully', sprint });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/sprints/:id - Update a sprint
 */
const updateSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found.' });
    res.json({ message: 'Sprint updated successfully', sprint });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSprints, createSprint, updateSprint };
