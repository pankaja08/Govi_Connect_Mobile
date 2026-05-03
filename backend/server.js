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
const forumRoutes = require('./routes/forumRoutes');
const farmTrackerRoutes = require('./routes/farmTrackerRoutes');
const cropAdvisoryRoutes = require('./routes/cropAdvisoryRoutes');
const productRoutes      = require('./routes/productRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/farm/crops', farmTrackerRoutes);
app.use('/api/crop-advisory', cropAdvisoryRoutes);
app.use('/api/products', productRoutes);

// Database connection
const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosconnect';

// 2. DEBUG LOG to see what is actually loading
console.log("==== CHECKING DB STRING ====");
console.log(DB);
console.log("============================");

mongoose.connect(DB, {
  serverSelectionTimeoutMS: 30000, // Increase to 30 seconds for more stability
  family: 4, // Force IPv4
})
  .then(() => console.log('✅ DB connection successful!'))
  .catch(err => {
    console.log('❌ DB connection error:');
    console.error(err.message);
    console.log('\n💡 TIP: Check if your IP address is whitelisted in MongoDB Atlas:');
    console.log('   https://www.mongodb.com/docs/atlas/security-whitelist/');
    process.exit(1); 
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