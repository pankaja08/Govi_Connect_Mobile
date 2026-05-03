const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

// Helper: parse MongoDB errors into user-friendly messages
const parseMongoError = (err) => {
  // Duplicate key error (e.g. email or username already taken)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
    return `${fieldName} already in use. Please try a different one.`;
  }

  // Mongoose validation errors (e.g. required field missing, minlength)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return messages.join('. ');
  }

  return err.message;
};

exports.register = async (req, res) => {
  try {
    const {
      name, email, username, password, role,
      nic, dob, address, province, district, contactInfo,
      expertRegNo, areaOfExpertise, jobPosition, assignedArea
    } = req.body;

    // Strict validation for all required fields
    if (!name || !email || !username || !password || !nic || !dob || !address || !province || !district || !contactInfo) {
      return res.status(400).json({ status: 'fail', message: 'All personal information fields are required.' });
    }

    if (role === 'Expert') {
      if (!expertRegNo || !areaOfExpertise || !jobPosition || !assignedArea) {
        return res.status(400).json({ status: 'fail', message: 'All professional credentials are required for experts.' });
      }
    }

    if (password.length < 6) {
      return res.status(400).json({ status: 'fail', message: 'Password must be at least 6 characters long.' });
    }

    // NIC validation
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
    if (!nicRegex.test(nic)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid NIC format.' });
    }

    // Phone validation
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(contactInfo)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid contact number (10 digits starting with 0).' });
    }

    // Age validation (16+)
    const dobDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - dobDate.getFullYear();
    const m = today.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
    if (age < 16) return res.status(400).json({ status: 'fail', message: 'You must be at least 16 years old to register.' });

    // Check if email, username or NIC already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username },
        { nic: nic.toUpperCase() }
      ]
    });

    if (existingUser) {
      let field = 'User';
      if (existingUser.email === email.toLowerCase()) field = 'Email';
      else if (existingUser.username === username) field = 'Username';
      else if (existingUser.nic === nic.toUpperCase()) field = 'NIC';
      return res.status(400).json({ status: 'fail', message: `${field} already in use.` });
    }

    const newUser = await User.create({
      name, email, username, password,
      role: role || 'User',
      status: role === 'Expert' ? 'Pending' : 'Active',
      nic: nic.toUpperCase(),
      dob, address, province, district, contactInfo,
      expertRegNo, areaOfExpertise, jobPosition, assignedArea
    });

    const token = signToken(newUser._id);

    console.log(`\n✅ REGISTRATION SUCCESS: ${newUser.email} (${newUser.role})\n`);

    res.status(201).json({
      status: 'success',
      token,
      data: { user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, status: newUser.status } }
    });
  } catch (err) {
    const userMessage = parseMongoError(err);
    console.error('\n❌ REGISTRATION ERROR:');
    console.error('  Message:', userMessage);
    console.error('  Raw Error:', err);
    console.error('============================\n');
    res.status(400).json({ status: 'fail', message: userMessage });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Allow login with either username or email
    const identifier = username || email;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide username/email and password' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    }).select('+password');

    if (!user || !(await user.comparePassword(password, user.password))) {
      return res.status(401).json({ message: 'Incorrect username or password' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
