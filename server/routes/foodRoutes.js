const express = require('express');
const router = express.Router();
const {
  createFoodRecord,
  getFoodRecords,
  updateFoodRecord
} = require('../controllers/foodController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.post('/', protect, authorize('warden', 'admin'), createFoodRecord);
router.get('/', protect, authorize('warden', 'admin'), getFoodRecords);
router.put('/:id', protect, authorize('admin'), updateFoodRecord);

module.exports = router;
