// gateway/server.js - API Gateway Entry Point
// Routes all requests to appropriate microservices after authentication
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

// Load environment variables from root .env
dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();

// --- Middleware ---
app.use(cors());
app.use(morgan('dev'));

// Service URLs
const SERVICES = {
  user: `http://localhost:${process.env.PORT_USER_SERVICE || 5001}`,
  project: `http://localhost:${process.env.PORT_PROJECT_SERVICE || 5002}`,
  task: `http://localhost:${process.env.PORT_TASK_SERVICE || 5003}`,
  capacity: `http://localhost:${process.env.PORT_CAPACITY_SERVICE || 5004}`,
  report: `http://localhost:${process.env.PORT_REPORT_SERVICE || 5005}`,
  notification: `http://localhost:${process.env.PORT_NOTIFICATION_SERVICE || 5006}`
};

/**
 * JWT Authentication Middleware for the Gateway
 * Validates token and forwards user info to services via headers
 */
const gatewayAuth = (req, res, next) => {
  // Skip auth for login, register, health endpoints
  const publicPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/sso', '/api/health', '/api/reports/download'];
  const fullPath = (req.originalUrl || req.url).split('?')[0];
  if (publicPaths.some(p => fullPath.startsWith(p) || req.path.startsWith(p) || req.path.startsWith(p.replace('/api', '')))) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Forward decoded user ID to downstream services
    req.headers['x-user-id'] = decoded.id;
    req.headers['x-auth-token'] = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized. Token expired.' });
    }
    return res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};

// Apply gateway auth to all /api routes
app.use('/api', gatewayAuth);

// --- Proxy Configuration ---
// Helper to create proxy options preserving full path to downstream microservices
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path, req) => req.originalUrl,
  onError: (err, req, res) => {
    console.error(`Proxy error to ${target}:`, err.message);
    res.status(502).json({ message: `Service temporarily unavailable. Target: ${target}` });
  }
});

// User Service Routes
app.use('/api/auth', createProxyMiddleware(proxyOptions(SERVICES.user)));
app.use('/api/users', createProxyMiddleware(proxyOptions(SERVICES.user)));
app.use('/api/roles', createProxyMiddleware(proxyOptions(SERVICES.user)));
app.use('/api/teams', createProxyMiddleware(proxyOptions(SERVICES.user)));
app.use('/api/settings', createProxyMiddleware(proxyOptions(SERVICES.user)));

// Project Service Routes
app.use('/api/projects', createProxyMiddleware(proxyOptions(SERVICES.project)));
app.use('/api/sprints', createProxyMiddleware(proxyOptions(SERVICES.project)));

// Task Service Routes
app.use('/api/tasks', createProxyMiddleware(proxyOptions(SERVICES.task)));
app.use('/api/assignments', createProxyMiddleware(proxyOptions(SERVICES.task)));

// Capacity Analysis Service Routes
app.use('/api/capacity', createProxyMiddleware(proxyOptions(SERVICES.capacity)));
app.use('/api/availability', createProxyMiddleware(proxyOptions(SERVICES.capacity)));
app.use('/api/workload', createProxyMiddleware(proxyOptions(SERVICES.capacity)));
app.use('/api/recommendations', createProxyMiddleware(proxyOptions(SERVICES.capacity)));

// Report Service Routes
app.use('/api/reports', createProxyMiddleware(proxyOptions(SERVICES.report)));

// Notification Service Routes
app.use('/api/notifications', createProxyMiddleware(proxyOptions(SERVICES.notification)));

// --- Gateway Health Check ---
app.get('/api/health', async (req, res) => {
  const serviceHealth = {};
  for (const [name, url] of Object.entries(SERVICES)) {
    try {
      const response = await fetch(`${url}/health`);
      serviceHealth[name] = response.ok ? 'UP' : 'DOWN';
    } catch {
      serviceHealth[name] = 'DOWN';
    }
  }
  res.json({
    status: 'OK',
    message: 'Smart Workload System API Gateway is running',
    services: serviceHealth
  });
});

// --- Start Gateway ---
const PORT = process.env.PORT_GATEWAY || 5000;
app.listen(PORT, () => {
  console.log(`\n=== API GATEWAY ===`);
  console.log(`Gateway running on port ${PORT}`);
  console.log(`Routing to services:`);
  for (const [name, url] of Object.entries(SERVICES)) {
    console.log(`  ${name}: ${url}`);
  }
  console.log(`==================\n`);
});

module.exports = app;
