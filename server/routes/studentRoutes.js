const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, authorize('warden', 'admin'), getStudents);
router.get('/:id', protect, authorize('warden', 'admin'), getStudentById);
router.put('/:id', protect, authorize('admin'), updateStudent);
router.delete('/:id', protect, authorize('admin'), deleteStudent);

module.exports = router;
