const User = require('../models/User');

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
