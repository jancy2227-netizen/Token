require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const foodRoutes = require('./routes/foodRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const wardenRoutes = require('./routes/wardenRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Connect to Database and auto-seed if empty
connectDB().then(async () => {
  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('Database empty on start, initializing demo seed data...');
    try {
      const { seedData } = require('./seed');
      await seedData();
    } catch (e) {
      console.log('Auto-seed note:', e.message);
    }
  }
});

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// API Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Hostel Mess API is running normally.',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/wardens', wardenRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` SMART HOSTEL MESS SERVER RUNNING ON PORT ${PORT} `);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

module.exports = { app, server };
