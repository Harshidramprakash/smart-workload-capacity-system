// controllers/userController.js - User Management Controller
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const Employee = require('../models/Employee');

/**
 * GET /api/users - Get all users (Admin)
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    const usersWithRoles = [];

    for (const user of users) {
      const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');
      usersWithRoles.push({
        ...user.toObject(),
        role: userRole ? userRole.role_id.role_name : 'Unassigned'
      });
    }

    res.json(usersWithRoles);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users - Create a new user (Admin)
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, designation } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const user = await User.create({ name, email, password: password || 'Password@123', phone });

    // Assign role
    const roleName = role || 'Employee';
    let roleDoc = await Role.findOne({ role_name: roleName });
    if (!roleDoc) {
      return res.status(400).json({ message: `Invalid role: ${roleName}` });
    }
    await UserRole.create({ user_id: user._id, role_id: roleDoc._id });

    // Create employee record if applicable
    if (roleName === 'Employee') {
      await Employee.create({
        user_id: user._id,
        designation: designation || 'Developer'
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: { _id: user._id, name: user.name, email: user.email, role: roleName }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id - Update a user (Admin)
 */
const updateUser = async (req, res, next) => {
  try {
    const { name, phone, status, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (status) user.status = status;
    await user.save();

    // Update role if provided
    if (role) {
      const roleDoc = await Role.findOne({ role_name: role });
      if (roleDoc) {
        await UserRole.findOneAndUpdate(
          { user_id: user._id },
          { role_id: roleDoc._id },
          { upsert: true }
        );
      }
    }

    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');

    res.json({
      message: 'User updated successfully',
      user: {
        ...user.toObject(),
        password: undefined,
        role: userRole ? userRole.role_id.role_name : 'Unassigned'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id - Disable/delete a user (Admin)
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Soft delete: set status to inactive
    user.status = 'inactive';
    await user.save();

    res.json({ message: 'User disabled successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
