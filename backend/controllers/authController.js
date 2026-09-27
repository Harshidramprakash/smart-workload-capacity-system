// controllers/authController.js - Authentication Controller
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const Employee = require('../models/Employee');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

/**
 * POST /api/auth/register
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Create user
    const user = await User.create({ name, email, password, phone });

    // Assign role (default to Employee if not specified)
    const roleName = role || 'Employee';
    let roleDoc = await Role.findOne({ role_name: roleName });
    if (!roleDoc) {
      roleDoc = await Role.create({ role_name: roleName, description: `${roleName} role` });
    }
    await UserRole.create({ user_id: user._id, role_id: roleDoc._id });

    // If role is Employee, create employee record
    if (roleName === 'Employee') {
      await Employee.create({ user_id: user._id, designation: 'Developer' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: roleName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login user and return JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // Find user with password field included
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account is disabled. Contact admin.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Get user role
    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');
    const roleName = userRole ? userRole.role_id.role_name : 'Employee';

    // Get employee record if applicable
    let employeeId = null;
    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ user_id: user._id });
      employeeId = employee ? employee._id : null;
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: roleName,
        employeeId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get current logged-in user
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');
    const roleName = userRole ? userRole.role_id.role_name : 'Employee';

    let employeeId = null;
    const employee = await Employee.findOne({ user_id: user._id });
    if (employee) employeeId = employee._id;

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        role: roleName,
        employeeId
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
