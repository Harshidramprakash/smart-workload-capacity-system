// services/notification-service/server.js - Notification Service Entry Point
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectDB = require('../../shared/config/db');
const errorHandler = require('../../shared/middleware/errorHandler');

connectDB('Notification Service');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'Notification Service' }));
app.use(errorHandler);

const PORT = process.env.PORT_NOTIFICATION_SERVICE || 5006;
app.listen(PORT, () => console.log(`[Notification Service] Running on port ${PORT}`));

module.exports = app;
