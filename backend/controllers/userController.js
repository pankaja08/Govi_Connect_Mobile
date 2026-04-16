const User = require('../models/User');
const bcrypt = require('bcrypt');
const emailService = require('../utils/emailService');

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

exports.getPendingExperts = async (req, res) => {
  try {
    const experts = await User.find({ role: 'Expert', status: 'Pending' }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', results: experts.length, data: { experts } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.verifyExpert = async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' or 'reject'
    const expert = await User.findById(req.params.id);

    if (!expert || expert.role !== 'Expert') {
      return res.status(404).json({ status: 'fail', message: 'No pending expert found with that ID' });
    }

    if (action === 'approve') {
      expert.status = 'Active';
      expert.rejectionReason = '';
      await expert.save();
      
      // Send Approval Email
      await emailService.sendApprovalEmail(expert.email, expert.name);
    } else if (action === 'reject') {
      expert.status = 'Rejected';
      expert.rejectionReason = reason || 'Your credentials could not be verified.';
      await expert.save();
      
      // Send Rejection Email
      await emailService.sendRejectionEmail(expert.email, expert.name, expert.rejectionReason);
    } else {
      return res.status(400).json({ status: 'fail', message: 'Invalid action. Use "approve" or "reject".' });
    }

    res.status(200).json({ status: 'success', data: { user: expert } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.resubmitExpertRequest = async (req, res) => {
  try {
    const expert = await User.findById(req.user.id);

    if (!expert || expert.role !== 'Expert' || expert.status !== 'Rejected') {
      return res.status(400).json({ status: 'fail', message: 'Only rejected experts can resubmit information.' });
    }

    // Update with new info from req.body
    const allowedFields = ['name', 'email', 'contactInfo', 'nic', 'dob', 'address', 'province', 'district', 'expertRegNo', 'areaOfExpertise', 'jobPosition', 'assignedArea'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        expert[field] = req.body[field];
      }
    });

    expert.status = 'Pending';
    expert.rejectionReason = '';
    await expert.save();

    res.status(200).json({ status: 'success', message: 'Request resubmitted successfully. Your account is now under review.', data: { user: expert } });
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
      province,
      status: 'Active' // Admin created users are active by default
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
