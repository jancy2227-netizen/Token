const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected.');
      return;
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('MONGODB_URI environment variable is not set.');
      process.exit(1);
    }

    try {
      console.log('Connecting to configured MongoDB...');

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
      });

      console.log('MongoDB connected successfully via MONGODB_URI.');
      return;
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();

    if (mongod) {
      await mongod.stop();
      mongod = null;
    }

    console.log('MongoDB disconnected.');
  } catch (error) {
    console.error('Error disconnecting database:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
