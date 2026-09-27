// services/notification-service/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getNotifications,
  createNotificationHandler,
  markReadHandler,
  markAllReadHandler,
  getUnreadCountHandler
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getNotifications);
router.post('/', createNotificationHandler);
router.get('/unread-count', getUnreadCountHandler);
router.put('/read-all', markAllReadHandler);
router.put('/:id/read', markReadHandler);

module.exports = router;
