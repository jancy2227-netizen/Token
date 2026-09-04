const express = require('express');
const router = express.Router();
const {
  generatePrediction,
  getLatestPrediction
} = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.post('/', protect, authorize('warden', 'admin'), generatePrediction);
router.get('/latest', protect, authorize('warden', 'admin'), getLatestPrediction);

module.exports = router;
