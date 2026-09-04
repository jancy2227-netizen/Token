const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingSession',
      required: true
    },
    predictedVeg: {
      type: Number,
      required: true
    },
    predictedNonVeg: {
      type: Number,
      required: true
    },
    totalPrediction: {
      type: Number,
      required: true
    },
    recommendedVeg: {
      type: Number,
      required: true
    },
    recommendedNonVeg: {
      type: Number,
      required: true
    },
    totalRecommended: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      default: 0.91
    },
    algorithmUsed: {
      type: String,
      default: 'ML Trend Regression with Adaptive Buffer'
    },
    featuresInput: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    estimatedWasteReductionPercentage: {
      type: Number,
      default: 32.5
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Prediction', predictionSchema);
