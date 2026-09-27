// controllers/settingsController.js - System Settings Controller
const SystemSetting = require('../models/SystemSetting');

/**
 * GET /api/settings - Get all system settings
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings - Update system settings (Admin only)
 */
const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body; // Array of { key, value, description }
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings array is required.' });
    }

    for (const s of settings) {
      await SystemSetting.findOneAndUpdate(
        { key: s.key },
        { value: s.value, description: s.description || '' },
        { upsert: true }
      );
    }

    const updated = await SystemSetting.find();
    res.json({ message: 'Settings updated successfully.', settings: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
