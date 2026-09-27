// services/capacity-service/server.js - Capacity Analysis Service Entry Point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../../shared/config/db');
const errorHandler = require('../../shared/middleware/errorHandler');

connectDB('Capacity Service');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/capacity', require('./routes/capacityRoutes'));
app.use('/api/availability', require('./routes/availabilityRoutes'));
app.use('/api/workload', require('./routes/workloadRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Capacity Service' }));
app.use(errorHandler);

const PORT = process.env.PORT_CAPACITY_SERVICE || 5004;
app.listen(PORT, () => console.log(`[Capacity Service] Running on port ${PORT}`));
module.exports = app;
