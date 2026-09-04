const mongoose = require('mongoose');

const foodRecordSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingSession',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    preparedVeg: {
      type: Number,
      required: true,
      default: 0
    },
    preparedNonVeg: {
      type: Number,
      required: true,
      default: 0
    },
    preparedQuantity: {
      type: Number,
      required: true
    },
    servedVeg: {
      type: Number,
      default: 0
    },
    servedNonVeg: {
      type: Number,
      default: 0
    },
    servedQuantity: {
      type: Number,
      required: true,
      default: 0
    },
    remainingQuantity: {
      type: Number,
      default: 0
    },
    vegWaste: {
      type: Number,
      default: 0
    },
    nonVegWaste: {
      type: Number,
      default: 0
    },
    wastedQuantity: {
      type: Number,
      required: true,
      default: 0
    },
    wastePercentage: {
      type: Number,
      required: true,
      default: 0
    },
    notes: {
      type: String,
      trim: true
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodRecord', foodRecordSchema);
