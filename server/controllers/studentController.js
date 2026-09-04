const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Admin / Warden)
const getStudents = async (req, res, next) => {
  try {
    const { search, department, year } = req.query;
    const query = { role: 'student' };

    if (department) query.department = department;
    if (year) query.year = year;

    let students = await User.find(query).select('-password').sort({ rollNumber: 1 });

    if (search && search.trim() !== '') {
      const s = search.toLowerCase().trim();
      students = students.filter(
        (st) =>
          st.name.toLowerCase().includes(s) ||
          st.rollNumber.toLowerCase().includes(s) ||
          (st.roomNumber && st.roomNumber.toLowerCase().includes(s)) ||
          st.email.toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student by ID with full booking stats
// @route   GET /api/students/:id
// @access  Private (Admin / Warden)
const getStudentById = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const bookings = await Booking.find({ studentId: student._id })
      .populate('sessionId')
      .sort({ bookedAt: -1 });

    const totalBookings = bookings.length;
    const servedMeals = bookings.filter((b) => b.served).length;
    const cancelledMeals = bookings.filter((b) => b.status === 'cancelled').length;

    res.status(200).json({
      success: true,
      student,
      stats: {
        totalBookings,
        servedMeals,
        cancelledMeals
      },
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin)
const updateStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const { name, email, rollNumber, roomNumber, department, year, phone, mealPreference, isActive } = req.body;

    if (name) student.name = name;
    if (email) student.email = email.toLowerCase();
    if (rollNumber) student.rollNumber = rollNumber.toUpperCase();
    if (roomNumber) student.roomNumber = roomNumber;
    if (department) student.department = department;
    if (year) student.year = year;
    if (phone) student.phone = phone;
    if (mealPreference) student.mealPreference = mealPreference;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student record updated successfully',
      student
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    await Booking.deleteMany({ studentId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Student and associated bookings removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
};
