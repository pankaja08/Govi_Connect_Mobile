const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '90d'
  });
};

exports.register = async (req, res) => {
  try {
    const { 
      name, email, username, password, role, 
      nic, dob, address, province, district, contactInfo,
      expertRegNo, jobPosition, assignedArea 
    } = req.body;
    
    // Check if email or username already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${field} already in use` });
    }

    const newUser = await User.create({
      name,
      email,
      username,
      password,
      role,
      nic,
      dob,
      address,
      province,
      district,
      contactInfo,
      expertRegNo,
      jobPosition,
      assignedArea
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: { user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
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
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role } }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
