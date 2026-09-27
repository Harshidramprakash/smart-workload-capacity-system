// controllers/roleController.js - Role Management Controller
const Role = require('../models/Role');

/**
 * GET /api/roles - Get all roles
 */
const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roles - Create a role (Admin)
 */
const createRole = async (req, res, next) => {
  try {
    const { role_name, description } = req.body;
    const role = await Role.create({ role_name, description });
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/roles/:id - Update a role (Admin)
 */
const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ message: 'Role not found.' });
    res.json(role);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRoles, createRole, updateRole };
