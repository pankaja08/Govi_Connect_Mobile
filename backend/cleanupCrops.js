require('dotenv').config();
const mongoose = require('mongoose');

const DB = process.env.MONGODB_URI;

const cleanup = async () => {
  try {
    await mongoose.connect(DB);
    console.log('✅ Connected to MongoDB');

    // Drop the Crop collection to remove old index
    await mongoose.connection.dropCollection('crops');
    console.log('✅ Dropped Crop collection and old index');

    await mongoose.disconnect();
    console.log('✅ Cleanup complete. Now run seedCropAdvisory.js');
  } catch (err) {
    console.error('❌ Cleanup error:', err.message);
    process.exit(1);
  }
};

cleanup();
