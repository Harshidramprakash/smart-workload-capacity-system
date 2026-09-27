// services/user-service/controllers/roleController.js
const Role = require('../../../shared/models/Role');

const getRoles = async (req, res, next) => {
  try { res.json(await Role.find()); } catch (error) { next(error); }
};

const createRole = async (req, res, next) => {
  try {
    const role = await Role.create(req.body);
    res.status(201).json(role);
  } catch (error) { next(error); }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!role) return res.status(404).json({ message: 'Role not found.' });
    res.json(role);
  } catch (error) { next(error); }
};

module.exports = { getRoles, createRole, updateRole };
