const mongoose = require('mongoose');

module.exports = async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: process.env.NODE_ENV !== 'production',
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};
