// services/user-service/controllers/settingsController.js
const SystemSetting = require('../../../shared/models/SystemSetting');

const getSettings = async (req, res, next) => {
  try { res.json(await SystemSetting.find()); } catch (error) { next(error); }
};

const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ message: 'Settings array is required.' });
    }
    for (const s of settings) {
      await SystemSetting.findOneAndUpdate({ key: s.key }, { value: s.value, description: s.description || '' }, { upsert: true });
    }
    const updated = await SystemSetting.find();
    res.json({ message: 'Settings updated successfully.', settings: updated });
  } catch (error) { next(error); }
};

module.exports = { getSettings, updateSettings };
