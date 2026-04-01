require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin user exists
    const adminExists = await User.findOne({ username: 'admin' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    // Create default admin user
    const adminUser = new User({
      name: 'Super Admin',
      email: 'admin@goviconnect.lk',
      username: 'admin',
      password: 'Admin@123',
      role: 'Admin',
    });

    await adminUser.save();
    console.log('Admin user seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
