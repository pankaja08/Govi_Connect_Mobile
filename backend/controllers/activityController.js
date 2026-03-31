const Activity = require('../models/Activity');

exports.getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user.id }).sort('-date');
    res.status(200).json({
      status: 'success',
      results: activities.length,
      data: { activities }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.createActivity = async (req, res) => {
  try {
    const newActivity = await Activity.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { activity: newActivity }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!activity) {
      return res.status(404).json({ message: 'No activity found with that ID' });
    }

    res.status(200).json({
      status: 'success',
      data: { activity }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!activity) {
      return res.status(404).json({ message: 'No activity found with that ID' });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
