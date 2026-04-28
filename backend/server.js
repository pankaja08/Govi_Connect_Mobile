// 1. MUST BE THE VERY FIRST LINE
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');

// Fix for Node 17+ and Windows DNS issues with MongoDB Atlas
dns.setDefaultResultOrder('ipv4first');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const blogRoutes = require('./routes/blogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/notifications', notificationRoutes);

// Database connection
const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosconnect';

// 2. DEBUG LOG to see what is actually loading
console.log("==== CHECKING DB STRING ====");
console.log(DB);
console.log("============================");

mongoose.connect(DB, {
  serverSelectionTimeoutMS: 5000,
  family: 4, // Force IPv4
})
  .then(() => console.log('✅ DB connection successful!'))
  .catch(err => {
    console.log('❌ DB connection error:');
    console.error(err);
    process.exit(1); // Stop the server if DB fails
  });

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});