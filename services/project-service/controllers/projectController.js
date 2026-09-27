// services/project-service/controllers/projectController.js
const Project = require('../../../shared/models/Project');
const Sprint = require('../../../shared/models/Sprint');

const getProjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.manager_id) filter.manager_id = req.query.manager_id;
    const projects = await Project.find(filter).populate('manager_id', 'name email').sort({ created_at: -1 });
    res.json(projects);
  } catch (error) { next(error); }
};

const createProject = async (req, res, next) => {
  try {
    const { project_name, description, start_date, end_date, status } = req.body;
    const project = await Project.create({
      manager_id: req.user._id, project_name, description, start_date, end_date, status: status || 'Planning'
    });
    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) { next(error); }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('manager_id', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    const sprints = await Sprint.find({ project_id: project._id });
    res.json({ ...project.toObject(), sprints });
  } catch (error) { next(error); }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Authorization: Managers can only manage their own projects
    if (req.userRole === 'Project Manager' && project.manager_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only manage projects you own.' });
    }

    const { project_name, description, start_date, end_date, status } = req.body;
    if (project_name) project.project_name = project_name;
    if (description !== undefined) project.description = description;
    if (start_date) project.start_date = start_date;
    if (end_date) project.end_date = end_date;
    if (status) project.status = status;

    await project.save();
    res.json({ message: 'Project updated successfully', project });
  } catch (error) { next(error); }
};

module.exports = { getProjects, createProject, getProject, updateProject };
