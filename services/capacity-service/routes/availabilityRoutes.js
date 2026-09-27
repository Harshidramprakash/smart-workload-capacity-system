// services/capacity-service/routes/availabilityRoutes.js
const express = require('express');
const router = express.Router();
const { getAvailability, createAvailability, updateAvailability } = require('../controllers/availabilityController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getAvailability);
router.post('/', createAvailability);
router.put('/:id', updateAvailability);

module.exports = router;
