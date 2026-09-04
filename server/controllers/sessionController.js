const BookingSession = require('../models/BookingSession');
const Booking = require('../models/Booking');

// @desc    Get current/upcoming booking session
// @route   GET /api/sessions/current
// @access  Public
const getCurrentSession = async (req, res, next) => {
  try {
    let session = await BookingSession.findOne({
      status: { $in: ['open', 'upcoming'] }
    }).sort({ sundayDate: 1 });

    if (!session) {
      // Fallback to latest session
      session = await BookingSession.findOne().sort({ sundayDate: -1 });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No booking session found. Please contact mess administrator.'
      });
    }

    const now = new Date();
    const openTime = new Date(session.bookingOpen);
    const closeTime = new Date(session.bookingClose);

    let windowStatus = 'closed';
    let countdownTarget = null;
    let isBookingAllowed = false;

    if (session.isTestOverride) {
      windowStatus = 'open';
      isBookingAllowed = true;
      countdownTarget = closeTime;
    } else if (now < openTime) {
      windowStatus = 'upcoming';
      isBookingAllowed = false;
      countdownTarget = openTime;
    } else if (now >= openTime && now <= closeTime) {
      windowStatus = 'open';
      isBookingAllowed = true;
      countdownTarget = closeTime;
    } else {
      windowStatus = 'closed';
      isBookingAllowed = false;
      countdownTarget = null;
    }

    // Live counts for this session
    const [totalBookings, vegBookings, nonVegBookings, servedBookings] = await Promise.all([
      Booking.countDocuments({ sessionId: session._id, status: { $in: ['confirmed', 'used'] } }),
      Booking.countDocuments({ sessionId: session._id, status: { $in: ['confirmed', 'used'] }, mealType: 'veg' }),
      Booking.countDocuments({ sessionId: session._id, status: { $in: ['confirmed', 'used'] }, mealType: 'non-veg' }),
      Booking.countDocuments({ sessionId: session._id, $or: [{ served: true }, { status: 'used' }] })
    ]);

    res.status(200).json({
      success: true,
      session,
      windowStatus,
      isBookingAllowed,
      countdownTarget,
      stats: {
        totalBookings,
        vegBookings,
        nonVegBookings,
        servedBookings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all booking sessions
// @route   GET /api/sessions
// @access  Private (Warden / Admin)
const getAllSessions = async (req, res, next) => {
  try {
    const sessions = await BookingSession.find().sort({ sundayDate: -1 });

    // Attach summary stats to each session
    const enrichedSessions = await Promise.all(
      sessions.map(async (s) => {
        const [total, veg, nonVeg, served] = await Promise.all([
          Booking.countDocuments({ sessionId: s._id, status: { $in: ['confirmed', 'used'] } }),
          Booking.countDocuments({ sessionId: s._id, status: { $in: ['confirmed', 'used'] }, mealType: 'veg' }),
          Booking.countDocuments({ sessionId: s._id, status: { $in: ['confirmed', 'used'] }, mealType: 'non-veg' }),
          Booking.countDocuments({ sessionId: s._id, $or: [{ served: true }, { status: 'used' }] })
        ]);
        return {
          ...s.toObject(),
          totalBookings: total,
          vegBookings: veg,
          nonVegBookings: nonVeg,
          servedBookings: served
        };
      })
    );

    res.status(200).json({
      success: true,
      sessions: enrichedSessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new booking session
// @route   POST /api/sessions
// @access  Private (Admin)
const createSession = async (req, res, next) => {
  try {
    const {
      title,
      weekOf,
      sundayDate,
      bookingOpen,
      bookingClose,
      status,
      menuDetails,
      isTestOverride
    } = req.body;

    if (!weekOf || !sundayDate || !bookingOpen || !bookingClose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide weekOf, sundayDate, bookingOpen, and bookingClose.'
      });
    }

    const session = await BookingSession.create({
      title: title || 'Sunday Special Feast',
      weekOf,
      sundayDate: new Date(sundayDate),
      bookingOpen: new Date(bookingOpen),
      bookingClose: new Date(bookingClose),
      status: status || 'open',
      menuDetails: menuDetails || undefined,
      isTestOverride: Boolean(isTestOverride)
    });

    res.status(201).json({
      success: true,
      message: 'New booking session created successfully!',
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a booking session
// @route   PUT /api/sessions/:id
// @access  Private (Admin)
const updateSession = async (req, res, next) => {
  try {
    const session = await BookingSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const {
      title,
      weekOf,
      sundayDate,
      bookingOpen,
      bookingClose,
      status,
      menuDetails,
      isTestOverride
    } = req.body;

    if (title) session.title = title;
    if (weekOf) session.weekOf = weekOf;
    if (sundayDate) session.sundayDate = new Date(sundayDate);
    if (bookingOpen) session.bookingOpen = new Date(bookingOpen);
    if (bookingClose) session.bookingClose = new Date(bookingClose);
    if (status) session.status = status;
    if (menuDetails) session.menuDetails = { ...session.menuDetails, ...menuDetails };
    if (isTestOverride !== undefined) session.isTestOverride = Boolean(isTestOverride);

    await session.save();

    res.status(200).json({
      success: true,
      message: 'Booking session updated successfully!',
      session
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset or advance to next week's session
// @route   POST /api/sessions/:id/reset
// @access  Private (Admin)
const resetSession = async (req, res, next) => {
  try {
    const session = await BookingSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Mark old session as completed without deleting bookings
    session.status = 'completed';
    session.isTestOverride = false;
    await session.save();

    // Calculate dates for the subsequent week
    const currentSunday = new Date(session.sundayDate);
    const nextSunday = new Date(currentSunday);
    nextSunday.setDate(currentSunday.getDate() + 7);

    const nextSatOpen = new Date(nextSunday);
    nextSatOpen.setDate(nextSunday.getDate() - 1);
    nextSatOpen.setHours(18, 0, 0, 0); // 6:00 PM

    const nextSatClose = new Date(nextSatOpen);
    nextSatClose.setHours(21, 0, 0, 0); // 9:00 PM

    const weekNum = parseInt(session.weekOf.replace(/[^0-9]/g, ''), 10) + 1 || 37;

    const newSession = await BookingSession.create({
      title: 'Sunday Special Feast',
      weekOf: `2026-W${weekNum}`,
      sundayDate: nextSunday,
      bookingOpen: nextSatOpen,
      bookingClose: nextSatClose,
      status: 'open',
      isTestOverride: false,
      menuDetails: session.menuDetails
    });

    res.status(201).json({
      success: true,
      message: `Previous session marked completed. New session created for Sunday, ${nextSunday.toDateString()}!`,
      session: newSession
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentSession,
  getAllSessions,
  createSession,
  updateSession,
  resetSession
};
