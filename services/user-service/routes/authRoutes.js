// services/user-service/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, ssoLogin, ssoCallback } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/sso/login', ssoLogin);
router.post('/sso/callback', ssoCallback);

module.exports = router;
