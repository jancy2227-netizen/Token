const mongoose = require('mongoose');

const bookingSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Sunday Special Feast'
    },
    weekOf: {
      type: String,
      required: true,
      trim: true
    },
    sundayDate: {
      type: Date,
      required: true
    },
    bookingOpen: {
      type: Date,
      required: true
    },
    bookingClose: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['upcoming', 'open', 'closed', 'completed'],
      default: 'open'
    },
    // Allows admin to explicitly open session for testing/demo regardless of calendar time
    isTestOverride: {
      type: Boolean,
      default: false
    },
    menuDetails: {
      vegItem: {
        type: String,
        default: 'Paneer Butter Masala, Jeera Rice, Dal Tadka, Butter Naan'
      },
      nonVegItem: {
        type: String,
        default: 'Hyderabadi Chicken Biryani, Mirchi Ka Salan, Raita, Boiled Egg'
      },
      dessert: {
        type: String,
        default: 'Gulab Jamun with Vanilla Ice Cream'
      },
      specialNotes: {
        type: String,
        default: 'Please carry your digital token or QR code to the mess counter.'
      }
    }
  },
  { timestamps: true }
);

// Helper virtual to check if booking window is currently active
bookingSessionSchema.virtual('isBookingActive').get(function () {
  if (this.status === 'closed' || this.status === 'completed') return false;
  if (this.isTestOverride) return true;
  const now = new Date();
  return now >= this.bookingOpen && now <= this.bookingClose;
});

bookingSessionSchema.set('toJSON', { virtuals: true });
bookingSessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BookingSession', bookingSessionSchema);
