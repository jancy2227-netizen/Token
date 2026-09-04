const Booking = require('../models/Booking');
const BookingSession = require('../models/BookingSession');
const Notification = require('../models/Notification');
const QRCode = require('qrcode');

// Helper to generate unique digital mess token (e.g. SM-2026-000145)
const generateTokenNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await Booking.countDocuments();
  const sequence = String(count + 1).padStart(6, '0');
  const token = `SM-${currentYear}-${sequence}`;
  return token;
};

// @desc    Pre-book Sunday meal
// @route   POST /api/bookings
// @access  Private (Student)
const createBooking = async (req, res, next) => {
  try {
    const { mealType, sessionId } = req.body;
    const studentId = req.user.id;

    if (!mealType || !['veg', 'non-veg'].includes(mealType)) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a valid meal type (veg or non-veg).'
      });
    }

    // Determine target session
    let session = req.session;
    if (!session && sessionId) {
      session = await BookingSession.findById(sessionId);
    }
    if (!session) {
      session = await BookingSession.findOne({ status: { $in: ['open', 'upcoming'] } }).sort({ sundayDate: 1 });
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active booking session found for Sunday meal.'
      });
    }

    // Check if student already has a booking for this session
    const existingBooking = await Booking.findOne({
      studentId,
      sessionId: session._id
    });

    if (existingBooking) {
      if (existingBooking.status === 'cancelled') {
        // Allow re-activating cancelled booking before deadline
        existingBooking.status = 'confirmed';
        existingBooking.mealType = mealType;
        existingBooking.cancelledAt = null;
        await existingBooking.save();

        // Create notification
        await Notification.create({
          userId: studentId,
          title: 'Sunday Meal Re-booked',
          message: `Your ${mealType.toUpperCase()} meal has been re-booked for Sunday (${new Date(session.sundayDate).toLocaleDateString()}). Token: ${existingBooking.tokenNumber}`,
          type: 'success'
        });

        return res.status(200).json({
          success: true,
          message: `Booking re-confirmed for ${mealType.toUpperCase()} meal!`,
          booking: existingBooking
        });
      }

      return res.status(400).json({
        success: false,
        message: 'You have already booked a meal for this Sunday session. View your active token on your dashboard.'
      });
    }

    // Generate unique token number
    let tokenNumber = await generateTokenNumber();
    // Safety check for uniqueness
    while (await Booking.findOne({ tokenNumber })) {
      const randSuffix = Math.floor(100000 + Math.random() * 900000);
      tokenNumber = `SM-${new Date().getFullYear()}-${randSuffix}`;
    }

    // Generate QR Code Data payload
    const qrPayload = JSON.stringify({
      token: tokenNumber,
      studentId: req.user._id,
      rollNumber: req.user.rollNumber,
      name: req.user.name,
      mealType,
      sundayDate: session.sundayDate
    });

    const qrCodeData = await QRCode.toDataURL(qrPayload);

    const booking = await Booking.create({
      studentId,
      sessionId: session._id,
      mealType,
      tokenNumber,
      qrCodeData,
      status: 'confirmed',
      served: false,
      bookedAt: new Date()
    });

    // Populate details
    await booking.populate('sessionId');

    // Create notification
    await Notification.create({
      userId: studentId,
      title: 'Sunday Meal Booked Successfully',
      message: `Your ${mealType.toUpperCase()} meal for Sunday is confirmed. Digital Token: ${tokenNumber}`,
      type: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Sunday meal booked successfully! Digital token generated.',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's bookings and active token
// @route   GET /api/bookings/my
// @access  Private (Student)
const getMyBookings = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const bookings = await Booking.find({ studentId })
      .populate('sessionId')
      .sort({ bookedAt: -1 });

    // Identify current active/upcoming booking
    const activeBooking = bookings.find(
      (b) =>
        ['confirmed', 'used', 'verified'].includes(b.status) &&
        b.sessionId &&
        new Date(b.sessionId.sundayDate) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    res.status(200).json({
      success: true,
      activeBooking: activeBooking || null,
      history: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update meal type (Veg <-> Non-Veg) before deadline
// @route   PUT /api/bookings/:id
// @access  Private (Student)
const updateBookingMeal = async (req, res, next) => {
  try {
    const { mealType } = req.body;
    const booking = req.existingBooking || (await Booking.findById(req.params.id));

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.studentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this booking.' });
    }

    if (booking.served) {
      return res.status(400).json({
        success: false,
        message: 'This meal has already been served and cannot be changed.'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is cancelled. Please re-book instead.'
      });
    }

    if (!mealType || !['veg', 'non-veg'].includes(mealType)) {
      return res.status(400).json({
        success: false,
        message: 'Please choose either veg or non-veg.'
      });
    }

    const prevMeal = booking.mealType;
    booking.mealType = mealType;

    // Update QR code payload with new meal type
    const qrPayload = JSON.stringify({
      token: booking.tokenNumber,
      studentId: req.user._id,
      rollNumber: req.user.rollNumber,
      name: req.user.name,
      mealType,
      updatedAt: new Date()
    });
    booking.qrCodeData = await QRCode.toDataURL(qrPayload);

    await booking.save();
    await booking.populate('sessionId');

    // Notify student
    await Notification.create({
      userId: req.user.id,
      title: 'Meal Preference Changed',
      message: `Your meal preference changed from ${prevMeal.toUpperCase()} to ${mealType.toUpperCase()}.`,
      type: 'info'
    });

    res.status(200).json({
      success: true,
      message: `Meal updated to ${mealType.toUpperCase()} successfully!`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking before deadline
// @route   DELETE /api/bookings/:id
// @access  Private (Student)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = req.existingBooking || (await Booking.findById(req.params.id));

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.studentId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking.' });
    }

    if (booking.served) {
      return res.status(400).json({
        success: false,
        message: 'Meal already served. It cannot be cancelled.'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled.'
      });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    await Notification.create({
      userId: req.user.id,
      title: 'Booking Cancelled',
      message: `Your Sunday meal booking (${booking.tokenNumber}) has been cancelled.`,
      type: 'warning'
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings with filtering & search (Warden / Admin)
// @route   GET /api/bookings
// @access  Private (Warden / Admin)
const getAllBookings = async (req, res, next) => {
  try {
    const {
      sessionId,
      search,
      mealType,
      status,
      served,
      page = 1,
      limit = 100
    } = req.query;

    const query = {};

    if (sessionId) {
      query.sessionId = sessionId;
    } else {
      // Default to current/latest session
      const currentSession = await BookingSession.findOne({
        status: { $in: ['open', 'upcoming'] }
      }).sort({ sundayDate: 1 });

      if (currentSession) {
        query.sessionId = currentSession._id;
      }
    }

    if (mealType && ['veg', 'non-veg'].includes(mealType)) {
      query.mealType = mealType;
    }

    if (status && status !== 'all') {
      const s = status.toLowerCase();
      if (s === 'used' || s === 'served') {
        query.$or = [{ served: true }, { status: 'used' }];
      } else if (s === 'verified') {
        query.$or = [{ served: true }, { status: 'used' }, { status: 'verified' }];
      } else if (s === 'pending') {
        query.status = 'confirmed';
        query.served = false;
      } else if (s === 'booked') {
        query.status = { $in: ['confirmed', 'used'] };
      } else {
        query.status = status;
      }
    }

    if (served !== undefined && served !== '') {
      query.served = served === 'true';
    }

    let bookingsQuery = Booking.find(query)
      .populate('studentId', 'name rollNumber roomNumber department year phone email')
      .populate('sessionId')
      .populate('servedBy', 'name role')
      .sort({ bookedAt: -1 });

    let bookings = await bookingsQuery;

    // Filter by student search query if provided (name, rollNumber, roomNumber, token)
    if (search && search.trim() !== '') {
      const s = search.toLowerCase().trim();
      bookings = bookings.filter((b) => {
        const student = b.studentId || {};
        return (
          (b.tokenNumber && b.tokenNumber.toLowerCase().includes(s)) ||
          (student.name && student.name.toLowerCase().includes(s)) ||
          (student.rollNumber && student.rollNumber.toLowerCase().includes(s)) ||
          (student.roomNumber && student.roomNumber.toLowerCase().includes(s))
        );
      });
    }

    // Compute live counters for the filtered session
    const statsQuery = query.sessionId ? { sessionId: query.sessionId } : {};
    const [
      totalBooked,
      vegCount,
      nonVegCount,
      servedCount,
      pendingCount,
      cancelledCount
    ] = await Promise.all([
      Booking.countDocuments({ ...statsQuery, status: { $in: ['confirmed', 'used'] } }),
      Booking.countDocuments({ ...statsQuery, status: { $in: ['confirmed', 'used'] }, mealType: 'veg' }),
      Booking.countDocuments({ ...statsQuery, status: { $in: ['confirmed', 'used'] }, mealType: 'non-veg' }),
      Booking.countDocuments({ ...statsQuery, $or: [{ served: true }, { status: 'used' }] }),
      Booking.countDocuments({ ...statsQuery, status: 'confirmed', served: false }),
      Booking.countDocuments({ ...statsQuery, status: 'cancelled' })
    ]);

    res.status(200).json({
      success: true,
      count: bookings.length,
      stats: {
        totalBooked,
        pendingCount,
        verifiedCount: servedCount, // Tokens verified & processed
        usedCount: servedCount,     // Tokens redeemed
        cancelledCount,             // Cancelled bookings
        servedCount,                // Total meals served
        vegCount,
        nonVegCount
      },
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark meal as served by Warden
// @route   PUT /api/bookings/:id/serve
// @access  Private (Warden / Admin)
const serveBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('studentId', 'name rollNumber roomNumber email')
      .populate('sessionId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot serve meal for a cancelled booking.'
      });
    }

    if (booking.served || booking.status === 'used') {
      return res.status(400).json({
        success: false,
        message: `Meal already served on ${new Date(booking.servedAt).toLocaleTimeString()}! Duplicate meal collection prevented.`,
        servedAt: booking.servedAt
      });
    }

    booking.served = true;
    booking.status = 'used';
    booking.servedAt = new Date();
    booking.servedBy = req.user.id;
    await booking.save();

    // Create notification for student
    if (booking.studentId && booking.studentId._id) {
      await Notification.create({
        userId: booking.studentId._id,
        title: 'Meal Served',
        message: `Your ${booking.mealType.toUpperCase()} meal has been marked as served at the mess counter. Enjoy your meal!`,
        type: 'success'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token verified successfully. Meal marked as served.',
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking details by Token code (Warden Quick Scan / Input)
// @route   GET /api/bookings/token/:token
// @access  Private (Warden / Admin)
const getBookingByToken = async (req, res, next) => {
  try {
    const rawToken = req.params.token.trim();
    if (!rawToken) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid token number.'
      });
    }

    // Try exact or case-insensitive match
    const tokenRegex = new RegExp(`^${rawToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    let booking = await Booking.findOne({
      $or: [
        { tokenNumber: rawToken.toUpperCase() },
        { tokenNumber: tokenRegex }
      ]
    })
      .populate('studentId', 'name rollNumber roomNumber department year phone email')
      .populate('sessionId')
      .populate('servedBy', 'name role');

    // Fallback: search if user typed a numeric suffix or substring
    if (!booking && rawToken.length >= 3) {
      booking = await Booking.findOne({
        tokenNumber: new RegExp(rawToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
      })
        .populate('studentId', 'name rollNumber roomNumber department year phone email')
        .populate('sessionId')
        .populate('servedBy', 'name role');
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No valid booking found with token number: ${rawToken}`
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  updateBookingMeal,
  cancelBooking,
  getAllBookings,
  serveBooking,
  getBookingByToken
};
