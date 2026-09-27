// services/project-service/controllers/sprintController.js
const Sprint = require('../../../shared/models/Sprint');
const Project = require('../../../shared/models/Project');

const getSprints = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.project_id) filter.project_id = req.query.project_id;
    const sprints = await Sprint.find(filter).populate('project_id', 'project_name').sort({ start_date: -1 });
    res.json(sprints);
  } catch (error) { next(error); }
};

const createSprint = async (req, res, next) => {
  try {
    const { project_id, sprint_name, start_date, end_date, goal, status } = req.body;
    const project = await Project.findById(project_id);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    // Authorization: Managers can only create sprints for their own projects
    if (req.userRole === 'Project Manager' && project.manager_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only create sprints for projects you manage.' });
    }

    const sprint = await Sprint.create({ project_id, sprint_name, start_date, end_date, goal, status });
    res.status(201).json({ message: 'Sprint created successfully', sprint });
  } catch (error) { next(error); }
};

const updateSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: 'Sprint not found.' });

    const project = await Project.findById(sprint.project_id);
    if (project && req.userRole === 'Project Manager' && project.manager_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update sprints for projects you manage.' });
    }

    const { sprint_name, start_date, end_date, goal, status } = req.body;
    if (sprint_name) sprint.sprint_name = sprint_name;
    if (start_date) sprint.start_date = start_date;
    if (end_date) sprint.end_date = end_date;
    if (goal !== undefined) sprint.goal = goal;
    if (status) sprint.status = status;

    await sprint.save();
    res.json({ message: 'Sprint updated successfully', sprint });
  } catch (error) { next(error); }
};

module.exports = { getSprints, createSprint, updateSprint };
