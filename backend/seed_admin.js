require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createAdmin() {
  const URI = process.env.MONGODB_URI;
  try {
    await mongoose.connect(URI);
    
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log(`Admin already exists: ${existingAdmin.username}`);
    } else {
      const newAdmin = await User.create({
        name: 'System Administrator',
        email: 'admin@goviconnect.com',
        username: 'admin',
        password: 'admin123',
        role: 'Admin'
      });
      console.log("✅ Admin user created successfully!");
      console.log("Username: admin");
      console.log("Password: admin123");
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Failed to create admin:", err.message);
  }
}

createAdmin();
