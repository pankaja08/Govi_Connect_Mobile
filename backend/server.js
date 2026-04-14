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
const cropRoutes = require('./routes/cropRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger to debug login/register issues
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '******';
    console.log('Body:', JSON.stringify(safeBody, null, 2));
  }
  next();
});


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/farm/crops', cropRoutes);

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