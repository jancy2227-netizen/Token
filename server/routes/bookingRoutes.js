const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  updateBookingMeal,
  cancelBooking,
  getAllBookings,
  serveBooking,
  getBookingByToken
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validateBookingDeadline } = require('../middleware/validateDeadline');

// Student endpoints
router.post('/', protect, authorize('student'), validateBookingDeadline, createBooking);
router.get('/my', protect, authorize('student'), getMyBookings);
router.put('/:id', protect, authorize('student'), validateBookingDeadline, updateBookingMeal);
router.delete('/:id', protect, authorize('student'), validateBookingDeadline, cancelBooking);

// Warden / Admin endpoints
router.get('/', protect, authorize('warden', 'admin'), getAllBookings);
router.put('/:id/serve', protect, authorize('warden', 'admin'), serveBooking);
router.get('/token/:token', protect, authorize('warden', 'admin'), getBookingByToken);

module.exports = router;
