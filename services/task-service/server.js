// services/task-service/server.js - Task Service Entry Point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../../shared/config/db');
const errorHandler = require('../../shared/middleware/errorHandler');

connectDB('Task Service');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Task Service' }));
app.use(errorHandler);

const PORT = process.env.PORT_TASK_SERVICE || 5003;
app.listen(PORT, () => console.log(`[Task Service] Running on port ${PORT}`));
module.exports = app;
