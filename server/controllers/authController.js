const User = require('../models/User');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hostel_mess_secret_jwt_key_2026', {
    expiresIn: '7d'
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      rollNumber,
      roomNumber,
      department,
      year,
      phone,
      mealPreference
    } = req.body;

    if (!name || !email || !password || !rollNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and roll number.'
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { rollNumber: rollNumber.toUpperCase() }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A student with this email or roll number is already registered.'
      });
    }

    const student = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'student',
      rollNumber: rollNumber.toUpperCase(),
      roomNumber,
      department: department || 'Computer Science & Engineering',
      year: year || '3rd Year',
      phone,
      mealPreference: mealPreference || 'veg'
    });

    const token = generateToken(student._id);

    res.status(201).json({
      success: true,
      message: 'Student registration successful!',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        rollNumber: student.rollNumber,
        roomNumber: student.roomNumber,
        department: student.department,
        year: student.year,
        mealPreference: student.mealPreference
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Student / Warden / Admin)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email and password.'
      });
    }

    // Check user with password selected
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No user found with this email.'
      });
    }

    // Check role if specified
    if (role && user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account found, but role is '${user.role}' rather than '${role}'. Please use the correct login tab.`
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        roomNumber: user.roomNumber,
        department: user.department,
        year: user.year,
        mealPreference: user.mealPreference
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile & booking stats
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let stats = {
      totalBookings: 0,
      servedMeals: 0,
      cancelledMeals: 0
    };

    if (user.role === 'student') {
      const [total, served, cancelled] = await Promise.all([
        Booking.countDocuments({ studentId: user._id }),
        Booking.countDocuments({ studentId: user._id, served: true }),
        Booking.countDocuments({ studentId: user._id, status: 'cancelled' })
      ]);
      stats = { totalBookings: total, servedMeals: served, cancelledMeals: cancelled };
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        roomNumber: user.roomNumber,
        department: user.department,
        year: user.year,
        phone: user.phone,
        mealPreference: user.mealPreference,
        createdAt: user.createdAt,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { roomNumber, department, year, phone, mealPreference, name } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (roomNumber) user.roomNumber = roomNumber;
    if (department) user.department = department;
    if (year) user.year = year;
    if (phone) user.phone = phone;
    if (mealPreference) user.mealPreference = mealPreference;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        roomNumber: user.roomNumber,
        department: user.department,
        year: user.year,
        phone: user.phone,
        mealPreference: user.mealPreference
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStudent,
  login,
  getMe,
  updateProfile
};
