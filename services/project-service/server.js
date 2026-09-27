// services/project-service/server.js - Project Service Entry Point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../../shared/config/db');
const errorHandler = require('../../shared/middleware/errorHandler');

connectDB('Project Service');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/sprints', require('./routes/sprintRoutes'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Project Service' }));
app.use(errorHandler);

const PORT = process.env.PORT_PROJECT_SERVICE || 5002;
app.listen(PORT, () => console.log(`[Project Service] Running on port ${PORT}`));
module.exports = app;
