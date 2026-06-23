const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-medassist', {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
    });

    isConnected = true;
    process.env.MONGO_CONNECTED = 'true';
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    process.env.MONGO_CONNECTED = 'false';
    console.error('============================================================');
    console.error(`WARNING: MongoDB connection failed: ${error.message}`);
    console.error('The backend will run in Resilient Local-Memory Fallback Mode.');
    console.error('All users, chat sessions, and logs will be simulated in memory.');
    console.error('============================================================');
  }
};

module.exports = connectDB;
