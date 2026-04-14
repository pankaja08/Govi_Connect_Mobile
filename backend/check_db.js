const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const users = await User.find({}, 'username email role');
    console.log('Users in DB:', users);
    const admin = await User.findOne({ username: 'admin' }).select('+password');
    console.log('Admin user found:', admin ? 'Yes' : 'No');
    if (admin) {
        console.log('Admin email:', admin.email);
        console.log('Admin role:', admin.role);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDB();
