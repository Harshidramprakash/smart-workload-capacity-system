// services/user-service/routes/settingsRoutes.js
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getSettings);
router.put('/', authorize('Admin'), updateSettings);

module.exports = router;
