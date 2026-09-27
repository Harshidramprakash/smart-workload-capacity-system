// services/user-service/controllers/authController.js - Authentication Controller
const jwt = require('jsonwebtoken');
const User = require('../../../shared/models/User');
const Role = require('../../../shared/models/Role');
const UserRole = require('../../../shared/models/UserRole');
const Employee = require('../../../shared/models/Employee');
const ssoAdapter = require('../adapters/ssoAdapter');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

/**
 * POST /api/auth/register - Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, phone });

    // Security: Users cannot assign themselves privileged roles. Public registration is restricted to Employee.
    if (role && role !== 'Employee') {
      return res.status(403).json({ message: 'Privileged roles cannot be self-assigned. Contact an administrator.' });
    }
    const roleName = 'Employee';
    let roleDoc = await Role.findOne({ role_name: roleName });
    if (!roleDoc) {
      roleDoc = await Role.create({ role_name: roleName, description: `${roleName} role` });
    }
    await UserRole.create({ user_id: user._id, role_id: roleDoc._id });

    // Create employee record
    await Employee.create({ user_id: user._id, designation: 'Developer' });

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
 * POST /api/auth/login - Login user and return JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account is disabled. Contact admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');
    const roleName = userRole ? userRole.role_id.role_name : 'Employee';

    let employeeId = null;
    if (roleName === 'Employee') {
      const employee = await Employee.findOne({ user_id: user._id });
      employeeId = employee ? employee._id : null;
    }

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
 * GET /api/auth/me - Get current logged-in user
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

/**
 * GET /api/auth/sso/login - Get SSO login URL
 */
const ssoLogin = async (req, res) => {
  const loginURL = ssoAdapter.getSSOLoginURL();
  if (!loginURL) {
    return res.status(501).json({
      message: `SSO not available. Current provider: ${ssoAdapter.PROVIDER} (mock). Configure a real SSO provider in .env to enable.`
    });
  }
  res.json({ redirectUrl: loginURL });
};

/**
 * POST /api/auth/sso/callback - Handle SSO callback
 */
const ssoCallback = async (req, res, next) => {
  try {
    const { code, ssoToken } = req.body;
    let ssoUser;

    if (code) {
      ssoUser = await ssoAdapter.handleSSOCallback(code);
    } else if (ssoToken) {
      ssoUser = await ssoAdapter.validateSSOToken(ssoToken);
    }

    if (!ssoUser) {
      return res.status(501).json({
        message: `SSO not available. Current provider: ${ssoAdapter.PROVIDER} (mock). Configure a real SSO provider in .env to enable.`
      });
    }

    // Find or create user from SSO data
    let user = await User.findOne({ email: ssoUser.email });
    if (!user) {
      user = await User.create({
        name: ssoUser.name,
        email: ssoUser.email,
        password: require('crypto').randomBytes(32).toString('hex'),
        status: 'active'
      });
      const empRole = await Role.findOne({ role_name: 'Employee' });
      if (empRole) await UserRole.create({ user_id: user._id, role_id: empRole._id });
      await Employee.create({ user_id: user._id });
    }

    const token = generateToken(user._id);
    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');

    res.json({
      message: 'SSO login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: userRole ? userRole.role_id.role_name : 'Employee'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, ssoLogin, ssoCallback };
