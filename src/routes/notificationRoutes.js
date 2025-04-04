// File: src/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  createTestNotification
} = require('../controllers/notificationController');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getUserNotifications);

router.route('/unread')
  .get(getUnreadNotifications);

router.route('/read-all')
  .put(markAllAsRead);

router.route('/:id/read')
  .put(markAsRead);

// Test route - only available in development
if (process.env.NODE_ENV !== 'production') {
  router.route('/test')
    .post(createTestNotification);
}

module.exports = router;
