const Crop = require('../models/Crop');

exports.getCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      results: crops.length,
      data: { crops }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.createCrop = async (req, res) => {
  try {
    const newCrop = await Crop.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { crop: newCrop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    res.status(200).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.addActivity = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    crop.activities.push(req.body);
    await crop.save();

    res.status(201).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateAnalytics = async (req, res) => {
  try {
    const { yieldAmount, incomeAmount } = req.body;
    
    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { yieldAmount, incomeAmount },
      { new: true, runValidators: true }
    );

    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    res.status(200).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.toggleActivityStatus = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    const activity = crop.activities.id(req.params.activityId);
    if (!activity) {
      return res.status(404).json({ message: 'No activity found' });
    }

    activity.isCompleted = !activity.isCompleted;
    await crop.save();

    res.status(200).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
