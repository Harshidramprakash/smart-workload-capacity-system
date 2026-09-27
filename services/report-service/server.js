// services/report-service/server.js - Report Service Entry Point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../../shared/config/db');
const errorHandler = require('../../shared/middleware/errorHandler');

connectDB('Report Service');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/reports', require('./routes/reportRoutes'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Report Service' }));
app.use(errorHandler);

const PORT = process.env.PORT_REPORT_SERVICE || 5005;
app.listen(PORT, () => console.log(`[Report Service] Running on port ${PORT}`));

module.exports = app;
