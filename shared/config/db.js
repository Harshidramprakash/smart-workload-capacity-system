// shared/config/db.js - MongoDB Connection Configuration
const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @param {string} serviceName - Name of the service connecting
 */
const connectDB = async (serviceName = 'Service') => {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[${serviceName}] FATAL: MONGO_URI is missing in production.`);
      process.exit(1);
    }
    // Fallback for local development
    uri = 'mongodb://127.0.0.1:27017/smart_workload';
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    // Register all shared schemas in Mongoose memory to enable cross-model population
    require('../models');
    console.log(`[${serviceName}] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[${serviceName}] MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.error(`[${serviceName}] Note: Start MongoDB or provide Atlas MONGO_URI in .env for persistent database operations.`);
  }
};

module.exports = connectDB;
