const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '90d'
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

    // Log incoming registration attempt for debugging
    console.log('\n📥 REGISTRATION ATTEMPT:');
    console.log(`  Name: ${name}, Email: ${email}, Username: ${username}, Role: ${role}`);
    console.log('============================\n');

    // Basic required fields check before even hitting DB
    if (!name || !email || !username || !password) {
      return res.status(400).json({ status: 'fail', message: 'Name, email, username, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: 'fail', message: 'Password must be at least 6 characters long.' });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(400).json({ status: 'fail', message: `${field} already in use. Please try a different one.` });
    }

    // Set status to Pending for new Experts
    const status = role === 'Expert' ? 'Pending' : 'Active';

    const newUser = await User.create({
      name,
      email,
      username,
      password,
      role: role || 'User',
      status,
      nic: nic || '',
      dob: dob || '',
      address: address || '',
      province: province || '',
      district: district || '',
      contactInfo: contactInfo || '',
      expertRegNo: expertRegNo || '',
      areaOfExpertise: areaOfExpertise || '',
      jobPosition: jobPosition || '',
      assignedArea: assignedArea || ''
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
