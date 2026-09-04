const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected.');
      return;
    }

    let mongoUri = process.env.MONGODB_URI;

    // If explicit URI provided, try connecting
    if (mongoUri) {
      try {
        console.log(`Connecting to configured MongoDB at ${mongoUri.split('@').pop()}...`);
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
        console.log(' MongoDB connected successfully via MONGODB_URI.');
        return;
      } catch (err) {
        console.warn(`! Failed to connect to configured MongoDB (${err.message}). Initializing embedded database fallback...`);
      }
    }

    // Portable Embedded MongoDB Fallback (MongoMemoryServer)
    console.log('Starting portable embedded MongoDB instance (this may download a binary on first run)...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create({
      instance: {
        dbName: 'hostel_mess'
      },
      spawn: {
        timeout: 60000
      }
    });
    mongoUri = mongod.getUri();
    await mongoose.connect(mongoUri);
    console.log(` Embedded MongoDB instance running and connected at: ${mongoUri}`);
  } catch (error) {
    console.error('Fatal MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
  } catch (error) {
    console.error('Error disconnecting database:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
