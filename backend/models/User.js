const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['User', 'Expert', 'Admin'],
    default: 'User'
  },
  nic: { 
    type: String, 
    required: [true, 'Please provide your NIC'],
    unique: true,
    uppercase: true,
    trim: true
  },
  dob: { type: String, default: '' },
  address: { type: String, default: '' },
  province: { type: String, default: '' },
  district: { type: String, default: '' },
  contactInfo: { type: String, default: '' },
  location: { type: String, default: '' }, // Legacy field, keeping for compatibility
  savedBlogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],

  // Status for expert verification
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Rejected'],
    default: 'Active'
  },

  // Expert specific fields
  expertRegNo: { type: String, default: '' },
  areaOfExpertise: { type: String, default: '' },
  jobPosition: { type: String, default: '' },
  assignedArea: { type: String, default: '' },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);
