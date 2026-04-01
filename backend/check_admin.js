require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAdminCredentials() {
  const URI = process.env.MONGODB_URI;
  try {
    await mongoose.connect(URI);
    const admin = await User.findOne({ role: 'Admin' });
    if (admin) {
      console.log(`Admin found! Username: ${admin.username}, Email: ${admin.email}`);
    } else {
      console.log("No admin user found in the database. You may need to register one via the backend or a script.");
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
}

checkAdminCredentials();
