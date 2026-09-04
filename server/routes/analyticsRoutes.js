const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getBookingTrends,
  getWasteAnalytics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/dashboard', protect, authorize('warden', 'admin'), getDashboardAnalytics);
router.get('/bookings', protect, authorize('warden', 'admin'), getBookingTrends);
router.get('/waste', protect, authorize('warden', 'admin'), getWasteAnalytics);

module.exports = router;
