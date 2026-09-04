const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'warden', 'admin'],
      default: 'student'
    },
    // Student specific fields
    rollNumber: {
      type: String,
      sparse: true,
      uppercase: true,
      trim: true
    },
    roomNumber: {
      type: String,
      trim: true
    },
    department: {
      type: String,
      trim: true,
      default: 'Computer Science & Engineering'
    },
    year: {
      type: String,
      trim: true,
      default: '3rd Year'
    },
    phone: {
      type: String,
      trim: true
    },
    mealPreference: {
      type: String,
      enum: ['veg', 'non-veg'],
      default: 'veg'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
