const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set in environment. Running without MongoDB connection.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      // options are optional with mongoose >=6
    });
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.warn('MongoDB connection error:', err.message || err);
    console.warn('Continuing without MongoDB. Orders will be created with simulated IDs.');
  }
};

module.exports = connectDB;
