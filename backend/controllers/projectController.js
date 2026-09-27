// controllers/projectController.js - Project Management Controller
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');

/**
 * GET /api/projects - Get all projects (optionally filter by manager)
 */
const getProjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.manager_id) filter.manager_id = req.query.manager_id;
    const projects = await Project.find(filter).populate('manager_id', 'name email').sort({ created_at: -1 });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/projects - Create a project
 */
const createProject = async (req, res, next) => {
  try {
    const { project_name, description, start_date, end_date, status } = req.body;
    const project = await Project.create({
      manager_id: req.user._id,
      project_name,
      description,
      start_date,
      end_date,
      status: status || 'Planning'
    });
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id - Get project details
 */
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('manager_id', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const sprints = await Sprint.find({ project_id: project._id });
    res.json({ ...project.toObject(), sprints });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/projects/:id - Update a project
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, getProject, updateProject };
