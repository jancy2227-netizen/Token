const BookingSession = require('../models/BookingSession');
const Booking = require('../models/Booking');

/**
 * Validates that the targeted session is currently within its booking window
 * (Saturday 6:00 PM - 9:00 PM, or isTestOverride = true)
 */
const validateBookingDeadline = async (req, res, next) => {
  try {
    let sessionId = req.body.sessionId;

    // If modifying or cancelling, get sessionId from existing booking
    if (!sessionId && req.params.id) {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found.'
        });
      }

      // Check if already served
      if (booking.served) {
        return res.status(400).json({
          success: false,
          message: 'This meal has already been served and cannot be modified or cancelled.'
        });
      }

      sessionId = booking.sessionId;
      req.existingBooking = booking;
    }

    let session;
    if (sessionId) {
      session = await BookingSession.findById(sessionId);
    } else {
      // Find current active or latest session
      session = await BookingSession.findOne({ status: { $in: ['open', 'upcoming'] } }).sort({ sundayDate: 1 });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active booking session found for Sunday meal.'
      });
    }

    req.session = session;

    // Check if admin override is enabled for live demo testing
    if (session.isTestOverride) {
      return next();
    }

    if (session.status === 'closed' || session.status === 'completed') {
      return res.status(403).json({
        success: false,
        message: 'Booking session is officially closed. Pre-bookings for this Sunday have ended.'
      });
    }

    const now = new Date();

    if (now < new Date(session.bookingOpen)) {
      const openTimeFormatted = new Date(session.bookingOpen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return res.status(403).json({
        success: false,
        message: `Booking window has not opened yet. Booking opens on Saturday at ${openTimeFormatted}.`
      });
    }

    if (now > new Date(session.bookingClose)) {
      const closeTimeFormatted = new Date(session.bookingClose).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return res.status(403).json({
        success: false,
        message: `Booking deadline passed (${closeTimeFormatted} Saturday cutoff). No new bookings or changes permitted.`
      });
    }

    next();
  } catch (error) {
    console.error('Error validating booking deadline:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate booking window deadline.'
    });
  }
};

module.exports = { validateBookingDeadline };
