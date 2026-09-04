const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookingSession',
      required: true
    },
    mealType: {
      type: String,
      enum: ['veg', 'non-veg'],
      required: [true, 'Please select a meal preference (veg or non-veg)']
    },
    tokenNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    qrCodeData: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: [
        'confirmed',
        'cancelled',
        'used',
        'expired',
        'verified',
        'BOOKED',
        'VERIFIED',
        'USED',
        'CANCELLED',
        'EXPIRED'
      ],
      default: 'confirmed'
    },
    served: {
      type: Boolean,
      default: false
    },
    bookedAt: {
      type: Date,
      default: Date.now
    },
    servedAt: {
      type: Date
    },
    servedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cancelledAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Enforce single booking per student per session
bookingSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
