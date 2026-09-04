const express = require('express');
const router = express.Router();
const {
  getCurrentSession,
  getAllSessions,
  createSession,
  updateSession,
  resetSession
} = require('../controllers/sessionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/current', getCurrentSession);
router.get('/', protect, authorize('warden', 'admin'), getAllSessions);
router.post('/', protect, authorize('admin'), createSession);
router.put('/:id', protect, authorize('admin'), updateSession);
router.post('/:id/reset', protect, authorize('admin'), resetSession);

module.exports = router;
