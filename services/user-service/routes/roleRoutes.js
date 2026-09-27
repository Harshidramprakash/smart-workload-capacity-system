// services/user-service/routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const { getRoles, createRole, updateRole } = require('../controllers/roleController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getRoles);
router.post('/', authorize('Admin'), createRole);
router.put('/:id', authorize('Admin'), updateRole);

module.exports = router;
