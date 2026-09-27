// services/user-service/server.js - User Service Entry Point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../../shared/config/db');
const errorHandler = require('../../shared/middleware/errorHandler');

// Connect to MongoDB
connectDB('User Service');

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Shared auth middleware for this service
const { protect, authorize } = require('./middleware/auth');

// --- Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'User Service' });
});

// --- Error Handler ---
app.use(errorHandler);

// --- Start ---
const PORT = process.env.PORT_USER_SERVICE || 5001;
app.listen(PORT, () => {
  console.log(`[User Service] Running on port ${PORT}`);
});

module.exports = app;
