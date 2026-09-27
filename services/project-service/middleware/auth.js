// services/project-service/middleware/auth.js - Shared auth middleware
const jwt = require('jsonwebtoken');
const User = require('../../../shared/models/User');
const UserRole = require('../../../shared/models/UserRole');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ message: 'Not authorized. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Not authorized. User not found.' });
    if (user.status === 'inactive') return res.status(401).json({ message: 'Account is disabled.' });

    const userRole = await UserRole.findOne({ user_id: user._id }).populate('role_id');
    req.user = user;
    req.userRole = userRole ? userRole.role_id.role_name : null;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token.' });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired.' });
    return res.status(500).json({ message: 'Server error during authentication.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.userRole || !roles.includes(req.userRole)) {
    return res.status(403).json({ message: `Access denied. Role '${req.userRole}' is not authorized.` });
  }
  next();
};

module.exports = { protect, authorize };
