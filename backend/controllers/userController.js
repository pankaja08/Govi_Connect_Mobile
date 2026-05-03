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
    const { name, email, nic, dob, contactInfo, province, district, location } = req.body;
    
    // 1. Basic format validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^0\d{9}$/;
    const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;

    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid email format.' });
    }
    if (contactInfo && !phoneRegex.test(contactInfo)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid contact number (10 digits starting with 0).' });
    }
    if (nic && !nicRegex.test(nic)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid NIC format.' });
    }

    // 2. Age validation (16+)
    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
      if (age < 16) return res.status(400).json({ status: 'fail', message: 'You must be at least 16 years old.' });
    }

    // 3. Uniqueness check if Email or NIC changed
    const currentUser = await User.findById(req.user.id);
    const checks = [];
    if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
      checks.push({ email: email.toLowerCase() });
    }
    if (nic && nic.toUpperCase() !== currentUser.nic?.toUpperCase()) {
      checks.push({ nic: nic.toUpperCase() });
    }

    if (checks.length > 0) {
      const existing = await User.findOne({ $or: checks });
      if (existing) {
        let field = existing.email === email.toLowerCase() ? 'Email' : 'NIC';
        return res.status(400).json({ status: 'fail', message: `${field} is already in use by another user.` });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name, 
        email: email ? email.toLowerCase() : undefined, 
        nic: nic ? nic.toUpperCase() : undefined, 
        dob, contactInfo, province, district, location 
      },
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

exports.toggleSaveBlog = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const blogId = req.params.id;
    
    if (!user.savedBlogs) {
      user.savedBlogs = [];
    }

    const index = user.savedBlogs.indexOf(blogId);
    if (index === -1) {
      user.savedBlogs.push(blogId);
    } else {
      user.savedBlogs.splice(index, 1);
    }
    
    await user.save();
    
    res.status(200).json({ 
      status: 'success', 
      data: { savedBlogs: user.savedBlogs } 
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ADMIN ONLY CONTROLLERS

exports.getDashboardStats = async (req, res) => {
  try {
    const farmers = await User.countDocuments({ role: 'User' });
    const agriOfficers = await User.countDocuments({ 
      role: 'Expert', 
      status: { $nin: ['Pending', 'Rejected'] } 
    });
    const pendingExperts = await User.countDocuments({ role: 'Expert', status: 'Pending' });

    // Total = farmers + active agri officers + pending experts (excludes Admins)
    const totalUsers = farmers + agriOfficers + pendingExperts;
    const pendingProducts = await require('../models/Product').countDocuments({ approvalStatus: 'pending' });

    // Get geographical distribution of Farmers
    const geographicStats = await User.aggregate([
      { $match: { role: 'User' } },
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        farmers,
        agriOfficers,
        pendingExperts,
        pendingProducts,
        geographicStats
      }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

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
    
    // Explicitly find the user and ensure email/name are available
    const expert = await User.findById(req.params.id).select('+email +name');

    if (!expert || expert.role !== 'Expert') {
      return res.status(404).json({ status: 'fail', message: 'No pending expert found with that ID' });
    }

    console.log(`\n--- Expert Verification: ${expert.email} ---`);
    console.log(`Action: ${action}`);

    if (action === 'approve') {
      expert.status = 'Active';
      expert.rejectionReason = '';
      await expert.save();
      
      console.log(`✅ [Admin] Expert status set to Active. Sending approval email...`);
      // Send Approval Email
      try {
        await emailService.sendApprovalEmail(expert.email, expert.name);
      } catch (emailErr) {
        console.error(`⚠️ [Admin] Email service failed:`, emailErr.message);
      }
    } else if (action === 'reject') {
      expert.status = 'Rejected';
      expert.rejectionReason = reason || 'Your credentials could not be verified.';
      await expert.save();
      
      console.log(`✅ [Admin] Expert status set to Rejected. Sending rejection email...`);
      // Send Rejection Email
      try {
        await emailService.sendRejectionEmail(expert.email, expert.name, expert.rejectionReason);
      } catch (emailErr) {
        console.error(`⚠️ [Admin] Email service failed:`, emailErr.message);
      }
    } else {
      return res.status(400).json({ status: 'fail', message: 'Invalid action. Use "approve" or "reject".' });
    }

    console.log(`--- Verification Completed ---\n`);
    res.status(200).json({ status: 'success', data: { user: expert } });
  } catch (err) {
    console.error('❌ [Admin] Expert verification error:', err.message);
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Target email is required' });

    const result = await emailService.sendTestEmail(email);
    res.status(200).json({ status: 'success', message: 'Test email sent!', data: result });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Email test failed', error: err.message });
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
      district, contactInfo, nic, dob, address, province,
      expertRegNo, areaOfExpertise, jobPosition, assignedArea
    } = req.body;

    // Check for required fields
    if (!name || !email || !username || !password || !nic || !dob || !contactInfo || !district || !province || !address) {
      return res.status(400).json({ status: 'fail', message: 'All basic fields are required.' });
    }

    // Expert fields validation
    if (role === 'Expert') {
      if (!expertRegNo || !areaOfExpertise || !jobPosition || !assignedArea) {
        return res.status(400).json({ status: 'fail', message: 'All expert credentials are required for Expert role.' });
      }
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
    if (age < 16) return res.status(400).json({ status: 'fail', message: 'User must be at least 16 years old.' });

    const existing = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }, { nic: nic.toUpperCase() }] 
    });
    if (existing) {
      let field = 'User';
      if (existing.email === email.toLowerCase()) field = 'Email';
      else if (existing.username === username) field = 'Username';
      else if (existing.nic === nic.toUpperCase()) field = 'NIC';
      return res.status(400).json({ status: 'fail', message: `${field} already in use.` });
    }
    
    const newUser = await User.create({
      name, email, username, password, role,
      district, contactInfo, nic, dob, address, province,
      expertRegNo, areaOfExpertise, jobPosition, assignedArea,
      status: role === 'Expert' ? 'Pending' : 'Active'
    });

    res.status(201).json({ status: 'success', data: { user: newUser } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateUserByAdmin = async (req, res) => {
  try {
    const { email, nic, dob, contactInfo, role } = req.body;

    if (req.body.name === '' || email === '' || nic === '' || dob === '' || contactInfo === '') {
      return res.status(400).json({ status: 'fail', message: 'Fields cannot be empty.' });
    }

    // Expert fields validation if role is being changed to Expert or is already Expert
    if (role === 'Expert') {
      const { expertRegNo, areaOfExpertise, jobPosition, assignedArea } = req.body;
      if (expertRegNo === '' || areaOfExpertise === '' || jobPosition === '' || assignedArea === '') {
        return res.status(400).json({ status: 'fail', message: 'Expert fields cannot be empty.' });
      }
    }

    if (nic) {
      const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
      if (!nicRegex.test(nic)) return res.status(400).json({ status: 'fail', message: 'Invalid NIC format.' });
      const existingNic = await User.findOne({ nic: nic.toUpperCase(), _id: { $ne: req.params.id } });
      if (existingNic) return res.status(400).json({ status: 'fail', message: 'NIC already in use.' });
    }

    if (contactInfo) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(contactInfo)) return res.status(400).json({ status: 'fail', message: 'Invalid phone format.' });
    }

    if (dob) {
      const dobDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;
      if (age < 16) return res.status(400).json({ status: 'fail', message: 'User must be at least 16 years old.' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
      if (existingEmail) return res.status(400).json({ status: 'fail', message: 'Email already in use.' });
    }

    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 12);
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updatedUser) return res.status(404).json({ status: 'fail', message: 'No user found.' });

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
