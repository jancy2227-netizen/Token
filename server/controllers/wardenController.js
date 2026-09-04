const User = require('../models/User');

// @desc    Get all wardens
// @route   GET /api/wardens
// @access  Private (Admin)
const getWardens = async (req, res, next) => {
  try {
    const wardens = await User.find({ role: 'warden' }).select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: wardens.length,
      wardens
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new warden
// @route   POST /api/wardens
// @access  Private (Admin)
const createWarden = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password for warden.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const warden = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'warden',
      phone
    });

    res.status(201).json({
      success: true,
      message: 'Warden account created successfully',
      warden: {
        id: warden._id,
        name: warden.name,
        email: warden.email,
        role: warden.role,
        phone: warden.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete warden
// @route   DELETE /api/wardens/:id
// @access  Private (Admin)
const deleteWarden = async (req, res, next) => {
  try {
    const warden = await User.findById(req.params.id);
    if (!warden || warden.role !== 'warden') {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Warden account removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWardens,
  createWarden,
  deleteWarden
};
