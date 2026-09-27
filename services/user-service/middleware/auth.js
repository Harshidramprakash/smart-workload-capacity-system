// services/user-service/middleware/auth.js - JWT Authentication Middleware
const jwt = require('jsonwebtoken');
const User = require('../../../shared/models/User');
const UserRole = require('../../../shared/models/UserRole');

/**
 * Protect routes - Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized. User not found.' });
    }

    if (user.status === 'inactive') {
      return res.status(401).json({ message: 'Account is disabled. Contact admin.' });
    }

    // Get user's role
    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');

    // Attach user and role to request
    req.user = user;
    req.userRole = userRole ? userRole.role_id.role_name : null;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized. Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized. Token expired.' });
    }
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
};

/**
 * Authorize by role - Check if user has required role
 * @param  {...string} roles - Allowed role names
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        message: `Access denied. Role '${req.userRole}' is not authorized for this action.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
