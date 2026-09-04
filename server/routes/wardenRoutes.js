const express = require('express');
const router = express.Router();
const {
  getWardens,
  createWarden,
  deleteWarden
} = require('../controllers/wardenController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, authorize('admin'), getWardens);
router.post('/', protect, authorize('admin'), createWarden);
router.delete('/:id', protect, authorize('admin'), deleteWarden);

module.exports = router;
