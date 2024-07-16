const mongoose = require('mongoose');

const connectDB = async (MONGODB_URI, PORT) => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // New option to control server selection timeout
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
