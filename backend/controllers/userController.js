const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateMe = async (req, res) => {
  try {
    // Only allow updating specific fields
    const { name, location, contactInfo, nic, dob, email, province, district } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, location, contactInfo, nic, dob, email, province, district },
      { new: true, runValidators: true }
    );

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ADMIN ONLY CONTROLLERS

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.status(200).json({ status: 'success', results: users.length, data: { users } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.createUserByAdmin = async (req, res) => {
  try {
    const { 
      name, email, username, password, role, 
      district, contactInfo, nic, dob, address, province 
    } = req.body;
    
    const newUser = await User.create({
      name,
      email,
      username,
      password,
      role,
      district,
      contactInfo,
      nic,
      dob,
      address,
      province
    });

    res.status(201).json({ status: 'success', data: { user: newUser } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateUserByAdmin = async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedUser) {
      return res.status(404).json({ status: 'fail', message: 'No user found with that ID' });
    }

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.deleteUserByAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user.id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'You cannot delete your own admin account!' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'No user found with that ID' });
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
